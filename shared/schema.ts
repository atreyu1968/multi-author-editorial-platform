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
  // Digital file configuration
  digitalFileUrl: text("digital_file_url"),
  digitalFileFormat: text("digital_file_format"),
  isDigitalProduct: boolean("is_digital_product").default(false),
  // Sale format configuration
  saleFormatPhysical: boolean("sale_format_physical").default(false),
  saleFormatDigital: boolean("sale_format_digital").default(false),
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
  subscribedAt: text("subscribed_at").default(sql`current_timestamp`),
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
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  seoKeywords: z.string().nullable().optional(),
  backgroundImageUrl: z.string().nullable().optional(),
  backgroundColor: z.string().nullable().optional(),
  digitalFileUrl: z.string().nullable().optional(),
  digitalFileFormat: z.string().nullable().optional(),
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
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings).omit({
  id: true,
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

export type AnalyticsSession = typeof analyticsSessions.$inferSelect;
export type InsertAnalyticsSession = z.infer<typeof insertAnalyticsSessionSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

export type AnalyticsDailyMetrics = typeof analyticsDailyMetrics.$inferSelect;
export type InsertAnalyticsDailyMetrics = z.infer<typeof insertAnalyticsDailyMetricsSchema>;

export type DownloadToken = typeof downloadTokens.$inferSelect;
export type InsertDownloadToken = z.infer<typeof insertDownloadTokenSchema>;
