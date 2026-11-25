#!/usr/bin/env bash
# Contrôles qualité à la manière de sentinel (spec docs/specs/controles-qualite, ADR 0013).
# Usage : bash scripts/quality-check.sh <famille> [--project <chemin>]
#         bash scripts/quality-check.sh rapport [--project <chemin>] [--base <ref>]
#         bash scripts/quality-check.sh --selftest
# Familles : complexite (oxlint), code-mort (knip), duplication (jscpd), sql (squawk), env (bash et git).
# Une famille écrit une ligne par constat au format unix (docs/reference/diagnostics.md), chemin relatif
# à la racine du projet ; sortie 0 aucun constat, 1 au moins un, 2 bloqué. Le rapport imprime un tableau
# Markdown, une ligne par famille ; il mesure sans juger : sortie 0, ou 2 si une famille est bloquée.
# Configuration déclarée : .cothon/quality.conf, lignes « cle = valeur » (sql_glob, env_ignore).
# Outils : node_modules/.bin du projet, sinon paquet ponctuel du gestionnaire déclaré (packageManager),
# à la version épinglée ci-dessous. Dépendances : bash, git, jq.
set -uo pipefail

SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
HERE="$(dirname "$SELF")"
FAMILIES=(complexite code-mort duplication sql env)
# La plus récente publiée au moins 7 jours avant l'écriture (npm view <paquet> time, 2026-11-25, journal du plan).
KNIP_VERSION=6.45.1
JSCPD_VERSION=5.4.3
SQUAWK_VERSION=2.73.0
JS_FILES=('*.js' '*.jsx' '*.mjs' '*.cjs' '*.ts' '*.tsx')
ENV_BUILTIN=NODE_ENV,CI,TZ,MODE,DEV,PROD,SSR,BASE_URL
UNIX_RE='^.+:[0-9]+:[0-9]+: .+$'

blocked() { printf 'quality-check : BLOQUÉ : %s\n' "$1" >&2; exit 2; }
note_tool() { [[ -n "${QC_TOOL_FILE:-}" ]] && printf '%s\n' "$1" > "$QC_TOOL_FILE"; return 0; }
last_err() { grep -v '^[[:space:]]*$' "$TMP/err" 2>/dev/null | tail -1 | cut -c1-160; }

# Texte « Que faire » par famille (recopié de docs/reference/controles-qualite.md).
todo() {
  case "$1" in
    complexite) echo "Découper la fonction ou le module signalé ; casser un cycle d'import par un module commun" ;;
    code-mort) echo "Supprimer le fichier, l'export ou la dépendance ; si un outil l'utilise hors de la vue de knip, le déclarer dans la config de knip" ;;
    duplication) echo "Extraire la partie commune dans une fonction ou un module partagé, ou décider par écrit dans SPEED.md que la copie reste" ;;
    sql) echo "Réécrire la migration selon l'aide de squawk (index concurrent, timeouts, colonne nullable puis remplie), ou décider par écrit" ;;
    env) echo "Retirer le .env de git, déclarer la variable dans .env.example, finir le Dockerfile par un USER non root" ;;
  esac
}

# Configuration déclarée du projet (comportement 4).
SQL_GLOB='**/migrations/**/*.sql'; ENV_IGNORE=''
read_conf() {
  local f=.cothon/quality.conf line
  [[ -f "$f" ]] || return 0
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="${line%%#*}"
    [[ "$line" =~ ^[[:space:]]*$ ]] && continue
    [[ "$line" =~ ^[[:space:]]*([A-Za-z_]+)[[:space:]]*=[[:space:]]*(.*)$ ]] || blocked "$f : ligne illisible : $line"
    local k="${BASH_REMATCH[1]}" v="${BASH_REMATCH[2]}"
    v="${v%"${v##*[![:space:]]}"}"
    case "$k" in
      sql_glob) SQL_GLOB="$v" ;;
      env_ignore) ENV_IGNORE="${v//[[:space:]]/}" ;;
      *) blocked "$f : clé inconnue « $k » (clés : sql_glob, env_ignore)" ;;
    esac
  done < "$f"
}

