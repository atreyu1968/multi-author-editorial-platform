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
  type InsertUser,
  type BlogPost,
  type InsertBlogPost,
  type UiText,
  type InsertUiText
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
  upsertSiteSetting(key: string, value: string): Promise<SiteSettings>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Blog Post methods
  getBlogPosts(): Promise<BlogPost[]>;
  getPublishedBlogPosts(): Promise<BlogPost[]>;
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
  private blogPosts: Map<string, BlogPost>;
  private uiTexts: Map<string, UiText>;
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

  async upsertSiteSetting(key: string, value: string): Promise<SiteSettings> {
    const existingSetting = Array.from(this.siteSettings.values()).find(s => s.key === key);
    if (existingSetting) {
      const updatedSetting = { ...existingSetting, value };
      this.siteSettings.set(existingSetting.id, updatedSetting);
      return updatedSetting;
    }
    
    const id = randomUUID();
    const setting: SiteSettings = { id, key, value };
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
}

// Use DatabaseStorage for PostgreSQL persistence
import { DatabaseStorage } from "./database-storage";
export const storage = new DatabaseStorage();
