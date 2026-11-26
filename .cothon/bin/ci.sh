#!/usr/bin/env bash
# CI exigée dès l'init (spec docs/specs/cothon-0.13, B4) : ce que le workflow .github/workflows/cothon.yml d'un projet lance.
# Distribué aux projets par « preset bin/ci » (.cothon/bin/ci.sh). Tout vient de docs/factory/COTHON.md, déclaré à l'init :
#   Commande check : <commande>                  obligatoire
#   Commande build : <commande> | aucune         (B6)
#   Sortie du build : <dossier>                  si build
#   Budget du build : <n> Ko                     si build ; mesuré par du -sk, agnostique
#   Lighthouse CI : oui | non                    oui : lighthouserc.* du projet, @lhci/cli en devDependency épinglée
#   Barrière qualité : <familles> | aucune       familles de quality-check.sh dont seuls les ajouts bloquent
# Usage : bash ci.sh install | check | quality | build | lighthouse | all
#         bash ci.sh --selftest
# Sortie : 0 ok, 1 échec de l'étape, 2 bloqué (déclaration absente ou illisible).
set -uo pipefail

SELF="$(cd "$(dirname "$0")" && pwd)/$(basename "$0")"
HERE="$(dirname "$SELF")"
COTHON_MD=docs/factory/COTHON.md

blocked() { printf 'ci : BLOQUÉ : %s\n' "$1" >&2; exit 2; }
say() { printf 'ci : %s\n' "$1"; }
decl() { sed -n "s/^$1[[:space:]]*:[[:space:]]*//p" "$COTHON_MD" 2>/dev/null | head -1 | sed 's/[[:space:]]*$//'; }
need() { local v; v=$(decl "$1"); [[ -n "$v" ]] || blocked "$COTHON_MD : ligne « $1 : … » absente (déclarée à l'init, playbook 4.1)"; printf '%s' "$v"; }

do_install() {
  local pm; pm=$(jq -r '.packageManager // empty' package.json 2>/dev/null); pm="${pm%%@*}"
  case "$pm" in
    pnpm) corepack enable >/dev/null 2>&1; pnpm install --frozen-lockfile ;;
    bun) command -v bun >/dev/null || blocked "bun absent : ajoute oven-sh/setup-bun (épinglé par SHA) avant ce pas"; bun install --frozen-lockfile ;;
    npm) npm ci ;;
    "") [[ -f package.json ]] && blocked "package.json sans packageManager : déclare l'adaptateur (docs/reference/adaptateurs.md)"; say "pas de package.json : rien à installer" ;;
    *) blocked "gestionnaire non pris en charge : $pm" ;;
  esac
}

do_check() { local c; c=$(need "Commande check") || exit 2; say "check : $c"; bash -c "$c"; }

