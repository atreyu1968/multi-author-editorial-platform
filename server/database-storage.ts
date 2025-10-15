// Reference: blueprint:javascript_database integration
import { db } from "./db";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  authors,
  bookSeries,
  books,
  testimonials,
  newsletters,
  siteSettings,
  users,
  blogPosts,
  uiTexts,
  editorialSettings,
  type Author,
  type InsertAuthor,
  type BookSeries,
  type InsertBookSeries,
  type Book,
  type InsertBook,
  type Testimonial,
  type InsertTestimonial,
  type Newsletter,
  type InsertNewsletter,
  type SiteSettings,
  type InsertSiteSettings,
  type User,
  type InsertUser,
  type BlogPost,
  type InsertBlogPost,
  type UiText,
  type InsertUiText,
  type EditorialSettings,
  type InsertEditorialSettings
} from "@shared/schema";
import { IStorage } from "./storage";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  // Author methods
  async getAuthors(): Promise<Author[]> {
    return await db.select().from(authors);
  }

  async getAuthorById(id: string): Promise<Author | undefined> {
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.id, id));
    return author || undefined;
  }

  async getAuthorBySlug(slug: string): Promise<Author | undefined> {
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.slug, slug));
    return author || undefined;
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const [author] = await db
      .insert(authors)
      .values(insertAuthor)
      .returning();
    return author;
  }

  async updateAuthor(id: string, updateAuthor: Partial<InsertAuthor>): Promise<Author | undefined> {
    const [author] = await db
      .update(authors)
      .set(updateAuthor)
      .where(eq(authors.id, id))
      .returning();
    return author || undefined;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    const result = await db
      .delete(authors)
      .where(eq(authors.id, id))
      .returning();
    return result.length > 0;
  }

  // Book Series methods
  async getBookSeries(authorId?: string): Promise<BookSeries[]> {
    if (authorId) {
      return await db
        .select()
        .from(bookSeries)
        .where(eq(bookSeries.authorId, authorId));
    }
    return await db.select().from(bookSeries);
  }

  async getBookSeriesById(id: string): Promise<BookSeries | undefined> {
    const [series] = await db
      .select()
      .from(bookSeries)
      .where(eq(bookSeries.id, id));
    return series || undefined;
  }

  async createBookSeries(insertSeries: InsertBookSeries): Promise<BookSeries> {
    const [series] = await db
      .insert(bookSeries)
      .values(insertSeries)
      .returning();
    return series;
  }

  async updateBookSeries(
    id: string,
    updateSeries: Partial<InsertBookSeries>
  ): Promise<BookSeries | undefined> {
    const [series] = await db
      .update(bookSeries)
      .set(updateSeries)
      .where(eq(bookSeries.id, id))
      .returning();
    return series || undefined;
  }

  async deleteBookSeries(id: string): Promise<boolean> {
    const result = await db
      .delete(bookSeries)
      .where(eq(bookSeries.id, id))
      .returning();
    return result.length > 0;
  }

  // Book methods
  async getBooks(authorId?: string): Promise<Book[]> {
    if (authorId) {
      return await db
        .select()
        .from(books)
        .where(eq(books.authorId, authorId));
    }
    return await db.select().from(books);
  }

  async getBooksBySeriesId(seriesId: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(eq(books.seriesId, seriesId));
  }

  async getStandaloneBooks(authorId?: string): Promise<Book[]> {
    const conditions = [
      eq(books.isStandalone, true),
      eq(books.isPublished, true)
    ];
    
    if (authorId) {
      conditions.push(eq(books.authorId, authorId));
    }
    
    return await db
      .select()
      .from(books)
      .where(and(...conditions));
  }

  async getBookById(id: string): Promise<Book | undefined> {
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, id));
    return book || undefined;
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const [book] = await db
      .insert(books)
      .values(insertBook)
      .returning();
    return book;
  }

  async updateBook(
    id: string,
    updateBook: Partial<InsertBook>
  ): Promise<Book | undefined> {
    const [book] = await db
      .update(books)
      .set(updateBook)
      .where(eq(books.id, id))
      .returning();
    return book || undefined;
  }

  async deleteBook(id: string): Promise<boolean> {
    const result = await db
      .delete(books)
      .where(eq(books.id, id))
      .returning();
    return result.length > 0;
  }

  // Testimonial methods
  async getTestimonials(authorId?: string): Promise<Testimonial[]> {
    if (authorId) {
      return await db
        .select()
        .from(testimonials)
        .where(eq(testimonials.authorId, authorId));
    }
    return await db.select().from(testimonials);
  }

  async getPublishedTestimonials(authorId?: string): Promise<Testimonial[]> {
    const conditions = [eq(testimonials.isPublished, true)];
    
    if (authorId) {
      conditions.push(eq(testimonials.authorId, authorId));
    }
    
    return await db
      .select()
      .from(testimonials)
      .where(and(...conditions));
  }

  async getTestimonialById(id: string): Promise<Testimonial | undefined> {
    const [testimonial] = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, id));
    return testimonial || undefined;
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const [testimonial] = await db
      .insert(testimonials)
      .values(insertTestimonial)
      .returning();
    return testimonial;
  }

  async updateTestimonial(
    id: string,
    updateTestimonial: Partial<InsertTestimonial>
  ): Promise<Testimonial | undefined> {
    const [testimonial] = await db
      .update(testimonials)
      .set(updateTestimonial)
      .where(eq(testimonials.id, id))
      .returning();
    return testimonial || undefined;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    const result = await db
      .delete(testimonials)
      .where(eq(testimonials.id, id))
      .returning();
    return result.length > 0;
  }

  // Newsletter methods
  async getNewsletterSubscribers(authorId?: string): Promise<Newsletter[]> {
    if (authorId) {
      return await db
        .select()
        .from(newsletters)
        .where(eq(newsletters.authorId, authorId));
    }
    return await db.select().from(newsletters);
  }

  async createNewsletterSubscriber(insertSubscriber: InsertNewsletter): Promise<Newsletter> {
    const [subscriber] = await db
      .insert(newsletters)
      .values(insertSubscriber)
      .returning();
    return subscriber;
  }

  // Site Settings methods
  async getSiteSettings(authorId?: string): Promise<SiteSettings[]> {
    if (authorId) {
      return await db
        .select()
        .from(siteSettings)
        .where(eq(siteSettings.authorId, authorId));
    }
    return await db.select().from(siteSettings);
  }

  async getSiteSettingByKey(authorId: string, key: string): Promise<SiteSettings | undefined> {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(
        and(
          eq(siteSettings.authorId, authorId),
          eq(siteSettings.key, key)
        )
      );
    return setting || undefined;
  }

  async createSiteSetting(insertSetting: InsertSiteSettings): Promise<SiteSettings> {
    const [setting] = await db
      .insert(siteSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async updateSiteSetting(authorId: string, key: string, value: string): Promise<SiteSettings | undefined> {
    const [setting] = await db
      .update(siteSettings)
      .set({ value })
      .where(
        and(
          eq(siteSettings.authorId, authorId),
          eq(siteSettings.key, key)
        )
      )
      .returning();
    return setting || undefined;
  }

  async upsertSiteSetting(authorId: string, key: string, value: string): Promise<SiteSettings> {
    const [setting] = await db
      .insert(siteSettings)
      .values({ authorId, key, value })
      .onConflictDoUpdate({
        target: [siteSettings.authorId, siteSettings.key],
        set: { value }
      })
      .returning();
    return setting;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Blog Post methods
  async getBlogPosts(authorId?: string): Promise<BlogPost[]> {
    if (authorId) {
      return await db
        .select()
        .from(blogPosts)
        .where(eq(blogPosts.authorId, authorId));
    }
    return await db.select().from(blogPosts);
  }

  async getPublishedBlogPosts(authorId?: string): Promise<BlogPost[]> {
    const conditions = [eq(blogPosts.isPublished, true)];
    
    if (authorId) {
      conditions.push(eq(blogPosts.authorId, authorId));
    }
    
    return await db
      .select()
      .from(blogPosts)
      .where(and(...conditions));
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    const [post] = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.id, id));
    return post || undefined;
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const now = new Date().toISOString();
    const [post] = await db
      .insert(blogPosts)
      .values({
        ...insertPost,
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    return post;
  }

  async updateBlogPost(
    id: string,
    updatePost: Partial<InsertBlogPost>
  ): Promise<BlogPost | undefined> {
    const now = new Date().toISOString();
    const [post] = await db
      .update(blogPosts)
      .set({
        ...updatePost,
        updatedAt: now,
      })
      .where(eq(blogPosts.id, id))
      .returning();
    return post || undefined;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    const result = await db
      .delete(blogPosts)
      .where(eq(blogPosts.id, id))
      .returning();
    return result.length > 0;
  }

  async getUiTexts(locale?: string): Promise<UiText[]> {
    if (!locale) {
      return await db.select().from(uiTexts);
    }
    return await db
      .select()
      .from(uiTexts)
      .where(eq(uiTexts.locale, locale));
  }

  async getUiTextsByNamespace(namespace: string, locale?: string): Promise<UiText[]> {
    if (!locale) {
      return await db
        .select()
        .from(uiTexts)
        .where(eq(uiTexts.namespace, namespace));
    }
    return await db
      .select()
      .from(uiTexts)
      .where(
        and(
          eq(uiTexts.namespace, namespace),
          eq(uiTexts.locale, locale)
        )
      );
  }

  async getUiTextById(id: string): Promise<UiText | undefined> {
    const [text] = await db
      .select()
      .from(uiTexts)
      .where(eq(uiTexts.id, id));
    return text || undefined;
  }

  async updateUiText(id: string, text: Partial<InsertUiText>): Promise<UiText | undefined> {
    const [updatedText] = await db
      .update(uiTexts)
      .set(text)
      .where(eq(uiTexts.id, id))
      .returning();
    return updatedText || undefined;
  }

  async upsertUiText(text: InsertUiText): Promise<UiText> {
    const [upsertedText] = await db
      .insert(uiTexts)
      .values(text)
      .onConflictDoUpdate({
        target: [uiTexts.namespace, uiTexts.key, uiTexts.locale],
        set: { value: text.value },
      })
      .returning();
    return upsertedText;
  }

  async getEditorialSettings(): Promise<EditorialSettings | undefined> {
    const [settings] = await db.select().from(editorialSettings).limit(1);
    return settings || undefined;
  }

  async updateEditorialSettings(settings: Partial<InsertEditorialSettings>): Promise<EditorialSettings | undefined> {
    const existing = await this.getEditorialSettings();
    if (!existing) {
      return undefined;
    }
    
    const [updated] = await db
      .update(editorialSettings)
      .set(settings)
      .where(eq(editorialSettings.id, existing.id))
      .returning();
    return updated || undefined;
  }
}
