import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, real, integer, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const authors = pgTable("authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  heroTitle: text("hero_title").notNull(),
  heroSubtitle: text("hero_subtitle").notNull(),
  bioParagraph1: text("bio_paragraph_1").notNull(),
  bioParagraph2: text("bio_paragraph_2").notNull(),
  bioParagraph3: text("bio_paragraph_3").notNull(),
  photo: text("photo"),
  email: text("email"),
  instagramUrl: text("instagram_url"),
  twitterUrl: text("twitter_url"),
  facebookUrl: text("facebook_url"),
  amazonUrl: text("amazon_url"),
  isActive: boolean("is_active").default(true),
  // SEO fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  // Background customization
  backgroundImageUrl: text("background_image_url"),
  backgroundColor: text("background_color"),
  // Per-author mailing list configuration
  mailingListEnabled: boolean("mailing_list_enabled").default(true),
  emailFromName: text("email_from_name"),
  emailFromEmail: text("email_from_email"),
  emailProvider: text("email_provider"), // "Resend" | "SendGrid" | "Mailchimp" | "Brevo" | "Postmark" | "Mailgun" | "Gmail"
  emailApiKey: text("email_api_key"),
  // Custom domain (e.g. authorname.com)
  customDomain: text("custom_domain").unique(),
  // Free book offered by this author
  freeBookFile: text("free_book_file"),
  freeBookCover: text("free_book_cover"),
  freeBookTitle: text("free_book_title"),
  freeBookDescription: text("free_book_description"),
  freeBookCtaText: text("free_book_cta_text"),
});

export const bookSeries = pgTable("book_series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id"), // Nullable - series can have books from multiple authors
  title: text("title").notNull(),
  description: text("description").notNull(),
  genre: text("genre").notNull(),
  amazonUrl: text("amazon_url"),
  isActive: boolean("is_active").default(true),
  cardBackgroundImage: text("card_background_image"),
  // Landing page fields
  landingHeroImage: text("landing_hero_image"),
  landingTagline: text("landing_tagline"),
  landingWorldDescription: text("landing_world_description"),
  landingCharacters: text("landing_characters"),
  landingReadingOrder: text("landing_reading_order"),
  landingThemes: text("landing_themes").array(),
  // Promotional content (optional)
  promoConceptMap: text("promo_concept_map"),
  promoShowConceptMap: boolean("promo_show_concept_map").default(true),
  promoFamilyTree: text("promo_family_tree"),
  promoShowFamilyTree: boolean("promo_show_family_tree").default(true),
  promoPressNotes: text("promo_press_notes").array(),
  promoShowPressNotes: boolean("promo_show_press_notes").default(true),
  promoAdditionalMedia: text("promo_additional_media").array(),
  promoShowAdditionalMedia: boolean("promo_show_additional_media").default(true),
  promoSpotifyPlaylist: text("promo_spotify_playlist"),
  promoShowSpotifyPlaylist: boolean("promo_show_spotify_playlist").default(true),
  promoYoutubeBooktrailer: text("promo_youtube_booktrailer"),
  promoShowYoutubeBooktrailer: boolean("promo_show_youtube_booktrailer").default(true),
  // Background customization
  backgroundImageUrl: text("background_image_url"),
  backgroundColor: text("background_color"),
});

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  genre: text("genre").notNull(),
  price: real("price"),
  amazonUrl: text("amazon_url"),
  // Store links - JSON array: [{name: "Google Play", url: "https://..."}, {name: "Kobo", url: "https://..."}]
  storeLinks: text("store_links"),
  seriesId: varchar("series_id"),
  orderInSeries: integer("order_in_series"),
  isStandalone: boolean("is_standalone").default(false),
  isPublished: boolean("is_published").default(true),
  publicationDate: text("publication_date"), // Format: YYYY-MM-DD
  // Landing page fields
  landingHeroImage: text("landing_hero_image"),
  landingTagline: text("landing_tagline"),
  landingSynopsis: text("landing_synopsis"),
  landingFeatures: text("landing_features").array(),
  landingQuotes: text("landing_quotes").array(),
  landingCTA: text("landing_cta"),
  landingGallery: text("landing_gallery").array(),
  landingAwards: text("landing_awards").array(),
  // Promotional content (optional)
  promoConceptMap: text("promo_concept_map"),
  promoShowConceptMap: boolean("promo_show_concept_map").default(true),
  promoFamilyTree: text("promo_family_tree"),
  promoShowFamilyTree: boolean("promo_show_family_tree").default(true),
  promoPressNotes: text("promo_press_notes").array(),
  promoShowPressNotes: boolean("promo_show_press_notes").default(true),
  promoAdditionalMedia: text("promo_additional_media").array(),
  promoShowAdditionalMedia: boolean("promo_show_additional_media").default(true),
  promoSpotifyPlaylist: text("promo_spotify_playlist"),
  promoShowSpotifyPlaylist: boolean("promo_show_spotify_playlist").default(true),
  promoYoutubeBooktrailer: text("promo_youtube_booktrailer"),
  promoShowYoutubeBooktrailer: boolean("promo_show_youtube_booktrailer").default(true),
  // SEO fields
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  seoKeywords: text("seo_keywords"),
  // Background customization
  backgroundImageUrl: text("background_image_url"),
  backgroundColor: text("background_color"),
  // Direct sales configuration
  directSaleEnabled: boolean("direct_sale_enabled").default(false),
  directSalePrice: real("direct_sale_price"),
  directSaleStock: integer("direct_sale_stock").default(0),
  // Digital files configuration - JSON object with format keys: { epub: "url", pdf: "url", mobi: "url", azw3: "url" }
  digitalFiles: text("digital_files"),
  isDigitalProduct: boolean("is_digital_product").default(false),
  // Sale format configuration
  saleFormatPhysical: boolean("sale_format_physical").default(false),
  saleFormatDigital: boolean("sale_format_digital").default(false),
  // Coming soon flag
  isComingSoon: boolean("is_coming_soon").default(false),
  // Audiobook link (e.g. Audivia platform)
  audiobookUrl: text("audiobook_url"),
});

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorType: text("author_type").notNull(),
  authorPhoto: text("author_photo"),
  rating: integer("rating").notNull().default(5),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),
});

