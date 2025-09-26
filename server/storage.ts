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
  type SiteSettings,
  type InsertSiteSettings,
  type User,
  type InsertUser
} from "@shared/schema";
import { randomUUID } from "crypto";
import session from "express-session";

export interface IStorage {
  // Author methods
  getAuthor(): Promise<Author | undefined>;
  createAuthor(author: InsertAuthor): Promise<Author>;
  updateAuthor(author: Partial<InsertAuthor>): Promise<Author>;

  // Book Series methods
  getBookSeries(): Promise<BookSeries[]>;
  getBookSeriesById(id: string): Promise<BookSeries | undefined>;
  createBookSeries(series: InsertBookSeries): Promise<BookSeries>;
  updateBookSeries(id: string, series: Partial<InsertBookSeries>): Promise<BookSeries | undefined>;
  deleteBookSeries(id: string): Promise<boolean>;

  // Book methods
  getBooks(): Promise<Book[]>;
  getBooksBySeriesId(seriesId: string): Promise<Book[]>;
  getStandaloneBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book | undefined>;
  createBook(book: InsertBook): Promise<Book>;
  updateBook(id: string, book: Partial<InsertBook>): Promise<Book | undefined>;
  deleteBook(id: string): Promise<boolean>;

  // Testimonial methods
  getTestimonials(): Promise<Testimonial[]>;
  getPublishedTestimonials(): Promise<Testimonial[]>;
  getTestimonialById(id: string): Promise<Testimonial | undefined>;
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  updateTestimonial(id: string, testimonial: Partial<InsertTestimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: string): Promise<boolean>;

  // Newsletter methods
  getNewsletterSubscribers(): Promise<Newsletter[]>;
  createNewsletterSubscriber(subscriber: InsertNewsletter): Promise<Newsletter>;

  // Site Settings methods
  getSiteSettings(): Promise<SiteSettings[]>;
  getSiteSettingByKey(key: string): Promise<SiteSettings | undefined>;
  createSiteSetting(setting: InsertSiteSettings): Promise<SiteSettings>;
  updateSiteSetting(key: string, value: string): Promise<SiteSettings | undefined>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Session store for authentication
  sessionStore: session.Store;
}

