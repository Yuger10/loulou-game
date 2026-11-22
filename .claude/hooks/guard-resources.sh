#!/usr/bin/env bash
# Garde des ressources d'Amrou (cothon 0.2.0-1, playbook 5.4) : hook
# PreToolUse sur Bash. Refuse toute commande destructrice qui vise une
# ressource protégée (liste : AGENTS.md, section « Ressources protégées »).
# Sortie : 0 autorisé ; 2 refusé (la raison part sur stderr, vers l'agent).
#   bash .claude/hooks/guard-resources.sh --selftest   vérifie sa propre logique
set -uo pipefail

# rend la raison d'un refus, ou rien si la commande est permise
reason_for() {
  local cmd="$1"
  # 1. l'historique et la branche main
  [[ "$cmd" =~ git[[:space:]]+push.*(--force|[[:space:]]-f([[:space:]]|$)|--force-with-lease) ]] && { echo "push forcé : interdit (AGENTS.md)"; return; }
  [[ "$cmd" =~ git[[:space:]]+reset[[:space:]]+--hard ]] && { echo "git reset --hard efface du travail : commiter d'abord, puis annuler par un commit"; return; }
  [[ "$cmd" =~ git[[:space:]]+clean[[:space:]]+-[a-z]*f ]] && { echo "git clean -f efface des fichiers non suivis"; return; }
  [[ "$cmd" =~ git[[:space:]]+branch[[:space:]]+-D[[:space:]]+main([[:space:]]|$) ]] && { echo "supprimer la branche main"; return; }
  [[ "$cmd" =~ gh[[:space:]]+pr[[:space:]]+merge.*--admin ]] && { echo "merge forcé en administrateur : il contourne ci-ok et la protection de main"; return; }
  [[ "$cmd" =~ gh[[:space:]]+api.*-X[[:space:]]*(DELETE|PUT).*branches/main/protection ]] && { echo "modifier la protection de main : décision d'Amrou"; return; }
  # 2. les dossiers du jeu, de la doc et des tests holdout
  if [[ "$cmd" =~ (^|[[:space:];&|])(rm|trash)[[:space:]] ]]; then
    local p
    for p in js docs conductor test test/holdout .git .github; do
      if [[ "$cmd" =~ (^|[[:space:]/\'\"])$p/?([[:space:]\'\"]|$) ]]; then echo "suppression de « $p » : ressource protégée"; return; fi
    done
  fi
}

if [[ "${1:-}" == "--selftest" ]]; then
  fail=0
  expect() { # expect <attendu: allow|deny> <commande>
    local got=allow; [[ -n "$(reason_for "$2")" ]] && got=deny
    if [[ "$got" != "$1" ]]; then echo "❌ $1 attendu, $got obtenu : $2"; fail=1; fi
  }
  expect deny 'git push --force origin main'
  expect deny 'git push -f'
  expect deny 'git reset --hard HEAD~1'
  expect deny 'git clean -fd'
  expect deny 'git branch -D main'
  expect deny 'gh pr merge 12 --merge --admin'
  expect deny 'rm -rf js'
  expect deny 'rm -rf test/holdout'
  expect deny 'cd /tmp && rm -r docs/'
  expect deny 'rm -rf .git'
  expect allow 'git push -u origin claude/x'
  expect allow 'git branch -D claude/vieille-branche'
  expect allow 'rm js/zz-essai.js'
  expect allow 'rm -rf node_modules'
  expect allow 'gh pr merge 12 --merge'
  expect allow 'bun run check'
  if (( fail )); then echo "guard-resources : selftest en échec"; exit 1; fi
  echo "guard-resources : selftest ok (16 cas)"; exit 0
fi

command -v jq >/dev/null || { echo "guard-resources : jq absent, la garde ne peut pas vérifier : commande bloquée" >&2; exit 2; }
cmd="$(jq -r '.tool_input.command // empty')"
[[ -z "$cmd" ]] && exit 0
why="$(reason_for "$cmd")"
if [[ -n "$why" ]]; then
  printf 'Refusé par la garde des ressources (.claude/hooks/guard-resources.sh) : %s.\n' "$why" >&2
  exit 2
fi
exit 0