export const newsletters = pgTable("newsletters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  // Token used by subscriber-facing preference center & unsubscribe URLs.
  // Generated lazily for older rows by the storage layer.
  preferencesToken: varchar("preferences_token").unique(),
  // Soft-unsubscribe: when set, subscriber is globally unsubscribed from
  // this author. Granular per-list opt-outs live in newsletterListSubscriptions.
  unsubscribedAt: text("unsubscribed_at"),
  subscribedAt: text("subscribed_at").default(sql`current_timestamp`),
  // GDPR / RGPD audit trail. `consentedAt` records when the subscriber
  // explicitly agreed to receive commercial emails; `consentText` snapshots
  // the literal disclosure they were shown so we can prove what they
  // accepted at signup time.
  consentedAt: text("consented_at"),
  consentText: text("consent_text"),
});

// Per-author topical lists subscribers can opt into (e.g. "Histórica",
// "Thriller", "Romántica"). Lists are author-scoped because each author
// publishes in different genres.
export const newsletterLists = pgTable("newsletter_lists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  name: text("name").notNull(),
  // Stable slug used in URLs and as a sync key with external providers.
  slug: text("slug").notNull(),
  description: text("description"),
  // Pre-checked in the public signup form when true.
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").default(true),
  sortOrder: integer("sort_order").default(0),
  // Optional sync metadata for external providers (e.g. Resend Audience id).
  externalAudienceId: text("external_audience_id"),
  createdAt: text("created_at").default(sql`current_timestamp`),
});

// M2M: which lists a given subscriber has opted into. Deleting a subscriber
// or list cascades; we keep this row even if the subscriber is globally
// unsubscribed, so re-subscribing restores their preferences.
export const newsletterListSubscriptions = pgTable("newsletter_list_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  subscriberId: varchar("subscriber_id").notNull(),
  listId: varchar("list_id").notNull(),
  subscribedAt: text("subscribed_at").default(sql`current_timestamp`),
});

// Editable email templates. Author-scoped when authorId is set; falls back
// to the global (authorId = NULL) template of the same `type` when no
// per-author template exists. The HTML is a Handlebars-style template:
// {{name}}, {{book_title}}, {{download_url}}, {{preferences_url}}, etc.
export const emailTemplates = pgTable("email_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id"),
  // Known types: "welcome" (plain newsletter signup), "free_book"
  // (signup with gift download), "broadcast" (admin-sent campaign),
  // "preferences" (subscriber preferences confirmation), "custom".
  type: text("type").notNull(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  html: text("html").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: text("created_at").default(sql`current_timestamp`),
  updatedAt: text("updated_at").default(sql`current_timestamp`),
});

