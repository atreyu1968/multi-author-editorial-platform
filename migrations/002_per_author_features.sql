-- ============================================================
-- Migración 002: Funcionalidades por autor
-- - Lista de correo por autor
-- - Dominio personalizado
-- - Libro de regalo individual
-- Fecha: 2026-04-21
-- ============================================================

-- Mailing list por autor
ALTER TABLE authors ADD COLUMN IF NOT EXISTS mailing_list_enabled BOOLEAN DEFAULT true;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email_from_name TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email_from_email TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email_provider TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS email_api_key TEXT;

-- Dominio personalizado
ALTER TABLE authors ADD COLUMN IF NOT EXISTS custom_domain TEXT;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'authors_custom_domain_unique'
  ) THEN
    ALTER TABLE authors ADD CONSTRAINT authors_custom_domain_unique UNIQUE (custom_domain);
  END IF;
END$$;

-- Libro de regalo por autor
ALTER TABLE authors ADD COLUMN IF NOT EXISTS free_book_file TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS free_book_cover TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS free_book_title TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS free_book_description TEXT;
ALTER TABLE authors ADD COLUMN IF NOT EXISTS free_book_cta_text TEXT;