# Commande d'un outil dans TOOL (tableau) et son nom affiché dans TOOL_NAME.
# $1 binaire, $2 paquet npm, $3 version épinglée (vide : le binaire du projet est obligatoire).
resolve() {
  local bin="$1" pkg="$2" ver="$3" pm v
  if [[ -x "node_modules/.bin/$bin" ]]; then
    TOOL=("node_modules/.bin/$bin")
    v=$(jq -r '.version // empty' "node_modules/$pkg/package.json" 2>/dev/null)
    TOOL_NAME="$bin@${v:-projet}"; note_tool "$TOOL_NAME"; return 0
  fi
  [[ -n "$ver" ]] || blocked "$bin absent du projet (node_modules/.bin/$bin)"
  pm=$(jq -r '.packageManager // empty' package.json 2>/dev/null); pm="${pm%%@*}"
  case "$pm" in
    pnpm) TOOL=(pnpm --silent dlx "$pkg@$ver") ;;
    bun) TOOL=(bunx "$pkg@$ver") ;;
    *) TOOL=(npx --yes "$pkg@$ver") ;;
  esac
  command -v "${TOOL[0]}" >/dev/null || blocked "${TOOL[0]} absent : impossible de lancer $pkg@$ver"
  TOOL_NAME="$bin@$ver"; note_tool "$TOOL_NAME"
}

js_files() { git ls-files -z -- "${JS_FILES[@]}"; }
sql_files() { git ls-files -z -- ":(glob)$SQL_GLOB"; }
count0() { tr -cd '\0' | wc -c | tr -d ' '; }

fam_complexite() {
  local cfg=.cothon/presets/oxlint/qualite.json rc
  [[ -f "$cfg" ]] || cfg="$(cd "$HERE/.." && pwd)/presets/oxlint/qualite.json"
  [[ -f "$cfg" ]] || blocked "preset oxlint/qualite introuvable (preset oxlint/qualite, ou presets/ de cothon)"
  resolve oxlint oxlint ""
  "${TOOL[@]}" -c "$cfg" -f unix > "$TMP/raw" 2> "$TMP/err"; rc=$?
  (( rc <= 1 )) || blocked "$TOOL_NAME sort $rc : $(last_err)"
  grep -E "$UNIX_RE" "$TMP/raw"
}