// Email broadcasts - admin-composed campaigns sent to mailing-list
// subscribers. A broadcast can announce a new release (`type = "new_release"`)
// or a price promotion (`type = "promotion"`). For promotions we capture
// the discounted price and validity window so the email can show the
// "before / now / valid until" block. `bookId` points at the catalog book
// the campaign is about; when that book belongs to a series the email
// will also surface the previous books from that series. `listIds` is the
// set of newsletterLists targeted (NULL or empty = the author's whole
// active mailing list, regardless of list membership).
export const broadcasts = pgTable("broadcasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  type: text("type").notNull(), // "new_release" | "promotion"
  bookId: varchar("book_id"),
  subject: text("subject").notNull(),
  previewText: text("preview_text"),
  // Optional admin-written intro that appears above the auto-generated
  // book block (e.g. "¡Por fin tengo noticias para vosotros!").
  customMessage: text("custom_message"),
  // Price stored as integer cents to avoid float drift; currency is the
  // ISO-4217 code (e.g. "EUR"). Both are NULL for "new_release" campaigns.
  promoPriceCents: integer("promo_price_cents"),
  promoCurrency: text("promo_currency"),
  promoStartsAt: text("promo_starts_at"), // ISO date YYYY-MM-DD
  promoEndsAt: text("promo_ends_at"),
  // Targeting: array of newsletterLists.id. NULL/empty = send to every
  // active subscriber of this author.
  listIds: text("list_ids").array(),
  // Lifecycle: draft → sending → sent | failed.
  status: text("status").notNull().default("draft"),
  recipientCount: integer("recipient_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  errorMessage: text("error_message"),
  sentAt: text("sent_at"),
  createdAt: text("created_at").default(sql`current_timestamp`),
});

// Customers - registered users with billing information
export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  // Address stored as JSON: {street, city, state, zipCode, country}
  billingAddress: text("billing_address"),
  shippingAddress: text("shipping_address"),
  // Newsletter subscription
  isSubscribedToNewsletter: boolean("is_subscribed_to_newsletter").default(true),
  createdAt: text("created_at").default(sql`current_timestamp`),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  key: text("key").notNull(),
  value: text("value").notNull(),
  // Locale configuration fields
  defaultLocale: varchar("default_locale"), // e.g., "fr-FR", "de-DE", "pt-PT"
  autoDetectLocale: boolean("auto_detect_locale").default(true),
}, (table) => ({
  uniqueAuthorKey: unique("site_settings_author_key").on(table.authorId, table.key),
}));

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  excerpt: text("excerpt").notNull(),
  featuredImage: text("featured_image"),
  category: text("category").notNull(),
  tags: text("tags").array(),
  isPublished: boolean("is_published").default(false),
  publishedAt: text("published_at"),
  createdAt: text("created_at").default(sql`current_timestamp`),
  updatedAt: text("updated_at").default(sql`current_timestamp`),
});

export const uiTexts = pgTable("ui_texts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  namespace: text("namespace").notNull(),
  key: text("key").notNull(),
  locale: text("locale").notNull().default("es-ES"),
  value: text("value").notNull(),
}, (table) => ({
  uniqueKey: unique("ui_texts_unique_key").on(table.namespace, table.key, table.locale),
}));

