#!/usr/bin/env bash
# Preuve d'identité de l'outillage d'un projet (spec docs/specs/preuve-identite) : instantané, puis comparaison.
# Usage : bash scripts/prove-identity.sh snapshot <sortie> [--project <chemin>]
#         bash scripts/prove-identity.sh compare <avant> <après>
#         bash scripts/prove-identity.sh --selftest
# snapshot écrit dans <sortie> (vide ou absent) un fichier par mesure dont la config existe à la racine du projet :
#   oxlint.txt (.oxlintrc.json), extra-<n>.txt (.cothon/identity.extra, une commande par ligne),
#   tsconfig--<chemin> (chaque tsconfig*.json suivi par git), lefthook.yml (lefthook.yml),
#   oxfmt.json et oxfmt-check.txt (.oxfmtrc.json), plus skipped.txt (mesures sautées et raison).
# Les binaires sont ceux du projet (node_modules/.bin/<outil>). Les fichiers de .cothon/probes/ sont posés
# à leur chemin relatif avant oxlint et extra, puis retirés, même en erreur.
# Sortie : snapshot 0 fait, 2 bloqué ; compare 0 identique, 1 différent, 2 bloqué.
# Dépendances : bash, git, jq.
set -uo pipefail

DIAG_RE='^[^ ]+:[0-9]+:[0-9]+: '
DIFF_MAX=200

blocked() { printf 'prove-identity : BLOQUÉ : %s\n' "$1" >&2; exit 2; }

PROJ=""
RAW=""
PROBES=()      # sondes posées, chemins relatifs au projet
PROBE_DIRS=()  # dossiers créés pour les poser, du plus haut au plus profond

