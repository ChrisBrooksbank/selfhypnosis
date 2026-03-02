#!/usr/bin/env bash
set -euo pipefail

# Ralph Wiggum Loop — feeds prompts to Claude with fresh context per iteration.
# Progress lives in files and git, not LLM memory.
#
# Usage:
#   ./loop.sh plan [max_iterations]
#   ./loop.sh build [max_iterations]

MODE="${1:-}"
MAX="${2:-0}"

if [[ "$MODE" != "plan" && "$MODE" != "build" ]]; then
  echo "Usage: ./loop.sh <plan|build> [max_iterations]"
  exit 1
fi

PROMPT_FILE="PROMPT_${MODE}.md"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Error: $PROMPT_FILE not found"
  exit 1
fi

ITERATION=0

while true; do
  ITERATION=$((ITERATION + 1))

  if [[ "$MAX" -gt 0 && "$ITERATION" -gt "$MAX" ]]; then
    echo "Reached max iterations ($MAX). Stopping."
    break
  fi

  echo ""
  echo "========================================="
  echo "  Iteration $ITERATION — mode: $MODE"
  echo "========================================="
  echo ""

  # Fresh Claude invocation each iteration — no carried-over context
  cat "$PROMPT_FILE" | claude -p --model sonnet --allowedTools "Bash(npm run:*)" "Bash(npx *)" "Read" "Write" "Edit" "Glob" "Grep"

  # Auto-commit any changes
  if [[ -n "$(git status --porcelain)" ]]; then
    git add -A
    git commit -m "ralph(${MODE}): iteration ${ITERATION}

Automated commit from loop.sh ${MODE} mode."
    echo "Committed iteration $ITERATION changes."
  else
    echo "No changes in iteration $ITERATION."
  fi

  # Brief pause between iterations
  sleep 2
done