export const editorialSettings = pgTable("editorial_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  // Branding
  name: text("name").notNull(),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  // Hero Section
  heroTitle: text("hero_title").notNull(),
  heroSubtitle: text("hero_subtitle").notNull(),
  heroPrimaryButtonText: text("hero_primary_button_text").notNull(),
  heroSecondaryButtonText: text("hero_secondary_button_text").notNull(),
  // What We Offer Section
  offerSectionTitle: text("offer_section_title").notNull(),
  offerSectionDescription: text("offer_section_description").notNull(),
  // Feature Cards (3 cards)
  feature1Title: text("feature1_title").notNull(),
  feature1Description: text("feature1_description").notNull(),
  feature1Icon: text("feature1_icon").notNull(),
  feature2Title: text("feature2_title").notNull(),
  feature2Description: text("feature2_description").notNull(),
  feature2Icon: text("feature2_icon").notNull(),
  feature3Title: text("feature3_title").notNull(),
  feature3Description: text("feature3_description").notNull(),
  feature3Icon: text("feature3_icon").notNull(),
  // Featured Authors Section
  featuredSectionTitle: text("featured_section_title").notNull(),
  featuredSectionDescription: text("featured_section_description").notNull(),
  // Footer
  footerLogoUrl: text("footer_logo_url"),
  footerDescription: text("footer_description").notNull(),
  footerEmail: text("footer_email").notNull(),
  footerLocation: text("footer_location").notNull(),
  footerInstagramUrl: text("footer_instagram_url"),
  footerTwitterUrl: text("footer_twitter_url"),
  footerFacebookUrl: text("footer_facebook_url"),
  footerCopyright: text("footer_copyright").notNull(),
  // Footer Navigation - stored as JSON array: [{label: string, url: string}]
  footerQuickLinks: text("footer_quick_links").array(),
  // SEO
  seoTitle: text("seo_title").notNull(),
  seoDescription: text("seo_description").notNull(),
  seoKeywords: text("seo_keywords").notNull(),
  // Theme Colors (independent from author colors)
  primaryColor: text("primary_color"),
  secondaryColor: text("secondary_color"),
  accentColor: text("accent_color"),
  textColor: text("text_color"),
  // Background customization
  backgroundImageUrl: text("background_image_url"),
  backgroundColor: text("background_color"),
  // PayPal Configuration
  paypalClientId: text("paypal_client_id"),
  paypalClientSecret: text("paypal_client_secret"),
  paypalEnvironment: text("paypal_environment").default("sandbox"), // "sandbox" | "production"
  // Currency Configuration
  currency: text("currency").notNull().default("USD"),
  currencySymbol: text("currency_symbol").notNull().default("$"),
  // Email Configuration - Newsletter
  emailNewsletterProvider: text("email_newsletter_provider"), // "Resend" | "SendGrid" | "Mailchimp" | "Brevo" | "Postmark" | "Mailgun"
  emailNewsletterApiKey: text("email_newsletter_api_key"),
  emailNewsletterFromName: text("email_newsletter_from_name"),
  emailNewsletterFromEmail: text("email_newsletter_from_email"),
  // Email Configuration - Digital Products
  emailDigitalProvider: text("email_digital_provider"),
  emailDigitalApiKey: text("email_digital_api_key"),
  emailDigitalFromName: text("email_digital_from_name"),
  emailDigitalFromEmail: text("email_digital_from_email"),
  // Email Configuration - Invoices
  emailInvoiceProvider: text("email_invoice_provider"),
  emailInvoiceApiKey: text("email_invoice_api_key"),
  emailInvoiceFromName: text("email_invoice_from_name"),
  emailInvoiceFromEmail: text("email_invoice_from_email"),
});

// Merchandise Products - products linked to authors, books, or series
export const merchandiseProducts = pgTable("merchandise_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  imageUrl: text("image_url"),
  stock: integer("stock").notNull().default(0),
  isActive: boolean("is_active").default(true),
  // Linked entity - can be author, book, or series
  linkedEntityType: text("linked_entity_type"), // "author" | "book" | "series" | null (global)
  linkedEntityId: varchar("linked_entity_id"), // ID of the author, book, or series
  createdAt: text("created_at").default(sql`current_timestamp`),
  updatedAt: text("updated_at").default(sql`current_timestamp`),
});

// Cart Items - shopping cart for users
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(), // For guest users
  userId: varchar("user_id"), // For authenticated users (optional)
  productType: text("product_type").notNull(), // "book" | "merchandise"
  productId: varchar("product_id").notNull(), // ID of the book or merchandise product
  quantity: integer("quantity").notNull().default(1),
  createdAt: text("created_at").default(sql`current_timestamp`),
});

// Orders - completed purchases
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  paypalOrderId: text("paypal_order_id"),
  paypalPayerId: text("paypal_payer_id"),
  totalAmount: real("total_amount").notNull(),
  status: text("status").notNull().default("pending"), // "pending" | "completed" | "failed" | "cancelled"
  // Customer reference (optional - allows guest checkout)
  customerId: varchar("customer_id"), // Foreign key to customers table
  // Customer information (for guest checkout or as backup)
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  shippingAddress: text("shipping_address"), // JSON string
  // Order items (stored as JSON)
  items: text("items").notNull(), // JSON array of items with product details
  // Timestamps
  createdAt: text("created_at").default(sql`current_timestamp`),
  completedAt: text("completed_at"),
});