fam_code_mort() {
  local rc
  resolve knip knip "$KNIP_VERSION"
  "${TOOL[@]}" --reporter json --no-exit-code > "$TMP/out.knip" 2> "$TMP/err"; rc=$?
  # Le JSON tient sur une ligne ; une config du projet chargée par knip peut écrire avant lui (dotenv).
  grep '^{"issues"' "$TMP/out.knip" | tail -1 > "$TMP/raw"
  if (( rc != 0 )); then
    # Sortie 2 de knip : un plugin n'a pas pu charger une config du projet. Avec un JSON complet, les
    # constats restent, signalés partiels ; sans JSON, knip n'a pas tourné.
    jq -e '.issues' "$TMP/raw" >/dev/null 2>&1 || blocked "$TOOL_NAME sort $rc : $(last_err)"
    grep '^ERROR' "$TMP/err" | sort -u | sed 's/^/quality-check : attention : knip : /' >&2
    note_tool "$TOOL_NAME (config du projet en erreur, résultats partiels)"
  fi
  jq -r '
    [["files", "fichier inutilisé"], ["exports", "export inutilisé"], ["types", "type exporté inutilisé"],
     ["dependencies", "dépendance inutilisée"], ["devDependencies", "dépendance de dev inutilisée"]] as $kinds
    | .issues[] | . as $i | $kinds[] | . as [$k, $label]
    | ($i[$k] // [])[]
    | "\($i.file):\(.line // 1):\(.col // 1): \($label) : \(.name) [Warning/knip(\($k))]"' "$TMP/raw" 2>/dev/null \
    || blocked "$TOOL_NAME : sortie JSON illisible ($(head -c 120 "$TMP/raw"))"
}

fam_duplication() {
  resolve jscpd jscpd "$JSCPD_VERSION"
  # jscpd respecte .gitignore par défaut (--no-gitignore pour l'inverse) ; -f : les mêmes fichiers que le dénominateur.
  "${TOOL[@]}" . -r json -o "$TMP/jscpd" --silent -f javascript,typescript,jsx,tsx > /dev/null 2> "$TMP/err" \
    || blocked "$TOOL_NAME sort $? : $(last_err)"
  [[ -f "$TMP/jscpd/jscpd-report.json" ]] || blocked "$TOOL_NAME n'a pas écrit jscpd-report.json"
  jq -r '.duplicates[] | .lines as $n | .firstFile as $a | .secondFile as $b
    | "\($a.name):\($a.start):1: \($n) lignes dupliquées avec \($b.name) [Warning/jscpd(clone)]",
      "\($b.name):\($b.start):1: \($n) lignes dupliquées avec \($a.name) [Warning/jscpd(clone)]"' \
    "$TMP/jscpd/jscpd-report.json" 2>/dev/null || blocked "$TOOL_NAME : rapport JSON illisible"
}

fam_sql() {
  local files=() f rc
  while IFS= read -r -d '' f; do files+=("$f"); done < <(sql_files)
  (( ${#files[@]} )) || { note_tool "squawk (non lancé : aucun fichier)"; return 0; }
  resolve squawk squawk-cli "$SQUAWK_VERSION"
  "${TOOL[@]}" --reporter json --no-error-on-unmatched-pattern "${files[@]}" > "$TMP/raw" 2> "$TMP/err"; rc=$?
  (( rc <= 1 )) || blocked "$TOOL_NAME sort $rc : $(last_err)"
  # squawk compte lignes et colonnes à partir de 0 : le format unix à partir de 1.
  jq -r '.[] | "\(.file):\(.line + 1):\(.column + 1): \(.message | gsub("\n"; " ")) [\(if (.level | ascii_downcase) == "error" then "Error" else "Warning" end)/squawk(\(.rule_name))]"' \
    "$TMP/raw" 2>/dev/null || blocked "$TOOL_NAME : sortie JSON illisible ($(head -c 120 "$TMP/raw"))"
}

fam_env() {
  local f base keys="" u srcs=() docker=()
  note_tool bash
  while IFS= read -r -d '' f; do
    base="${f##*/}"
    if [[ "$base" =~ ^\.env(\..+)?$ && ! "$base" =~ \.(example|sample|template)$ ]]; then
      printf "%s:1:1: fichier d'environnement suivi par git [Error/env(fichier-commite)]\n" "$f"   # E1
    fi
    if [[ "$base" == .env.example || "$base" =~ ^\.env\..+\.example$ ]]; then
      # « NOM= » déclare une variable ; « # NOM=valeur » aussi : variable optionnelle, avec son défaut dans le code.
      keys+=$(sed -n 's/^#\{0,1\}[[:space:]]*\([A-Za-z_][A-Za-z0-9_]*\)=.*/\1/p' "$f" | tr '\n' ',')
    fi
    [[ "$base" == Dockerfile || "$base" == *.Dockerfile || "$base" == Dockerfile.* ]] && docker+=("$f")
  done < <(git ls-files -z)
  # E2 : lectures non déclarées, une par couple (fichier, nom), à la première lecture.
  while IFS= read -r -d '' f; do [[ -f "$f" ]] && srcs+=("$f"); done < <(js_files)
  if (( ${#srcs[@]} )); then
    awk -v skip=",$ENV_BUILTIN,$ENV_IGNORE,$keys," -v q="'" '
      BEGIN { re = "process[.]env[.][A-Za-z_][A-Za-z0-9_]*|process[.]env[[][\"" q "][A-Za-z_][A-Za-z0-9_]*[\"" q "][]]|import[.]meta[.]env[.][A-Za-z_][A-Za-z0-9_]*" }
      {
        line = $0; off = 0
        while (match(line, re)) {
          m = substr(line, RSTART, RLENGTH); col = off + RSTART
          if (substr(m, 1, 12) == "process.env[") name = substr(m, 14, length(m) - 15)
          else { name = m; sub(/^(process[.]env[.]|import[.]meta[.]env[.])/, "", name) }
          if (index(skip, "," name ",") == 0 && !((FILENAME SUBSEP name) in seen)) {
            seen[FILENAME, name] = 1
            printf "%s:%d:%d: variable %s lue sans être déclarée dans .env.example [Warning/env(variable-non-declaree)]\n", FILENAME, FNR, col, name
          }
          off += RSTART + RLENGTH - 1; line = substr(line, RSTART + RLENGTH)
        }
      }' "${srcs[@]}"
  fi
  # E3 : la dernière instruction USER manque ou vaut root ou 0.
  for f in "${docker[@]+"${docker[@]}"}"; do
    [[ -f "$f" ]] || continue
    u=$(awk 'toupper($1) == "USER" { u = $2 } END { print u }' "$f"); u="${u%%:*}"
    [[ -z "$u" || "$u" == root || "$u" == 0 ]] && printf '%s:1:1: dernière instruction USER absente ou root [Warning/env(dockerfile-root)]\n' "$f"
  done
  return 0
}

# Une famille : constats sur stdout, sortie 0, 1 ou 2.
family() {
  "fam_${1//-/_}" > "$TMP/out"
  cat "$TMP/out"
  [[ -s "$TMP/out" ]] && exit 1
  exit 0
}

cell() { printf '%s' "$1" | tr '|\n' '/ '; }

rapport() {
  local base="$1" f rc n add tool on nv="$HERE/new-violations.sh" blocked_any=0
  printf '| Famille | Constats | Ajoutés par la branche | Sur quoi | Outil | Que faire |\n'
  printf '|---|---|---|---|---|---|\n'
  for f in "${FAMILIES[@]}"; do
    rm -f "$TMP/tool"
    QC_TOOL_FILE="$TMP/tool" bash "$SELF" "$f" --project . > "$TMP/fam" 2> "$TMP/err"; rc=$?
    tool=$(cat "$TMP/tool" 2>/dev/null); tool="${tool:-–}"
    if (( rc == 2 )); then
      n="bloqué : $(sed -n 's/^quality-check : BLOQUÉ : //p' "$TMP/err" | tail -1)"; blocked_any=1
    else
      n=$(grep -cE "$UNIX_RE" "$TMP/fam")
    fi
    add="–"
    if [[ -n "$base" && $rc != 2 ]]; then
      if [[ ! -f "$nv" ]]; then
        add="bloqué : new-violations.sh absent"
      else
        bash "$nv" --base "$base" -- bash "$SELF" "$f" --project . > "$TMP/nv" 2>&1
        if (( $? == 2 )); then
          add="bloqué : $(sed -n 's/.*BLOQUÉ : //p' "$TMP/nv" | tail -1)"
        else
          add=$(sed -n 's/^new-violations : \([0-9][0-9]*\) ajoutée.*/\1/p' "$TMP/nv" | tail -1)
          add="${add:-bloqué : résumé de new-violations.sh illisible}"
        fi
      fi
    fi
    if [[ "$f" == sql ]]; then on=$(sql_files | count0); else on=$(js_files | count0); fi
    printf '| %s | %s | %s | %s fichiers | %s | %s |\n' "$f" "$(cell "$n")" "$(cell "$add")" "$on" "$(cell "$tool")" "$(todo "$f")"
  done
  exit $(( blocked_any ? 2 : 0 ))
}

cmd="${1:-}"; (( $# )) && shift
case "$cmd" in
  --selftest) exec bash "$HERE/test/quality-check.test.sh" ;;
  complexite | code-mort | duplication | sql | env | rapport) ;;
  *) blocked "usage : quality-check.sh <complexite|code-mort|duplication|sql|env|rapport> [--project <chemin>] [--base <ref>] | --selftest" ;;
esac
PROJ=.; BASE=""
while (( $# )); do
  case "$1" in
    --project) (( $# >= 2 )) || blocked "--project attend un chemin"; PROJ="$2"; shift 2 ;;
    --base) [[ "$cmd" == rapport ]] || blocked "--base n'existe que pour rapport"
      (( $# >= 2 )) || blocked "--base attend une référence"; BASE="$2"; shift 2 ;;
    *) blocked "argument inconnu : $1" ;;
  esac
done
cd "$PROJ" 2>/dev/null || blocked "projet introuvable : $PROJ"
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || blocked "$PROJ n'est pas dans un dépôt git"
command -v jq >/dev/null || blocked "jq absent"
read_conf
TMP=$(mktemp -d "${TMPDIR:-/tmp}/quality-check.XXXXXX") || blocked "mktemp"
trap 'rm -rf "$TMP"' EXIT
if [[ "$cmd" == rapport ]]; then rapport "$BASE"; else family "$cmd"; fi
