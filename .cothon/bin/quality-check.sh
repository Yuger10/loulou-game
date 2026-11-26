#!/usr/bin/env bash
# Contrôles qualité à la manière de sentinel (spec docs/specs/controles-qualite, ADR 0013).
# Usage : bash scripts/quality-check.sh <famille> [--project <chemin>]
#         bash scripts/quality-check.sh rapport [--project <chemin>] [--base <ref>]
#         bash scripts/quality-check.sh --selftest
# Familles : complexite (oxlint), code-mort (knip), duplication (jscpd), sql (squawk et règles maison), env (bash et git),
#            secrets (gitleaks, binaire épinglé par version et SHA-256 dans scripts/gitleaks.pin).
#         bash scripts/quality-check.sh --pin-gitleaks <version>   (écrit scripts/gitleaks.pin depuis la release GitHub)
# Une famille écrit une ligne par constat au format unix (docs/reference/diagnostics.md), chemin relatif
# à la racine du projet ; sortie 0 aucun constat, 1 au moins un, 2 bloqué. Le rapport imprime un tableau
# Markdown, une ligne par famille ; il mesure sans juger : sortie 0, ou 2 si une famille est bloquée.
# Configuration déclarée : .cothon/quality.conf, lignes « cle = valeur » (sql_glob, env_ignore, docker_context).
# Outils : node_modules/.bin du projet, sinon paquet ponctuel du gestionnaire déclaré (packageManager),
# à la version épinglée ci-dessous. Dépendances : bash, git, jq.
set -uo pipefail

SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
HERE="$(dirname "$SELF")"
FAMILIES=(complexite code-mort duplication sql env secrets)
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
    sql) echo "Réécrire la migration selon l'aide de squawk (index concurrent, timeouts, colonne nullable puis remplie) ; ne jamais modifier une migration appliquée ; Prisma : une valeur d'enum par migration, \$queryRaw au lieu de Unsafe ; ou décider par écrit" ;;
    secrets) echo "Révoquer le secret chez son émetteur, puis le retirer du code (variable d'environnement) ; un faux positif va dans .gitleaksignore avec son empreinte" ;;
    env) echo "Retirer le .env de git, déclarer la variable dans .env.example (vide si secret), retirer les variables mortes, aligner FROM node sur .node-version, finir le Dockerfile par un USER non root et des COPY --chown" ;;
  esac
}

# Configuration déclarée du projet (comportement 4).
SQL_GLOB='**/migrations/**/*.sql'; ENV_IGNORE=''; DOCKER_CONTEXT=''
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
      docker_context) DOCKER_CONTEXT="$v" ;;
      *) blocked "$f : clé inconnue « $k » (clés : sql_glob, env_ignore, docker_context)" ;;
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
    # [[ -s ]] d'abord : jq 1.6 sort 0 avec -e sur une entrée vide.
    [[ -s "$TMP/raw" ]] && jq -e '.issues' "$TMP/raw" >/dev/null 2>&1 || blocked "$TOOL_NAME sort $rc : $(last_err)"
    grep '^ERROR' "$TMP/err" | sort -u | sed 's/^/quality-check : attention : knip : /' >&2
    note_tool "$TOOL_NAME (config du projet en erreur, résultats partiels)"
  fi
  jq -r '
    [["files", "fichier inutilisé"], ["exports", "export inutilisé"], ["types", "type exporté inutilisé"],
     ["dependencies", "dépendance inutilisée"], ["devDependencies", "dépendance de dev inutilisée"]] as $kinds
    | .issues[] | . as $i | $kinds[] | . as [$k, $lib]
    | ($i[$k] // [])[]
    | "\($i.file):\(.line // 1):\(.col // 1): \($lib) : \(.name) [Warning/knip(\($k))]"' "$TMP/raw" 2>/dev/null \
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
  sql_house_rules "${files[@]+"${files[@]}"}"
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
  env_contracts
  env_docker "${docker[@]+"${docker[@]}"}"
  return 0
}