# Retire les sondes et les dossiers créés pour elles (piège EXIT : aussi en erreur ou interruption).
remove_probes() {
  local i
  for (( i = ${#PROBES[@]} - 1; i >= 0; i-- )); do rm -f "$PROJ/${PROBES[i]}"; done
  for (( i = ${#PROBE_DIRS[@]} - 1; i >= 0; i-- )); do rmdir "$PROJ/${PROBE_DIRS[i]}" 2>/dev/null; done
  PROBES=(); PROBE_DIRS=()
}

# Sondes de .cothon/probes/ : liste (sortie standard), un chemin relatif par ligne.
probe_list() {
  [[ -d "$PROJ/.cothon/probes" ]] || return 0
  (cd "$PROJ/.cothon/probes" && find . -type f | sed 's|^\./||' | LC_ALL=C sort)
}

pose_probes() {
  local rel d part parts
  while IFS= read -r rel; do
    [[ -n "$rel" ]] || continue
    d=""
    IFS=/ read -r -a parts <<< "$(dirname "$rel")"
    for part in "${parts[@]}"; do
      [[ "$part" == . ]] && continue
      d="${d:+$d/}$part"
      [[ -d "$PROJ/$d" ]] && continue
      mkdir "$PROJ/$d" || blocked "dossier $d impossible à créer pour la sonde $rel"
      PROBE_DIRS+=("$d")
    done
    PROBES+=("$rel")
    cp "$PROJ/.cothon/probes/$rel" "$PROJ/$rel" || blocked "sonde $rel impossible à poser"
  done < <(probe_list)
}

# Lance une commande depuis la racine du projet ; sortie brute dans $RAW. $1 : nom pour les messages ;
# $2 : « fusion » (stderr avec stdout, pour les diagnostics) ou « stdout ». Bloque sur un code autre que 0 ou 1.
measure() {
  local name="$1" mode="$2" rc; shift 2
  if [[ "$mode" == fusion ]]; then (cd "$PROJ" && "$@") > "$RAW" 2>&1; else (cd "$PROJ" && "$@") > "$RAW" 2>"$RAW.err"; fi
  rc=$?
  (( rc <= 1 )) || blocked "$name : sortie $rc (attendu 0 ou 1)"
}

# Lignes de diagnostic seules, triées.
diagnostics() { { grep -E "$DIAG_RE" "$RAW" || true; } | LC_ALL=C sort; }

snapshot() {
  local out="" proj="."
  while (( $# )); do
    case "$1" in
      --project) (( $# >= 2 )) || blocked "--project attend un chemin"; proj="$2"; shift 2 ;;
      -*) blocked "argument inconnu '$1'" ;;
      *) [[ -z "$out" ]] || blocked "une seule sortie : '$out' puis '$1'"; out="$1"; shift ;;
    esac
  done
  [[ -n "$out" ]] || blocked "usage : prove-identity.sh snapshot <sortie> [--project <chemin>]"
  command -v jq >/dev/null || blocked "jq absent"
  PROJ=$(cd "$proj" 2>/dev/null && pwd) || blocked "projet introuvable : $proj"
  git -C "$PROJ" rev-parse --is-inside-work-tree >/dev/null 2>&1 || blocked "$PROJ n'est pas un dépôt git (tsconfig suivis par git)"
  if [[ -e "$out" ]]; then
    [[ -d "$out" ]] || blocked "$out existe et n'est pas un dossier"
    [[ -z "$(ls -A "$out")" ]] || blocked "$out existe et n'est pas vide"
  fi

  # Mesures déclarées par leur config ; binaire du projet exigé avant tout changement.
  local f tsconfigs=() extras=() line
  while IFS= read -r -d '' f; do
    [[ "$(basename "$f")" == tsconfig*.json && "/$f/" != */node_modules/* ]] && tsconfigs+=("$f")
  done < <(git -C "$PROJ" ls-files -z)
  if [[ -f "$PROJ/.cothon/identity.extra" ]]; then
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ "$line" =~ ^[[:space:]]*(#|$) ]] && continue
      extras+=("$line")
    done < "$PROJ/.cothon/identity.extra"
  fi
  need() { [[ -e "$PROJ/node_modules/.bin/$1" ]] || blocked "$1 absent (node_modules/.bin/$1) alors que $2 existe"; }
  [[ -f "$PROJ/.oxlintrc.json" ]] && need oxlint .oxlintrc.json
  (( ${#tsconfigs[@]} )) && need tsc "${tsconfigs[0]}"
  [[ -f "$PROJ/lefthook.yml" ]] && need lefthook lefthook.yml
  [[ -f "$PROJ/.oxfmtrc.json" ]] && need oxfmt .oxfmtrc.json
  while IFS= read -r f; do
    [[ -n "$f" ]] || continue
    [[ -e "$PROJ/$f" || -L "$PROJ/$f" ]] && blocked "sonde .cothon/probes/$f : $f existe déjà dans le projet"
  done < <(probe_list)

  mkdir -p "$out" && out=$(cd "$out" && pwd) || blocked "sortie $out impossible à créer"
  RAW=$(mktemp "${TMPDIR:-/tmp}/prove-identity.XXXXXX") || blocked "mktemp"
  trap 'remove_probes; rm -f "$RAW" "$RAW.err"' EXIT
  trap 'exit 2' HUP INT TERM
  local bin="$PROJ/node_modules/.bin" skipped="$out/skipped.txt" n
  : > "$skipped"

  # Sondes posées pour oxlint et les mesures en plus, retirées juste après.
  pose_probes
  if [[ -f "$PROJ/.oxlintrc.json" ]]; then
    measure "oxlint" fusion "$bin/oxlint" -f unix; diagnostics > "$out/oxlint.txt"
  else
    echo "oxlint.txt : .oxlintrc.json absent" >> "$skipped"
  fi
  if [[ ! -f "$PROJ/.cothon/identity.extra" ]]; then
    echo "extra : .cothon/identity.extra absent" >> "$skipped"
  elif (( ${#extras[@]} == 0 )); then
    echo "extra : aucune commande dans .cothon/identity.extra" >> "$skipped"
  else
    for (( n = 1; n <= ${#extras[@]}; n++ )); do
      measure "extra-$n ($(printf %s "${extras[n-1]}"))" fusion bash -c "${extras[n-1]}"; diagnostics > "$out/extra-$n.txt"
    done
  fi
  remove_probes

  if (( ${#tsconfigs[@]} )); then
    for f in "${tsconfigs[@]}"; do
      measure "tsc --showConfig -p $f" stdout "$bin/tsc" --showConfig -p "$f"
      jq -S 'del(.files)' "$RAW" > "$out/tsconfig--${f//\//--}" 2>/dev/null || blocked "tsc --showConfig -p $f : sortie non JSON"
    done
  else
    echo "tsconfig : aucun tsconfig*.json suivi par git" >> "$skipped"
  fi
  if [[ -f "$PROJ/lefthook.yml" ]]; then
    measure "lefthook dump" stdout "$bin/lefthook" dump
    awk '/^extends:/ {s = 1; next} s && /^[^[:space:]]/ {s = 0} !s' "$RAW" > "$out/lefthook.yml"
  else
    echo "lefthook.yml : lefthook.yml absent" >> "$skipped"
  fi
  if [[ -f "$PROJ/.oxfmtrc.json" ]]; then
    jq -S . "$PROJ/.oxfmtrc.json" > "$out/oxfmt.json" || blocked ".oxfmtrc.json : JSON invalide"
    (cd "$PROJ" && "$bin/oxfmt" --check) >/dev/null 2>&1
    printf 'exit %d\n' "$?" > "$out/oxfmt-check.txt"
  else
    echo "oxfmt.json, oxfmt-check.txt : .oxfmtrc.json absent" >> "$skipped"
  fi
  printf 'prove-identity : instantané de %s dans %s\n' "$PROJ" "$out"
}

compare() {
  (( $# == 2 )) || blocked "usage : prove-identity.sh compare <avant> <après>"
  local a="$1" b="$2" f x y rc=0 diffs=()
  [[ -d "$a" ]] || blocked "dossier absent : $a"
  [[ -d "$b" ]] || blocked "dossier absent : $b"
  while IFS= read -r f; do
    [[ -n "$f" ]] || continue
    if [[ -f "$a/$f" && -f "$b/$f" ]] && cmp -s "$a/$f" "$b/$f"; then
      printf '✓ %s\n' "$f"
    else
      printf '✗ %s\n' "$f"; rc=1; diffs+=("$f")
    fi
  done < <({ ls -A "$a"; ls -A "$b"; } | LC_ALL=C sort -u)
  for f in "${diffs[@]+"${diffs[@]}"}"; do
    x="$a/$f"; y="$b/$f"; [[ -f "$x" ]] || x=/dev/null; [[ -f "$y" ]] || y=/dev/null
    diff -u "$x" "$y" | head -n "$DIFF_MAX"
  done
  return "$rc"
}

selftest() {
  local self; self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  local t ok=0 out p; t=$(mktemp -d "${TMPDIR:-/tmp}/prove-identity-selftest.XXXXXX") || exit 2
  p="$t/p"
  mkdir -p "$p/node_modules/.bin" "$p/apps/api" "$p/.cothon/probes/src/sonde"
  git -C "$p" init -q . && git -C "$p" config user.email t@t.invalid && git -C "$p" config user.name t
  printf '{}\n' > "$p/.oxlintrc.json"
  printf '{ "extends": "../../tsconfig.json" }\n' > "$p/apps/api/tsconfig.json"
  printf '{}\n' > "$p/tsconfig.json"
  printf 'pre-commit: {}\n' > "$p/lefthook.yml"
  printf '{ "singleQuote": true, "printWidth": 120 }\n' > "$p/.oxfmtrc.json"
  printf '# commentaire\n\necho "b.js:2:1: extra"; echo bruit\n' > "$p/.cothon/identity.extra"
  printf 'if (1) {}\n' > "$p/.cothon/probes/src/sonde/zz.ts"
  printf 'node_modules/\n' > "$p/.gitignore"
  git -C "$p" add -A && git -C "$p" commit -qm base
  # Faux binaires : sortie fixe. Le faux oxlint signale la sonde si elle est posée.
  cat > "$p/node_modules/.bin/oxlint" <<'EOF'
#!/usr/bin/env bash
echo "Found 2 warnings"
echo "src/b.ts:3:1: Warning: no-debugger"
echo "src/a.ts:1:5: Error: no-empty"
[[ -f src/sonde/zz.ts ]] && echo "src/sonde/zz.ts:1:8: Error: no-empty"
exit 1
EOF
  cat > "$p/node_modules/.bin/tsc" <<'EOF'
#!/usr/bin/env bash
printf '{ "compilerOptions": { "strict": true, "target": "es2022" }, "files": ["./x.ts", "./%s"] }\n' "$RANDOM"
EOF
  cat > "$p/node_modules/.bin/lefthook" <<'EOF'
#!/usr/bin/env bash
cat <<'YAML'
extends:
  - .cothon/local/lefthook.yml
pre-commit:
  commands:
    lint:
      run: ./node_modules/.bin/oxlint {staged_files}
YAML
EOF
  printf '#!/usr/bin/env bash\nexit 1\n' > "$p/node_modules/.bin/oxfmt"
  chmod +x "$p/node_modules/.bin/"*
  local run=(bash "$self")

  # Instantané complet.
  "${run[@]}" snapshot "$t/a" --project "$p" >/dev/null 2>&1; (( $? == 0 )) || { echo "selftest : snapshot échoue"; ok=1; }
  for f in oxlint.txt extra-1.txt tsconfig--tsconfig.json tsconfig--apps--api--tsconfig.json lefthook.yml oxfmt.json oxfmt-check.txt skipped.txt; do
    [[ -f "$t/a/$f" ]] || { echo "selftest : $f absent de l'instantané"; ok=1; }
  done
  [[ "$(cat "$t/a/oxlint.txt" 2>/dev/null)" == "$(printf 'src/a.ts:1:5: Error: no-empty\nsrc/b.ts:3:1: Warning: no-debugger\nsrc/sonde/zz.ts:1:8: Error: no-empty')" ]] \
    || { echo "selftest : oxlint.txt mal normalisé, ou sonde non posée"; ok=1; }
  [[ "$(cat "$t/a/extra-1.txt" 2>/dev/null)" == "b.js:2:1: extra" ]] || { echo "selftest : extra-1.txt mal normalisé"; ok=1; }
  jq -e 'has("files") | not' "$t/a/tsconfig--tsconfig.json" >/dev/null 2>&1 || { echo "selftest : files gardé dans tsconfig"; ok=1; }
  [[ "$(head -1 "$t/a/lefthook.yml" 2>/dev/null)" == "pre-commit:" ]] || { echo "selftest : bloc extends gardé dans lefthook.yml"; ok=1; }
  [[ "$(cat "$t/a/oxfmt-check.txt" 2>/dev/null)" == "exit 1" ]] || { echo "selftest : oxfmt-check.txt faux"; ok=1; }
  [[ "$(jq -c . "$t/a/oxfmt.json" 2>/dev/null)" == '{"printWidth":120,"singleQuote":true}' ]] || { echo "selftest : oxfmt.json non trié"; ok=1; }
  [[ -e "$p/src" ]] && { echo "selftest : sonde restée dans le projet"; ok=1; }
  [[ -z "$(git -C "$p" status --porcelain)" ]] || { echo "selftest : projet modifié par snapshot"; ok=1; }

  # Deux instantanés identiques, puis une sortie d'oxlint changée.
  "${run[@]}" snapshot "$t/b" --project "$p" >/dev/null 2>&1
  "${run[@]}" compare "$t/a" "$t/b" >/dev/null 2>&1; (( $? == 0 )) || { echo "selftest : instantanés identiques jugés différents"; ok=1; }
  sed -i.bak 's/no-debugger/no-console/' "$p/node_modules/.bin/oxlint" && rm -f "$p/node_modules/.bin/oxlint.bak"
  "${run[@]}" snapshot "$t/c" --project "$p" >/dev/null 2>&1
  out=$("${run[@]}" compare "$t/a" "$t/c" 2>&1); (( $? == 1 )) || { echo "selftest : écart d'oxlint non détecté"; ok=1; }
  grep -qx '✗ oxlint.txt' <<< "$out" && grep -qx '✓ lefthook.yml' <<< "$out" || { echo "selftest : lignes de compare fausses"; echo "$out"; ok=1; }
  grep -q '^+src/b.ts:3:1: Warning: no-console' <<< "$out" || { echo "selftest : diff absent"; ok=1; }
  "${run[@]}" compare "$t/a" "$t/absent" >/dev/null 2>&1; (( $? == 2 )) || { echo "selftest : dossier absent non bloqué"; ok=1; }

  # Refus : sortie non vide, sonde en collision, config sans binaire, code de sortie inattendu.
  "${run[@]}" snapshot "$t/a" --project "$p" >/dev/null 2>&1; (( $? == 2 )) || { echo "selftest : sortie non vide acceptée"; ok=1; }
  mkdir -p "$p/src/sonde" && printf 'mien\n' > "$p/src/sonde/zz.ts"
  "${run[@]}" snapshot "$t/d" --project "$p" >/dev/null 2>&1; (( $? == 2 )) || { echo "selftest : sonde en collision acceptée"; ok=1; }
  [[ "$(cat "$p/src/sonde/zz.ts")" == mien ]] || { echo "selftest : fichier du projet écrasé par une sonde"; ok=1; }
  rm -rf "$p/src"
  mv "$p/node_modules/.bin/oxfmt" "$t/oxfmt"
  out=$("${run[@]}" snapshot "$t/e" --project "$p" 2>&1); (( $? == 2 )) || { echo "selftest : config sans binaire acceptée"; ok=1; }
  grep -qF 'prove-identity : BLOQUÉ : oxfmt absent (node_modules/.bin/oxfmt) alors que .oxfmtrc.json existe' <<< "$out" \
    || { echo "selftest : message du binaire absent faux"; echo "$out"; ok=1; }
  mv "$t/oxfmt" "$p/node_modules/.bin/oxfmt"
  printf 'exit 3\n' >> "$p/.cothon/identity.extra"
  "${run[@]}" snapshot "$t/f" --project "$p" >/dev/null 2>&1; (( $? == 2 )) || { echo "selftest : code de sortie 3 accepté"; ok=1; }
  [[ -e "$p/src" ]] && { echo "selftest : sonde restée après une erreur"; ok=1; }
  rm -rf "$t"
  (( ok == 0 )) && echo "selftest : ok"
  exit "$ok"
}

case "${1:-}" in
  --selftest) selftest ;;
  snapshot) shift; snapshot "$@" ;;
  compare) shift; compare "$@" ;;
  *) blocked "usage : prove-identity.sh snapshot <sortie> [--project <chemin>] | compare <avant> <après> | --selftest" ;;
esac
