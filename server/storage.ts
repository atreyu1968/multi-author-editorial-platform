import { 
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
  type NewsletterList,
  type InsertNewsletterList,
  type NewsletterListSubscription,
  type InsertNewsletterListSubscription,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Broadcast,
  type InsertBroadcast,
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
  freeBookTokens,
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
import { randomUUID, scrypt, randomBytes, scryptSync } from "crypto";
import { promisify } from "util";
import session from "express-session";

const scryptAsync = promisify(scrypt);

// Helper function for password hashing
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Cart item with related product data
export interface CartItemWithDetails extends CartItem {
  book?: Book;
  merchandise?: MerchandiseProduct;
}

export interface IStorage {
  // Author methods
  getAuthors(): Promise<Author[]>;
  getAuthorById(id: string): Promise<Author | undefined>;
  getAuthorBySlug(slug: string): Promise<Author | undefined>;
  getAuthorByDomain(domain: string): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  updateAuthor(id: string, author: Partial<InsertAuthor>): Promise<Author | undefined>;
  deleteAuthor(id: string): Promise<boolean>;

  // Book Series methods
  getBookSeries(authorId?: string): Promise<BookSeries[]>;
  getBookSeriesById(id: string): Promise<BookSeries | undefined>;
  createBookSeries(series: InsertBookSeries): Promise<BookSeries>;
  updateBookSeries(id: string, series: Partial<InsertBookSeries>): Promise<BookSeries | undefined>;
  deleteBookSeries(id: string): Promise<boolean>;

  // Book methods
  getBooks(authorId?: string): Promise<Book[]>;
  getBooksBySeriesId(seriesId: string): Promise<Book[]>;
  getStandaloneBooks(authorId?: string): Promise<Book[]>;
  getLatestBooks(limit?: number): Promise<Book[]>;
  getBookById(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;

  // Testimonial methods
  getTestimonials(authorId?: string): Promise<Testimonial[]>;
  getPublishedTestimonials(authorId?: string): Promise<Testimonial[]>;
  getTestimonialById(id: string): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;

  // Newsletter methods
  getNewsletterSubscribers(authorId?: string): Promise<Newsletter[]>;
  createNewsletterSubscriber(subscriber: InsertNewsletter): Promise<Newsletter>;
  getNewsletterSubscriberByEmail(authorId: string, email: string): Promise<Newsletter | undefined>;
  getNewsletterSubscriberByToken(token: string): Promise<Newsletter | undefined>;
  updateNewsletterSubscriber(id: string, patch: Partial<Newsletter>): Promise<Newsletter | undefined>;
  // Soft-unsubscribe by preferences token (used by the public unsubscribe
  // page and by RFC 8058 List-Unsubscribe-Post one-click handlers).
  // Returns the updated subscriber, or undefined when the token doesn't match.
  unsubscribeNewsletterByToken(token: string): Promise<Newsletter | undefined>;

  // Newsletter list (interest topic) methods
  getNewsletterLists(authorId: string, opts?: { activeOnly?: boolean }): Promise<NewsletterList[]>;
  getNewsletterListById(id: string): Promise<NewsletterList | undefined>;
  createNewsletterList(list: InsertNewsletterList): Promise<NewsletterList>;
  updateNewsletterList(id: string, patch: Partial<InsertNewsletterList>): Promise<NewsletterList | undefined>;
  deleteNewsletterList(id: string): Promise<boolean>;

  // Subscriber<->List membership methods
  getSubscriberListIds(subscriberId: string): Promise<string[]>;
  setSubscriberLists(subscriberId: string, listIds: string[]): Promise<void>;

  // Email template methods
  getEmailTemplates(authorId?: string | null): Promise<EmailTemplate[]>;
  getEmailTemplateById(id: string): Promise<EmailTemplate | undefined>;
  // Lookup the active template for `type`. Per-author template wins; falls back to global (authorId IS NULL).
  resolveEmailTemplate(type: string, authorId?: string | null): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: string, patch: Partial<InsertEmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: string): Promise<boolean>;

  // Broadcast (campaign) methods
  getBroadcasts(authorId: string): Promise<Broadcast[]>;
  getBroadcastById(id: string): Promise<Broadcast | undefined>;
  createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast>;
  updateBroadcast(id: string, patch: Partial<Broadcast>): Promise<Broadcast | undefined>;
  // Returns broadcasts whose status="scheduled" AND scheduled_for <= the
  // given UTC ISO timestamp. Used by the background tick to claim due jobs.
  getDueScheduledBroadcasts(nowIso: string): Promise<Broadcast[]>;
  // Returns active subscribers (unsubscribedAt IS NULL) for the author.
  // When `listIds` is non-empty, only subscribers opted into at least one
  // of those lists are returned. When empty/omitted, returns every active
  // subscriber for that author regardless of list membership.
  getActiveSubscribersForBroadcast(authorId: string, listIds?: string[]): Promise<Newsletter[]>;

  // Site Settings methods
  getSiteSettings(authorId?: string): Promise<SiteSettings[]>;
  getSiteSettingByKey(authorId: string, key: string): Promise<SiteSettings | undefined>;
  createSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings>;
  updateSiteSetting(authorId: string, key: string, value: string): Promise<SiteSettings | undefined>;
  upsertSiteSetting(authorId: string, key: string, value: string): Promise<SiteSettings>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  // Newsletter admin methods (subscriber CRUD beyond signup)
  deleteNewsletterSubscriber(id: string): Promise<boolean>;
  getNewsletterSubscriberById(id: string): Promise<Newsletter | undefined>;

  // Blog Post methods
  getBlogPosts(authorId?: string): Promise<BlogPost[]>;
  getPublishedBlogPosts(authorId?: string): Promise<BlogPost[]>;
  getBlogPostById(id: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: string, post: Partial<InsertBlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: string): Promise<boolean>;

  // UI Texts methods
  getUiTexts(locale?: string): Promise<UiText[]>;
  getUiTextsByNamespace(namespace: string, locale?: string): Promise<UiText[]>;
  getUiTextById(id: string): Promise<UiText | undefined>;
  updateUiText(id: string, text: Partial<InsertUiText>): Promise<UiText | undefined>;
  upsertUiText(text: InsertUiText): Promise<UiText>;
  
  // Translation management methods
  listNamespaces(): Promise<string[]>;
  getLocaleMatrix(namespaces?: string[], search?: string): Promise<{ namespace: string; key: string; locales: Record<string, string | null> }[]>;
  bulkUpsertUiTexts(entries: InsertUiText[]): Promise<UiText[]>;
  deleteUiTextsByLocaleKey(locale: string, keys: string[]): Promise<number>;

  // Editorial Settings methods
  getEditorialSettings(): Promise<EditorialSettings | undefined>;
  updateEditorialSettings(settings: Partial<InsertEditorialSettings>): Promise<EditorialSettings | undefined>;

  // Analytics methods
  createAnalyticsSession(session: InsertAnalyticsSession): Promise<AnalyticsSession>;
  getAnalyticsSession(sessionId: string): Promise<AnalyticsSession | undefined>;
  updateAnalyticsSessionActivity(sessionId: string): Promise<void>;
  
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEvents(filters?: { sessionId?: string, entityType?: string, entityId?: string, startDate?: string, endDate?: string }): Promise<AnalyticsEvent[]>;
  
  getDailyMetrics(filters?: { date?: string, entityType?: string, entityId?: string, startDate?: string, endDate?: string }): Promise<AnalyticsDailyMetrics[]>;
  incrementDailyMetric(date: string, entityType: string | null, entityId: string | null, metricType: string, value?: number): Promise<void>;
  updateAvgSessionDuration(date: string, entityType: string | null, entityId: string | null, sessionDuration: number): Promise<void>;
  
  hasSessionEventOnDate(sessionId: string, date: string): Promise<boolean>;
  
  getTopBooks(limit?: number, startDate?: string, endDate?: string): Promise<any[]>;
  getTopAuthors(limit?: number, startDate?: string, endDate?: string): Promise<any[]>;

  // E-commerce methods
  // Customer methods
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: string): Promise<Customer | undefined>;
  getCustomerByEmail(email: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  
  // Order methods
  getOrders(): Promise<Order[]>;
  getOrderById(id: string): Promise<Order | undefined>;
  getOrdersByCustomerId(customerId: string): Promise<Order[]>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrderStatus(id: string, status: string): Promise<Order | undefined>;
  getOrderItemBooks(orderId: string): Promise<Book[]>;
  
  // Merchandise Product methods
  getMerchandiseProducts(): Promise<MerchandiseProduct[]>;
  getPublishedMerchandiseProducts(): Promise<MerchandiseProduct[]>;
  getMerchandiseProductById(id: string): Promise<MerchandiseProduct | undefined>;
  createMerchandiseProduct(product: InsertMerchandiseProduct): Promise<MerchandiseProduct>;
  updateMerchandiseProduct(id: string, product: Partial<InsertMerchandiseProduct>): Promise<MerchandiseProduct | undefined>;
  deleteMerchandiseProduct(id: string): Promise<boolean>;
  
  // Cart Item methods (for saved carts)
  getCartItems(sessionId: string): Promise<CartItemWithDetails[]>;
  addCartItem(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: string, quantity: number): Promise<CartItem | undefined>;
  deleteCartItem(id: string): Promise<boolean>;
  clearCart(sessionId: string): Promise<void>;

  // Download Token methods (secure download system)
  createDownloadToken(token: InsertDownloadToken): Promise<DownloadToken>;
  getDownloadToken(token: string): Promise<DownloadToken | undefined>;
  markTokenAsUsed(token: string): Promise<void>;
  getDownloadTokensByOrderId(orderId: string): Promise<DownloadToken[]>;

  // Free Book Token methods (one-time, expiring links emailed to subscribers)
  createFreeBookToken(input: { authorId: string; email: string; fileUrl: string; token: string; expiresAt: string }): Promise<{ id: string; token: string; expiresAt: string }>;
  getFreeBookToken(token: string): Promise<{ id: string; authorId: string; email: string; fileUrl: string; token: string; expiresAt: string; usedAt: string | null } | undefined>;
  markFreeBookTokenUsed(token: string): Promise<void>;

  // Translation methods
  // Author translations
  getAuthorTranslations(authorId: string): Promise<AuthorTranslation[]>;
  upsertAuthorTranslation(translation: InsertAuthorTranslation): Promise<AuthorTranslation>;
  
  // Book translations
  getBookTranslations(bookId: string): Promise<BookTranslation[]>;
  upsertBookTranslation(translation: InsertBookTranslation): Promise<BookTranslation>;
  
  // Series translations
  getSeriesTranslations(seriesId: string): Promise<SeriesTranslation[]>;
  upsertSeriesTranslation(translation: InsertSeriesTranslation): Promise<SeriesTranslation>;
  
  // Testimonial translations
  getTestimonialTranslations(testimonialId: string): Promise<TestimonialTranslation[]>;
  upsertTestimonialTranslation(translation: InsertTestimonialTranslation): Promise<TestimonialTranslation>;
  
  // Blog post translations
  getBlogPostTranslations(blogPostId: string): Promise<BlogPostTranslation[]>;
  upsertBlogPostTranslation(translation: InsertBlogPostTranslation): Promise<BlogPostTranslation>;

  // Search methods
  searchAuthors(query: string): Promise<Author[]>;
  searchSeries(query: string): Promise<BookSeries[]>;
  searchBooks(query: string): Promise<Book[]>;

  // Session store for authentication
  sessionStore: session.Store;
}

// Reference: javascript_auth_all_persistance integration
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Note: MemStorage is deprecated - use DatabaseStorage instead
// Keeping for reference but not implementing full IStorage interface
export class MemStorage {
  private authors: Map<string, Author>;
  private bookSeries: Map<string, BookSeries>;
  private books: Map<string, Book>;
  private testimonials: Map<string, Testimonial>;
  private newsletters: Map<string, Newsletter>;
  private siteSettings: Map<string, SiteSettings>;
  private users: Map<string, User>;
  private blogPosts: Map<string, BlogPost>;
  private uiTexts: Map<string, UiText>;
  private analyticsSessions: Map<string, AnalyticsSession>;
  private analyticsEvents: Map<string, AnalyticsEvent>;
  private analyticsDailyMetrics: Map<string, AnalyticsDailyMetrics>;
  private customers: Map<string, Customer>;
  private orders: Map<string, Order>;
  private merchandiseProducts: Map<string, MerchandiseProduct>;
  private cartItems: Map<string, CartItem>;
  sessionStore: session.Store;

  constructor() {
    this.authors = new Map();
    this.bookSeries = new Map();
    this.books = new Map();
    this.testimonials = new Map();
    this.newsletters = new Map();
    this.siteSettings = new Map();
    this.users = new Map();
    this.blogPosts = new Map();
    this.uiTexts = new Map();
    this.analyticsSessions = new Map();
    this.analyticsEvents = new Map();
    this.analyticsDailyMetrics = new Map();
    this.customers = new Map();
    this.orders = new Map();
    this.merchandiseProducts = new Map();
    this.cartItems = new Map();
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create default author
    const authorId = randomUUID();
    const author: Author = {
      id: authorId,
      name: "María González",
      slug: "maria-gonzalez",
      heroTitle: "Descubre Mundos Extraordinarios",
      heroSubtitle: "Sumérgete en las emocionantes aventuras creadas por la autora bestseller María González. Descarga gratis tu primer libro y comienza una experiencia inolvidable.",
      bioParagraph1: "María González es una autora bestseller con más de diez años de experiencia creando historias que han cautivado a lectores de todo el mundo. Nacida en Barcelona, siempre tuvo una pasión por contar historias que tocaran el corazón de las personas.",
      bioParagraph2: "Con más de veinte libros publicados en géneros que van desde el romance contemporáneo hasta el thriller psicológico, María ha demostrado su versatilidad como escritora. Sus obras han sido traducidas a varios idiomas y han alcanzado las listas de bestsellers en múltiples plataformas.",
      bioParagraph3: "Cuando no está escribiendo, María disfruta viajando, explorando nuevas culturas que inspiran sus historias, y pasando tiempo con su familia. Su misión es crear personajes auténticos y tramas emocionantes que transporten a los lectores a mundos extraordinarios.",
      photo: "https://images.unsplash.com/photo-1494790108755-2616b612b47c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400",
      email: "info@mariagonzalez.com",
      instagramUrl: "https://instagram.com/mariagonzalez",
      twitterUrl: "https://twitter.com/mariagonzalez",
      facebookUrl: "https://facebook.com/mariagonzalez",
      amazonUrl: "https://amazon.com/author/mariagonzalez",
      isActive: true,
      seoTitle: null,
      seoDescription: null,
      seoKeywords: null,
      backgroundImageUrl: null,
      backgroundColor: null,
      mailingListEnabled: true,
      emailFromName: null,
      emailFromEmail: null,
      emailProvider: null,
      emailApiKey: null,
      customDomain: null,
      freeBookFile: null,
      freeBookCover: null,
      freeBookTitle: null,
      freeBookDescription: null,
      freeBookCtaText: null,
    };
    this.authors.set(authorId, author);

    // Create sample book series
    const seriesId1 = randomUUID();
    const series1: BookSeries = {
      id: seriesId1,
      authorId: authorId,
      title: "Serie Pasiones Urbanas",
      description: "Una serie de romance contemporáneo que sigue las vidas entrecruzadas de jóvenes profesionales en la ciudad. Cada libro puede leerse de forma independiente, pero juntos forman una saga emocionante llena de pasión, drama y segundas oportunidades.",
      genre: "Romance",
      amazonUrl: "https://amazon.com/series/pasiones-urbanas",
      isActive: true,
      cardBackgroundImage: null,
      landingHeroImage: null,
      landingTagline: null,
      landingWorldDescription: null,
      landingCharacters: null,
      landingReadingOrder: null,
      landingThemes: null,
      promoConceptMap: null,
      promoShowConceptMap: true,
      promoFamilyTree: null,
      promoShowFamilyTree: true,
      promoPressNotes: null,
      promoShowPressNotes: true,
      promoAdditionalMedia: null,
      promoShowAdditionalMedia: true,
      promoSpotifyPlaylist: null,
      promoShowSpotifyPlaylist: true,
      promoYoutubeBooktrailer: null,
      promoShowYoutubeBooktrailer: true,
      backgroundImageUrl: null,
      backgroundColor: null
    };
    this.bookSeries.set(seriesId1, series1);

    const seriesId2 = randomUUID();
    const series2: BookSeries = {
      id: seriesId2,
      authorId: authorId,
      title: "Serie Detective Luna",
      description: "Sigue las investigaciones de la detective Carmen Luna mientras resuelve los casos más complejos de la ciudad. Una serie llena de suspense, giros inesperados y un toque de misterio que te mantendrá en vilo hasta la última página.",
      genre: "Thriller",
      amazonUrl: "https://amazon.com/series/detective-luna",
      isActive: true,
      cardBackgroundImage: null,
      landingHeroImage: null,
      landingTagline: null,
      landingWorldDescription: null,
      landingCharacters: null,
      landingReadingOrder: null,
      landingThemes: null,
      promoConceptMap: null,
      promoShowConceptMap: true,
      promoFamilyTree: null,
      promoShowFamilyTree: true,
      promoPressNotes: null,
      promoShowPressNotes: true,
      promoAdditionalMedia: null,
      promoShowAdditionalMedia: true,
      promoSpotifyPlaylist: null,
      promoShowSpotifyPlaylist: true,
      promoYoutubeBooktrailer: null,
      promoShowYoutubeBooktrailer: true,
      backgroundImageUrl: null,
      backgroundColor: null
    };
    this.bookSeries.set(seriesId2, series2);

    // Create sample books
    const books = [
      {
        authorId: authorId,
        title: "Corazones en Fuga",
        description: "Una historia de amor contemporáneo en la ciudad",
        coverImage: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        genre: "Romance",
        price: 9.99,
        amazonUrl: "https://amazon.com/corazones-fuga",
        seriesId: seriesId1,
        orderInSeries: 1,
        isStandalone: false,
        isPublished: true,
        landingHeroImage: null,
        landingTagline: null,
        landingSynopsis: null,
        landingFeatures: null,
        landingQuotes: null,
        landingCTA: null,
        landingGallery: null,
        landingAwards: null,
        promoConceptMap: null,
        promoShowConceptMap: true,
        promoFamilyTree: null,
        promoShowFamilyTree: true,
        promoPressNotes: null,
        promoShowPressNotes: true,
        promoAdditionalMedia: null,
        promoShowAdditionalMedia: true,
        promoSpotifyPlaylist: null,
        promoShowSpotifyPlaylist: true,
        promoYoutubeBooktrailer: null,
        promoShowYoutubeBooktrailer: true,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        backgroundImageUrl: null,
        backgroundColor: null,
        publicationDate: "2024-01-15",
        directSaleEnabled: false,
        directSalePrice: null,
        directSaleStock: null
      },
      {
        authorId: authorId,
        title: "Sombras del Pasado",
        description: "Un thriller lleno de suspense y misterio",
        coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        genre: "Thriller",
        price: 8.99,
        amazonUrl: "https://amazon.com/sombras-pasado",
        seriesId: seriesId2,
        orderInSeries: 3,
        isStandalone: false,
        isPublished: true,
        landingHeroImage: null,
        landingTagline: null,
        landingSynopsis: null,
        landingFeatures: null,
        landingQuotes: null,
        landingCTA: null,
        landingGallery: null,
        landingAwards: null,
        promoConceptMap: null,
        promoShowConceptMap: true,
        promoFamilyTree: null,
        promoShowFamilyTree: true,
        promoPressNotes: null,
        promoShowPressNotes: true,
        promoAdditionalMedia: null,
        promoShowAdditionalMedia: true,
        promoSpotifyPlaylist: null,
        promoShowSpotifyPlaylist: true,
        promoYoutubeBooktrailer: null,
        promoShowYoutubeBooktrailer: true,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        backgroundImageUrl: null,
        backgroundColor: null,
        publicationDate: "2024-03-20",
        directSaleEnabled: false,
        directSalePrice: null,
        directSaleStock: null
      },
      {
        authorId: authorId,
        title: "El Último Hechizo",
        description: "Una joven bibliotecaria descubre un grimorio ancestral que cambiará su vida para siempre. Una aventura mágica llena de secretos, poder y autodescubrimiento.",
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        genre: "Fantasía",
        price: 9.99,
        amazonUrl: "https://amazon.com/ultimo-hechizo",
        seriesId: null,
        orderInSeries: null,
        isStandalone: true,
        isPublished: true,
        landingHeroImage: null,
        landingTagline: null,
        landingSynopsis: null,
        landingFeatures: null,
        landingQuotes: null,
        landingCTA: null,
        landingGallery: null,
        landingAwards: null,
        promoConceptMap: null,
        promoShowConceptMap: true,
        promoFamilyTree: null,
        promoShowFamilyTree: true,
        promoPressNotes: null,
        promoShowPressNotes: true,
        promoAdditionalMedia: null,
        promoShowAdditionalMedia: true,
        promoSpotifyPlaylist: null,
        promoShowSpotifyPlaylist: true,
        promoYoutubeBooktrailer: null,
        promoShowYoutubeBooktrailer: true,
        seoTitle: null,
        seoDescription: null,
        seoKeywords: null,
        backgroundImageUrl: null,
        backgroundColor: null,
        publicationDate: "2024-06-10",
        directSaleEnabled: false,
        directSalePrice: null,
        directSaleStock: null
      }
    ];

    books.forEach(book => {
      const bookId = randomUUID();
      this.books.set(bookId, { id: bookId, ...book });
    });

    // Create sample testimonials
    const testimonials = [
      {
        authorId: authorId,
        content: "María tiene un don especial para crear personajes que se sienten reales. No pude soltar 'Corazones en Fuga' hasta terminarlo. ¡Estoy ansiosa por el siguiente!",
        authorName: "Ana Martínez",
        authorType: "Lectora verificada",
        authorPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        rating: 5,
        isFeatured: true,
        isPublished: true
      },
      {
        authorId: authorId,
        content: "La serie Detective Luna es adictiva. Los giros de la trama son increíbles y siempre me mantiene adivinando hasta el final. ¡Recomendadísima!",
        authorName: "Carlos López",
        authorType: "Lector verificado",
        authorPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        rating: 5,
        isFeatured: true,
        isPublished: true
      }
    ];

    testimonials.forEach(testimonial => {
      const testimonialId = randomUUID();
      this.testimonials.set(testimonialId, { id: testimonialId, ...testimonial });
    });

    // Create sample blog posts
    const blogPosts = [
      {
        title: "Mi proceso creativo: Cómo nace una nueva historia",
        content: "Escribir es un viaje fascinante que comienza mucho antes de poner las primeras palabras en papel. Mi proceso creativo siempre empieza con una pregunta: ¿qué pasaría si...? Esta simple interrogante ha sido la semilla de todas mis novelas.\n\nCuando una idea me atrapa, comienzo por desarrollar los personajes. Para mí, son ellos quienes conducen la historia, no al revés. Paso días, a veces semanas, conociendo a mis protagonistas: sus miedos, sus sueños, sus contradicciones. Solo cuando puedo verlos claramente en mi mente, cuando sé cómo reaccionarían en cualquier situación, comienzo a escribir.\n\nEl primer borrador siempre es terrible. Es mi regla número uno: permítete escribir mal al principio. La magia está en la reescritura, en pulir cada frase hasta que brille con luz propia.",
        excerpt: "Descubre los secretos detrás de la creación de mis novelas y cómo los personajes cobran vida en mi mente antes de llegar al papel.",
        featuredImage: "https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        category: "Proceso Creativo",
        tags: ["escritura", "creatividad", "personajes"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      },
      {
        title: "Próximamente: Nueva serie \"Misterios de Medianoche\"",
        content: "Estoy emocionada de anunciar que estoy trabajando en una nueva serie que espero les fascine tanto como a mí me está fascinando escribirla. \"Misterios de Medianoche\" será una trilogía de suspenso psicológico que explora los límites entre la realidad y la pesadilla.\n\nLa protagonista, Elena Vega, es una psicóloga forense que comienza a experimentar sueños vívidos sobre crímenes que aún no han ocurrido. ¿Son premoniciones? ¿Coincidencias? ¿O hay algo más siniestro en juego?\n\nLa serie estará ambientada en una ciudad ficticia donde los límites entre el día y la noche, entre lo consciente y lo inconsciente, se difuminan peligrosamente. Cada libro podrá leerse de forma independiente, pero juntos contarán una historia más amplia sobre el poder de la mente humana.\n\nEspero tener el primer libro listo para finales de este año. ¡Manténganse atentos para más actualizaciones!",
        excerpt: "Una nueva trilogía de suspenso psicológico está en camino. Conoce a Elena Vega y adéntrate en un mundo donde los sueños pueden predecir el futuro.",
        featuredImage: "https://images.unsplash.com/photo-1519904981063-b0cf448d479e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        category: "Noticias",
        tags: ["nueva serie", "suspenso", "psicológico"],
        isPublished: true,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      },
      {
        title: "Consejos para escritores emergentes",
        content: "A menudo recibo mensajes de lectores que también aspiran a ser escritores. Siempre me emociona saber que mis historias han inspirado a otros a crear las suyas propias. Aquí comparto algunos consejos que hubiera querido recibir cuando empecé:\n\n1. **Lee vorazmente**: Un buen escritor es ante todo un buen lector. Lee en tu género, pero también fuera de él. Cada libro es una lección magistral.\n\n2. **Escribe todos los días**: Aunque sean solo 200 palabras. La consistencia es más importante que la cantidad.\n\n3. **No edites mientras escribes el primer borrador**: Deja que las ideas fluyan. Ya habrá tiempo para pulir.\n\n4. **Encuentra tu voz**: No trates de sonar como otro escritor. Tu perspectiva única es tu mayor fortaleza.\n\n5. **Acepta la crítica constructiva**: Un buen editor o beta reader vale su peso en oro.\n\nRecuerda: cada escritor publicado fue una vez un principiante que no se rindió. ¡Tu historia merece ser contada!",
        excerpt: "Consejos prácticos para quienes están comenzando su viaje en el mundo de la escritura, desde la importancia de leer hasta encontrar tu voz única.",
        featuredImage: "https://images.unsplash.com/photo-1471107340929-a87cd0f5b5f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=400",
        category: "Consejos",
        tags: ["escritura", "consejos", "principiantes"],
        isPublished: false,
      }
    ];

    blogPosts.forEach(post => {
      const postId = randomUUID();
      const now = new Date().toISOString();
      this.blogPosts.set(postId, { 
        id: postId,
        authorId: authorId,
        ...post,
        publishedAt: post.publishedAt || null,
        createdAt: post.publishedAt || now,
        updatedAt: post.publishedAt || now,
      });
    });

    // Create default admin user (registration disabled for security)
    this.initializeDefaultAdmin();
  }

  private initializeDefaultAdmin() {
    // Create default admin user with secure credentials from environment
    // Use strong default that requires immediate change
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || `admin_${randomUUID().slice(0, 8)}`;
    
    if (!process.env.ADMIN_PASSWORD) {
      console.log("⚠️  SECURITY: No ADMIN_PASSWORD set. Generated temporary password:", adminPassword);
      console.log("⚠️  CHANGE THIS IMMEDIATELY after first login!");
    }
    
    const adminId = randomUUID();
    const hashedPassword = this.hashPasswordSync(adminPassword);
    const adminUser: User = {
      id: adminId,
      username: adminUsername,
      password: hashedPassword,
    };
    this.users.set(adminId, adminUser);
  }

  private hashPasswordSync(password: string): string {
    const salt = randomBytes(16).toString("hex");
    const buf = scryptSync(password, salt, 64);
    return `${buf.toString("hex")}.${salt}`;
  }

  // Author methods
  async getAuthor(): Promise<Author | undefined> {
    return Array.from(this.authors.values())[0];
  }

  async getAuthors(): Promise<Author[]> {
    return Array.from(this.authors.values());
  }

  async getAuthorById(id: string): Promise<Author | undefined> {
    return this.authors.get(id);
  }

  async getAuthorBySlug(slug: string): Promise<Author | undefined> {
    return Array.from(this.authors.values()).find(author => author.slug === slug);
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const id = randomUUID();
    const author: Author = { 
      ...insertAuthor, 
      id, 
      email: insertAuthor.email ?? null, 
      instagramUrl: insertAuthor.instagramUrl ?? null, 
      twitterUrl: insertAuthor.twitterUrl ?? null, 
      facebookUrl: insertAuthor.facebookUrl ?? null, 
      amazonUrl: insertAuthor.amazonUrl ?? null, 
      photo: insertAuthor.photo ?? null,
      isActive: insertAuthor.isActive ?? null,
      seoTitle: insertAuthor.seoTitle ?? null,
      seoDescription: insertAuthor.seoDescription ?? null,
      seoKeywords: insertAuthor.seoKeywords ?? null,
      backgroundImageUrl: insertAuthor.backgroundImageUrl ?? null,
      backgroundColor: insertAuthor.backgroundColor ?? null,
      mailingListEnabled: insertAuthor.mailingListEnabled ?? null,
      emailFromName: insertAuthor.emailFromName ?? null,
      emailFromEmail: insertAuthor.emailFromEmail ?? null,
      emailProvider: insertAuthor.emailProvider ?? null,
      emailApiKey: insertAuthor.emailApiKey ?? null,
      customDomain: insertAuthor.customDomain ?? null,
      freeBookFile: insertAuthor.freeBookFile ?? null,
      freeBookCover: insertAuthor.freeBookCover ?? null,
      freeBookTitle: insertAuthor.freeBookTitle ?? null,
      freeBookDescription: insertAuthor.freeBookDescription ?? null,
      freeBookCtaText: insertAuthor.freeBookCtaText ?? null,
    };
    this.authors.set(id, author);
    return author;
  }

  async getAuthorByDomain(domain: string): Promise<Author | undefined> {
    const normalized = domain.toLowerCase().replace(/^www\./, '');
    return Array.from(this.authors.values()).find(a => a.customDomain === normalized);
  }

  async updateAuthor(id: string, updateAuthor: Partial<InsertAuthor>): Promise<Author | undefined> {
    const existingAuthor = this.authors.get(id);
    if (!existingAuthor) {
      return undefined;
    }
    const updatedAuthor = { ...existingAuthor, ...updateAuthor };
    this.authors.set(id, updatedAuthor);
    return updatedAuthor;
  }

  async deleteAuthor(id: string): Promise<boolean> {
    return this.authors.delete(id);
  }

  // Book Series methods
  async getBookSeries(): Promise<BookSeries[]> {
    return Array.from(this.bookSeries.values());
  }

  async getBookSeriesById(id: string): Promise<BookSeries | undefined> {
    return this.bookSeries.get(id);
  }

  async createBookSeries(insertSeries: InsertBookSeries): Promise<BookSeries> {
    const id = randomUUID();
    const series: BookSeries = { 
      ...insertSeries, 
      id,
      authorId: insertSeries.authorId ?? null, 
      amazonUrl: insertSeries.amazonUrl ?? null, 
      isActive: insertSeries.isActive ?? null,
      cardBackgroundImage: insertSeries.cardBackgroundImage ?? null,
      landingHeroImage: insertSeries.landingHeroImage ?? null,
      landingTagline: insertSeries.landingTagline ?? null,
      landingWorldDescription: insertSeries.landingWorldDescription ?? null,
      landingCharacters: insertSeries.landingCharacters ?? null,
      landingReadingOrder: insertSeries.landingReadingOrder ?? null,
      landingThemes: insertSeries.landingThemes ?? null,
      promoConceptMap: insertSeries.promoConceptMap ?? null,
      promoShowConceptMap: insertSeries.promoShowConceptMap ?? null,
      promoFamilyTree: insertSeries.promoFamilyTree ?? null,
      promoShowFamilyTree: insertSeries.promoShowFamilyTree ?? null,
      promoPressNotes: insertSeries.promoPressNotes ?? null,
      promoShowPressNotes: insertSeries.promoShowPressNotes ?? null,
      promoAdditionalMedia: insertSeries.promoAdditionalMedia ?? null,
      promoShowAdditionalMedia: insertSeries.promoShowAdditionalMedia ?? null,
      promoSpotifyPlaylist: insertSeries.promoSpotifyPlaylist ?? null,
      promoShowSpotifyPlaylist: insertSeries.promoShowSpotifyPlaylist ?? null,
      promoYoutubeBooktrailer: insertSeries.promoYoutubeBooktrailer ?? null,
      promoShowYoutubeBooktrailer: insertSeries.promoShowYoutubeBooktrailer ?? null,
      backgroundImageUrl: insertSeries.backgroundImageUrl ?? null,
      backgroundColor: insertSeries.backgroundColor ?? null
    };
    this.bookSeries.set(id, series);
    return series;
  }

  async updateBookSeries(id: string, updateSeries: Partial<InsertBookSeries>): Promise<BookSeries | undefined> {
    const existingSeries = this.bookSeries.get(id);
    if (!existingSeries) return undefined;
    const updatedSeries = { ...existingSeries, ...updateSeries };
    this.bookSeries.set(id, updatedSeries);
    return updatedSeries;
  }

  async deleteBookSeries(id: string): Promise<boolean> {
    return this.bookSeries.delete(id);
  }

  // Book methods
  async getBooks(): Promise<Book[]> {
    return Array.from(this.books.values());
  }

  async getBooksBySeriesId(seriesId: string): Promise<Book[]> {
    return Array.from(this.books.values()).filter(book => book.seriesId === seriesId);
  }

  async getStandaloneBooks(): Promise<Book[]> {
    return Array.from(this.books.values()).filter(book => book.isStandalone);
  }

  async getLatestBooks(limit: number = 6): Promise<Book[]> {
    return Array.from(this.books.values())
      .filter(book => book.isPublished === true)
      .sort((a, b) => {
        const aDate = new Date(a.publicationDate || 0);
        const bDate = new Date(b.publicationDate || 0);
        return bDate.getTime() - aDate.getTime();
      })
      .slice(0, limit);
  }

  async getBookById(id: string): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = randomUUID();
    const book: Book = { 
      ...insertBook, 
      id,
      authorId: insertBook.authorId || "", 
      amazonUrl: insertBook.amazonUrl ?? null, 
      description: insertBook.description ?? null, 
      seriesId: insertBook.seriesId ?? null, 
      coverImage: insertBook.coverImage ?? null, 
      price: insertBook.price ?? null, 
      orderInSeries: insertBook.orderInSeries ?? null, 
      isStandalone: insertBook.isStandalone ?? null, 
      isPublished: insertBook.isPublished ?? null,
      landingHeroImage: insertBook.landingHeroImage ?? null,
      landingTagline: insertBook.landingTagline ?? null,
      landingSynopsis: insertBook.landingSynopsis ?? null,
      landingFeatures: insertBook.landingFeatures ?? null,
      landingQuotes: insertBook.landingQuotes ?? null,
      landingCTA: insertBook.landingCTA ?? null,
      landingGallery: insertBook.landingGallery ?? null,
      landingAwards: insertBook.landingAwards ?? null,
      promoConceptMap: insertBook.promoConceptMap ?? null,
      promoShowConceptMap: insertBook.promoShowConceptMap ?? null,
      promoFamilyTree: insertBook.promoFamilyTree ?? null,
      promoShowFamilyTree: insertBook.promoShowFamilyTree ?? null,
      promoPressNotes: insertBook.promoPressNotes ?? null,
      promoShowPressNotes: insertBook.promoShowPressNotes ?? null,
      promoAdditionalMedia: insertBook.promoAdditionalMedia ?? null,
      promoShowAdditionalMedia: insertBook.promoShowAdditionalMedia ?? null,
      promoSpotifyPlaylist: insertBook.promoSpotifyPlaylist ?? null,
      promoShowSpotifyPlaylist: insertBook.promoShowSpotifyPlaylist ?? null,
      promoYoutubeBooktrailer: insertBook.promoYoutubeBooktrailer ?? null,
      promoShowYoutubeBooktrailer: insertBook.promoShowYoutubeBooktrailer ?? null,
      seoTitle: insertBook.seoTitle ?? null,
      seoDescription: insertBook.seoDescription ?? null,
      seoKeywords: insertBook.seoKeywords ?? null,
      backgroundImageUrl: insertBook.backgroundImageUrl ?? null,
      backgroundColor: insertBook.backgroundColor ?? null,
      publicationDate: insertBook.publicationDate ?? null,
      directSaleEnabled: insertBook.directSaleEnabled ?? null,
      directSalePrice: insertBook.directSalePrice ?? null,
      directSaleStock: insertBook.directSaleStock ?? null
    };
    this.books.set(id, book);
    return book;
  }

  async updateBook(id: string, updateBook: Partial<InsertBook>): Promise<Book | undefined> {
    const existingBook = this.books.get(id);
    if (!existingBook) return undefined;
    const updatedBook = { ...existingBook, ...updateBook };
    this.books.set(id, updatedBook);
    return updatedBook;
  }

  async deleteBook(id: string): Promise<boolean> {
    return this.books.delete(id);
  }

  // Testimonial methods
  async getTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values());
  }

  async getPublishedTestimonials(): Promise<Testimonial[]> {
    return Array.from(this.testimonials.values()).filter(t => t.isPublished);
  }

  async getTestimonialById(id: string): Promise<Testimonial | undefined> {
    return this.testimonials.get(id);
  }

  async createTestimonial(insertTestimonial: InsertTestimonial): Promise<Testimonial> {
    const id = randomUUID();
    const testimonial: Testimonial = { 
      ...insertTestimonial, 
      id, 
      authorPhoto: insertTestimonial.authorPhoto || null, 
      isFeatured: insertTestimonial.isFeatured || null, 
      isPublished: insertTestimonial.isPublished || null,
      rating: insertTestimonial.rating || 5
    };
    this.testimonials.set(id, testimonial);
    return testimonial;
  }

  async updateTestimonial(id: string, updateTestimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined> {
    const existingTestimonial = this.testimonials.get(id);
    if (!existingTestimonial) return undefined;
    const updatedTestimonial = { ...existingTestimonial, ...updateTestimonial };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }

  async deleteTestimonial(id: string): Promise<boolean> {
    return this.testimonials.delete(id);
  }

  // Newsletter methods
  async getNewsletterSubscribers(): Promise<Newsletter[]> {
    return Array.from(this.newsletters.values());
  }

  async createNewsletterSubscriber(insertNewsletter: InsertNewsletter): Promise<Newsletter> {
    const id = randomUUID();
    const newsletter: Newsletter = {
      ...insertNewsletter,
      id,
      preferencesToken: randomUUID(),
      unsubscribedAt: null,
      subscribedAt: new Date().toISOString(),
      // Coerce optional consent fields to null so the value matches the
      // Newsletter row shape (`string | null`, not `... | undefined`).
      consentedAt: insertNewsletter.consentedAt ?? null,
      consentText: insertNewsletter.consentText ?? null,
      // IANA timezone (optional). Captured from the browser at signup so the
      // per-recipient local-9-a.m. broadcast scheduler can honour it.
      timezone: insertNewsletter.timezone ?? null,
    };
    this.newsletters.set(id, newsletter);
    return newsletter;
  }

  // The methods below are deprecated stubs satisfying IStorage; production
  // uses DatabaseStorage. They keep MemStorage compilable without persisting
  // multi-list / template state.
  async getNewsletterSubscriberByEmail(authorId: string, email: string): Promise<Newsletter | undefined> {
    return Array.from(this.newsletters.values()).find(n => n.authorId === authorId && n.email === email);
  }
  async getNewsletterSubscriberByToken(token: string): Promise<Newsletter | undefined> {
    return Array.from(this.newsletters.values()).find(n => n.preferencesToken === token);
  }
  async updateNewsletterSubscriber(id: string, patch: Partial<Newsletter>): Promise<Newsletter | undefined> {
    const existing = this.newsletters.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch };
    this.newsletters.set(id, updated);
    return updated;
  }
  async unsubscribeNewsletterByToken(token: string): Promise<Newsletter | undefined> {
    const found = Array.from(this.newsletters.values()).find(n => n.preferencesToken === token);
    if (!found) return undefined;
    const updated = { ...found, unsubscribedAt: new Date().toISOString() };
    this.newsletters.set(found.id, updated);
    return updated;
  }
  async getNewsletterLists(): Promise<NewsletterList[]> { return []; }
  async getNewsletterListById(): Promise<NewsletterList | undefined> { return undefined; }
  async createNewsletterList(list: InsertNewsletterList): Promise<NewsletterList> {
    return { ...list, id: randomUUID(), createdAt: new Date().toISOString() } as NewsletterList;
  }
  async updateNewsletterList(): Promise<NewsletterList | undefined> { return undefined; }
  async deleteNewsletterList(): Promise<boolean> { return false; }
  async getSubscriberListIds(): Promise<string[]> { return []; }
  async setSubscriberLists(): Promise<void> { /* no-op */ }
  async getEmailTemplates(): Promise<EmailTemplate[]> { return []; }
  async getEmailTemplateById(): Promise<EmailTemplate | undefined> { return undefined; }
  async resolveEmailTemplate(): Promise<EmailTemplate | undefined> { return undefined; }
  async createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate> {
    return { ...template, id: randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as EmailTemplate;
  }
  async updateEmailTemplate(): Promise<EmailTemplate | undefined> { return undefined; }
  async deleteEmailTemplate(): Promise<boolean> { return false; }

  // Broadcast methods (in-memory stubs)
  async getBroadcasts(): Promise<Broadcast[]> { return []; }
  async getBroadcastById(): Promise<Broadcast | undefined> { return undefined; }
  async createBroadcast(broadcast: InsertBroadcast): Promise<Broadcast> {
    return {
      ...broadcast,
      id: randomUUID(),
      status: "draft",
      recipientCount: 0,
      successCount: 0,
      failureCount: 0,
      errorMessage: null,
      sentAt: null,
      createdAt: new Date().toISOString(),
    } as Broadcast;
  }
  async updateBroadcast(): Promise<Broadcast | undefined> { return undefined; }
  async getDueScheduledBroadcasts(): Promise<Broadcast[]> { return []; }
  async getActiveSubscribersForBroadcast(): Promise<Newsletter[]> { return []; }

  // Site Settings methods
  async getSiteSettings(): Promise<SiteSettings[]> {
    return Array.from(this.siteSettings.values());
  }

  async getSiteSettingByKey(key: string): Promise<SiteSettings | undefined> {
    return Array.from(this.siteSettings.values()).find(setting => setting.key === key);
  }

  async createSiteSetting(insertSetting: InsertSiteSettings): Promise<SiteSettings> {
    const id = randomUUID();
    const setting: SiteSettings = { ...insertSetting, id };
    this.siteSettings.set(id, setting);
    return setting;
  }

  async updateSiteSetting(key: string, value: string): Promise<SiteSettings | undefined> {
    const existingSetting = Array.from(this.siteSettings.values()).find(s => s.key === key);
    if (!existingSetting) return undefined;
    const updatedSetting = { ...existingSetting, value };
    this.siteSettings.set(existingSetting.id, updatedSetting);
    return updatedSetting;
  }

  async upsertSiteSetting(authorId: string, key: string, value: string): Promise<SiteSettings> {
    const existingSetting = Array.from(this.siteSettings.values()).find(s => s.authorId === authorId && s.key === key);
    const id = existingSetting?.id || randomUUID();
    const setting: SiteSettings = { id, authorId, key, value };
    this.siteSettings.set(id, setting);
    return setting;
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values()).sort((a, b) =>
      a.username.localeCompare(b.username),
    );
  }

  async updateUser(id: string, patch: Partial<User>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...patch, id: existing.id };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async deleteNewsletterSubscriber(id: string): Promise<boolean> {
    // MemStorage doesn't currently track newsletter subscriptions in detail —
    // it operates on the simple `newsletters` map. For the in-memory backend
    // we just remove the row; list memberships live elsewhere if used.
    return this.newsletters.delete(id);
  }

  async getNewsletterSubscriberById(id: string): Promise<Newsletter | undefined> {
    return this.newsletters.get(id);
  }

  // Blog Post methods
  async getBlogPosts(): Promise<BlogPost[]> {
    return Array.from(this.blogPosts.values()).sort((a, b) => {
      const aDate = new Date(a.createdAt || 0);
      const bDate = new Date(b.createdAt || 0);
      return bDate.getTime() - aDate.getTime();
    });
  }

  async getPublishedBlogPosts(): Promise<BlogPost[]> {
    const posts = Array.from(this.blogPosts.values())
      .filter(post => post.isPublished)
      .sort((a, b) => {
        const aDate = new Date(a.publishedAt || a.createdAt || 0);
        const bDate = new Date(b.publishedAt || b.createdAt || 0);
        return bDate.getTime() - aDate.getTime();
      });
    return posts;
  }

  async getBlogPostById(id: string): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }

  async createBlogPost(insertPost: InsertBlogPost): Promise<BlogPost> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const post: BlogPost = { 
      ...insertPost, 
      id, 
      createdAt: now,
      updatedAt: now,
      publishedAt: insertPost.isPublished === true ? now : null,
      isPublished: insertPost.isPublished || false,
      featuredImage: insertPost.featuredImage || null,
      tags: insertPost.tags || null,
    };
    this.blogPosts.set(id, post);
    return post;
  }

  async updateBlogPost(id: string, insertPost: Partial<InsertBlogPost>): Promise<BlogPost | undefined> {
    const existingPost = this.blogPosts.get(id);
    if (!existingPost) return undefined;
    
    const now = new Date().toISOString();
    const updatedPost: BlogPost = { 
      ...existingPost, 
      ...insertPost,
      updatedAt: now,
      publishedAt: insertPost.isPublished === true && !existingPost.publishedAt ? now : existingPost.publishedAt,
    };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }

  async deleteBlogPost(id: string): Promise<boolean> {
    return this.blogPosts.delete(id);
  }

  async getUiTexts(locale?: string): Promise<UiText[]> {
    const allTexts = Array.from(this.uiTexts.values());
    if (!locale) {
      return allTexts;
    }
    return allTexts.filter(text => text.locale === locale);
  }

  async getUiTextsByNamespace(namespace: string, locale?: string): Promise<UiText[]> {
    const allTexts = Array.from(this.uiTexts.values()).filter(text => text.namespace === namespace);
    if (!locale) {
      return allTexts;
    }
    return allTexts.filter(text => text.locale === locale);
  }

  async getUiTextById(id: string): Promise<UiText | undefined> {
    return this.uiTexts.get(id);
  }

  async updateUiText(id: string, text: Partial<InsertUiText>): Promise<UiText | undefined> {
    const existingText = this.uiTexts.get(id);
    if (!existingText) return undefined;
    const updatedText = { ...existingText, ...text };
    this.uiTexts.set(id, updatedText);
    return updatedText;
  }

  async upsertUiText(text: InsertUiText): Promise<UiText> {
    const locale = text.locale || "es-ES";
    const existing = Array.from(this.uiTexts.values()).find(
      t => t.namespace === text.namespace && t.key === text.key && t.locale === locale
    );
    
    if (existing) {
      const updatedText = { ...existing, value: text.value };
      this.uiTexts.set(existing.id, updatedText);
      return updatedText;
    }
    
    const id = randomUUID();
    const newText: UiText = { ...text, id, locale };
    this.uiTexts.set(id, newText);
    return newText;
  }

  async listNamespaces(): Promise<string[]> {
    const namespaces = new Set<string>();
    Array.from(this.uiTexts.values()).forEach(text => namespaces.add(text.namespace));
    return Array.from(namespaces).sort();
  }

  async getLocaleMatrix(namespaces?: string[], search?: string): Promise<{ namespace: string; key: string; locales: Record<string, string | null> }[]> {
    let allTexts = Array.from(this.uiTexts.values());
    
    if (namespaces && namespaces.length > 0) {
      allTexts = allTexts.filter(t => namespaces.includes(t.namespace));
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      allTexts = allTexts.filter(t => 
        t.key.toLowerCase().includes(searchLower) || 
        t.value.toLowerCase().includes(searchLower)
      );
    }
    
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
    const results: UiText[] = [];
    for (const entry of entries) {
      const result = await this.upsertUiText(entry);
      results.push(result);
    }
    return results;
  }

  async deleteUiTextsByLocaleKey(locale: string, keys: string[]): Promise<number> {
    let deleted = 0;
    const toDelete: string[] = [];
    
    for (const [id, text] of Array.from(this.uiTexts.entries())) {
      if (text.locale === locale && keys.includes(text.key)) {
        toDelete.push(id);
      }
    }
    
    for (const id of toDelete) {
      this.uiTexts.delete(id);
      deleted++;
    }
    
    return deleted;
  }

  async getEditorialSettings(): Promise<EditorialSettings | undefined> {
    // MemStorage doesn't use editorial settings
    return undefined;
  }

  async updateEditorialSettings(settings: Partial<InsertEditorialSettings>): Promise<EditorialSettings | undefined> {
    // MemStorage doesn't use editorial settings
    return undefined;
  }

  // Analytics methods
  async createAnalyticsSession(insertSession: InsertAnalyticsSession): Promise<AnalyticsSession> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const session: AnalyticsSession = {
      ...insertSession,
      id,
      userId: insertSession.userId || null,
      userAgent: insertSession.userAgent || null,
      browser: insertSession.browser || null,
      os: insertSession.os || null,
      device: insertSession.device || null,
      referrer: insertSession.referrer || null,
      landingPage: insertSession.landingPage || null,
      startedAt: now,
      lastActiveAt: now,
    };
    this.analyticsSessions.set(session.sessionId, session);
    return session;
  }

  async getAnalyticsSession(sessionId: string): Promise<AnalyticsSession | undefined> {
    return Array.from(this.analyticsSessions.values()).find(s => s.sessionId === sessionId);
  }

  async updateAnalyticsSessionActivity(sessionId: string): Promise<void> {
    const session = await this.getAnalyticsSession(sessionId);
    if (session) {
      session.lastActiveAt = new Date().toISOString();
      this.analyticsSessions.set(session.sessionId, session);
    }
  }

  async createAnalyticsEvent(insertEvent: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const id = randomUUID();
    const now = new Date().toISOString();
    const event: AnalyticsEvent = {
      ...insertEvent,
      id,
      pagePath: insertEvent.pagePath || null,
      pageTitle: insertEvent.pageTitle || null,
      entityType: insertEvent.entityType || null,
      entityId: insertEvent.entityId || null,
      entityName: insertEvent.entityName || null,
      elementId: insertEvent.elementId || null,
      elementText: insertEvent.elementText || null,
      metadata: insertEvent.metadata || null,
      createdAt: now,
    };
    this.analyticsEvents.set(id, event);
    return event;
  }

  async getAnalyticsEvents(filters?: { sessionId?: string, entityType?: string, entityId?: string, startDate?: string, endDate?: string }): Promise<AnalyticsEvent[]> {
    let events = Array.from(this.analyticsEvents.values());
    
    if (filters?.sessionId) {
      events = events.filter(e => e.sessionId === filters.sessionId);
    }
    if (filters?.entityType) {
      events = events.filter(e => e.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      events = events.filter(e => e.entityId === filters.entityId);
    }
    if (filters?.startDate) {
      events = events.filter(e => (e.createdAt || '') >= filters.startDate!);
    }
    if (filters?.endDate) {
      events = events.filter(e => (e.createdAt || '') <= filters.endDate!);
    }
    
    return events.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }

  async getDailyMetrics(filters?: { date?: string, entityType?: string, entityId?: string, startDate?: string, endDate?: string }): Promise<AnalyticsDailyMetrics[]> {
    let metrics = Array.from(this.analyticsDailyMetrics.values());
    
    if (filters?.date) {
      metrics = metrics.filter(m => m.date === filters.date);
    }
    if (filters?.entityType) {
      metrics = metrics.filter(m => m.entityType === filters.entityType);
    }
    if (filters?.entityId) {
      metrics = metrics.filter(m => m.entityId === filters.entityId);
    }
    if (filters?.startDate) {
      metrics = metrics.filter(m => m.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      metrics = metrics.filter(m => m.date <= filters.endDate!);
    }
    
    return metrics.sort((a, b) => b.date.localeCompare(a.date));
  }

  async incrementDailyMetric(date: string, entityType: string | null, entityId: string | null, metricType: string, value: number = 1): Promise<void> {
    const key = `${date}_${entityType || 'global'}_${entityId || 'all'}`;
    let metric = Array.from(this.analyticsDailyMetrics.values()).find(
      m => m.date === date && m.entityType === entityType && m.entityId === entityId
    );
    
    if (!metric) {
      const id = randomUUID();
      const now = new Date().toISOString();
      metric = {
        id,
        date,
        totalPageviews: 0,
        uniqueVisitors: 0,
        totalSessions: 0,
        avgSessionDuration: 0,
        entityType,
        entityId,
        entityName: null,
        newsletterSignups: 0,
        bookDownloads: 0,
        purchases: 0,
        revenue: 0,
        createdAt: now,
        updatedAt: now,
      };
      this.analyticsDailyMetrics.set(id, metric);
    }
    
    const now = new Date().toISOString();
    metric.updatedAt = now;
    
    switch (metricType) {
      case 'totalPageviews':
        metric.totalPageviews = (metric.totalPageviews || 0) + value;
        break;
      case 'uniqueVisitors':
        metric.uniqueVisitors = (metric.uniqueVisitors || 0) + value;
        break;
      case 'totalSessions':
        metric.totalSessions = (metric.totalSessions || 0) + value;
        break;
      case 'newsletterSignups':
        metric.newsletterSignups = (metric.newsletterSignups || 0) + value;
        break;
      case 'bookDownloads':
        metric.bookDownloads = (metric.bookDownloads || 0) + value;
        break;
      case 'purchases':
        metric.purchases = (metric.purchases || 0) + value;
        break;
      case 'revenue':
        metric.revenue = (metric.revenue || 0) + value;
        break;
    }
    
    this.analyticsDailyMetrics.set(metric.id, metric);
  }

  async updateAvgSessionDuration(date: string, entityType: string | null, entityId: string | null, sessionDuration: number): Promise<void> {
    let metric = Array.from(this.analyticsDailyMetrics.values()).find(
      m => m.date === date && m.entityType === entityType && m.entityId === entityId
    );
    
    if (metric) {
      const oldAvg = metric.avgSessionDuration || 0;
      const oldCount = metric.totalSessions || 1;
      metric.avgSessionDuration = (oldAvg * oldCount + sessionDuration) / (oldCount + 1);
      metric.updatedAt = new Date().toISOString();
      this.analyticsDailyMetrics.set(metric.id, metric);
    }
  }

  async hasSessionEventOnDate(sessionId: string, date: string): Promise<boolean> {
    const dateStart = new Date(`${date}T00:00:00.000Z`).getTime();
    const dateEnd = new Date(`${date}T23:59:59.999Z`).getTime();
    
    const events = Array.from(this.analyticsEvents.values()).filter(
      e => e.sessionId === sessionId && 
           new Date(e.createdAt || 0).getTime() >= dateStart && 
           new Date(e.createdAt || 0).getTime() <= dateEnd
    );
    
    return events.length > 0;
  }

  async getTopBooks(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    let metrics = Array.from(this.analyticsDailyMetrics.values()).filter(m => m.entityType === 'book');
    
    if (startDate) {
      metrics = metrics.filter(m => m.date >= startDate);
    }
    if (endDate) {
      metrics = metrics.filter(m => m.date <= endDate);
    }
    
    const bookMetrics = new Map<string, { entityId: string, entityName: string | null, totalPageviews: number }>();
    
    metrics.forEach(m => {
      if (m.entityId) {
        const existing = bookMetrics.get(m.entityId);
        if (existing) {
          existing.totalPageviews += (m.totalPageviews || 0);
        } else {
          bookMetrics.set(m.entityId, {
            entityId: m.entityId,
            entityName: m.entityName,
            totalPageviews: m.totalPageviews || 0,
          });
        }
      }
    });
    
    return Array.from(bookMetrics.values())
      .sort((a, b) => b.totalPageviews - a.totalPageviews)
      .slice(0, limit);
  }

  async getTopAuthors(limit: number = 10, startDate?: string, endDate?: string): Promise<any[]> {
    let metrics = Array.from(this.analyticsDailyMetrics.values()).filter(m => m.entityType === 'author');
    
    if (startDate) {
      metrics = metrics.filter(m => m.date >= startDate);
    }
    if (endDate) {
      metrics = metrics.filter(m => m.date <= endDate);
    }
    
    const authorMetrics = new Map<string, { entityId: string, entityName: string | null, totalPageviews: number }>();
    
    metrics.forEach(m => {
      if (m.entityId) {
        const existing = authorMetrics.get(m.entityId);
        if (existing) {
          existing.totalPageviews += (m.totalPageviews || 0);
        } else {
          authorMetrics.set(m.entityId, {
            entityId: m.entityId,
            entityName: m.entityName,
            totalPageviews: m.totalPageviews || 0,
          });
        }
      }
    });
    
    return Array.from(authorMetrics.values())
      .sort((a, b) => b.totalPageviews - a.totalPageviews)
      .slice(0, limit);
  }

  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomerById(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByEmail(email: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(c => c.email === email);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      phone: insertCustomer.phone ?? null,
      billingAddress: insertCustomer.billingAddress ?? null,
      shippingAddress: insertCustomer.shippingAddress ?? null,
      isSubscribedToNewsletter: insertCustomer.isSubscribedToNewsletter ?? true,
      createdAt: new Date().toISOString()
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    const updated = { ...customer, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  async getOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async getOrderById(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrdersByCustomerId(customerId: string): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(o => o.customerId === customerId);
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order: Order = {
      ...insertOrder,
      id,
      status: insertOrder.status ?? "pending",
      customerId: insertOrder.customerId ?? null,
      paypalOrderId: insertOrder.paypalOrderId ?? null,
      paypalPayerId: insertOrder.paypalPayerId ?? null,
      shippingAddress: insertOrder.shippingAddress ?? null,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrderStatus(id: string, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    const updated = { ...order, status };
    this.orders.set(id, updated);
    return updated;
  }

  async getMerchandiseProducts(): Promise<MerchandiseProduct[]> {
    return Array.from(this.merchandiseProducts.values());
  }

  async getPublishedMerchandiseProducts(): Promise<MerchandiseProduct[]> {
    return Array.from(this.merchandiseProducts.values()).filter(p => p.isActive);
  }

  async getMerchandiseProductById(id: string): Promise<MerchandiseProduct | undefined> {
    return this.merchandiseProducts.get(id);
  }

  async createMerchandiseProduct(insertProduct: InsertMerchandiseProduct): Promise<MerchandiseProduct> {
    const id = randomUUID();
    const product: MerchandiseProduct = {
      ...insertProduct,
      id,
      imageUrl: insertProduct.imageUrl ?? null,
      stock: insertProduct.stock ?? 0,
      isActive: insertProduct.isActive ?? true,
      linkedEntityType: insertProduct.linkedEntityType ?? null,
      linkedEntityId: insertProduct.linkedEntityId ?? null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.merchandiseProducts.set(id, product);
    return product;
  }

  async updateMerchandiseProduct(id: string, updates: Partial<InsertMerchandiseProduct>): Promise<MerchandiseProduct | undefined> {
    const product = this.merchandiseProducts.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.merchandiseProducts.set(id, updated);
    return updated;
  }

  async deleteMerchandiseProduct(id: string): Promise<boolean> {
    return this.merchandiseProducts.delete(id);
  }

  async getCartItems(sessionId: string): Promise<CartItemWithDetails[]> {
    const items = Array.from(this.cartItems.values()).filter(item => item.sessionId === sessionId);
    
    // Fetch related product data for each cart item
    const itemsWithDetails: CartItemWithDetails[] = await Promise.all(
      items.map(async (item) => {
        const itemWithDetails: CartItemWithDetails = { ...item };
        
        if (item.productType === 'book') {
          itemWithDetails.book = this.books.get(item.productId);
        } else if (item.productType === 'merchandise') {
          itemWithDetails.merchandise = this.merchandiseProducts.get(item.productId);
        }
        
        return itemWithDetails;
      })
    );
    
    return itemsWithDetails;
  }

  async addCartItem(insertItem: InsertCartItem): Promise<CartItem> {
    const id = randomUUID();
    const item: CartItem = {
      ...insertItem,
      id,
      userId: insertItem.userId ?? null,
      quantity: insertItem.quantity ?? 1,
      createdAt: new Date().toISOString()
    };
    this.cartItems.set(id, item);
    return item;
  }

  async updateCartItem(id: string, quantity: number): Promise<CartItem | undefined> {
    const item = this.cartItems.get(id);
    if (!item) return undefined;
    const updated = { ...item, quantity };
    this.cartItems.set(id, updated);
    return updated;
  }

  async deleteCartItem(id: string): Promise<boolean> {
    return this.cartItems.delete(id);
  }

  async clearCart(sessionId: string): Promise<void> {
    const itemsToDelete = Array.from(this.cartItems.entries())
      .filter(([_, item]) => item.sessionId === sessionId)
      .map(([id, _]) => id);
    itemsToDelete.forEach(id => this.cartItems.delete(id));
  }

  // Search methods
  async searchAuthors(query: string): Promise<Author[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.authors.values())
      .filter(author => 
        author.isActive && 
        author.name.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20);
  }

  async searchSeries(query: string): Promise<BookSeries[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.bookSeries.values())
      .filter(series => 
        series.isActive && 
        series.title.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20);
  }

  async searchBooks(query: string): Promise<Book[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.books.values())
      .filter(book => 
        book.isPublished && 
        book.title.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 20);
  }
}

// Use DatabaseStorage for PostgreSQL persistence
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