// Analytics - Event tracking system
// Download Tokens - secure tokens for digital file downloads
export const downloadTokens = pgTable("download_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  bookId: varchar("book_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").default(sql`current_timestamp`),
});

// Free Book Tokens - one-time/expiring secure links emailed to newsletter subscribers
export const freeBookTokens = pgTable("free_book_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull(),
  email: text("email").notNull(),
  fileUrl: text("file_url").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  usedAt: text("used_at"),
  createdAt: text("created_at").default(sql`current_timestamp`),
});

export const analyticsSessions = pgTable("analytics_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull().unique(), // Browser-generated session ID
  userId: varchar("user_id"), // For authenticated users (optional)
  // Session metadata
  userAgent: text("user_agent"),
  browser: text("browser"),
  os: text("os"),
  device: text("device"), // "desktop" | "mobile" | "tablet"
  referrer: text("referrer"),
  landingPage: text("landing_page"),
  // Timestamps
  startedAt: text("started_at").default(sql`current_timestamp`),
  lastActiveAt: text("last_active_at").default(sql`current_timestamp`),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: text("session_id").notNull(),
  eventType: text("event_type").notNull(), // "pageview" | "click" | "download" | "newsletter_signup" | "purchase"
  // Event details
  pagePath: text("page_path"),
  pageTitle: text("page_title"),
  // Entity references (for book/author/series specific events)
  entityType: text("entity_type"), // "book" | "author" | "series" | "merchandise" | null
  entityId: varchar("entity_id"),
  entityName: text("entity_name"), // Cached name for quick reports
  // Interaction details
  elementId: text("element_id"), // Button/link ID that was clicked
  elementText: text("element_text"),
  // Additional metadata (stored as JSON)
  metadata: text("metadata"), // JSON string for additional event-specific data
  // Timestamp
  createdAt: text("created_at").default(sql`current_timestamp`),
});

export const analyticsDailyMetrics = pgTable("analytics_daily_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(), // Format: YYYY-MM-DD
  // Aggregated metrics
  totalPageviews: integer("total_pageviews").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  totalSessions: integer("total_sessions").default(0),
  avgSessionDuration: real("avg_session_duration").default(0), // in seconds
  // Entity-specific metrics (nullable for global metrics)
  entityType: text("entity_type"), // "book" | "author" | "series" | null (global)
  entityId: varchar("entity_id"),
  entityName: text("entity_name"),
  // Conversion metrics
  newsletterSignups: integer("newsletter_signups").default(0),
  bookDownloads: integer("book_downloads").default(0),
  purchases: integer("purchases").default(0),
  revenue: real("revenue").default(0),
  // Timestamps
  createdAt: text("created_at").default(sql`current_timestamp`),
  updatedAt: text("updated_at").default(sql`current_timestamp`),
}, (table) => ({
  uniqueDateEntity: unique("analytics_daily_metrics_date_entity").on(table.date, table.entityType, table.entityId),
}));

// Translation Tables
export const authorTranslations = pgTable("author_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  authorId: varchar("author_id").notNull().references(() => authors.id, { onDelete: "cascade" }),
  locale: varchar("locale").notNull(),
  name: varchar("name"),
  biography: text("biography"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
}, (table) => ({
  uniqueAuthorLocale: unique("author_translations_author_locale").on(table.authorId, table.locale),
}));

export const bookTranslations = pgTable("book_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookId: varchar("book_id").notNull().references(() => books.id, { onDelete: "cascade" }),
  locale: varchar("locale").notNull(),
  title: varchar("title"),
  description: text("description"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
  conceptMapText: text("concept_map_text"),
  familyTreeText: text("family_tree_text"),
  pressNotesText: text("press_notes_text"),
}, (table) => ({
  uniqueBookLocale: unique("book_translations_book_locale").on(table.bookId, table.locale),
}));

export const seriesTranslations = pgTable("series_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  seriesId: varchar("series_id").notNull().references(() => bookSeries.id, { onDelete: "cascade" }),
  locale: varchar("locale").notNull(),
  name: varchar("name"),
  description: text("description"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
}, (table) => ({
  uniqueSeriesLocale: unique("series_translations_series_locale").on(table.seriesId, table.locale),
}));