# Règles maison de la famille sql (spec cothon-0.13, B1 ; règles de sentinel, docs/sql-adoption.md).
# Base des migrations : QC_BASE, sinon la merge-base avec origin/HEAD, origin/main ou main ; aucune : règles sans base sautées.
sql_base() {
  local r
  for r in "${QC_BASE:-}" origin/HEAD origin/main main; do
    [[ -n "$r" ]] || continue
    git merge-base HEAD "$r" 2>/dev/null && return 0
  done
  return 1
}
uses_prisma() {
  [[ -n "$(git ls-files -- ':(glob)**/*.prisma' | head -1)" ]] && return 0
  jq -e '((.dependencies // {}) + (.devDependencies // {})) | has("@prisma/client") or has("prisma")' package.json >/dev/null 2>&1
}
sql_house_rules() {
  local base="" f d st old new col
  base=$(sql_base) || base=""
  # S1 applied-migration-changed : une migration présente sur la base, modifiée, renommée ou supprimée.
  if [[ -n "$base" ]]; then
    while IFS=$'\t' read -r st old new; do
      case "$st" in
        M) printf '%s:1:1: migration déjà appliquée modifiée : écrire une nouvelle migration [Error/sql(migration-appliquee-modifiee)]\n' "$old" ;;
        D) printf '%s:1:1: migration déjà appliquée supprimée : historique réécrit [Error/sql(migration-appliquee-modifiee)]\n' "$old" ;;
        R*) printf '%s:1:1: migration déjà appliquée renommée depuis %s : historique réécrit [Error/sql(migration-appliquee-modifiee)]\n' "$new" "$old" ;;
      esac
    done < <(git diff --name-status -M "$base" -- ":(glob)$SQL_GLOB" 2>/dev/null)
  fi
  # S2 update-delete-sans-where : dans une migration, UPDATE ou DELETE sans WHERE (toute la table).
  for f in "$@"; do
    [[ -f "$f" ]] || continue
    awk -v f="$f" 'BEGIN { RS = ";" } {
        st = $0; pre = st; match(pre, /^[[:space:]]*/); pre = substr(pre, 1, RLENGTH)
        first = cur + gsub(/\n/, "", pre) + 1
        gsub(/--[^\n]*/, "", st); u = toupper(st)
        if (u ~ /(^|[^A-Z_])(UPDATE[[:space:]]+[^[:space:]]+[[:space:]]+SET|DELETE[[:space:]]+FROM)[[:space:]]/ && u !~ /(^|[^A-Z_])WHERE([^A-Z_]|$)/)
          printf "%s:%d:1: UPDATE ou DELETE sans WHERE : toute la table est touchée [Warning/sql(update-delete-sans-where)]\n", f, first
        cur += gsub(/\n/, "\n", $0)
      }' "$f"
  done
  uses_prisma || return 0
  # P1 dossier-sans-migration-sql (P3015) : un dossier de migrations Prisma sans migration.sql.
  while IFS= read -r d; do
    [[ -f "$d/migration.sql" ]] || printf '%s:1:1: dossier de migration Prisma sans migration.sql (P3015 au déploiement) [Error/sql(prisma-dossier-sans-sql)]\n' "$d"
  done < <(git ls-files -- ':(glob)**/migrations/*/*' | while IFS= read -r f; do
             top="${f%/*}"; [[ -n "$(git ls-files -- "${top%/*}/migration_lock.toml")" ]] && printf '%s\n' "$top"; done | sort -u)
  # P2 enum-utilisee-avant-commit (P3018) : ALTER TYPE … ADD VALUE puis la valeur utilisée dans la même migration.
  for f in "$@"; do
    [[ -f "$f" ]] || continue
    awk -v f="$f" -v q="'" '
      toupper($0) ~ /ALTER[[:space:]]+TYPE.*ADD[[:space:]]+VALUE/ {
        if (match($0, q "[^" q "]+" q)) added[substr($0, RSTART, RLENGTH)] = NR
        next
      }
      { for (v in added) if (index($0, v)) { printf "%s:%d:1: valeur d%cenum %s ajoutée ligne %d puis utilisée dans la même migration (P3018) : la déplacer dans une migration suivante [Error/sql(prisma-enum-avant-commit)]\n", f, NR, 39, v, added[v]; delete added[v] } }' "$f"
  done
  # P3 sql-brut-non-sur : $queryRawUnsafe, $executeRawUnsafe, Prisma.raw( dans le code, hors tests.
  git grep -nE '\$(query|execute)RawUnsafe([^[:alnum:]_]|$)|Prisma\.raw\(' -- "${JS_FILES[@]}" ':!:**/*.test.*' ':!:**/*.spec.*' 2>/dev/null \
    | awk -F: '{ printf "%s:%s:1: SQL brut non paramétré ($queryRawUnsafe, $executeRawUnsafe ou Prisma.raw) : utiliser $queryRaw ou Prisma.sql [Error/sql(prisma-sql-brut)]\n", $1, $2 }'
  # P4 colonne-supprimee-encore-lue : DROP COLUMN dans une migration ajoutée par la branche, nom encore cité en SQL brut.
  [[ -n "$base" ]] || return 0
  while IFS= read -r f; do
    [[ -f "$f" ]] || continue
    grep -oiE 'DROP[[:space:]]+COLUMN[[:space:]]+(IF[[:space:]]+EXISTS[[:space:]]+)?"?[A-Za-z_][A-Za-z0-9_]*' "$f" | sed -E 's/.*[[:space:]]"?//' | sort -u \
    | while IFS= read -r col; do
        git grep -lE '\$(query|execute)Raw|Prisma\.sql' -- "${JS_FILES[@]}" 2>/dev/null \
          | xargs -r git grep -nwF "$col" -- 2>/dev/null \
          | awk -F: -v c="$col" -v m="$f" '{ printf "%s:%s:1: colonne %s supprimée par %s, encore citée dans un fichier de SQL brut [Warning/sql(prisma-colonne-supprimee-lue)]\n", $1, $2, c, m }'
      done
  done < <(git diff --name-only --diff-filter=A "$base" -- ":(glob)$SQL_GLOB" 2>/dev/null)
}

# E4 à E6 : les contrats (.env.example, .env.*.example), règles 6, 4 et 5 de sentinel (docs/env-adoption.md).
SECRET_RE='(SECRET|TOKEN|PASSWORD|PRIVATE_?KEY|ACCESS_?KEY|API_?KEY)'
PUBLIC_RE='^(VITE_|PUBLIC_|NEXT_PUBLIC_|REACT_APP_)'
env_contracts() {
  local f n name val line
  while IFS= read -r -d '' f; do
    [[ -f "$f" ]] || continue
    n=0
    while IFS= read -r line || [[ -n "$line" ]]; do
      n=$((n + 1))
      [[ "$line" =~ ^(#?)[[:space:]]*([A-Za-z_][A-Za-z0-9_]*)=(.*)$ ]] || continue
      local commented="${BASH_REMATCH[1]}"; name="${BASH_REMATCH[2]}"; val="${BASH_REMATCH[3]}"
      val="${val%%[[:space:]]#*}"; val="${val#\"}"; val="${val%\"}"; val="${val#\'}"; val="${val%\'}"
      if [[ "$name" =~ $SECRET_RE ]]; then
        if [[ "$name" =~ $PUBLIC_RE ]]; then                                                   # E6
          printf '%s:%d:1: %s : secret exposé au navigateur par son préfixe public, à revoir [Warning/env(secret-public)]\n' "$f" "$n" "$name"
        elif [[ -z "$commented" && -n "$val" && ! "$val" =~ ^([<].*[>]|\$\{.*\}|x+|changeme|CHANGEME)$ ]]; then   # E4
          printf '%s:%d:1: %s : secret avec une valeur commitée dans le contrat, à vider [Error/env(secret-non-vide)]\n' "$f" "$n" "$name"
        fi
      fi
      # E5 : déclarée, lue nulle part (ni code, ni Dockerfile, ni CI, ni config) hors des fichiers d'environnement.
      if ! git grep -qwF "$name" -- . ':(exclude,glob)**/.env*' ':(exclude,glob)**/*.env' 2>/dev/null; then
        printf '%s:%d:1: %s déclarée mais lue nulle part [Warning/env(variable-morte)]\n' "$f" "$n" "$name"
      fi
    done < "$f"
  done < <(git ls-files -z -- ':(glob)**/.env.example' ':(glob)**/.env.*.example')
}

# Version de Node attendue : .node-version, .nvmrc, puis engines.node ; seulement les chiffres et les points.
node_expected() {
  local v=""
  [[ -f .node-version ]] && v=$(head -1 .node-version)
  [[ -z "$v" && -f .nvmrc ]] && v=$(head -1 .nvmrc)
  [[ -z "$v" && -f package.json ]] && v=$(jq -r '.engines.node // empty' package.json 2>/dev/null)
  v=$(grep -oE '[0-9]+(\.[0-9]+){0,2}' <<< "$v" | head -1)
  printf '%s' "$v"
}

# E7 à E9 : les Dockerfile, règles 7, 9 et 10 de sentinel.
env_docker() {
  local f expected ctx
  expected=$(node_expected)
  for f in "$@"; do
    [[ -f "$f" ]] || continue
    ctx="${DOCKER_CONTEXT:-$(dirname "$f")}"
    awk -v f="$f" -v want="$expected" '
      function srcs(line,   n, i, a, out) {
        n = split(line, a, /[[:space:]]+/); out = ""
        for (i = 2; i < n; i++) if (a[i] !~ /^--/) out = out a[i] " "
        return out
      }
      { up = toupper($1) }
      up == "FROM" {
        stage++; user[stage] = ""; img = $2; sub(/^[^:]*node:/, "node:", img)
        if (want != "" && img ~ /^node:[0-9]/) {
          v = img; sub(/^node:/, "", v); sub(/[^0-9.].*$/, "", v)
          nv = split(v, dv, "."); nw = split(want, wv, "."); ok = 1
          for (i = 1; i <= nv && i <= nw; i++) if (dv[i] != wv[i]) ok = 0
          if (!ok) printf "%s:%d:1: FROM %s, alors que le projet attend Node %s [Error/env(version-node)]\n", f, NR, $2, want
        }
      }
      up == "USER" { user[stage] = $2 }
      up == "COPY" || up == "ADD" {
        line = $0; from = (line ~ /--from=/); chown = (line ~ /--chown=/)
        if (!from && up == "COPY") print "SRC\t" NR "\t" srcs(line)
        copies[stage] = copies[stage] NR ":" chown " "
      }
      END {
        u = user[stage]; sub(/:.*/, "", u)
        if (u != "" && u != "root" && u != "0") {
          n = split(copies[stage], c, " ")
          for (i = 1; i <= n; i++) { split(c[i], kv, ":"); if (kv[2] == 0) printf "%s:%d:1: COPY sans --chown dans l%cétage final non root [Warning/env(copy-sans-chown)]\n", f, kv[1], 39 }
        }
      }' "$f" > "$TMP/docker"
    grep -v $'^SRC\t' "$TMP/docker"
    while IFS=$'\t' read -r _ n list; do                                                        # E7
      for src in $list; do
        [[ "$src" == *'$'* || "$src" =~ ^https?:// ]] && continue
        compgen -G "$ctx/${src#/}" >/dev/null || printf "%s:%d:1: COPY %s : chemin absent du contexte de build %s [Error/env(copy-chemin-absent)]\n" "$f" "$n" "$src" "$ctx"
      done
    done < <(grep $'^SRC\t' "$TMP/docker")
  done
}

# Secrets : gitleaks, jamais le paquet npm du même nom (un autre projet). Binaire de la release GitHub,
# version et SHA-256 par plateforme épinglés dans scripts/gitleaks.pin, mis en cache dans ~/.cache/cothon/bin.
PIN_FILE="${QC_GITLEAKS_PIN:-$HERE/gitleaks.pin}"
pin_value() { sed -n "s/^$1[[:space:]]*=[[:space:]]*//p" "$PIN_FILE" 2>/dev/null | head -1; }
platform() {
  local os arch
  case "$(uname -s)" in Darwin) os=darwin ;; Linux) os=linux ;; *) return 1 ;; esac
  case "$(uname -m)" in arm64 | aarch64) arch=arm64 ;; x86_64 | amd64) arch=x64 ;; *) return 1 ;; esac
  printf '%s_%s' "$os" "$arch"
}
sha256() { if command -v sha256sum >/dev/null; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }
gitleaks_bin() {
  local v plat want cache tgz
  v=$(pin_value version); [[ -n "$v" ]] || blocked "gitleaks non épinglé : lance quality-check.sh --pin-gitleaks <version> (scripts/gitleaks.pin)"
  # Un gitleaks déjà présent à la version épinglée (CI, Homebrew) sert tel quel.
  if command -v gitleaks >/dev/null && [[ "$(gitleaks version 2>/dev/null)" == *"$v"* ]]; then
    TOOL=(gitleaks); TOOL_NAME="gitleaks@$v"; note_tool "$TOOL_NAME"; return 0
  fi
  plat=$(platform) || blocked "plateforme non prise en charge pour gitleaks : $(uname -sm)"
  want=$(pin_value "sha256_$plat"); [[ -n "$want" ]] || blocked "scripts/gitleaks.pin : pas de somme pour $plat"
  cache="${COTHON_CACHE:-$HOME/.cache/cothon}/bin/gitleaks-$v"
  if [[ ! -x "$cache/gitleaks" ]]; then
    command -v curl >/dev/null || blocked "curl absent : impossible de télécharger gitleaks $v"
    mkdir -p "$cache" || blocked "cache impossible : $cache"
    tgz="$TMP/gitleaks.tar.gz"
    curl -fsSL -o "$tgz" "https://github.com/gitleaks/gitleaks/releases/download/v$v/gitleaks_${v}_$plat.tar.gz" \
      || blocked "téléchargement de gitleaks $v ($plat) impossible"
    [[ "$(sha256 "$tgz")" == "$want" ]] || blocked "gitleaks $v ($plat) : somme SHA-256 différente de scripts/gitleaks.pin, binaire refusé"
    tar -xzf "$tgz" -C "$cache" gitleaks || blocked "archive gitleaks illisible"
  fi
  TOOL=("$cache/gitleaks"); TOOL_NAME="gitleaks@$v"; note_tool "$TOOL_NAME"
}
fam_secrets() {
  local rc
  gitleaks_bin
  # Les fichiers suivis seulement, tels qu'ils sont dans l'arbre de travail ; .gitleaksignore du projet respecté.
  mkdir -p "$TMP/tree" && git ls-files -z | tar --null -T - -cf - 2>/dev/null | tar -xf - -C "$TMP/tree" 2>/dev/null
  [[ -f .gitleaksignore ]] && cp .gitleaksignore "$TMP/tree/"
  ( cd "$TMP/tree" && "${TOOL[@]}" dir . --no-banner --redact --exit-code 0 --report-format json --report-path "$TMP/leaks.json" ) > /dev/null 2> "$TMP/err"; rc=$?
  (( rc == 0 )) || blocked "$TOOL_NAME sort $rc : $(last_err)"
  jq -r '.[] | "\(.File | sub("^\\./"; "")):\(.StartLine):\(.StartColumn): secret probable (\(.Description)) [Error/gitleaks(\(.RuleID))]"' "$TMP/leaks.json" 2>/dev/null \
    || blocked "$TOOL_NAME : rapport JSON illisible"
}
pin_gitleaks() {
  local v="$1" sums plat
  [[ "$v" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || blocked "--pin-gitleaks attend une version x.y.z"
  sums=$(curl -fsSL "https://github.com/gitleaks/gitleaks/releases/download/v$v/gitleaks_${v}_checksums.txt") \
    || blocked "checksums de gitleaks $v introuvables sur GitHub"
  { printf '# Épinglé par quality-check.sh --pin-gitleaks le %s, depuis gitleaks_%s_checksums.txt de la release GitHub.\n' "$(date -u +%Y-%m-%d)" "$v"
    printf 'version = %s\n' "$v"
    for plat in darwin_arm64 darwin_x64 linux_arm64 linux_x64; do
      printf 'sha256_%s = %s\n' "$plat" "$(awk -v f="gitleaks_${v}_$plat.tar.gz" '$2 == f { print $1 }' <<< "$sums")"
    done; } > "$PIN_FILE"
  echo "quality-check : $PIN_FILE écrit (gitleaks $v)"
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
        QC_BASE="$base" bash "$nv" --base "$base" -- bash "$SELF" "$f" --project . > "$TMP/nv" 2>&1
        if (( $? == 2 )); then
          add="bloqué : $(sed -n 's/.*BLOQUÉ : //p' "$TMP/nv" | tail -1)"
        else
          add=$(sed -n 's/^new-violations : \([0-9][0-9]*\) ajoutée.*/\1/p' "$TMP/nv" | tail -1)
          add="${add:-bloqué : résumé de new-violations.sh illisible}"
        fi
      fi
    fi
    case "$f" in
      sql) on=$(sql_files | count0) ;;
      secrets) on=$(git ls-files -z | count0) ;;
      *) on=$(js_files | count0) ;;
    esac
    printf '| %s | %s | %s | %s fichiers | %s | %s |\n' "$f" "$(cell "$n")" "$(cell "$add")" "$on" "$(cell "$tool")" "$(todo "$f")"
  done
  exit $(( blocked_any ? 2 : 0 ))
}

cmd="${1:-}"; (( $# )) && shift
case "$cmd" in
  --selftest) exec bash "$HERE/test/quality-check.test.sh" ;;
  --pin-gitleaks) TMP=""; pin_gitleaks "${1:-}"; exit 0 ;;
  complexite | code-mort | duplication | sql | env | secrets | rapport) ;;
  *) blocked "usage : quality-check.sh <complexite|code-mort|duplication|sql|env|secrets|rapport> [--project <chemin>] [--base <ref>] | --pin-gitleaks <version> | --selftest" ;;
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
