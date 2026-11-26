#!/usr/bin/env bash
# Seules les violations ajoutées bloquent : lance un contrôle sur la base de la branche et sur la branche,
# et n'échoue que sur les diagnostics ajoutés (spec docs/specs/violations-ajoutees, inspirée de sentinel).
# Usage : bash scripts/new-violations.sh [--base <ref>] [--format unix|tsc] -- <commande...>
#         bash scripts/new-violations.sh --selftest
# Branche : la commande tourne dans l'arbre de travail courant, tel quel. Base : dans un worktree git temporaire
# détaché sur la merge-base de HEAD et <ref> (défaut origin/HEAD, sinon origin/main, sinon main), où les fichiers
# ignorés par git et les symlinks non suivis de l'arbre courant sont liés par symlink. Les deux depuis la racine.
# Diagnostics (docs/reference/diagnostics.md) comptés par clé <fichier> TAB <message>, sans numéro de ligne ni,
# en format unix, les nombres isolés du message (mesures) ;
# les renommages (git diff -M) reportent les clés de la base sur le nouveau nom.
# Sortie : 0 aucun ajout, 1 au moins un ajout, 2 bloqué. Dépendances : bash, git. Pas de réseau (aucun fetch).
set -uo pipefail

tmp_root() { local t="${TMPDIR:-/tmp}"; printf %s "${t%/}"; }
blocked() { printf 'new-violations : BLOQUÉ : %s\n' "$1" >&2; exit 2; }

SEP=$'\037'

# Lignes de diagnostic d'un journal, une par ligne : <fichier> TAB <message> SEP <ligne complète>.
# $1 journal, $2 format, $3... préfixes absolus à retirer des chemins (worktree, racine).
records() {
  local log="$1" fmt="$2" re line file msg p; shift 2
  if [[ "$fmt" == tsc ]]; then re='^(.+)\(([0-9]+),([0-9]+)\): (.*)$'; else re='^(.+):([0-9]+):([0-9]+): (.*)$'; fi
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%$'\r'}"
    [[ "$line" =~ $re ]] || continue
    file="${BASH_REMATCH[1]}" msg="${BASH_REMATCH[4]}"
    for p in "$@"; do file="${file#"$p"/}"; done
    printf '%s\t%s%s%s\n' "$file" "$msg" "$SEP" "$line"
  done < "$log" | if [[ "$fmt" == unix ]]; then normalize_key; else cat; fi
}

# Format unix : dans la clé, chaque nombre isolé du message devient « # » (mesures comme « too many lines (385) »
# ou « complexity of 29 ») ; une violation existante dont la mesure change n'est pas un ajout. La ligne affichée garde
# le nombre. Les nombres collés à un mot (TS2307, foo2) restent.
normalize_key() {
  awk -v S="$SEP" '{
    i = index($0, S); k = substr($0, 1, i - 1); t = index(k, "\t")
    m = substr(k, t + 1); out = ""
    while (match(m, /[0-9]+/)) {
      pre = substr(m, 1, RSTART - 1); post = substr(m, RSTART + RLENGTH)
      b = substr(pre, length(pre), 1); a = substr(post, 1, 1)
      if (b ~ /[A-Za-z_.]/ || a ~ /[A-Za-z_]/) out = out pre substr(m, RSTART, RLENGTH)
      else out = out pre "#"
      m = post
    }
    print substr(k, 1, t) out m S substr($0, i + 1)
  }'
}

