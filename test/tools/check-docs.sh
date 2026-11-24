#!/usr/bin/env bash
# Vérifications de documentation cothon. À lancer depuis la racine du dépôt.
# Usage : bash check-docs.sh            (appelé par la commande check du projet)
#         bash check-docs.sh --selftest
# Déterministe, sans réseau. Dépendances : bash, git, grep ; jq seulement si package.json sert de lanceur.
# Env : AGENTS_MAX_LINES (défaut 150).
# Sortie : 0 ok, 1 problème de doc, 2 bloqué (pas un dépôt git, jq absent alors qu'il est requis).
set -uo pipefail

check() {
  local max_lines="${AGENTS_MAX_LINES:-150}" errors=0
  fail() { printf 'docs: %s\n' "$1" >&2; errors=$((errors + 1)); }
  blocked() { printf 'docs: BLOQUÉ : %s\n' "$1" >&2; exit 2; }
  git rev-parse --is-inside-work-tree >/dev/null 2>&1 || blocked "pas un dépôt git (lance le script à la racine du projet)"

  # 1. AGENTS.md : source unique, assez court pour être chargé à chaque session.
  if [[ ! -f AGENTS.md ]]; then
    fail "AGENTS.md manquant à la racine"
  else
    local lines; lines=$(wc -l < AGENTS.md | tr -d ' ')
    (( lines > max_lines )) && fail "AGENTS.md fait $lines lignes (budget $max_lines)"
  fi

  # 2. S'il y a un CLAUDE.md, il importe AGENTS.md (sinon Claude Code ne lit que CLAUDE.md).
  if [[ -f CLAUDE.md ]] && ! grep -qx '@AGENTS.md' CLAUDE.md; then
    fail "CLAUDE.md doit contenir la ligne @AGENTS.md"
  fi

  # 3. Les commandes citées dans AGENTS.md existent dans le lanceur de tâches.
  if [[ -f AGENTS.md ]]; then
    local cmd runner task
    while IFS= read -r cmd; do
      runner=${cmd%% *}; task=${cmd##* }
      case "$runner" in
        bun|npm|pnpm|yarn)
          [[ -f package.json ]] || { fail "commande citée dans AGENTS.md sans package.json : $cmd"; continue; }
          command -v jq >/dev/null || blocked "jq absent (requis pour lire package.json)"
          jq -e --arg t "$task" '.scripts[$t]' package.json >/dev/null || fail "script absent de package.json : $cmd" ;;
        make) grep -qE "^${task}:" Makefile 2>/dev/null || fail "cible absente du Makefile : $cmd" ;;
        just) grep -qE "^${task}( |:)" justfile 2>/dev/null || fail "recette absente du justfile : $cmd" ;;
        task) grep -qE "^  ${task}:" Taskfile.yml 2>/dev/null || fail "tâche absente de Taskfile.yml : $cmd" ;;
      esac
    done < <(grep -oE '`(bun|npm|pnpm|yarn) run [A-Za-z0-9:_-]+|`(make|just|task) [A-Za-z0-9:_-]+' AGENTS.md | tr -d '`' | sort -u)
  fi

  # 4. Au moins un ADR (MADR) dans docs/adr/.
  # NNNN-titre.md (MADR) ou ADR-NNN-titre.md (convention déjà en place, vue sur moly-safety).
  compgen -G 'docs/adr/[0-9][0-9][0-9][0-9]-*.md' >/dev/null || compgen -G 'docs/adr/ADR-[0-9][0-9][0-9]-*.md' >/dev/null \
    || fail "aucun ADR dans docs/adr/ (format NNNN-titre.md ou ADR-NNN-titre.md)"

  # 5. Les liens Markdown internes existent (liens externes : lychee dans un job CI planifié).
  local md dir target path
  while IFS= read -r -d '' md; do
    dir=$(dirname "$md")
    while IFS= read -r target; do
      path=${target%%#*}
      [[ -z "$path" || "$path" == *"<"* || "$path" == *" "* ]] && continue
      [[ -e "$dir/$path" ]] || fail "lien cassé dans $md : $target"
    # Les liens dans un bloc de code délimité (``` ou ~~~) sont des exemples, pas des liens (vu sur moly-safety).
    done < <(awk '
      /^[[:space:]]*(```|~~~)/ {
        match($0, /(`{3,}|~{3,})/); fence = substr($0, RSTART, RLENGTH)
        if (open == "") { open = fence; next }
        if (substr(fence, 1, 1) == substr(open, 1, 1) && length(fence) >= length(open) && $0 ~ /^[[:space:]]*(`+|~+)[[:space:]]*$/) { open = ""; next }
      }
      open == "" { print }
    ' "$md" | grep -oE '\]\([^)]+\)' | sed -E 's/^\]\((.*)\)$/\1/' | grep -vE '^(https?:|mailto:|#)')
  done < <(git ls-files -z --cached --others --exclude-standard '*.md')

  if (( errors > 0 )); then printf 'docs: %d problème(s)\n' "$errors" >&2; exit 1; fi
  echo "docs: ok"
}

selftest() {
  local self; self="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
  local t; t="${TMPDIR:-/tmp}"; t=$(mktemp -d "${t%/}/docs-selftest.XXXXXX") || exit 2
  local ok=0
  (cd "$t" && bash "$self" >/dev/null 2>&1); (( $? == 2 )) || { echo "selftest : hors dépôt git non bloqué"; ok=1; }
  cd "$t" && git init -q . && mkdir -p docs/adr
  printf '# p\n\n## Commandes\n- `make check`\n' > AGENTS.md
  printf 'check:\n\t@true\n' > Makefile
  printf '# 0001\n\nvoir [le guide](../guide.md)\n' > 'docs/adr/0001-décision.md'
  printf '# guide\n' > docs/guide.md
  bash "$self" >/dev/null 2>&1; (( $? == 0 )) || { echo "selftest : dépôt sain refusé"; ok=1; }
  printf 'autre\n' > CLAUDE.md
  bash "$self" >/dev/null 2>&1; (( $? == 1 )) || { echo "selftest : CLAUDE.md sans import accepté"; ok=1; }
  printf '@AGENTS.md\n' > CLAUDE.md && rm docs/guide.md
  bash "$self" >/dev/null 2>&1; (( $? == 1 )) || { echo "selftest : lien cassé (fichier accentué) non vu"; ok=1; }
  printf '# guide\n' > docs/guide.md && printf -- '- `make deploy`\n' >> AGENTS.md
  bash "$self" >/dev/null 2>&1; (( $? == 1 )) || { echo "selftest : cible make absente non vue"; ok=1; }
  # ADR nommés ADR-NNN-titre.md (retour de moly-safety) ; lien d'exemple dans un bloc de code ignoré.
  printf '# p\n\n## Commandes\n- `make check`\n' > AGENTS.md
  git mv -q 'docs/adr/0001-décision.md' docs/adr/ADR-001-décision.md 2>/dev/null || mv 'docs/adr/0001-décision.md' docs/adr/ADR-001-décision.md
  bash "$self" >/dev/null 2>&1; (( $? == 0 )) || { echo "selftest : ADR au format ADR-NNN-titre.md refusé"; ok=1; }
  printf '# exemple\n\n```md\nvoir [la spec](./spec.md)\n```\n' > docs/exemple.md
  bash "$self" >/dev/null 2>&1; (( $? == 0 )) || { echo "selftest : lien dans un bloc de code pris pour un vrai lien"; ok=1; }
  printf 'puis [absent](./absent.md)\n' >> docs/exemple.md
  bash "$self" >/dev/null 2>&1; (( $? == 1 )) || { echo "selftest : lien cassé après un bloc de code non vu"; ok=1; }
  cd / && rm -rf "$t"
  (( ok == 0 )) && echo "selftest : ok"
  exit "$ok"
}

[[ "${1:-}" == "--selftest" ]] && selftest
check
