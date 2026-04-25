#!/bin/bash
set -e

# Replit's post-merge environment may not have npm/node on PATH (depends on
# how the runtime injects toolchains). When npm IS available we keep deps in
# sync and run our own additive schema sync; otherwise we exit 0 so the merge
# isn't blocked — the workflow restart that follows will surface any real issue.
#
# We intentionally use scripts/sync-schema.ts instead of `drizzle-kit push`
# because drizzle-kit prompts interactively when it sees a new column it
# suspects is a rename of an existing one, and that prompt was hanging the
# update flow on the self-hosted server. sync-schema.ts is purely additive
# (CREATE TABLE / ADD COLUMN IF NOT EXISTS / ADD CONSTRAINT IF NOT EXISTS)
# and always non-interactive, so it can run safely on every merge.
if command -v npm >/dev/null 2>&1; then
  npm install --no-audit --no-fund
  if command -v npx >/dev/null 2>&1; then
    npx tsx scripts/sync-schema.ts || true
  else
    echo "post-merge: npx not on PATH; skipping schema sync"
  fi
else
  echo "post-merge: npm not on PATH; skipping install/schema sync"
fi
