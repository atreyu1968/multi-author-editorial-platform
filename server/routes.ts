import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { 
  insertAuthorSchema,
  insertBookSeriesSchema,
  insertBookSchema,
  insertTestimonialSchema,
  insertNewsletterSchema,
  insertSiteSettingsSchema,
  insertBlogPostSchema,
  insertUiTextSchema,
  insertEditorialSettingsSchema
} from "@shared/schema";
// Referenced from blueprint:javascript_object_storage
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";

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
      const book = await storage.createBook(validatedBook);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ message: "Invalid book data" });
    }
  });

  app.put("/api/books/:id", requireAuth, async (req, res) => {
    try {
      const validatedBook = insertBookSchema.partial().parse(req.body);
      const book = await storage.updateBook(req.params.id, validatedBook);
      if (!book) {
        res.status(404).json({ message: "Book not found" });
        return;
      }
      res.json(book);
    } catch (error) {
      res.status(400).json({ message: "Invalid book data" });
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
        const settings = await storage.getSiteSettings();
        const settingsMap = settings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);

        // Check if email is configured
        const emailApiKey = process.env.EMAIL_API_KEY;
        const emailProvider = settingsMap.emailProvider || 'Resend';
        const freeBookFile = settingsMap.freeBookFile;
        const freeBookTitle = settingsMap.freeBookTitle || 'Libro de Regalo';
        const freeBookDescription = settingsMap.freeBookDescription || 'Disfruta de este libro exclusivo como regalo de bienvenida.';
        const emailFromName = settingsMap.emailFromName || 'Newsletter';
        const emailFromAddress = settingsMap.emailFromAddress || 'noreply@example.com';

        if (emailApiKey && freeBookFile) {
          const { emailService } = await import('./email-service.js');
          emailService.configure(emailProvider, emailApiKey);
          
          // Construct full download URL
          const baseUrl = process.env.REPL_SLUG 
            ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`
            : 'http://localhost:5000';
          const downloadUrl = freeBookFile.startsWith('http') 
            ? freeBookFile 
            : `${baseUrl}${freeBookFile}`;

          await emailService.sendWelcomeEmail(
            validatedSubscriber.email,
            validatedSubscriber.name,
            freeBookTitle,
            freeBookDescription,
            downloadUrl,
            { name: emailFromName, email: emailFromAddress }
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

  // Editorial Settings routes
  app.get("/api/editorial-settings", async (req, res) => {
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
      const settings = await storage.updateEditorialSettings(validatedSettings);
      if (!settings) {
        res.status(404).json({ message: "Editorial settings not found" });
        return;
      }
      res.json(settings);
    } catch (error) {
      res.status(400).json({ message: "Invalid editorial settings data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
