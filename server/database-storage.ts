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
  type InsertBlogPost
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
  async getAuthor(): Promise<Author | undefined> {
    const [author] = await db.select().from(authors).limit(1);
    return author || undefined;
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const [author] = await db
      .insert(authors)
      .values(insertAuthor)
      .returning();
    return author;
  }

  async updateAuthor(updateAuthor: Partial<InsertAuthor>): Promise<Author> {
    const existingAuthor = await this.getAuthor();
    if (!existingAuthor) {
      throw new Error("Author not found");
    }
    const [author] = await db
      .update(authors)
      .set(updateAuthor)
      .where(eq(authors.id, existingAuthor.id))
      .returning();
    return author;
  }

  // Book Series methods
  async getBookSeries(): Promise<BookSeries[]> {
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
  async getBooks(): Promise<Book[]> {
    return await db.select().from(books);
  }

  async getBooksBySeriesId(seriesId: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(eq(books.seriesId, seriesId));
  }

  async getStandaloneBooks(): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.isStandalone, true),
          eq(books.isPublished, true)
        )
      );
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
  async getTestimonials(): Promise<Testimonial[]> {
    return await db.select().from(testimonials);
  }

  async getPublishedTestimonials(): Promise<Testimonial[]> {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isPublished, true));
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
  async getNewsletterSubscribers(): Promise<Newsletter[]> {
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
  async getSiteSettings(): Promise<SiteSettings[]> {
    return await db.select().from(siteSettings);
  }

  async getSiteSettingByKey(key: string): Promise<SiteSettings | undefined> {
    const [setting] = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, key));
    return setting || undefined;
  }

  async createSiteSetting(insertSetting: InsertSiteSettings): Promise<SiteSettings> {
    const [setting] = await db
      .insert(siteSettings)
      .values(insertSetting)
      .returning();
    return setting;
  }

  async updateSiteSetting(key: string, value: string): Promise<SiteSettings | undefined> {
    const [setting] = await db
      .update(siteSettings)
      .set({ value })
      .where(eq(siteSettings.key, key))
      .returning();
    return setting || undefined;
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
  async getBlogPosts(): Promise<BlogPost[]> {
    return await db.select().from(blogPosts);
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    return await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true));
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
}
