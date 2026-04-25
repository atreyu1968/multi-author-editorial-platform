#!/bin/bash
set -e

# Replit's post-merge environment may not have npm/node on PATH (depends on
# how the runtime injects toolchains). When npm IS available we keep deps in
# sync and push the Drizzle schema; otherwise we exit 0 so the merge isn't
# blocked — the workflow restart that follows will surface any real issue.
if command -v npm >/dev/null 2>&1; then
  npm install --no-audit --no-fund
  # Pipe "No" so drizzle-kit's interactive truncate prompt never blocks.
  printf 'No, add the constraint without truncating the table\n' | npm run db:push -- --force || true
else
  echo "post-merge: npm not on PATH; skipping install/db:push"
fi
