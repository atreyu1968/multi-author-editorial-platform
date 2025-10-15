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
});

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
});

export const insertTestimonialSchema = createInsertSchema(testimonials).omit({
  id: true,
});

export const insertNewsletterSchema = createInsertSchema(newsletters).omit({
  id: true,
  subscribedAt: true,
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
