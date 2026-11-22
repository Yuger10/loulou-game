#!/usr/bin/env bash
# Claude Code PostToolUse hook: format and lint the file the agent just edited.
# Exit 2 sends stderr back to the agent so it fixes the issue immediately.
set -uo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"

[[ -z "$file" || ! -f "$file" ]] && exit 0
case "$file" in
  *.js|*.jsx|*.mjs|*.cjs|*.ts|*.tsx|*.mts|*.cts) ;;
  *) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
bin="node_modules/.bin"

# Local binaries only: no download, no package manager startup cost.
[[ -x "$bin/oxfmt" ]] && "$bin/oxfmt" "$file" >/dev/null 2>&1
[[ -x "$bin/oxlint" ]] || exit 0

if ! out="$("$bin/oxlint" --deny-warnings "$file" 2>&1)"; then
  printf 'oxlint a trouvé des problèmes dans %s :\n%s\n' "$file" "$out" >&2
  exit 2
fi
exit 0
