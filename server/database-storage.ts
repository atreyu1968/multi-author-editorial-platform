// Reference: blueprint:javascript_database integration
import { db } from "./db";
import { eq, and, isNull, sql, desc, ilike } from "drizzle-orm";
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
  analyticsSessions,
  analyticsEvents,
  analyticsDailyMetrics,
  customers,
  orders,
  merchandiseProducts,
  cartItems,
  downloadTokens,
  authorTranslations,
  bookTranslations,
  seriesTranslations,
  testimonialTranslations,
  blogPostTranslations,
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
  type InsertEditorialSettings,
  type AnalyticsSession,
  type InsertAnalyticsSession,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type AnalyticsDailyMetrics,
  type InsertAnalyticsDailyMetrics,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type MerchandiseProduct,
  type InsertMerchandiseProduct,
  type CartItem,
  type InsertCartItem,
  type DownloadToken,
  type InsertDownloadToken,
  type AuthorTranslation,
  type InsertAuthorTranslation,
  type BookTranslation,
  type InsertBookTranslation,
  type SeriesTranslation,
  type InsertSeriesTranslation,
  type TestimonialTranslation,
  type InsertTestimonialTranslation,
  type BlogPostTranslation,
  type InsertBlogPostTranslation
} from "@shared/schema";
import { IStorage, CartItemWithDetails } from "./storage";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    // Use MemoryStore - sessions persist in memory
    // For production external servers, use connect-pg-simple with standard pg driver
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Clear expired entries every 24h
    });
    
    console.log('[Session] Using MemoryStore');
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

  async getAuthorByDomain(domain: string): Promise<Author | undefined> {
    const normalized = domain.toLowerCase().replace(/^www\./, '');
    const [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.customDomain, normalized));
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
      .where(eq(books.seriesId, seriesId))
      .orderBy(books.orderInSeries);
  }

  async getStandaloneBooks(authorId?: string): Promise<Book[]> {
    // Books are standalone if they have no series OR isStandalone flag is true
    const conditions = [
      eq(books.isPublished, true),
    ];
    
    if (authorId) {
      conditions.push(eq(books.authorId, authorId));
    }
    
    // Get books that are either marked as standalone OR have no series assigned
    return await db
      .select()
      .from(books)
      .where(and(
        ...conditions,
        sql`(${books.isStandalone} = true OR ${books.seriesId} IS NULL)`
      ));
  }

  async getLatestBooks(limit: number = 6): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(eq(books.isPublished, true))
      .orderBy(sql`publication_date DESC NULLS LAST`)
      .limit(limit);
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

  async listNamespaces(): Promise<string[]> {
    const result = await db
      .selectDistinct({ namespace: uiTexts.namespace })
      .from(uiTexts)
      .orderBy(uiTexts.namespace);
    return result.map(r => r.namespace);
  }

  async getLocaleMatrix(namespaces?: string[], search?: string): Promise<{ namespace: string; key: string; locales: Record<string, string | null> }[]> {
    const conditions = [];
    
    if (namespaces && namespaces.length > 0) {
      conditions.push(sql`${uiTexts.namespace} IN (${sql.join(namespaces.map(ns => sql`${ns}`), sql`, `)})`);
    }
    
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        sql`(${uiTexts.key} ILIKE ${searchPattern} OR ${uiTexts.value} ILIKE ${searchPattern})`
      );
    }
    
    const allTexts = conditions.length > 0
      ? await db.select().from(uiTexts).where(and(...conditions))
      : await db.select().from(uiTexts);
    
    const matrix = new Map<string, { namespace: string; key: string; locales: Record<string, string | null> }>();
    
    for (const text of allTexts) {
      const compositeKey = `${text.namespace}|||${text.key}`;
      if (!matrix.has(compositeKey)) {
        matrix.set(compositeKey, {
          namespace: text.namespace,
          key: text.key,
          locales: {}
        });
      }
      matrix.get(compositeKey)!.locales[text.locale] = text.value;
    }
    
    return Array.from(matrix.values()).sort((a, b) => {
      if (a.namespace !== b.namespace) return a.namespace.localeCompare(b.namespace);
      return a.key.localeCompare(b.key);
    });
  }

  async bulkUpsertUiTexts(entries: InsertUiText[]): Promise<UiText[]> {
    if (entries.length === 0) return [];
    
    const results: UiText[] = [];
    for (const entry of entries) {
      const [upserted] = await db
        .insert(uiTexts)
        .values(entry)
        .onConflictDoUpdate({
          target: [uiTexts.namespace, uiTexts.key, uiTexts.locale],
          set: { value: entry.value },
        })
        .returning();
      results.push(upserted);
    }
    
    return results;
  }

  async deleteUiTextsByLocaleKey(locale: string, keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    
    const result = await db
      .delete(uiTexts)
      .where(
        and(
          eq(uiTexts.locale, locale),
          sql`${uiTexts.key} IN (${sql.join(keys.map(k => sql`${k}`), sql`, `)})`
        )
      )
      .returning();
    
    return result.length;
  }

  async getEditorialSettings(): Promise<EditorialSettings | undefined> {
    const [settings] = await db.select().from(editorialSettings).limit(1);
    return settings || undefined;
  }

  async updateEditorialSettings(settings: Partial<InsertEditorialSettings>): Promise<EditorialSettings | undefined> {
    const existing = await this.getEditorialSettings();
    
    if (!existing) {
      // Create initial settings if they don't exist
      const [created] = await db
        .insert(editorialSettings)
        .values(settings as InsertEditorialSettings)
        .returning();
      return created || undefined;
    }
    
    const [updated] = await db
      .update(editorialSettings)
      .set(settings)
      .where(eq(editorialSettings.id, existing.id))
      .returning();
    return updated || undefined;
  }

  // Analytics methods
  async createAnalyticsSession(insertSession: InsertAnalyticsSession): Promise<AnalyticsSession> {
    const [session] = await db
      .insert(analyticsSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getAnalyticsSession(sessionId: string): Promise<AnalyticsSession | undefined> {
    const [session] = await db
      .select()
      .from(analyticsSessions)
      .where(eq(analyticsSessions.sessionId, sessionId));
    return session || undefined;
  }

  async updateAnalyticsSessionActivity(sessionId: string): Promise<void> {
    const now = new Date().toISOString();
    await db
      .update(analyticsSessions)
      .set({ lastActiveAt: now })
      .where(eq(analyticsSessions.sessionId, sessionId));
  }

  async createAnalyticsEvent(insertEvent: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await db
      .insert(analyticsEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getAnalyticsEvents(filters?: { sessionId?: string, entityType?: string, entityId?: string, startDate?: string, endDate?: string }): Promise<AnalyticsEvent[]> {
    const conditions = [];
    
    if (filters?.sessionId) {
      conditions.push(eq(analyticsEvents.sessionId, filters.sessionId));
    }
    if (filters?.entityType) {
      conditions.push(eq(analyticsEvents.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(analyticsEvents.entityId, filters.entityId));
    }
    if (filters?.startDate) {
      conditions.push(sql`${analyticsEvents.createdAt} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${analyticsEvents.createdAt} <= ${filters.endDate}`);
    }
    
    if (conditions.length === 0) {
      return await db
        .select()
        .from(analyticsEvents)
        .orderBy(desc(analyticsEvents.createdAt));
    }
    
    return await db
      .select()
      .from(analyticsEvents)
      .where(and(...conditions))
      .orderBy(desc(analyticsEvents.createdAt));
  }

  async getDailyMetrics(filters?: { date?: string, entityType?: string, entityId?: string, startDate?: string, endDate?: string }): Promise<AnalyticsDailyMetrics[]> {
    const conditions = [];
    
    if (filters?.date) {
      conditions.push(eq(analyticsDailyMetrics.date, filters.date));
    }
    if (filters?.entityType) {
      conditions.push(eq(analyticsDailyMetrics.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(analyticsDailyMetrics.entityId, filters.entityId));
    }
    if (filters?.startDate) {
      conditions.push(sql`${analyticsDailyMetrics.date} >= ${filters.startDate}`);
    }
    if (filters?.endDate) {
      conditions.push(sql`${analyticsDailyMetrics.date} <= ${filters.endDate}`);
    }
    
    if (conditions.length === 0) {
      return await db
        .select()
        .from(analyticsDailyMetrics)
        .orderBy(desc(analyticsDailyMetrics.date));
    }
    
    return await db
      .select()
      .from(analyticsDailyMetrics)
      .where(and(...conditions))
      .orderBy(desc(analyticsDailyMetrics.date));
  }

  async incrementDailyMetric(date: string, entityType: string | null, entityId: string | null, metricType: string, value: number = 1): Promise<void> {
    const now = new Date().toISOString();
    
    // Build the update object based on metricType
    const updateObj: any = { updatedAt: now };
    
    switch (metricType) {
      case 'totalPageviews':
        updateObj.totalPageviews = sql`COALESCE(${analyticsDailyMetrics.totalPageviews}, 0) + ${value}`;
        break;
      case 'uniqueVisitors':
        updateObj.uniqueVisitors = sql`COALESCE(${analyticsDailyMetrics.uniqueVisitors}, 0) + ${value}`;
        break;
      case 'totalSessions':
        updateObj.totalSessions = sql`COALESCE(${analyticsDailyMetrics.totalSessions}, 0) + ${value}`;
        break;
      case 'newsletterSignups':
        updateObj.newsletterSignups = sql`COALESCE(${analyticsDailyMetrics.newsletterSignups}, 0) + ${value}`;
        break;
      case 'bookDownloads':
        updateObj.bookDownloads = sql`COALESCE(${analyticsDailyMetrics.bookDownloads}, 0) + ${value}`;
        break;
      case 'purchases':
        updateObj.purchases = sql`COALESCE(${analyticsDailyMetrics.purchases}, 0) + ${value}`;
        break;
      case 'revenue':
        updateObj.revenue = sql`COALESCE(${analyticsDailyMetrics.revenue}, 0) + ${value}`;
        break;
    }
    
    await db
      .insert(analyticsDailyMetrics)
      .values({
        date,
        entityType,
        entityId,
        entityName: null,
        totalPageviews: metricType === 'totalPageviews' ? value : 0,
        uniqueVisitors: metricType === 'uniqueVisitors' ? value : 0,
        totalSessions: metricType === 'totalSessions' ? value : 0,
        newsletterSignups: metricType === 'newsletterSignups' ? value : 0,
        bookDownloads: metricType === 'bookDownloads' ? value : 0,
        purchases: metricType === 'purchases' ? value : 0,
        revenue: metricType === 'revenue' ? value : 0,
        avgSessionDuration: 0,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [analyticsDailyMetrics.date, analyticsDailyMetrics.entityType, analyticsDailyMetrics.entityId],
        set: updateObj,
      });
  }

  async updateAvgSessionDuration(date: string, entityType: string | null, entityId: string | null, sessionDuration: number): Promise<void> {
    const now = new Date().toISOString();
    
    // Get current metrics for this date/entity combination
    const conditions = [
      eq(analyticsDailyMetrics.date, date),
      entityType ? eq(analyticsDailyMetrics.entityType, entityType) : isNull(analyticsDailyMetrics.entityType),
      entityId ? eq(analyticsDailyMetrics.entityId, entityId) : isNull(analyticsDailyMetrics.entityId),
    ];
    
    const [currentMetrics] = await db
      .select()
      .from(analyticsDailyMetrics)
      .where(and(...conditions));
    
    if (currentMetrics) {
      // Calculate new average: (old_avg * old_count + new_duration) / (old_count + 1)
      const oldAvg = currentMetrics.avgSessionDuration || 0;
      const oldCount = currentMetrics.totalSessions || 1;
      const newAvg = (oldAvg * oldCount + sessionDuration) / (oldCount + 1);
      
      await db
        .update(analyticsDailyMetrics)
        .set({
          avgSessionDuration: newAvg,
          updatedAt: now,
        })
        .where(and(...conditions));
    }
  }

  async hasSessionEventOnDate(sessionId: string, date: string): Promise<boolean> {
    const dateStart = `${date}T00:00:00.000Z`;
    const dateEnd = `${date}T23:59:59.999Z`;
    
    const [event] = await db
      .select()
      .from(analyticsEvents)
      .where(
        and(
          eq(analyticsEvents.sessionId, sessionId),
          sql`${analyticsEvents.createdAt} >= ${dateStart}`,
          sql`${analyticsEvents.createdAt} <= ${dateEnd}`
        )
      )
      .limit(1);
    
    return !!event;
  }

  async getTopBooks(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    const conditions = [eq(analyticsDailyMetrics.entityType, 'book')];
    
    if (startDate) {
      conditions.push(sql`${analyticsDailyMetrics.date} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${analyticsDailyMetrics.date} <= ${endDate}`);
    }
    
    const result = await db
      .select({
        entityId: analyticsDailyMetrics.entityId,
        entityName: books.title,
        totalPageviews: sql<number>`SUM(COALESCE(${analyticsDailyMetrics.totalPageviews}, 0))`.as('total_pageviews'),
      })
      .from(analyticsDailyMetrics)
      .leftJoin(books, eq(analyticsDailyMetrics.entityId, books.id))
      .where(and(...conditions))
      .groupBy(analyticsDailyMetrics.entityId, books.title)
      .orderBy(desc(sql`total_pageviews`))
      .limit(limit);
    
    return result;
  }

  async getTopAuthors(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    const conditions = [eq(analyticsDailyMetrics.entityType, 'author')];
    
    if (startDate) {
      conditions.push(sql`${analyticsDailyMetrics.date} >= ${startDate}`);
    }
    if (endDate) {
      conditions.push(sql`${analyticsDailyMetrics.date} <= ${endDate}`);
    }
    
    const result = await db
      .select({
        entityId: analyticsDailyMetrics.entityId,
        entityName: authors.name,
        totalPageviews: sql<number>`SUM(COALESCE(${analyticsDailyMetrics.totalPageviews}, 0))`.as('total_pageviews'),
      })
      .from(analyticsDailyMetrics)
      .leftJoin(authors, eq(analyticsDailyMetrics.entityId, authors.id))
      .where(and(...conditions))
      .groupBy(analyticsDailyMetrics.entityId, authors.name)
      .orderBy(desc(sql`total_pageviews`))
      .limit(limit);
    
    return result;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id));
    return result[0];
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.email, email));
    return result[0];
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(insertCustomer).returning();
    return result[0];
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return result[0];
  }

  // Order methods
  async getOrders(): Promise<Order[]> {
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result[0];
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values(insertOrder).returning();
    return result[0];
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
    return result[0];
  }

  async getOrderItemBooks(orderId: string): Promise<Book[]> {
    const order = await this.getOrderById(orderId);
    if (!order) {
      return [];
    }
    
    const items = JSON.parse(order.items);
    const bookIds = items
      .filter((item: any) => item.productType === 'book')
      .map((item: any) => item.productId);
    
    if (bookIds.length === 0) {
      return [];
    }
    
    const orderBooks = await db
      .select()
      .from(books)
      .where(sql`${books.id} = ANY(${bookIds})`);
    
    return orderBooks;
  }

  // Merchandise Product methods
  async getMerchandiseProducts(): Promise<MerchandiseProduct[]> {
    return await db.select().from(merchandiseProducts);
  }

  async getPublishedMerchandiseProducts(): Promise<MerchandiseProduct[]> {
    return await db.select().from(merchandiseProducts).where(eq(merchandiseProducts.isActive, true));
  }

  async getMerchandiseProductById(id: string): Promise<MerchandiseProduct | undefined> {
    const result = await db.select().from(merchandiseProducts).where(eq(merchandiseProducts.id, id));
    return result[0];
  }

  async createMerchandiseProduct(insertProduct: InsertMerchandiseProduct): Promise<MerchandiseProduct> {
    const result = await db.insert(merchandiseProducts).values(insertProduct).returning();
    return result[0];
  }

  async updateMerchandiseProduct(id: string, updates: Partial<InsertMerchandiseProduct>): Promise<MerchandiseProduct | undefined> {
    const result = await db.update(merchandiseProducts).set(updates).where(eq(merchandiseProducts.id, id)).returning();
    return result[0];
  }

  async deleteMerchandiseProduct(id: string): Promise<boolean> {
    const result = await db.delete(merchandiseProducts).where(eq(merchandiseProducts.id, id)).returning();
    return result.length > 0;
  }

  // Cart Item methods
  async getCartItems(sessionId: string): Promise<CartItemWithDetails[]> {
    const items = await db.select().from(cartItems).where(eq(cartItems.sessionId, sessionId));
    
    // Fetch related product data for each cart item
    const itemsWithDetails: CartItemWithDetails[] = await Promise.all(
      items.map(async (item) => {
        const itemWithDetails: CartItemWithDetails = { ...item };
        
        if (item.productType === 'book') {
          const [book] = await db.select().from(books).where(eq(books.id, item.productId));
          itemWithDetails.book = book;
        } else if (item.productType === 'merchandise') {
          const [merchandise] = await db.select().from(merchandiseProducts).where(eq(merchandiseProducts.id, item.productId));
          itemWithDetails.merchandise = merchandise;
        }
        
        return itemWithDetails;
      })
    );
    
    return itemsWithDetails;
  }

  async addCartItem(insertItem: InsertCartItem): Promise<CartItem> {
    const result = await db.insert(cartItems).values(insertItem).returning();
    return result[0];
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const result = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
    return result[0];
  }

  async deleteCartItem(id: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id)).returning();
    return result.length > 0;
  }

  async clearCart(sessionId: string): Promise<void> {
    await db.delete(cartItems).where(eq(cartItems.sessionId, sessionId));
  }

  // Download Token methods
  async createDownloadToken(insertToken: InsertDownloadToken): Promise<DownloadToken> {
    const [token] = await db
      .insert(downloadTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  async getDownloadToken(token: string): Promise<DownloadToken | undefined> {
    const [downloadToken] = await db
      .select()
      .from(downloadTokens)
      .where(eq(downloadTokens.token, token));
    return downloadToken || undefined;
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(downloadTokens)
      .set({ usedAt: new Date().toISOString() })
      .where(eq(downloadTokens.token, token));
  }

  async getDownloadTokensByOrderId(orderId: string): Promise<DownloadToken[]> {
    return await db
      .select()
      .from(downloadTokens)
      .where(eq(downloadTokens.orderId, orderId));
  }

  // Translation methods
  // Author translations
  async getAuthorTranslations(authorId: string): Promise<AuthorTranslation[]> {
    return await db
      .select()
      .from(authorTranslations)
      .where(eq(authorTranslations.authorId, authorId));
  }

  async upsertAuthorTranslation(translation: InsertAuthorTranslation): Promise<AuthorTranslation> {
    const [result] = await db
      .insert(authorTranslations)
      .values(translation)
      .onConflictDoUpdate({
        target: [authorTranslations.authorId, authorTranslations.locale],
        set: translation
      })
      .returning();
    return result;
  }

  // Book translations
  async getBookTranslations(bookId: string): Promise<BookTranslation[]> {
    return await db
      .select()
      .from(bookTranslations)
      .where(eq(bookTranslations.bookId, bookId));
  }

  async upsertBookTranslation(translation: InsertBookTranslation): Promise<BookTranslation> {
    const [result] = await db
      .insert(bookTranslations)
      .values(translation)
      .onConflictDoUpdate({
        target: [bookTranslations.bookId, bookTranslations.locale],
        set: translation
      })
      .returning();
    return result;
  }

  // Series translations
  async getSeriesTranslations(seriesId: string): Promise<SeriesTranslation[]> {
    return await db
      .select()
      .from(seriesTranslations)
      .where(eq(seriesTranslations.seriesId, seriesId));
  }

  async upsertSeriesTranslation(translation: InsertSeriesTranslation): Promise<SeriesTranslation> {
    const [result] = await db
      .insert(seriesTranslations)
      .values(translation)
      .onConflictDoUpdate({
        target: [seriesTranslations.seriesId, seriesTranslations.locale],
        set: translation
      })
      .returning();
    return result;
  }

  // Testimonial translations
  async getTestimonialTranslations(testimonialId: string): Promise<TestimonialTranslation[]> {
    return await db
      .select()
      .from(testimonialTranslations)
      .where(eq(testimonialTranslations.testimonialId, testimonialId));
  }

  async upsertTestimonialTranslation(translation: InsertTestimonialTranslation): Promise<TestimonialTranslation> {
    const [result] = await db
      .insert(testimonialTranslations)
      .values(translation)
      .onConflictDoUpdate({
        target: [testimonialTranslations.testimonialId, testimonialTranslations.locale],
        set: translation
      })
      .returning();
    return result;
  }

  // Blog post translations
  async getBlogPostTranslations(blogPostId: string): Promise<BlogPostTranslation[]> {
    return await db
      .select()
      .from(blogPostTranslations)
      .where(eq(blogPostTranslations.blogPostId, blogPostId));
  }

  async upsertBlogPostTranslation(translation: InsertBlogPostTranslation): Promise<BlogPostTranslation> {
    const [result] = await db
      .insert(blogPostTranslations)
      .values(translation)
      .onConflictDoUpdate({
        target: [blogPostTranslations.blogPostId, blogPostTranslations.locale],
        set: translation
      })
      .returning();
    return result;
  }

  // Search methods
  async searchAuthors(query: string): Promise<Author[]> {
    return await db
      .select()
      .from(authors)
      .where(and(
        eq(authors.isActive, true),
        ilike(authors.name, `%${query}%`)
      ))
      .limit(20);
  }

  async searchSeries(query: string): Promise<BookSeries[]> {
    return await db
      .select()
      .from(bookSeries)
      .where(and(
        eq(bookSeries.isActive, true),
        ilike(bookSeries.title, `%${query}%`)
      ))
      .limit(20);
  }

  async searchBooks(query: string): Promise<Book[]> {
    return await db
      .select()
      .from(books)
      .where(and(
        eq(books.isPublished, true),
        ilike(books.title, `%${query}%`)
      ))
      .limit(20);
  }
}