export const testimonialTranslations = pgTable("testimonial_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  testimonialId: varchar("testimonial_id").notNull().references(() => testimonials.id, { onDelete: "cascade" }),
  locale: varchar("locale").notNull(),
  text: text("text"),
  authorName: varchar("author_name"),
  authorCredentials: varchar("author_credentials"),
}, (table) => ({
  uniqueTestimonialLocale: unique("testimonial_translations_testimonial_locale").on(table.testimonialId, table.locale),
}));

export const blogPostTranslations = pgTable("blog_post_translations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  blogPostId: varchar("blog_post_id").notNull().references(() => blogPosts.id, { onDelete: "cascade" }),
  locale: varchar("locale").notNull(),
  title: varchar("title"),
  excerpt: text("excerpt"),
  content: text("content"),
  seoTitle: varchar("seo_title"),
  seoDescription: text("seo_description"),
}, (table) => ({
  uniqueBlogPostLocale: unique("blog_post_translations_blog_post_locale").on(table.blogPostId, table.locale),
}));

export const insertAuthorSchema = createInsertSchema(authors).omit({
  id: true,
}).extend({
  heroTitle: z.string(),
  heroSubtitle: z.string(),
  bioParagraph1: z.string(),
  bioParagraph2: z.string(),
  bioParagraph3: z.string(),
});

