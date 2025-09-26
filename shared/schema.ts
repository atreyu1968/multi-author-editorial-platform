import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const authors = pgTable("authors", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
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
});

export const bookSeries = pgTable("book_series", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  genre: text("genre").notNull(),
  amazonUrl: text("amazon_url"),
  isActive: boolean("is_active").default(true),
});

export const books = pgTable("books", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
});

export const testimonials = pgTable("testimonials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  name: text("name").notNull(),
  email: text("email").notNull(),
  subscribedAt: text("subscribed_at").default(sql`current_timestamp`),
});

export const siteSettings = pgTable("site_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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

export const insertAuthorSchema = createInsertSchema(authors).omit({
  id: true,
});

export const insertBookSeriesSchema = createInsertSchema(bookSeries).omit({
  id: true,
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
