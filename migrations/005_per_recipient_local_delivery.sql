-- Per-recipient local 9 a.m. delivery for newsletter campaigns.
--
-- Adds an optional IANA `timezone` column to subscribers (captured from the
-- browser at signup) and three new columns on broadcasts so authors can
-- schedule a campaign for "9 a.m. local time of each subscriber":
--
--   schedule_mode          'fixed' (legacy) | 'per_recipient_local_9am'
--   local_delivery_date    YYYY-MM-DD on which each tz hits its local 9am
--   completed_timezones    text[] of IANA zones already dispatched to,
--                          so overlapping ticks never double-send.
ALTER TABLE newsletters
  ADD COLUMN IF NOT EXISTS timezone text;

ALTER TABLE broadcasts
  ADD COLUMN IF NOT EXISTS schedule_mode text NOT NULL DEFAULT 'fixed',
  ADD COLUMN IF NOT EXISTS local_delivery_date text,
  ADD COLUMN IF NOT EXISTS completed_timezones text[];