export const insertBookSeriesSchema = createInsertSchema(bookSeries).omit({
  id: true,
}).extend({
  authorId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  cardBackgroundImage: z.string().nullable().optional(),
  landingHeroImage: z.string().nullable().optional(),
  landingTagline: z.string().nullable().optional(),
  landingWorldDescription: z.string().nullable().optional(),
  landingCharacters: z.string().nullable().optional(),
  landingReadingOrder: z.string().nullable().optional(),
  landingThemes: z.array(z.string()).nullable().optional(),
  promoConceptMap: z.string().nullable().optional(),
  promoShowConceptMap: z.boolean().optional(),
  promoFamilyTree: z.string().nullable().optional(),
  promoShowFamilyTree: z.boolean().optional(),
  promoPressNotes: z.array(z.string()).nullable().optional(),
  promoShowPressNotes: z.boolean().optional(),
  promoAdditionalMedia: z.array(z.string()).nullable().optional(),
  promoShowAdditionalMedia: z.boolean().optional(),
  promoSpotifyPlaylist: z.string().nullable().optional(),
  promoShowSpotifyPlaylist: z.boolean().optional(),
  promoYoutubeBooktrailer: z.string().nullable().optional(),
  promoShowYoutubeBooktrailer: z.boolean().optional(),
  amazonUrl: z.string().nullable().optional(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
}).extend({
  authorId: z.string().optional(), // Made optional as it's added programmatically in the mutation
  landingFeatures: z.array(z.string()).nullable().optional(),
  landingQuotes: z.array(z.string()).nullable().optional(),
  landingGallery: z.array(z.string()).nullable().optional(),
  landingAwards: z.array(z.string()).nullable().optional(),
  promoPressNotes: z.array(z.string()).nullable().optional(),
  promoAdditionalMedia: z.array(z.string()).nullable().optional(),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
  backgroundImageUrl: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  storeLinks: z.string().nullable().optional(),
  digitalFiles: z.string().nullable().optional(),
  isDigitalProduct: z.boolean().optional(),
  directSaleEnabled: z.boolean().optional(),
  directSalePrice: z.number().nullable().optional(),
  directSaleStock: z.number().int().nullable().optional(),
  saleFormatPhysical: z.boolean().optional(),
  saleFormatDigital: z.boolean().optional(),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  subscribedAt: true,
  preferencesToken: true,
  unsubscribedAt: true,
});

export const insertNewsletterListSchema = createInsertSchema(newsletterLists).omit({
  id: true,
  createdAt: true,
});

export const insertNewsletterListSubscriptionSchema = createInsertSchema(newsletterListSubscriptions).omit({
  id: true,
  subscribedAt: true,
});

export const insertEmailTemplateSchema = createInsertSchema(emailTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBroadcastSchema = createInsertSchema(broadcasts).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  status: true,
  recipientCount: true,
  successCount: true,
  failureCount: true,
  errorMessage: true,
}).extend({
  type: z.enum(["new_release", "promotion"]),
  // listIds is optional and omits empty arrays
  listIds: z.array(z.string().uuid()).optional().nullable(),
  promoPriceCents: z.number().int().nonnegative().optional().nullable(),
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
}).extend({
  defaultLocale: z.string().nullable().optional(),
  autoDetectLocale: z.boolean().optional(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUiTextSchema = createInsertSchema(uiTexts).omit({
  id: true,
});

export const insertEditorialSettingsSchema = createInsertSchema(editorialSettings).omit({
  id: true,
});

export type Author = typeof authors.$inferSelect;
export type InsertAuthor = z.infer<typeof insertAuthorSchema>;

export type BookSeries = typeof bookSeries.$inferSelect;
export type InsertBookSeries = z.infer<typeof insertBookSeriesSchema>;

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;

export type Testimonial = typeof testimonials.$inferSelect;
export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;

export type Newsletter = typeof newsletters.$inferSelect;
export type InsertNewsletter = z.infer<typeof insertNewsletterSchema>;

export type NewsletterList = typeof newsletterLists.$inferSelect;
export type InsertNewsletterList = z.infer<typeof insertNewsletterListSchema>;

export type NewsletterListSubscription = typeof newsletterListSubscriptions.$inferSelect;
export type InsertNewsletterListSubscription = z.infer<typeof insertNewsletterListSubscriptionSchema>;

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = z.infer<typeof insertEmailTemplateSchema>;

export type Broadcast = typeof broadcasts.$inferSelect;
export type InsertBroadcast = z.infer<typeof insertBroadcastSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type SiteSettings = typeof siteSettings.$inferSelect;
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type BlogPost = typeof blogPosts.$inferSelect;
export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export type UiText = typeof uiTexts.$inferSelect;
export type InsertUiText = z.infer<typeof insertUiTextSchema>;

export type EditorialSettings = typeof editorialSettings.$inferSelect;
export type InsertEditorialSettings = z.infer<typeof insertEditorialSettingsSchema>;

export const insertMerchandiseProductSchema = createInsertSchema(merchandiseProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type MerchandiseProduct = typeof merchandiseProducts.$inferSelect;
export type InsertMerchandiseProduct = z.infer<typeof insertMerchandiseProductSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertAnalyticsSessionSchema = createInsertSchema(analyticsSessions).omit({
  id: true,
  startedAt: true,
  lastActiveAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsDailyMetricsSchema = createInsertSchema(analyticsDailyMetrics).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDownloadTokenSchema = createInsertSchema(downloadTokens).omit({
  id: true,
  createdAt: true,
});

export const insertAuthorTranslationSchema = createInsertSchema(authorTranslations).omit({
  id: true,
});

export const insertBookTranslationSchema = createInsertSchema(bookTranslations).omit({
  id: true,
});

export const insertSeriesTranslationSchema = createInsertSchema(seriesTranslations).omit({
  id: true,
});

export const insertTestimonialTranslationSchema = createInsertSchema(testimonialTranslations).omit({
  id: true,
});

export const insertBlogPostTranslationSchema = createInsertSchema(blogPostTranslations).omit({
  id: true,
});

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type InsertAnalyticsSession = z.infer<typeof insertAnalyticsSessionSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type AnalyticsDailyMetrics = typeof analyticsDailyMetrics.$inferSelect;
export type InsertAnalyticsDailyMetrics = z.infer<typeof insertAnalyticsDailyMetricsSchema>;

export type DownloadToken = typeof downloadTokens.$inferSelect;
export type InsertDownloadToken = z.infer<typeof insertDownloadTokenSchema>;

export type AuthorTranslation = typeof authorTranslations.$inferSelect;
export type InsertAuthorTranslation = z.infer<typeof insertAuthorTranslationSchema>;

export type BookTranslation = typeof bookTranslations.$inferSelect;
export type InsertBookTranslation = z.infer<typeof insertBookTranslationSchema>;

export type SeriesTranslation = typeof seriesTranslations.$inferSelect;
export type InsertSeriesTranslation = z.infer<typeof insertSeriesTranslationSchema>;

export type TestimonialTranslation = typeof testimonialTranslations.$inferSelect;
export type InsertTestimonialTranslation = z.infer<typeof insertTestimonialTranslationSchema>;

export type BlogPostTranslation = typeof blogPostTranslations.$inferSelect;
export type InsertBlogPostTranslation = z.infer<typeof insertBlogPostTranslationSchema>;
