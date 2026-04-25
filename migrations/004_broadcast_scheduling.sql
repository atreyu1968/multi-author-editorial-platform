-- Broadcast scheduling: queue campaigns for future delivery instead of
-- sending them inline in the request. New columns let the admin pick a
-- target send time + IANA timezone and an optional emails-per-minute
-- throttle. A background worker (server/routes.ts cron tick) polls for
-- broadcasts whose scheduled_for is due and dispatches them.
ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS scheduled_for text,
  ADD COLUMN IF NOT EXISTS timezone text,
  ADD COLUMN IF NOT EXISTS rate_limit_per_minute integer;

-- Speeds up the "find due scheduled broadcasts" tick query.
CREATE INDEX IF NOT EXISTS idx_broadcasts_status_scheduled
  ON broadcasts(status, scheduled_for);