compare() {
  local base="" fmt=unix
  while (( $# )); do
    case "$1" in
      --base) (( $# >= 2 )) || blocked "--base attend une référence"; base="$2"; shift 2 ;;
      --format)
        (( $# >= 2 )) || blocked "--format attend unix ou tsc"
        [[ "$2" == unix || "$2" == tsc ]] || blocked "format inconnu '$2' (unix ou tsc)"
        fmt="$2"; shift 2 ;;
      --) shift; break ;;
      *) blocked "argument inconnu '$1' (la commande vient après --)" ;;
    esac
  done
  (( $# )) || blocked "commande manquante après --"
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || blocked "pas un dépôt git"
  if [[ -z "$base" ]]; then
    local r
    for r in origin/HEAD origin/main main; do
      git rev-parse --verify --quiet "$r^{commit}" >/dev/null && { base="$r"; break; }
    done
    [[ -n "$base" ]] || blocked "aucune référence de base (origin/HEAD, origin/main, main) : passe --base <ref>"
  fi
  git rev-parse --verify --quiet "$base^{commit}" >/dev/null || blocked "référence '$base' introuvable"
  local top mb short
  top=$(git rev-parse --show-toplevel) || blocked "racine du dépôt introuvable"
  mb=$(git -C "$top" merge-base HEAD "$base") || blocked "pas de merge-base entre HEAD et '$base'"
  short=$(git -C "$top" rev-parse --short "$mb")

  local work; work=$(mktemp -d "$(tmp_root)/new-violations.XXXXXX") || blocked "mktemp"
  local wt="$work/base"
  cleanup() { git -C "$top" worktree remove --force "$wt" >/dev/null 2>&1; git -C "$top" worktree prune >/dev/null 2>&1; rm -rf "$work"; }
  trap cleanup EXIT
  trap 'exit 2' HUP INT TERM
  git -C "$top" worktree add -q --detach "$wt" "$mb" 2>"$work/worktree.log" || blocked "git worktree add a échoué : $(cat "$work/worktree.log")"

  # Fichiers ignorés par git (node_modules, .env...) et symlinks non suivis : liés, pas copiés.
  local f
  while IFS= read -r -d '' f; do
    f="${f%/}"
    [[ -e "$wt/$f" || -L "$wt/$f" ]] && continue
    mkdir -p "$wt/$(dirname "$f")" && ln -s "$top/$f" "$wt/$f"
  done < <(git -C "$top" ls-files -z --others --ignored --exclude-standard --directory
           git -C "$top" ls-files -z --others --exclude-standard | while IFS= read -r -d '' f; do
             [[ -L "$top/$f" ]] && printf '%s\0' "$f"; done)

  local side dir rc
  for side in branche base; do
    if [[ "$side" == branche ]]; then dir="$top"; else dir="$wt"; fi
    (cd "$dir" && "$@") > "$work/$side.log" 2>&1; rc=$?
    if (( rc != 0 && rc != 1 )); then
      tail -n 5 "$work/$side.log" >&2
      blocked "la commande sort avec le code $rc sur la $side (\`$*\`)"
    fi
  done

  records "$work/branche.log" "$fmt" "$top" "$(cd "$top" && pwd -P)" > "$work/branche.rec"
  records "$work/base.log" "$fmt" "$wt" "$(cd "$wt" && pwd -P)" > "$work/base.rec"
  # Renommages depuis la merge-base, arbre de travail compris : ancien TAB nouveau.
  local st old new
  while IFS= read -r -d '' st; do
    IFS= read -r -d '' old || break
    if [[ "$st" == R* ]]; then IFS= read -r -d '' new || break; printf '%s\t%s\n' "$old" "$new"; fi
  done < <(git -C "$top" diff -z -M --name-status "$mb") > "$work/renames"

  awk -v S="$SEP" -v ren="$work/renames" -v base="$work/base.rec" -v short="$short" '
    BEGIN {
      while ((getline l < ren) > 0) { split(l, a, "\t"); rn[a[1]] = a[2] }
      while ((getline l < base) > 0) {
        k = substr(l, 1, index(l, S) - 1); f = substr(k, 1, index(k, "\t") - 1)
        if (f in rn) k = rn[f] substr(k, length(f) + 1)
        nb[k]++
      }
    }
    {
      i = index($0, S); k = substr($0, 1, i - 1)
      if (!(k in nr)) order[++n] = k
      nr[k]++; lines[k, nr[k]] = substr($0, i + 1)
    }
    END {
      for (j = 1; j <= n; j++) {
        k = order[j]; add = nr[k] - nb[k]
        if (add > 0) { for (m = 1; m <= add; m++) print lines[k, m]; A += add }
        B += (nr[k] < nb[k] ? nr[k] : nb[k])
      }
      for (k in nb) if (nb[k] > nr[k]) C += nb[k] - nr[k]
      printf "new-violations : %d ajoutée(s), %d déjà présente(s) sur la base (%s), %d disparue(s)\n", A, B, short, C
      exit (A > 0)
    }' "$work/branche.rec"
  exit $?  # dans la fonction : le trap EXIT voit encore ses variables locales
}

selftest() {
  local self; self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  local dir; dir=$(mktemp -d "$(tmp_root)/new-violations-selftest.XXXXXX") || exit 2
  local ok=0 out rc before after
  # Faux contrôle : une ligne unix par TODO dans src/*.js, sortie 1 s'il en trouve.
  cat > "$dir/check.sh" <<'EOF'
n=0
for f in src/*.js; do
  [ -f "$f" ] || continue
  while IFS=: read -r l _; do echo "$f:$l:1: TODO interdit [Error/fake(no-todo)]"; n=$((n + 1)); done < <(grep -n TODO "$f")
done
[ "$n" = 0 ]
EOF
  mkdir -p "$dir/r" && cd "$dir/r" || exit 2
  git init -q -b main . && git config user.email t@t.invalid && git config user.name t
  mkdir src && printf 'const a = 1;\n// TODO un\nconst b = 2;\n' > src/a.js
  printf 'src/x.ts(3,5): error TS2307: Cannot find module '"'"'y'"'"'.\n' > tsc.out
  git add -A && git commit -qm base && git checkout -qb travail
  local run=(bash "$self" -- bash "$dir/check.sh")

  out=$("${run[@]}" 2>&1); rc=$?
  (( rc == 0 )) || { echo "selftest : aucun ajout devrait sortir 0 (sortie $rc)"; echo "$out"; ok=1; }
  grep -q '^new-violations : 0 ajoutée(s), 1 déjà présente(s) sur la base' <<< "$out" || { echo "selftest : résumé faux"; echo "$out"; ok=1; }

  printf '// TODO deux\n' > src/b.js
  before=$(git status --porcelain; cat src/*.js)
  out=$("${run[@]}" 2>&1); rc=$?
  (( rc == 1 )) || { echo "selftest : un TODO ajouté devrait sortir 1 (sortie $rc)"; echo "$out"; ok=1; }
  grep -qxF 'src/b.js:1:1: TODO interdit [Error/fake(no-todo)]' <<< "$out" || { echo "selftest : ligne ajoutée non affichée"; echo "$out"; ok=1; }
  grep -q '^src/a.js' <<< "$out" && { echo "selftest : ligne déjà présente affichée"; ok=1; }
  after=$(git status --porcelain; cat src/*.js)
  [[ "$after" == "$before" ]] || { echo "selftest : l'arbre de travail a été modifié"; ok=1; }
  [[ $(git worktree list --porcelain | grep -c '^worktree') == 1 ]] || { echo "selftest : worktree temporaire non nettoyé"; ok=1; }
  rm src/b.js

  printf '// en tête\n\n' | cat - src/a.js > src/a.tmp && mv src/a.tmp src/a.js
  "${run[@]}" >/dev/null 2>&1; rc=$?
  (( rc == 0 )) || { echo "selftest : ligne insérée au-dessus d'un TODO vue comme un ajout (sortie $rc)"; ok=1; }
  git checkout -q -- src/a.js

  git mv src/a.js src/c.js && git commit -qm renomme
  out=$("${run[@]}" 2>&1); rc=$?
  (( rc == 0 )) || { echo "selftest : renommage vu comme un ajout (sortie $rc)"; echo "$out"; ok=1; }

  bash "$self" -- commande-introuvable-cothon >/dev/null 2>&1; rc=$?
  (( rc == 2 )) || { echo "selftest : commande introuvable non bloquée (sortie $rc)"; ok=1; }
  bash "$self" -- >/dev/null 2>&1; rc=$?
  (( rc == 2 )) || { echo "selftest : commande manquante non bloquée (sortie $rc)"; ok=1; }
  bash "$self" --base inconnue -- true >/dev/null 2>&1; rc=$?
  (( rc == 2 )) || { echo "selftest : référence introuvable non bloquée (sortie $rc)"; ok=1; }

  # Mesure dans le message (max-lines « (385) ») : raccourcir un fichier déjà trop long n'est pas un ajout.
  printf 'n=$(wc -l < src/c.js | tr -d " "); echo "src/c.js:1:1: File has too many lines ($n). Maximum allowed is 2. [Error/eslint(max-lines)]"; exit 1\n' > "$dir/size.sh"
  printf 'const z = 3;\n' >> src/c.js && git commit -qam allonge
  git checkout -q main && git merge -q --ff-only travail && git checkout -q -b raccourci
  sed -i.bak '$d' src/c.js && rm -f src/c.js.bak
  out=$(bash "$self" --base main -- bash "$dir/size.sh" 2>&1); rc=$?
  (( rc == 0 )) || { echo "selftest : fichier raccourci vu comme un ajout (sortie $rc)"; echo "$out"; ok=1; }
  git checkout -q -- src/c.js
  printf 'src/z.ts(1,1): error TS2307: Cannot find module '"'"'w'"'"'.\n' >> tsc.out
  out=$(bash "$self" --format tsc -- cat tsc.out 2>&1); rc=$?
  (( rc == 1 )) || { echo "selftest : format tsc, ajout non détecté (sortie $rc)"; echo "$out"; ok=1; }
  grep -qF "src/z.ts(1,1): error TS2307" <<< "$out" || { echo "selftest : format tsc, ligne ajoutée non affichée"; ok=1; }
  bash "$self" -- cat tsc.out >/dev/null 2>&1; rc=$?
  (( rc == 0 )) || { echo "selftest : format unix, une ligne tsc comptée (sortie $rc)"; ok=1; }

  cd / && rm -rf "$dir"
  (( ok == 0 )) && echo "selftest : ok"
  exit "$ok"
}

[[ "${1:-}" == "--selftest" ]] && selftest
compare "$@"
