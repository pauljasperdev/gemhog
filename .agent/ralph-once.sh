set -e

opencode run \
  --model openai/gpt-5.1-codex-max \
  --file .agent/prd.json \
  --file .agent/progress.md \
  --log-level DEBUG \
  -- \
  "Follow these steps to complete a task: \
  0. Read .agent/prd.json and .agent/progres.md \
  1. Decide which open task from .agent/prd.json to work on. \
  This should be the one YOU decide has the highest priority, \
  - not necessarily the first in the list. \
  \
  ONLY WORK ON A SINGLE ITEM. \
  \
  2. Before stating you MUST verify linting via 'uv run poe lint' \
  run tests with 'uv run poe test' and a clean worktree. \
  There might be uncommited changes from previous work that was interrupted. \
  You can either keep working there or restore and start somewhere else if you chose a different item. \
  3. While implementing, append your progress to the .agent/progress.md file. \
    - use this to leave a notes in markdown for the next person working on this project. \
  4. Format code via 'uv run poe format'. Linting and tests MUST pass after making changes. \
  5. You MUST mark an done in prd.json if requirements and verification are met. \
  6. In the last step, you MUST make a git commit of that work following Conventional Commit rules. \
    Leaving a clean working tree before completing.
  \
  If all work is complete, output <promise>COMPLETE</promise>."
