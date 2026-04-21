-- Free book tokens: one-time, expiring secure download links emailed to newsletter subscribers
CREATE TABLE IF NOT EXISTS free_book_tokens (
  id varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id varchar NOT NULL,
  email text NOT NULL,
  file_url text NOT NULL,
  token varchar NOT NULL UNIQUE,
  expires_at text NOT NULL,
  used_at text,
  created_at text DEFAULT current_timestamp
);

CREATE INDEX IF NOT EXISTS idx_free_book_tokens_token ON free_book_tokens(token);
CREATE INDEX IF NOT EXISTS idx_free_book_tokens_author ON free_book_tokens(author_id);
