import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertAuthorSchema,
  insertBookSeriesSchema,
  insertBookSchema,
  insertTestimonialSchema,
  insertNewsletterSchema,
  insertSiteSettingsSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Author routes
  app.get("/api/author", async (req, res) => {
    try {
      const author = await storage.getAuthor();
      res.json(author);
    } catch (error) {
      res.status(500).json({ message: "Failed to get author" });
    }
  });

  app.put("/api/author", async (req, res) => {
    try {
      const validatedAuthor = insertAuthorSchema.parse(req.body);
      const author = await storage.updateAuthor(validatedAuthor);
      res.json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });

  // Book Series routes
  app.get("/api/book-series", async (req, res) => {
    try {
      const series = await storage.getBookSeries();
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

  app.post("/api/book-series", async (req, res) => {
    try {
      const validatedSeries = insertBookSeriesSchema.parse(req.body);
      const series = await storage.createBookSeries(validatedSeries);
      res.status(201).json(series);
    } catch (error) {
      res.status(400).json({ message: "Invalid book series data" });
    }
  });

  app.put("/api/book-series/:id", async (req, res) => {
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

  app.delete("/api/book-series/:id", async (req, res) => {
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

  // Book routes
  app.get("/api/books", async (req, res) => {
    try {
      const books = await storage.getBooks();
      res.json(books);
    } catch (error) {
      res.status(500).json({ message: "Failed to get books" });
    }
  });

  app.get("/api/books/standalone", async (req, res) => {
    try {
      const books = await storage.getStandaloneBooks();
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

  app.post("/api/books", async (req, res) => {
    try {
      const validatedBook = insertBookSchema.parse(req.body);
      const book = await storage.createBook(validatedBook);
      res.status(201).json(book);
    } catch (error) {
      res.status(400).json({ message: "Invalid book data" });
    }
  });

  app.put("/api/books/:id", async (req, res) => {
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

  app.delete("/api/books/:id", async (req, res) => {
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

  // Testimonial routes
  app.get("/api/testimonials", async (req, res) => {
    try {
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to get testimonials" });
    }
  });

  app.get("/api/testimonials/published", async (req, res) => {
    try {
      const testimonials = await storage.getPublishedTestimonials();
      res.json(testimonials);
    } catch (error) {
      res.status(500).json({ message: "Failed to get published testimonials" });
    }
  });

  app.post("/api/testimonials", async (req, res) => {
    try {
      const validatedTestimonial = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(validatedTestimonial);
      res.status(201).json(testimonial);
    } catch (error) {
      res.status(400).json({ message: "Invalid testimonial data" });
    }
  });

  app.put("/api/testimonials/:id", async (req, res) => {
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

  app.delete("/api/testimonials/:id", async (req, res) => {
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
  app.get("/api/newsletter", async (req, res) => {
    try {
      const subscribers = await storage.getNewsletterSubscribers();
      res.json(subscribers);
    } catch (error) {
      res.status(500).json({ message: "Failed to get newsletter subscribers" });
    }
  });

  app.post("/api/newsletter", async (req, res) => {
    try {
      const validatedSubscriber = insertNewsletterSchema.parse(req.body);
      const subscriber = await storage.createNewsletterSubscriber(validatedSubscriber);
      res.status(201).json(subscriber);
    } catch (error) {
      res.status(400).json({ message: "Invalid newsletter data" });
    }
  });

  // Site Settings routes
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getSiteSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get site settings" });
    }
  });

  app.get("/api/settings/:key", async (req, res) => {
    try {
      const setting = await storage.getSiteSettingByKey(req.params.key);
      if (!setting) {
        res.status(404).json({ message: "Setting not found" });
        return;
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to get setting" });
    }
  });

  app.post("/api/settings", async (req, res) => {
    try {
      const validatedSetting = insertSiteSettingsSchema.parse(req.body);
      const setting = await storage.createSiteSetting(validatedSetting);
      res.status(201).json(setting);
    } catch (error) {
      res.status(400).json({ message: "Invalid setting data" });
    }
  });

  app.put("/api/settings/:key", async (req, res) => {
    try {
      const { value } = req.body;
      if (typeof value !== "string") {
        res.status(400).json({ message: "Value must be a string" });
        return;
      }
      const setting = await storage.updateSiteSetting(req.params.key, value);
      if (!setting) {
        res.status(404).json({ message: "Setting not found" });
        return;
      }
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update setting" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
