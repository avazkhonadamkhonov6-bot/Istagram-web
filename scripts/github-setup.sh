#!/usr/bin/env bash
# Az docs/TASKS.md dar GitHub label-ho, milestone-ho (Ruzi 1–4), Issue-ho va Project board mesozad.
# Istifoda: bash scripts/github-setup.sh [GITHUB_USERNAME_I_ABUBAKR]
# Takror ijro kardan bexatar ast: Issue-hoe ki alla'kay hastand (az ruyi ID dar sarlavha) dubora sohta nameshavand.
set -euo pipefail

REPO="avazkhonadamkhonov6-bot/Istagram-web"
OWNER="${REPO%%/*}"
AVAZ_GH="avazkhonadamkhonov6-bot"
ABUBAKR_GH="${1:-}"
TASKS="$(dirname "$0")/../docs/TASKS.md"

echo "== Label-ho"
create_label() { gh label create "$1" --repo "$REPO" --color "$2" --description "$3" --force >/dev/null; }
create_label backend  1D76DB "NestJS API"
create_label frontend 0E8A16 "Next.js web"
create_label qa       FBCA04 "Test va tekshirish"
create_label avaz     5319E7 "Vazifai Avaz"
create_label abubakr  D93F0B "Vazifai Abubakr"
create_label bug      B60205 "Xato"

echo "== Milestone-ho"
for d in 1 2 3 4; do
  if ! gh api "repos/$REPO/milestones?state=all" --jq '.[].title' | grep -qx "Ruzi $d"; then
    gh api "repos/$REPO/milestones" -f title="Ruzi $d" -f description="PLAN.md — Ruzi $d" >/dev/null
  fi
done

echo "== Issue-ho"
existing="$(gh issue list --repo "$REPO" --state all --limit 500 --json title --jq '.[].title')"

# TASKS.md-ro ba qismho az ruyi '### ' judo mekunem
tmp="$(mktemp -d)"
awk -v d="$tmp" '/^### /{n++} n>0{print > (d "/task_" sprintf("%02d", n) ".md")}' "$TASKS"

created=()
for f in "$tmp"/task_*.md; do
  title="$(head -1 "$f" | sed 's/^### //')"
  id="${title%% ·*}"
  meta="$(grep -o '<!-- who:[a-z]* day:[0-9] type:[a-z]* -->' "$f")"
  who="$(sed -E 's/.*who:([a-z]+).*/\1/' <<<"$meta")"
  day="$(sed -E 's/.*day:([0-9]).*/\1/' <<<"$meta")"
  type="$(sed -E 's/.*type:([a-z]+).*/\1/' <<<"$meta")"

  if grep -q "^$id ·" <<<"$existing"; then echo "  skip $id (hast)"; continue; fi

  body="$(tail -n +3 "$f")"$'\n\n---\n'"[TASKS.md](https://github.com/$REPO/blob/main/docs/TASKS.md) · [PLAN.md](https://github.com/$REPO/blob/main/docs/PLAN.md)"
  args=(--repo "$REPO" --title "$title" --body "$body" --label "$type" --label "$who" --milestone "Ruzi $day")
  if [[ "$who" == "avaz" ]]; then args+=(--assignee "$AVAZ_GH"); fi
  if [[ "$who" == "abubakr" && -n "$ABUBAKR_GH" ]]; then args+=(--assignee "$ABUBAKR_GH"); fi

  url="$(gh issue create "${args[@]}")"
  created+=("$url")
  echo "  + $id → $url"
done
rm -rf "$tmp"

echo "== Project board"
num="$(gh project list --owner "$OWNER" --format json --jq '.projects[] | select(.title=="Instagram — 4 ruz") | .number' || true)"
if [[ -z "$num" ]]; then
  num="$(gh project create --owner "$OWNER" --title "Instagram — 4 ruz" --format json --jq '.number')"
  gh project link "$num" --owner "$OWNER" --repo "$REPO" >/dev/null || true
fi
for url in "${created[@]}"; do
  gh project item-add "$num" --owner "$OWNER" --url "$url" >/dev/null
done
echo "Tayyor: https://github.com/users/$OWNER/projects/$num"
