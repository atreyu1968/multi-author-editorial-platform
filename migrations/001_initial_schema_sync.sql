-- ============================================================
-- Migración 001: Sincronización completa del esquema
-- Asegura que todas las columnas existen en producción
-- Fecha: 2026-02-10
-- ============================================================

-- Books: columnas que pueden faltar en instalaciones anteriores
ALTER TABLE books ADD COLUMN IF NOT EXISTS store_links TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS publication_date TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS direct_sale_enabled BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS direct_sale_price REAL;
ALTER TABLE books ADD COLUMN IF NOT EXISTS direct_sale_stock INTEGER DEFAULT 0;
ALTER TABLE books ADD COLUMN IF NOT EXISTS digital_files TEXT;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_digital_product BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS sale_format_physical BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS sale_format_digital BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN DEFAULT false;
ALTER TABLE books ADD COLUMN IF NOT EXISTS audiobook_url TEXT;

-- Editorial Settings: columnas que pueden faltar
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS paypal_client_id TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS paypal_client_secret TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS paypal_environment TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS currency TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS currency_symbol TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_newsletter_provider TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_newsletter_api_key TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_newsletter_from_name TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_newsletter_from_email TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_digital_provider TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_digital_api_key TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_digital_from_name TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_digital_from_email TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_invoice_provider TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_invoice_api_key TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_invoice_from_name TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS email_invoice_from_email TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS text_color TEXT;
ALTER TABLE editorial_settings ADD COLUMN IF NOT EXISTS footer_logo_url TEXT;