do_quality() {
  local fams f rc=0 qc nv
  fams=$(need "Barrière qualité") || exit 2
  [[ "$fams" == aucune ]] && { say "barrière qualité : aucune famille déclarée"; return 0; }
  qc="$HERE/quality-check.sh"; nv="$HERE/new-violations.sh"
  [[ -f "$qc" && -f "$nv" ]] || blocked "quality-check.sh ou new-violations.sh absent de $HERE (preset bin/quality-check, bin/new-violations)"
  for f in ${fams//,/ }; do
    say "barrière qualité : $f"
    bash "$nv" -- bash "$qc" "$f" || rc=1
  done
  return "$rc"
}

do_build() {
  local c out budget kb
  c=$(need "Commande build") || exit 2; [[ "$c" == aucune ]] && { say "build : aucun déclaré"; return 0; }
  out=$(need "Sortie du build") || exit 2; budget=$(need "Budget du build") || exit 2
  [[ "$budget" =~ ^([0-9]+)[[:space:]]*Ko$ ]] || blocked "Budget du build illisible : « $budget » (attendu : <n> Ko)"
  budget="${BASH_REMATCH[1]}"
  say "build : $c"; bash -c "$c" || return 1
  [[ -d "$out" ]] || blocked "Sortie du build absente après le build : $out"
  kb=$(du -sk "$out" | cut -f1)
  if (( kb > budget )); then say "budget dépassé : $out pèse $kb Ko, budget $budget Ko"; return 1; fi
  say "budget tenu : $out pèse $kb Ko, budget $budget Ko"
}

do_lighthouse() {
  local v; v=$(decl "Lighthouse CI"); [[ "$v" == oui ]] || { say "Lighthouse CI : non déclaré"; return 0; }
  [[ -x node_modules/.bin/lhci ]] || blocked "Lighthouse CI déclaré mais @lhci/cli absent des dépendances de dev"
  node_modules/.bin/lhci autorun
}

selftest() {
  local t ok=0 rc out
  t=$(mktemp -d "${TMPDIR:-/tmp}/ci-selftest.XXXXXX") || exit 1
  trap 'rm -rf "$t"' RETURN
  mkdir -p "$t/p/docs/factory" "$t/p/src" && cd "$t/p" || exit 1
  fail() { echo "selftest : $1"; ok=1; }
  printf 'Version : 0.13.0\n' > "$COTHON_MD"
  bash "$SELF" check >/dev/null 2>"$t/err"; rc=$?
  (( rc == 2 )) && grep -q 'Commande check' "$t/err" || fail "check sans déclaration : sortie $rc, attendu 2"
  printf 'Commande check : echo check-ok\nCommande build : mkdir -p dist && head -c 3000 /dev/zero > dist/a.js\nSortie du build : dist\nBudget du build : 100 Ko\nBarrière qualité : aucune\nLighthouse CI : non\n' > "$COTHON_MD"
  out=$(bash "$SELF" check 2>&1); rc=$?
  (( rc == 0 )) && grep -q check-ok <<< "$out" || fail "check : sortie $rc ($out)"
  out=$(bash "$SELF" build 2>&1); rc=$?
  (( rc == 0 )) && grep -q 'budget tenu' <<< "$out" || fail "build sous budget : sortie $rc ($out)"
  sed -i.bak 's/^Budget du build : 100 Ko/Budget du build : 1 Ko/' "$COTHON_MD"
  out=$(bash "$SELF" build 2>&1); rc=$?
  (( rc == 1 )) && grep -q 'budget dépassé' <<< "$out" || fail "build au-dessus du budget : sortie $rc, attendu 1 ($out)"
  sed -i.bak 's/^Budget du build : 1 Ko/Budget du build : beaucoup/' "$COTHON_MD"
  bash "$SELF" build >/dev/null 2>&1; rc=$?
  (( rc == 2 )) || fail "budget illisible : sortie $rc, attendu 2"
  out=$(bash "$SELF" quality 2>&1); rc=$?
  (( rc == 0 )) && grep -q 'aucune famille' <<< "$out" || fail "barrière aucune : sortie $rc"
  sed -i.bak 's/^Barrière qualité : aucune/Barrière qualité : env/' "$COTHON_MD"
  bash "$SELF" quality >/dev/null 2>"$t/err"; rc=$?
  if [[ -f "$HERE/quality-check.sh" ]]; then :; else (( rc == 2 )) || fail "barrière sans quality-check.sh : sortie $rc, attendu 2"; fi
  out=$(bash "$SELF" lighthouse 2>&1); rc=$?
  (( rc == 0 )) && grep -q 'non déclaré' <<< "$out" || fail "lighthouse non déclaré : sortie $rc"
  printf '{ "name": "x" }\n' > package.json
  bash "$SELF" install >/dev/null 2>&1; rc=$?
  (( rc == 2 )) || fail "install sans packageManager : sortie $rc, attendu 2"
  (( ok == 0 )) && echo "selftest : ok"
  return "$ok"
}

cmd="${1:-}"
case "$cmd" in
  --selftest) selftest; exit $? ;;
  install | check | quality | build | lighthouse | all) ;;
  *) blocked "usage : ci.sh install|check|quality|build|lighthouse|all | --selftest" ;;
esac
command -v jq >/dev/null || blocked "jq absent"
[[ -f "$COTHON_MD" ]] || blocked "$COTHON_MD absent : cothon n'est pas installé dans ce projet"
if [[ "$cmd" == all ]]; then
  rc=0
  for step in install check quality build lighthouse; do
    bash "$SELF" "$step"; r=$?
    (( r == 2 )) && exit 2
    (( r != 0 )) && rc=1
  done
  exit "$rc"
fi
"do_$cmd"
