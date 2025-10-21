import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import type { Book } from "@shared/schema";
import { 
  insertAuthorSchema,
  insertBookSeriesSchema,
  insertBookSchema,
  insertTestimonialSchema,
  insertNewsletterSchema,
  insertSiteSettingsSchema,
  insertBlogPostSchema,
  insertUiTextSchema,
  insertEditorialSettingsSchema,
  insertAnalyticsSessionSchema,
  insertAnalyticsEventSchema,
  insertCustomerSchema,
  insertOrderSchema,
  insertMerchandiseProductSchema,
  insertCartItemSchema,
  insertAuthorTranslationSchema,
  insertBookTranslationSchema,
  insertSeriesTranslationSchema,
  insertTestimonialTranslationSchema,
  insertBlogPostTranslationSchema
} from "@shared/schema";
import { z } from "zod";
// Referenced from blueprint:javascript_object_storage
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// Referenced from blueprint:javascript_paypal
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";

// Authentication middleware to protect admin routes
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Validation helpers
function isValidUrl(url: string): boolean {
  if (!url) return true; // Empty strings are allowed (for clearing settings)
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidHexColor(color: string): boolean {
  if (!color) return true; // Empty strings are allowed
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint for deployment platform
  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  // Reference: javascript_auth_all_persistance integration
  // Setup authentication routes: /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Author routes
  app.get("/api/authors", async (req, res) => {
    try {
      const authors = await storage.getAuthors();
      res.json(authors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get authors" });
    }
  });

  // Specific routes must be before parameterized routes
  app.get("/api/authors-with-content", async (req, res) => {
    try {
      const authors = await storage.getAuthors();
      const allBooks = await storage.getBooks();
      const series = await storage.getBookSeries();
      
      // Filter only published books
      const publishedBooks = allBooks.filter((book: Book) => book.isPublished);
      
      // Filter authors that are active AND have at least one published book or active series
      const authorsWithContent = authors.filter(author => {
        if (!author.isActive) return false;
        
        // Check if author has at least one published book
        const hasPublishedBook = publishedBooks.some(
          (book: Book) => book.authorId === author.id
        );
        
        // Check if author has at least one active series with their books
        const hasActiveSeries = series.some(s => {
          if (!s.isActive) return false;
          const seriesBooks = publishedBooks.filter((book: Book) => book.seriesId === s.id);
          return seriesBooks.some((book: Book) => book.authorId === author.id);
        });
        
        return hasPublishedBook || hasActiveSeries;
      });
      
      res.json(authorsWithContent);
    } catch (error) {
      res.status(500).json({ message: "Failed to get authors with content" });
    }
  });

  app.get("/api/authors/by-slug/:slug", async (req, res) => {
    try {
      const author = await storage.getAuthorBySlug(req.params.slug);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      res.json(author);
    } catch (error) {
      res.status(500).json({ message: "Failed to get author" });
    }
  });

  app.get("/api/authors/:id", async (req, res) => {
    try {
      const author = await storage.getAuthorById(req.params.id);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      res.json(author);
    } catch (error) {
      res.status(500).json({ message: "Failed to get author" });
    }
  });

  app.post("/api/authors", requireAuth, async (req, res) => {
    try {
      const validatedAuthor = insertAuthorSchema.parse(req.body);
      const author = await storage.createAuthor(validatedAuthor);
      res.status(201).json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });

  app.put("/api/authors/:id", requireAuth, async (req, res) => {
    try {
      const validatedAuthor = insertAuthorSchema.parse(req.body);
      const author = await storage.updateAuthor(req.params.id, validatedAuthor);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      res.json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });

  app.delete("/api/authors/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteAuthor(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      res.json({ message: "Author deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete author" });
    }
  });

  // Book Series routes
  app.get("/api/book-series", async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const series = await storage.getBookSeries(authorId);
      res.json(series);
    } catch (error) {
      res.status(500).json({ message: "Failed to get book series" });
    }
  });

  app.get("/api/book-series/:id", async (req, res) => {
    try {
      const series = await storage.getBookSeriesById(req.params.id);
      if (!series) {
        res.status(404).json({ message: "Book series not found" });
        return;
      }
      res.json(series);
    } catch (error) {
      res.status(500).json({ message: "Failed to get book series" });
    }
  });

  app.post("/api/book-series", requireAuth, async (req, res) => {
    try {
      const validatedSeries = insertBookSeriesSchema.parse(req.body);
      const series = await storage.createBookSeries(validatedSeries);
      res.status(201).json(series);
    } catch (error) {
      res.status(400).json({ message: "Invalid book series data" });
    }
  });

  app.put("/api/book-series/:id", requireAuth, async (req, res) => {
    try {
      const validatedSeries = insertBookSeriesSchema.partial().parse(req.body);
      const series = await storage.updateBookSeries(req.params.id, validatedSeries);
      if (!series) {
        res.status(404).json({ message: "Book series not found" });
        return;
      }
      res.json(series);
    } catch (error) {
      res.status(400).json({ message: "Invalid book series data" });
    }
  });

  app.delete("/api/book-series/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteBookSeries(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Book series not found" });
        return;
      }
      res.json({ message: "Book series deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete book series" });
    }
  });

  // Book routes (admin-only endpoint for all books including drafts)
  app.get("/api/books", requireAuth, async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const books = await storage.getBooks(authorId);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to get books" });
    }
  });

  app.get("/api/books/standalone", async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const books = await storage.getStandaloneBooks(authorId);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to get standalone books" });
    }
  });

  app.get("/api/books/latest", async (req, res) => {
    try {
      const parsedLimit = req.query.limit ? parseInt(req.query.limit as string, 10) : 6;
      const limit = isNaN(parsedLimit) || parsedLimit < 1 ? 6 : Math.min(parsedLimit, 50);
      const books = await storage.getLatestBooks(limit);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to get latest books" });
    }
  });

  app.get("/api/books/series/:seriesId", async (req, res) => {
    try {
      const books = await storage.getBooksBySeriesId(req.params.seriesId);
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to get books by series" });
    }
  });

  app.get("/api/books/:id", async (req, res) => {
    try {
      const book = await storage.getBookById(req.params.id);
      if (!book) {
        res.status(404).json({ message: "Book not found" });
        return;
      }
      res.json(book);
    } catch (error) {
      res.status(500).json({ message: "Failed to get book" });
    }
  });

  app.post("/api/books", requireAuth, async (req, res) => {
    try {
      const validatedBook = insertBookSchema.parse(req.body);
      
      // Validate sale format configuration
      if (validatedBook.directSaleEnabled) {
        if (!validatedBook.saleFormatPhysical && !validatedBook.saleFormatDigital) {
          res.status(400).json({ 
            message: "Al menos un formato de venta debe estar habilitado cuando la venta directa está activa" 
          });
          return;
        }
        
        // If digital format is enabled, ensure at least one digital file is configured
        if (validatedBook.saleFormatDigital) {
          const hasDigitalFiles = validatedBook.digitalFiles && 
            validatedBook.digitalFiles.trim() !== '' && 
            validatedBook.digitalFiles !== '{}';
          
          if (!hasDigitalFiles) {
            res.status(400).json({ 
              message: "Se requiere al menos un archivo digital cuando el formato digital está habilitado" 
            });
            return;
          }
        }
      }
      
      const book = await storage.createBook(validatedBook);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ message: "Invalid book data" });
    }
  });

  app.put("/api/books/:id", requireAuth, async (req, res) => {
    try {
      const validatedBook = insertBookSchema.partial().parse(req.body);
      
      // Get existing book to merge with partial update
      const existingBook = await storage.getBookById(req.params.id);
      if (!existingBook) {
        res.status(404).json({ message: "Book not found" });
        return;
      }
      
      // Merge existing book data with update payload
      const mergedBook = {
        ...existingBook,
        ...validatedBook,
      };
      
      // Validate sale format configuration on merged data
      if (mergedBook.directSaleEnabled) {
        if (!mergedBook.saleFormatPhysical && !mergedBook.saleFormatDigital) {
          res.status(400).json({ 
            message: "Al menos un formato de venta debe estar habilitado cuando la venta directa está activa" 
          });
          return;
        }
        
        // If digital format is enabled, ensure at least one digital file is configured
        if (mergedBook.saleFormatDigital) {
          const hasDigitalFiles = mergedBook.digitalFiles && 
            mergedBook.digitalFiles.trim() !== '' && 
            mergedBook.digitalFiles !== '{}';
          
          if (!hasDigitalFiles) {
            res.status(400).json({ 
              message: "Se requiere al menos un archivo digital cuando el formato digital está habilitado" 
            });
            return;
          }
        }
      }
      
      const book = await storage.updateBook(req.params.id, validatedBook);
      if (!book) {
        res.status(404).json({ message: "Book not found" });
        return;
      }
      res.json(book);
    } catch (error) {
      console.error("Error updating book:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid book data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update book" });
      }
    }
  });

  app.delete("/api/books/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteBook(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Book not found" });
        return;
      }
      res.json({ message: "Book deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete book" });
    }
  });

  // Search routes
  app.get("/api/search/authors", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        res.json([]);
        return;
      }
      const results = await storage.searchAuthors(query.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/search/series", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        res.json([]);
        return;
      }
      const results = await storage.searchSeries(query.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  app.get("/api/search/books", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        res.json([]);
        return;
      }
      const results = await storage.searchBooks(query.trim());
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Global search endpoint that returns all types
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.trim() === '') {
        res.json({ authors: [], series: [], books: [] });
        return;
      }
      const trimmedQuery = query.trim();
      const [authors, series, books] = await Promise.all([
        storage.searchAuthors(trimmedQuery),
        storage.searchSeries(trimmedQuery),
        storage.searchBooks(trimmedQuery)
      ]);
      res.json({ authors, series, books });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Testimonial routes (admin-only endpoint for all testimonials)
  app.get("/api/testimonials", requireAuth, async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const testimonials = await storage.getTestimonials(authorId);
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to get testimonials" });
    }
  });

  app.get("/api/testimonials/published", async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const testimonials = await storage.getPublishedTestimonials(authorId);
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to get published testimonials" });
    }
  });

  app.post("/api/testimonials", requireAuth, async (req, res) => {
    try {
      const validatedTestimonial = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(validatedTestimonial);
      res.status(201).json(testimonial);
    } catch (error) {
      res.status(400).json({ message: "Invalid testimonial data" });
    }
  });

  app.put("/api/testimonials/:id", requireAuth, async (req, res) => {
    try {
      const validatedTestimonial = insertTestimonialSchema.partial().parse(req.body);
      const testimonial = await storage.updateTestimonial(req.params.id, validatedTestimonial);
      if (!testimonial) {
        res.status(404).json({ message: "Testimonial not found" });
        return;
      }
      res.json(testimonial);
    } catch (error) {
      res.status(400).json({ message: "Invalid testimonial data" });
    }
  });

  app.delete("/api/testimonials/:id", requireAuth, async (req, res) => {
    try {
      const deleted = await storage.deleteTestimonial(req.params.id);
      if (!deleted) {
        res.status(404).json({ message: "Testimonial not found" });
        return;
      }
      res.json({ message: "Testimonial deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete testimonial" });
    }
  });

  // Newsletter routes
  app.get("/api/newsletter", requireAuth, async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const subscribers = await storage.getNewsletterSubscribers(authorId);
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get newsletter subscribers" });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const validatedSubscriber = insertNewsletterSchema.parse(req.body);
      const subscriber = await storage.createNewsletterSubscriber(validatedSubscriber);
      
      // Try to send welcome email with free book
      try {
        const siteSettings = await storage.getSiteSettings();
        const settingsMap = siteSettings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);

        const editorialSettings = await storage.getEditorialSettings();
        const freeBookFile = settingsMap.freeBookFile;
        const freeBookTitle = settingsMap.freeBookTitle || 'Libro de Regalo';
        const freeBookDescription = settingsMap.freeBookDescription || 'Disfruta de este libro exclusivo como regalo de bienvenida.';

        if (editorialSettings && freeBookFile) {
          const { emailService } = await import('./email-service.js');
          
          // Configure email service from editorial settings
          emailService.configureFromSettings('newsletter', editorialSettings);
          
          // Construct full download URL
          const baseUrl = process.env.REPL_SLUG 
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            : 'http://localhost:5000';
          const downloadUrl = freeBookFile.startsWith('http') 
            ? freeBookFile 
            : `${baseUrl}${freeBookFile}`;

          const from = emailService.getDefaultFrom();
          await emailService.sendWelcomeEmail(
            validatedSubscriber.email,
            validatedSubscriber.name,
            freeBookTitle,
            freeBookDescription,
            downloadUrl,
            from
          );
        }
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the subscription if email fails
      }

      res.status(201).json(subscriber);
    } catch (error) {
      res.status(400).json({ message: "Invalid newsletter data" });
    }
  });

  // Site Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const settings = await storage.getSiteSettings(authorId);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get site settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const authorId = req.query.authorId as string;
      if (!authorId) {
        res.status(400).json({ message: "authorId query parameter is required" });
        return;
      }
      const setting = await storage.getSiteSettingByKey(authorId, req.params.key);
      if (!setting) {
        res.status(404).json({ message: "Setting not found" });
        return;
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to get setting" });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const { authorId, key, value } = req.body;
      
      if (!authorId) {
        res.status(400).json({ message: "authorId is required in request body" });
        return;
      }
      
      if (!key) {
        res.status(400).json({ message: "key is required in request body" });
        return;
      }
      
      if (typeof value !== "string") {
        res.status(400).json({ message: "value must be a string" });
        return;
      }
      
      const setting = await storage.upsertSiteSetting(authorId, key, value);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid setting data" });
    }
  });

  app.put("/api/settings/:key", requireAuth, async (req, res) => {
    try {
      const { authorId, value } = req.body;
      const key = req.params.key;
      
      if (!authorId) {
        res.status(400).json({ message: "authorId is required in request body" });
        return;
      }
      
      if (typeof value !== "string") {
        res.status(400).json({ message: "Value must be a string" });
        return;
      }
      
      // Validate URLs for logo and favicon
      if (key === "logoUrl" || key === "faviconUrl") {
        if (value && !isValidUrl(value)) {
          res.status(400).json({ message: "Invalid URL format" });
          return;
        }
      }
      
      // Validate color values
      if (key === "primaryColor" || key === "secondaryColor" || key === "accentColor" || 
          key === "backgroundColor" || key === "textColor") {
        if (value && !isValidHexColor(value)) {
          res.status(400).json({ message: "Invalid color format. Must be a valid hex color (e.g., #FF5733)" });
          return;
        }
      }
      
      const setting = await storage.upsertSiteSetting(authorId, key, value);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  // Blog Post routes
  app.get("/api/blog-posts", requireAuth, async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const posts = await storage.getBlogPosts(authorId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog posts" });
    }
  });

  app.get("/api/blog-posts/published", async (req, res) => {
    try {
      const authorId = req.query.authorId as string | undefined;
      const posts = await storage.getPublishedBlogPosts(authorId);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get published blog posts" });
    }
  });

  app.get("/api/blog-posts/:id", async (req, res) => {
    try {
      const post = await storage.getBlogPostById(req.params.id);
      if (!post) {
        res.status(404).json({ message: "Blog post not found" });
        return;
      }
      // Only return published posts unless admin is authenticated
      if (!post.isPublished && !req.isAuthenticated()) {
        res.status(404).json({ message: "Blog post not found" });
        return;
      }
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog post" });
    }
  });

  app.post("/api/blog-posts", requireAuth, async (req, res) => {
    try {
      const validatedPost = insertBlogPostSchema.parse(req.body);
      const post = await storage.createBlogPost(validatedPost);
      res.status(201).json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid blog post data" });
    }
  });

  app.put("/api/blog-posts/:id", requireAuth, async (req, res) => {
    try {
      const validatedPost = insertBlogPostSchema.parse(req.body);
      const post = await storage.updateBlogPost(req.params.id, validatedPost);
      if (!post) {
        res.status(404).json({ message: "Blog post not found" });
        return;
      }
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid blog post data" });
    }
  });

  app.delete("/api/blog-posts/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteBlogPost(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Blog post not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete blog post" });
    }
  });

  // Object Storage routes
  // Referenced from blueprint:javascript_object_storage
  
  // Endpoint to serve uploaded images (public access for landing pages)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path,
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Endpoint to get upload URL (protected - admin only)
  app.post("/api/objects/upload", requireAuth, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Endpoint to save uploaded image reference (protected - admin only)
  app.post("/api/images/upload", requireAuth, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.imageURL,
        {
          owner: "admin",
          visibility: "public", // Public so landing pages can display images
        },
      );

      res.status(200).json({
        objectPath: objectPath,
      });
    } catch (error) {
      console.error("Error setting image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // UI Texts routes
  app.get("/api/ui-texts", async (req, res) => {
    try {
      const locale = req.query.locale as string | undefined;
      const texts = await storage.getUiTexts(locale);
      res.json(texts);
    } catch (error) {
      res.status(500).json({ message: "Failed to get UI texts" });
    }
  });

  app.get("/api/ui-texts/:id", async (req, res) => {
    try {
      const text = await storage.getUiTextById(req.params.id);
      if (!text) {
        res.status(404).json({ message: "UI text not found" });
        return;
      }
      res.json(text);
    } catch (error) {
      res.status(500).json({ message: "Failed to get UI text" });
    }
  });

  app.put("/api/ui-texts/:id", requireAuth, async (req, res) => {
    try {
      const validatedText = insertUiTextSchema.partial().parse(req.body);
      const text = await storage.updateUiText(req.params.id, validatedText);
      if (!text) {
        res.status(404).json({ message: "UI text not found" });
        return;
      }
      res.json(text);
    } catch (error) {
      res.status(400).json({ message: "Invalid UI text data" });
    }
  });

  app.post("/api/ui-texts", requireAuth, async (req, res) => {
    try {
      const validatedText = insertUiTextSchema.parse(req.body);
      const text = await storage.upsertUiText(validatedText);
      res.json(text);
    } catch (error) {
      res.status(400).json({ message: "Invalid UI text data" });
    }
  });

  // Force seed UI texts (temporary endpoint for production database population)
  app.post("/api/admin/force-seed-ui-texts", requireAuth, async (req, res) => {
    try {
      const { seedUiTexts } = await import("../scripts/seed-ui-texts");
      console.log("🔄 Manual seed triggered by admin");
      await seedUiTexts();
      res.json({ message: "UI texts seed completed successfully" });
    } catch (error) {
      console.error("❌ Seed error:", error);
      res.status(500).json({ message: "Seed failed: " + (error as Error).message });
    }
  });

  // Translation Management routes
  app.get("/api/translations/summary", requireAuth, async (req, res) => {
    try {
      const matrix = await storage.getLocaleMatrix();
      const locales = ['es-ES', 'en-US', 'ca-ES', 'fr-FR', 'it-IT', 'de-DE', 'pt-PT'];
      
      const summary = locales.map(locale => {
        const total = matrix.length;
        const translated = matrix.filter(item => item.locales[locale]).length;
        const coverage = total > 0 ? (translated / total) * 100 : 0;
        
        return {
          locale,
          total,
          translated,
          missing: total - translated,
          coverage: Math.round(coverage * 10) / 10
        };
      });
      
      res.json(summary);
    } catch (error) {
      console.error("Translation summary error:", error);
      res.status(500).json({ message: "Failed to get translation summary" });
    }
  });

  app.get("/api/translations/diff", requireAuth, async (req, res) => {
    try {
      const source = req.query.source as string;
      const target = req.query.target as string;
      
      if (!source || !target) {
        res.status(400).json({ message: "Source and target locales are required" });
        return;
      }
      
      const matrix = await storage.getLocaleMatrix();
      
      const missing = matrix.filter(item => item.locales[source] && !item.locales[target]);
      const obsolete = matrix.filter(item => !item.locales[source] && item.locales[target]);
      
      res.json({
        source,
        target,
        missing: missing.map(item => ({
          namespace: item.namespace,
          key: item.key,
          sourceValue: item.locales[source]
        })),
        obsolete: obsolete.map(item => ({
          namespace: item.namespace,
          key: item.key,
          targetValue: item.locales[target]
        }))
      });
    } catch (error) {
      console.error("Translation diff error:", error);
      res.status(500).json({ message: "Failed to get translation diff" });
    }
  });

  app.get("/api/translations/export", requireAuth, async (req, res) => {
    try {
      const format = (req.query.format as string) || 'json';
      const locale = req.query.locale as string;
      
      const texts = locale && locale !== 'all' 
        ? await storage.getUiTexts(locale)
        : await storage.getUiTexts();
      
      if (format === 'csv') {
        const csvRows = ['namespace,key,locale,value'];
        texts.forEach(text => {
          const value = text.value.replace(/"/g, '""');
          csvRows.push(`${text.namespace},${text.key},${text.locale},"${value}"`);
        });
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=translations-${locale || 'all'}.csv`);
        res.send(csvRows.join('\n'));
      } else {
        const nested: Record<string, Record<string, string>> = {};
        
        texts.forEach(text => {
          if (!nested[text.namespace]) {
            nested[text.namespace] = {};
          }
          const key = locale && locale !== 'all' ? text.key : `${text.key}|||${text.locale}`;
          nested[text.namespace][key] = text.value;
        });
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=translations-${locale || 'all'}.json`);
        res.json(nested);
      }
    } catch (error) {
      console.error("Translation export error:", error);
      res.status(500).json({ message: "Failed to export translations" });
    }
  });

  app.post("/api/translations/import", requireAuth, async (req, res) => {
    try {
      const { format, data, locale } = req.body;
      
      if (!format || !data) {
        res.status(400).json({ message: "Format and data are required" });
        return;
      }
      
      const entries: any[] = [];
      
      if (format === 'json') {
        if (typeof data !== 'object') {
          res.status(400).json({ message: "Invalid JSON format" });
          return;
        }
        
        for (const [namespace, keys] of Object.entries(data)) {
          if (typeof keys !== 'object') continue;
          
          for (const [key, value] of Object.entries(keys as Record<string, any>)) {
            if (typeof value !== 'string') continue;
            
            const [actualKey, keyLocale] = key.includes('|||') ? key.split('|||') : [key, locale];
            
            if (!keyLocale) {
              res.status(400).json({ message: "Locale is required for each entry" });
              return;
            }
            
            entries.push({
              namespace,
              key: actualKey,
              locale: keyLocale,
              value
            });
          }
        }
      } else if (format === 'csv') {
        const lines = data.split('\n').slice(1);
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          const match = line.match(/^([^,]+),([^,]+),([^,]+),"(.*)"/);
          if (!match) continue;
          
          const [, namespace, key, csvLocale, value] = match;
          entries.push({
            namespace,
            key,
            locale: csvLocale,
            value: value.replace(/""/g, '"')
          });
        }
      }
      
      const validatedEntries = entries.map(entry => insertUiTextSchema.parse(entry));
      const results = await storage.bulkUpsertUiTexts(validatedEntries);
      
      res.json({
        success: true,
        imported: results.length,
        entries: results
      });
    } catch (error) {
      console.error("Translation import error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Invalid import data" });
    }
  });

  app.post("/api/translations/copy", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        sourceLocale: z.string(),
        targetLocale: z.string(),
        namespaces: z.array(z.string()).optional()
      });
      
      const { sourceLocale, targetLocale, namespaces } = schema.parse(req.body);
      
      if (sourceLocale === targetLocale) {
        res.status(400).json({ message: "Source and target locales must be different" });
        return;
      }
      
      const matrix = await storage.getLocaleMatrix(namespaces);
      const toCopy = matrix.filter(item => item.locales[sourceLocale] && !item.locales[targetLocale]);
      
      const entries = toCopy.map(item => ({
        namespace: item.namespace,
        key: item.key,
        locale: targetLocale,
        value: item.locales[sourceLocale]!
      }));
      
      const results = await storage.bulkUpsertUiTexts(entries);
      
      res.json({
        success: true,
        copied: results.length,
        entries: results
      });
    } catch (error) {
      console.error("Translation copy error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Failed to copy translations" });
    }
  });

  // Editorial Settings routes
  // Public endpoint - excludes sensitive PayPal credentials
  app.get("/api/editorial-settings", async (req, res) => {
    try {
      const settings = await storage.getEditorialSettings();
      if (!settings) {
        res.status(404).json({ message: "Editorial settings not found" });
        return;
      }
      // Remove sensitive PayPal credentials from public response
      const { paypalClientId, paypalClientSecret, paypalEnvironment, ...publicSettings } = settings;
      res.json(publicSettings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get editorial settings" });
    }
  });

  // Protected admin endpoint - includes all fields including PayPal credentials
  app.get("/api/editorial-settings/admin", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getEditorialSettings();
      if (!settings) {
        res.status(404).json({ message: "Editorial settings not found" });
        return;
      }
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get editorial settings" });
    }
  });

  app.put("/api/editorial-settings", requireAuth, async (req, res) => {
    try {
      const validatedSettings = insertEditorialSettingsSchema.partial().parse(req.body);
      
      // This will create or update the settings automatically
      const settings = await storage.updateEditorialSettings(validatedSettings);
      
      if (!settings) {
        res.status(500).json({ message: "Failed to update editorial settings" });
        return;
      }
      res.json(settings);
    } catch (error) {
      console.error("Editorial settings update error:", error);
      res.status(400).json({ message: "Invalid editorial settings data" });
    }
  });

  // Analytics routes
  app.post("/api/analytics/session", async (req, res) => {
    try {
      const validatedSession = insertAnalyticsSessionSchema.parse(req.body);
      
      // Check if session already exists
      const existingSession = await storage.getAnalyticsSession(validatedSession.sessionId);
      
      if (existingSession) {
        // Update last activity and calculate session duration
        await storage.updateAnalyticsSessionActivity(validatedSession.sessionId);
        
        // Calculate session duration for metrics update
        try {
          if (existingSession.startedAt) {
            const startedAt = new Date(existingSession.startedAt).getTime();
            const now = Date.now();
            const durationMinutes = Math.round((now - startedAt) / 1000 / 60);
            
            if (durationMinutes > 0) {
              const today = new Date().toISOString().split('T')[0];
              await storage.updateAvgSessionDuration(today, null, null, durationMinutes);
            }
          }
        } catch (error) {
          console.error('Failed to update session duration:', error);
        }
        
        res.json(existingSession);
        return;
      }
      
      // Create new session
      const session = await storage.createAnalyticsSession(validatedSession);
      
      // Increment total sessions metric (don't block if this fails)
      try {
        const today = new Date().toISOString().split('T')[0];
        await storage.incrementDailyMetric(today, null, null, 'totalSessions', 1);
      } catch (error) {
        console.error('Failed to increment totalSessions metric:', error);
      }
      
      res.status(201).json(session);
    } catch (error) {
      res.status(400).json({ message: "Invalid session data" });
    }
  });

  app.post("/api/analytics/track", async (req, res) => {
    try {
      const validatedEvent = insertAnalyticsEventSchema.parse(req.body);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Check if this is the first event from this session today BEFORE creating the event
      let isFirstEventToday = false;
      try {
        const hasEventToday = await storage.hasSessionEventOnDate(validatedEvent.sessionId, today);
        isFirstEventToday = !hasEventToday;
      } catch (error) {
        console.error('Failed to check session event history:', error);
      }
      
      // Update session activity
      await storage.updateAnalyticsSessionActivity(validatedEvent.sessionId);
      
      // Create analytics event
      const event = await storage.createAnalyticsEvent(validatedEvent);
      
      // Track unique visitors (only count once per session per day)
      if (isFirstEventToday) {
        try {
          // This is the first event from this session today, increment unique visitors
          await storage.incrementDailyMetric(today, null, null, 'uniqueVisitors', 1);
          
          // Also track entity-specific unique visitors if entity info is provided
          if (validatedEvent.entityType && validatedEvent.entityId) {
            await storage.incrementDailyMetric(
              today,
              validatedEvent.entityType,
              validatedEvent.entityId,
              'uniqueVisitors',
              1
            );
          }
        } catch (error) {
          console.error('Failed to track unique visitors:', error);
        }
      }
      
      // Update daily metrics based on event type
      try {
        if (validatedEvent.eventType === 'pageview') {
          await storage.incrementDailyMetric(today, null, null, 'totalPageviews', 1);
          
          // Also track entity-specific pageviews if entity info is provided
          if (validatedEvent.entityType && validatedEvent.entityId) {
            await storage.incrementDailyMetric(
              today,
              validatedEvent.entityType,
              validatedEvent.entityId,
              'totalPageviews',
              1
            );
          }
        } else if (validatedEvent.eventType === 'newsletter_signup') {
          await storage.incrementDailyMetric(today, null, null, 'newsletterSignups', 1);
          
          // Also track entity-specific conversions if entity info is provided
          if (validatedEvent.entityType && validatedEvent.entityId) {
            await storage.incrementDailyMetric(
              today,
              validatedEvent.entityType,
              validatedEvent.entityId,
              'newsletterSignups',
              1
            );
          }
        } else if (validatedEvent.eventType === 'download') {
          await storage.incrementDailyMetric(today, null, null, 'bookDownloads', 1);
          
          // Also track entity-specific conversions if entity info is provided
          if (validatedEvent.entityType && validatedEvent.entityId) {
            await storage.incrementDailyMetric(
              today,
              validatedEvent.entityType,
              validatedEvent.entityId,
              'bookDownloads',
              1
            );
          }
        } else if (validatedEvent.eventType === 'purchase') {
          await storage.incrementDailyMetric(today, null, null, 'purchases', 1);
          
          // Also track entity-specific conversions if entity info is provided
          if (validatedEvent.entityType && validatedEvent.entityId) {
            await storage.incrementDailyMetric(
              today,
              validatedEvent.entityType,
              validatedEvent.entityId,
              'purchases',
              1
            );
          }
          
          // Track revenue if metadata contains purchase amount
          if (validatedEvent.metadata && typeof validatedEvent.metadata === 'object') {
            const metadata = validatedEvent.metadata as any;
            if (metadata.amount && typeof metadata.amount === 'number') {
              await storage.incrementDailyMetric(today, null, null, 'revenue', metadata.amount);
              
              if (validatedEvent.entityType && validatedEvent.entityId) {
                await storage.incrementDailyMetric(
                  today,
                  validatedEvent.entityType,
                  validatedEvent.entityId,
                  'revenue',
                  metadata.amount
                );
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to update metrics:', error);
      }
      
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ message: "Invalid event data" });
    }
  });

  app.get("/api/analytics/metrics", requireAuth, async (req, res) => {
    try {
      const filters = {
        date: req.query.date as string | undefined,
        entityType: req.query.entityType as string | undefined,
        entityId: req.query.entityId as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
      };
      
      const metrics = await storage.getDailyMetrics(filters);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  app.get("/api/analytics/top-books", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      const topBooks = await storage.getTopBooks(limit, startDate, endDate);
      res.json(topBooks);
    } catch (error) {
      res.status(500).json({ message: "Failed to get top books" });
    }
  });

  app.get("/api/analytics/top-authors", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      
      const topAuthors = await storage.getTopAuthors(limit, startDate, endDate);
      res.json(topAuthors);
    } catch (error) {
      res.status(500).json({ message: "Failed to get top authors" });
    }
  });

  // E-commerce routes
  // Customer routes
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customers" });
    }
  });

  app.get("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const customer = await storage.getCustomerById(req.params.id);
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer" });
    }
  });

  app.get("/api/customers/email/:email", async (req, res) => {
    try {
      const customer = await storage.getCustomerByEmail(req.params.email);
      res.json(customer || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedCustomer = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(validatedCustomer);
      
      // Newsletter subscription will be handled during checkout when we have author context
      
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.put("/api/customers/:id", requireAuth, async (req, res) => {
    try {
      const validatedCustomer = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(req.params.id, validatedCustomer);
      if (!customer) {
        res.status(404).json({ message: "Customer not found" });
        return;
      }
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  // Order routes
  app.get("/api/orders", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get orders" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    try {
      const order = await storage.getOrderById(req.params.id);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      
      // Include customer data if customerId exists
      let customer = null;
      if (order.customerId) {
        customer = await storage.getCustomerById(order.customerId);
      }
      
      // Include download tokens for digital products
      const downloadTokens = await storage.getDownloadTokensByOrderId(order.id);
      const downloadTokensFormatted = await Promise.all(
        downloadTokens.map(async (token) => {
          const book = await storage.getBookById(token.bookId);
          return {
            bookId: token.bookId,
            bookTitle: book?.title || 'Unknown',
            token: token.token,
            expiresAt: token.expiresAt,
            usedAt: token.usedAt
          };
        })
      );
      
      res.json({ ...order, customer, downloadTokens: downloadTokensFormatted });
    } catch (error) {
      res.status(500).json({ message: "Failed to get order" });
    }
  });

  app.get("/api/orders/customer/:customerId", requireAuth, async (req, res) => {
    try {
      const orders = await storage.getOrdersByCustomerId(req.params.customerId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to get customer orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const validatedOrder = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(validatedOrder);
      
      // Generate secure download tokens for digital products
      const downloadTokens = [];
      if (order.status === 'completed') {
        const orderItems = JSON.parse(order.items);
        
        for (const item of orderItems) {
          if (item.productType === 'book') {
            const book = await storage.getBookById(item.productId);
            
            if (book && book.isDigitalProduct && book.digitalFiles) {
              // Generate secure token with crypto.randomUUID()
              const { randomUUID } = await import('crypto');
              const token = randomUUID();
              
              // Calculate expiration date (7 days from now)
              const expiresAt = new Date();
              expiresAt.setDate(expiresAt.getDate() + 7);
              
              // Create download token
              const downloadToken = await storage.createDownloadToken({
                orderId: order.id,
                bookId: book.id,
                token: token,
                expiresAt: expiresAt.toISOString(),
                usedAt: null
              });
              
              downloadTokens.push({
                bookId: book.id,
                bookTitle: book.title,
                token: downloadToken.token,
                expiresAt: downloadToken.expiresAt
              });
            }
          }
        }
      }
      
      res.status(201).json({ ...order, downloadTokens });
    } catch (error) {
      res.status(400).json({ message: "Invalid order data" });
    }
  });

  app.put("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      if (!status) {
        res.status(400).json({ message: "Status is required" });
        return;
      }
      const order = await storage.updateOrderStatus(req.params.id, status);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Secure digital file download endpoint with token validation
  app.get("/api/download/:token", async (req, res) => {
    try {
      const { token } = req.params;

      // Get download token
      const downloadToken = await storage.getDownloadToken(token);
      
      if (!downloadToken) {
        res.status(404).json({ message: "Invalid download token" });
        return;
      }

      // Verify token hasn't been used
      if (downloadToken.usedAt) {
        res.status(401).json({ message: "This download link has already been used" });
        return;
      }

      // Verify token hasn't expired
      const now = new Date();
      const expirationDate = new Date(downloadToken.expiresAt);
      if (now > expirationDate) {
        res.status(403).json({ message: "This download link has expired" });
        return;
      }

      // Verify order is completed
      const order = await storage.getOrderById(downloadToken.orderId);
      if (!order) {
        res.status(404).json({ message: "Order not found" });
        return;
      }

      if (order.status !== 'completed') {
        res.status(403).json({ message: "Order is not completed yet" });
        return;
      }

      // Get book details
      const book = await storage.getBookById(downloadToken.bookId);
      if (!book || !book.digitalFiles || !book.isDigitalProduct) {
        res.status(404).json({ message: "Digital file not available" });
        return;
      }

      // Parse digital files JSON and get first available format
      let downloadUrl: string | null = null;
      try {
        const digitalFiles = JSON.parse(book.digitalFiles);
        // Get first available format (epub, pdf, mobi, or azw3)
        downloadUrl = digitalFiles.epub || digitalFiles.pdf || digitalFiles.mobi || digitalFiles.azw3;
      } catch (parseError) {
        console.error('Failed to parse digitalFiles:', parseError);
      }

      if (!downloadUrl) {
        res.status(404).json({ message: "No download URL available" });
        return;
      }

      // Mark token as used BEFORE redirect
      await storage.markTokenAsUsed(token);

      // Log download for analytics
      try {
        await storage.incrementDailyMetric(
          new Date().toISOString().split('T')[0],
          'book',
          downloadToken.bookId,
          'bookDownloads',
          1
        );
        console.log(`[DOWNLOAD] Token: ${token}, Order: ${downloadToken.orderId}, Book: ${downloadToken.bookId}, Time: ${new Date().toISOString()}`);
      } catch (analyticsError) {
        console.error('Failed to log download:', analyticsError);
      }

      // Redirect to the digital file URL
      res.redirect(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // Merchandise Product routes
  app.get("/api/merchandise", async (req, res) => {
    try {
      const products = await storage.getPublishedMerchandiseProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get merchandise products" });
    }
  });

  app.get("/api/merchandise/all", requireAuth, async (req, res) => {
    try {
      const products = await storage.getMerchandiseProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to get merchandise products" });
    }
  });

  app.get("/api/merchandise/:id", async (req, res) => {
    try {
      const product = await storage.getMerchandiseProductById(req.params.id);
      if (!product) {
        res.status(404).json({ message: "Merchandise product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to get merchandise product" });
    }
  });

  app.post("/api/merchandise", requireAuth, async (req, res) => {
    try {
      const validatedProduct = insertMerchandiseProductSchema.parse(req.body);
      const product = await storage.createMerchandiseProduct(validatedProduct);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid merchandise product data" });
    }
  });

  app.put("/api/merchandise/:id", requireAuth, async (req, res) => {
    try {
      const validatedProduct = insertMerchandiseProductSchema.partial().parse(req.body);
      const product = await storage.updateMerchandiseProduct(req.params.id, validatedProduct);
      if (!product) {
        res.status(404).json({ message: "Merchandise product not found" });
        return;
      }
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid merchandise product data" });
    }
  });

  app.delete("/api/merchandise/:id", requireAuth, async (req, res) => {
    try {
      const success = await storage.deleteMerchandiseProduct(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Merchandise product not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete merchandise product" });
    }
  });

  // Cart Item routes
  app.get("/api/cart/:sessionId", async (req, res) => {
    try {
      const items = await storage.getCartItems(req.params.sessionId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to get cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const validatedItem = insertCartItemSchema.parse(req.body);
      const item = await storage.addCartItem(validatedItem);
      res.status(201).json(item);
    } catch (error) {
      res.status(400).json({ message: "Invalid cart item data" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      if (typeof quantity !== 'number' || quantity < 1) {
        res.status(400).json({ message: "Valid quantity is required" });
        return;
      }
      const item = await storage.updateCartItem(req.params.id, quantity);
      if (!item) {
        res.status(404).json({ message: "Cart item not found" });
        return;
      }
      res.json(item);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const success = await storage.deleteCartItem(req.params.id);
      if (!success) {
        res.status(404).json({ message: "Cart item not found" });
        return;
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cart item" });
    }
  });

  app.delete("/api/cart/session/:sessionId", async (req, res) => {
    try {
      await storage.clearCart(req.params.sessionId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Translation routes
  // Author translations
  app.get("/api/authors/:id/translations", async (req, res) => {
    try {
      const author = await storage.getAuthorById(req.params.id);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      
      const translations = await storage.getAuthorTranslations(req.params.id);
      
      // Always include Spanish (es-ES) as base with original content
      const spanishBase = {
        id: `${req.params.id}-es-ES-base`,
        authorId: req.params.id,
        locale: "es-ES",
        name: author.name,
        biography: [author.bioParagraph1, author.bioParagraph2, author.bioParagraph3]
          .filter(Boolean)
          .join('\n\n'),
        seoTitle: author.seoTitle,
        seoDescription: author.seoDescription
      };
      
      // Check if es-ES translation exists, if not add the base
      const hasSpanishTranslation = translations.some(t => t.locale === 'es-ES');
      const allTranslations = hasSpanishTranslation 
        ? translations 
        : [spanishBase, ...translations];
      
      res.json(allTranslations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get author translations" });
    }
  });

  app.post("/api/authors/:id/translations", requireAuth, async (req, res) => {
    try {
      const validatedTranslation = insertAuthorTranslationSchema.parse(req.body);
      const translation = await storage.upsertAuthorTranslation(validatedTranslation);
      res.json(translation);
    } catch (error) {
      res.status(400).json({ message: "Invalid translation data" });
    }
  });

  // Book translations
  app.get("/api/books/:id/translations", async (req, res) => {
    try {
      const book = await storage.getBookById(req.params.id);
      if (!book) {
        res.status(404).json({ message: "Book not found" });
        return;
      }
      
      const translations = await storage.getBookTranslations(req.params.id);
      
      // Always include Spanish (es-ES) as base with original content
      const spanishBase = {
        id: `${req.params.id}-es-ES-base`,
        bookId: req.params.id,
        locale: "es-ES",
        title: book.title,
        description: book.description,
        seoTitle: book.seoTitle,
        seoDescription: book.seoDescription,
        conceptMapText: null,
        familyTreeText: null,
        pressNotesText: null
      };
      
      // Check if es-ES translation exists, if not add the base
      const hasSpanishTranslation = translations.some(t => t.locale === 'es-ES');
      const allTranslations = hasSpanishTranslation 
        ? translations 
        : [spanishBase, ...translations];
      
      res.json(allTranslations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get book translations" });
    }
  });

  app.post("/api/books/:id/translations", requireAuth, async (req, res) => {
    try {
      const validatedTranslation = insertBookTranslationSchema.parse(req.body);
      const translation = await storage.upsertBookTranslation(validatedTranslation);
      res.json(translation);
    } catch (error) {
      res.status(400).json({ message: "Invalid translation data" });
    }
  });

  // Series translations
  app.get("/api/series/:id/translations", async (req, res) => {
    try {
      const series = await storage.getBookSeriesById(req.params.id);
      if (!series) {
        res.status(404).json({ message: "Series not found" });
        return;
      }
      
      const translations = await storage.getSeriesTranslations(req.params.id);
      
      // Always include Spanish (es-ES) as base with original content
      const spanishBase = {
        id: `${req.params.id}-es-ES-base`,
        seriesId: req.params.id,
        locale: "es-ES",
        name: series.title,
        description: series.description,
        seoTitle: null,
        seoDescription: null
      };
      
      // Check if es-ES translation exists, if not add the base
      const hasSpanishTranslation = translations.some(t => t.locale === 'es-ES');
      const allTranslations = hasSpanishTranslation 
        ? translations 
        : [spanishBase, ...translations];
      
      res.json(allTranslations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get series translations" });
    }
  });

  app.post("/api/series/:id/translations", requireAuth, async (req, res) => {
    try {
      const validatedTranslation = insertSeriesTranslationSchema.parse(req.body);
      const translation = await storage.upsertSeriesTranslation(validatedTranslation);
      res.json(translation);
    } catch (error) {
      res.status(400).json({ message: "Invalid translation data" });
    }
  });

  // Testimonial translations
  app.get("/api/testimonials/:id/translations", async (req, res) => {
    try {
      const testimonial = await storage.getTestimonialById(req.params.id);
      if (!testimonial) {
        res.status(404).json({ message: "Testimonial not found" });
        return;
      }
      
      const translations = await storage.getTestimonialTranslations(req.params.id);
      
      // Always include Spanish (es-ES) as base with original content
      const spanishBase = {
        id: `${req.params.id}-es-ES-base`,
        testimonialId: req.params.id,
        locale: "es-ES",
        text: testimonial.content,
        authorName: testimonial.authorName,
        authorCredentials: testimonial.authorType
      };
      
      // Check if es-ES translation exists, if not add the base
      const hasSpanishTranslation = translations.some(t => t.locale === 'es-ES');
      const allTranslations = hasSpanishTranslation 
        ? translations 
        : [spanishBase, ...translations];
      
      res.json(allTranslations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get testimonial translations" });
    }
  });

  app.post("/api/testimonials/:id/translations", requireAuth, async (req, res) => {
    try {
      const validatedTranslation = insertTestimonialTranslationSchema.parse(req.body);
      const translation = await storage.upsertTestimonialTranslation(validatedTranslation);
      res.json(translation);
    } catch (error) {
      res.status(400).json({ message: "Invalid translation data" });
    }
  });

  // Blog post translations
  app.get("/api/blog-posts/:id/translations", async (req, res) => {
    try {
      const blogPost = await storage.getBlogPostById(req.params.id);
      if (!blogPost) {
        res.status(404).json({ message: "Blog post not found" });
        return;
      }
      
      const translations = await storage.getBlogPostTranslations(req.params.id);
      
      // Always include Spanish (es-ES) as base with original content
      const spanishBase = {
        id: `${req.params.id}-es-ES-base`,
        blogPostId: req.params.id,
        locale: "es-ES",
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        content: blogPost.content,
        seoTitle: null,
        seoDescription: null
      };
      
      // Check if es-ES translation exists, if not add the base
      const hasSpanishTranslation = translations.some(t => t.locale === 'es-ES');
      const allTranslations = hasSpanishTranslation 
        ? translations 
        : [spanishBase, ...translations];
      
      res.json(allTranslations);
    } catch (error) {
      res.status(500).json({ message: "Failed to get blog post translations" });
    }
  });

  app.post("/api/blog-posts/:id/translations", requireAuth, async (req, res) => {
    try {
      const validatedTranslation = insertBlogPostTranslationSchema.parse(req.body);
      const translation = await storage.upsertBlogPostTranslation(validatedTranslation);
      res.json(translation);
    } catch (error) {
      res.status(400).json({ message: "Invalid translation data" });
    }
  });

  // PayPal routes - Referenced from blueprint:javascript_paypal
  app.get("/paypal/setup", async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", async (req, res) => {
    await capturePaypalOrder(req, res);
  });

  // SEO Routes: Sitemaps and Robots.txt
  const LOCALES = ['es-ES', 'en-US', 'ca-ES', 'fr-FR', 'it-IT', 'de-DE', 'pt-PT'];
  const BASE_URL = process.env.REPL_SLUG 
    ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
    : 'http://localhost:5000';

  // Sitemap Index - Points to all locale-specific sitemaps
  app.get("/sitemap.xml", async (req, res) => {
    try {
      const sitemaps = LOCALES.map(locale => {
        const localeCode = locale.toLowerCase();
        return `  <sitemap>
    <loc>${BASE_URL}/sitemap-${localeCode}.xml</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`;
      }).join('\n');

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps}
</sitemapindex>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      res.status(500).send('Error generating sitemap index');
    }
  });

  // Locale-specific sitemap
  app.get("/sitemap-:locale.xml", async (req, res) => {
    try {
      const localeParam = req.params.locale.toLowerCase();
      const locale = LOCALES.find(l => l.toLowerCase() === localeParam);
      
      if (!locale) {
        return res.status(404).send('Locale not found');
      }

      // Get all content
      const [authors, books, series, blogPosts] = await Promise.all([
        storage.getAuthors(),
        storage.getBooks(),
        storage.getBookSeries(),
        storage.getBlogPosts()
      ]);

      const activeAuthors = authors.filter(a => a.isActive);
      const publishedBooks = books.filter(b => b.isPublished);
      const activeSeries = series.filter(s => s.isActive !== false);
      const publishedPosts = blogPosts.filter(p => p.isPublished);

      // Helper to generate alternate links
      const generateAlternates = (path: string) => {
        return LOCALES.map(l => {
          const hreflang = l.toLowerCase();
          return `    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${BASE_URL}/${l}${path}" />`;
        }).join('\n');
      };

      // Generate URL entries
      const urls: string[] = [];

      // Homepage
      urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
${generateAlternates('/')}
  </url>`);

      // Authors list
      urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/autores</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${generateAlternates('/autores')}
  </url>`);

      // Individual authors
      activeAuthors.forEach(author => {
        urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/autor/${author.slug}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${generateAlternates(`/autor/${author.slug}`)}
  </url>`);
      });

      // Books
      publishedBooks.forEach(book => {
        urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/libro/${book.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${generateAlternates(`/libro/${book.id}`)}
  </url>`);
      });

      // Series
      activeSeries.forEach(s => {
        urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/serie/${s.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
${generateAlternates(`/serie/${s.id}`)}
  </url>`);
      });

      // Blog
      urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
${generateAlternates('/blog')}
  </url>`);

      // Blog posts
      publishedPosts.forEach(post => {
        const lastmod = post.updatedAt || post.createdAt || new Date().toISOString();
        urls.push(`  <url>
    <loc>${BASE_URL}/${locale}/blog/${post.id}</loc>
    <lastmod>${new Date(lastmod).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
${generateAlternates(`/blog/${post.id}`)}
  </url>`);
      });

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(xml);
    } catch (error) {
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  });

  // Robots.txt
  app.get("/robots.txt", async (req, res) => {
    try {
      const sitemapRefs = LOCALES.map(locale => {
        const localeCode = locale.toLowerCase();
        return `Sitemap: ${BASE_URL}/sitemap-${localeCode}.xml`;
      }).join('\n');

      const robotsTxt = `# Robots.txt for Multi-language SEO
User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml
${sitemapRefs}`;

      res.header('Content-Type', 'text/plain');
      res.send(robotsTxt);
    } catch (error) {
      res.status(500).send('Error generating robots.txt');
    }
  });

  // Currency API endpoints
  app.get("/api/currency/rates", async (req, res) => {
    try {
      // Fetch current exchange rates from Frankfurter API
      const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      
      // Ensure EUR is in the rates
      const rates = {
        EUR: 1.0,
        ...data.rates,
      };
      
      res.json({
        base: 'EUR',
        date: data.date,
        rates,
      });
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      // Return fallback rates
      res.json({
        base: 'EUR',
        date: new Date().toISOString().split('T')[0],
        rates: {
          EUR: 1.0,
          USD: 1.10,
          GBP: 0.85,
          JPY: 165.0,
          CNY: 7.85,
          KRW: 1450.0,
          BRL: 5.50,
          MXN: 18.50,
          ARS: 350.0,
          CAD: 1.48,
          AUD: 1.65,
          CHF: 0.95,
        },
      });
    }
  });

  app.get("/api/currency/convert", async (req, res) => {
    try {
      const { from = 'EUR', to = 'USD', amount = 100 } = req.query;
      
      // Validate inputs
      const amountNum = parseInt(amount as string, 10);
      if (isNaN(amountNum) || amountNum < 0) {
        res.status(400).json({ message: 'Invalid amount' });
        return;
      }
      
      // Fetch current rates
      const response = await fetch('https://api.frankfurter.app/latest?from=' + from);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      const rate = data.rates[to as string] || 1.0;
      
      // Convert using integer math (amount is in cents)
      const rateAsInt = Math.round(rate * 10000);
      const convertedAmount = Math.round((amountNum * rateAsInt) / 10000);
      
      res.json({
        from,
        to,
        amount: amountNum,
        convertedAmount,
        rate,
      });
    } catch (error) {
      console.error('Error converting currency:', error);
      res.status(500).json({ message: 'Failed to convert currency' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