// Reference: javascript_auth_all_persistance integration
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export class MemStorage implements IStorage {
  private authors: Map<string, Author>;
  private bookSeries: Map<string, BookSeries>;
  private books: Map<string, Book>;
  private testimonials: Map<string, Testimonial>;
  private newsletters: Map<string, Newsletter>;
  private siteSettings: Map<string, SiteSettings>;
  private users: Map<string, User>;
  sessionStore: session.Store;

  constructor() {
    this.authors = new Map();
    this.bookSeries = new Map();
    this.books = new Map();
    this.testimonials = new Map();
    this.newsletters = new Map();
    this.siteSettings = new Map();
    this.users = new Map();
    
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
      amazonUrl: "https://amazon.com/author/mariagonzalez"
    };
    this.authors.set(authorId, author);

    // Create sample book series
    const seriesId1 = randomUUID();
    const series1: BookSeries = {
      id: seriesId1,
      title: "Serie Pasiones Urbanas",
      description: "Una serie de romance contemporáneo que sigue las vidas entrecruzadas de jóvenes profesionales en la ciudad. Cada libro puede leerse de forma independiente, pero juntos forman una saga emocionante llena de pasión, drama y segundas oportunidades.",
      genre: "Romance",
      amazonUrl: "https://amazon.com/series/pasiones-urbanas",
      isActive: true
    };
    this.bookSeries.set(seriesId1, series1);

    const seriesId2 = randomUUID();
    const series2: BookSeries = {
      id: seriesId2,
      title: "Serie Detective Luna",
      description: "Sigue las investigaciones de la detective Carmen Luna mientras resuelve los casos más complejos de la ciudad. Una serie llena de suspense, giros inesperados y un toque de misterio que te mantendrá en vilo hasta la última página.",
      genre: "Thriller",
      amazonUrl: "https://amazon.com/series/detective-luna",
      isActive: true
    };
    this.bookSeries.set(seriesId2, series2);

    // Create sample books
    const books = [
      {
        title: "Corazones en Fuga",
        description: "Una historia de amor contemporáneo en la ciudad",
        coverImage: "https://images.unsplash.com/photo-1516414447565-b14be0adf13e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        genre: "Romance",
        price: 9.99,
        amazonUrl: "https://amazon.com/corazones-fuga",
        seriesId: seriesId1,
        orderInSeries: 1,
        isStandalone: false,
        isPublished: true
      },
      {
        title: "Sombras del Pasado",
        description: "Un thriller lleno de suspense y misterio",
        coverImage: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        genre: "Thriller",
        price: 8.99,
        amazonUrl: "https://amazon.com/sombras-pasado",
        seriesId: seriesId2,
        orderInSeries: 3,
        isStandalone: false,
        isPublished: true
      },
      {
        title: "El Último Hechizo",
        description: "Una joven bibliotecaria descubre un grimorio ancestral que cambiará su vida para siempre. Una aventura mágica llena de secretos, poder y autodescubrimiento.",
        coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=600",
        genre: "Fantasía",
        price: 9.99,
        amazonUrl: "https://amazon.com/ultimo-hechizo",
        seriesId: null,
        orderInSeries: null,
        isStandalone: true,
        isPublished: true
      }
    ];

    books.forEach(book => {
      const bookId = randomUUID();
      this.books.set(bookId, { id: bookId, ...book });
    });

    // Create sample testimonials
    const testimonials = [
      {
        content: "María tiene un don especial para crear personajes que se sienten reales. No pude soltar 'Corazones en Fuga' hasta terminarlo. ¡Estoy ansiosa por el siguiente!",
        authorName: "Ana Martínez",
        authorType: "Lectora verificada",
        authorPhoto: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100",
        rating: 5,
        isFeatured: true,
        isPublished: true
      },
      {
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
  }

  // Author methods
  async getAuthor(): Promise<Author | undefined> {
    return Array.from(this.authors.values())[0];
  }

  async createAuthor(insertAuthor: InsertAuthor): Promise<Author> {
    const id = randomUUID();
    const author: Author = { ...insertAuthor, id, email: insertAuthor.email || null, instagramUrl: insertAuthor.instagramUrl || null, twitterUrl: insertAuthor.twitterUrl || null, facebookUrl: insertAuthor.facebookUrl || null, amazonUrl: insertAuthor.amazonUrl || null, photo: insertAuthor.photo || null };
    this.authors.set(id, author);
    return author;
  }

  async updateAuthor(updateAuthor: Partial<InsertAuthor>): Promise<Author> {
    const existingAuthor = Array.from(this.authors.values())[0];
    if (!existingAuthor) {
      throw new Error("No author found");
    }
    const updatedAuthor = { ...existingAuthor, ...updateAuthor };
    this.authors.set(existingAuthor.id, updatedAuthor);
    return updatedAuthor;
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
    const series: BookSeries = { ...insertSeries, id, amazonUrl: insertSeries.amazonUrl || null, isActive: insertSeries.isActive || null };
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

  async getBookById(id: string): Promise<Book | undefined> {
    return this.books.get(id);
  }

  async createBook(insertBook: InsertBook): Promise<Book> {
    const id = randomUUID();
    const book: Book = { ...insertBook, id, amazonUrl: insertBook.amazonUrl || null, description: insertBook.description || null, seriesId: insertBook.seriesId || null, coverImage: insertBook.coverImage || null, price: insertBook.price || null, orderInSeries: insertBook.orderInSeries || null, isStandalone: insertBook.isStandalone || null, isPublished: insertBook.isPublished || null };
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
    const testimonial: Testimonial = { ...insertTestimonial, id, authorPhoto: insertTestimonial.authorPhoto || null, isFeatured: insertTestimonial.isFeatured || null, isPublished: insertTestimonial.isPublished || null };
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
      subscribedAt: new Date().toISOString()
    };
    this.newsletters.set(id, newsletter);
    return newsletter;
  }

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
}

export const storage = new MemStorage();
