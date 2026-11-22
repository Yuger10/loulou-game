#!/usr/bin/env bash
# cothon documentation checks. Run from the repository root.
# Deterministic, no network, no dependency beyond bash, git, grep and jq (jq only if package.json is used).
# Env: AGENTS_MAX_LINES (default 150).
set -uo pipefail

max_lines="${AGENTS_MAX_LINES:-150}"
errors=0
fail() { printf 'docs: %s\n' "$1" >&2; errors=$((errors + 1)); }

# 1. AGENTS.md is the single source, short enough to be reloaded on every request.
if [[ ! -f AGENTS.md ]]; then
  fail "AGENTS.md manquant à la racine"
else
  lines=$(wc -l < AGENTS.md | tr -d ' ')
  (( lines > max_lines )) && fail "AGENTS.md fait $lines lignes (budget $max_lines)"
fi

# 2. CLAUDE.md must import AGENTS.md (Claude Code ignores AGENTS.md when CLAUDE.md exists).
if [[ ! -f CLAUDE.md ]]; then
  fail "CLAUDE.md manquant (doit contenir @AGENTS.md)"
elif ! grep -qx '@AGENTS.md' CLAUDE.md; then
  fail "CLAUDE.md doit contenir la ligne @AGENTS.md"
fi

# 3. Commands cited in AGENTS.md must exist in the task runner.
if [[ -f AGENTS.md ]]; then
  while IFS= read -r cmd; do
    runner=${cmd%% *}
    task=${cmd##* }
    case "$runner" in
      bun|npm|pnpm|yarn)
        if [[ ! -f package.json ]] || ! jq -e --arg t "$task" '.scripts[$t]' package.json >/dev/null; then
          fail "commande citée dans AGENTS.md introuvable dans package.json : $cmd"
        fi ;;
      make)
        grep -qE "^${task}:" Makefile 2>/dev/null || fail "cible absente du Makefile : $cmd" ;;
      just)
        grep -qE "^${task}( |:)" justfile 2>/dev/null || fail "recette absente du justfile : $cmd" ;;
    esac
  done < <(grep -oE '`(bun|npm|pnpm|yarn) run [A-Za-z0-9:_-]+|`(make|just) [A-Za-z0-9_-]+' AGENTS.md | tr -d '`' | sort -u)
fi

# 4. At least one ADR (MADR) in docs/adr/.
compgen -G 'docs/adr/[0-9][0-9][0-9][0-9]-*.md' >/dev/null || fail "aucun ADR dans docs/adr/ (format NNNN-titre.md)"

# 5. Internal Markdown links resolve (external links: lychee in a scheduled CI job).
while IFS= read -r md; do
  dir=$(dirname "$md")
  while IFS= read -r target; do
    path=${target%%#*}
    [[ -z "$path" || "$path" == *"<"* || "$path" == *" "* ]] && continue
    [[ -e "$dir/$path" ]] || fail "lien cassé dans $md : $target"
  done < <(grep -oE '\]\([^)]+\)' "$md" | sed -E 's/^\]\((.*)\)$/\1/' | grep -vE '^(https?:|mailto:|#)')
done < <(git ls-files --cached --others --exclude-standard '*.md')

if (( errors > 0 )); then
  printf 'docs: %d problème(s)\n' "$errors" >&2
  exit 1
fi
echo "docs: ok"
