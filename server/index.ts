import express, { type Request, Response, NextFunction } from "express";
import helmet from "helmet";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeAdminUser } from "./init-admin";
import { seedUiTexts } from "../scripts/seed-ui-texts";

const app = express();

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  }
}));

// Increase body size limits for file uploads (default is 100kb)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Hosts that are NOT custom author domains (Replit/dev/local).
const PLATFORM_HOST_SUFFIXES = ['.replit.dev', '.repl.co', '.replit.app', '.repl.run', '.kirk.replit.dev'];
function isPlatformHost(host: string): boolean {
  if (!host) return true;
  const h = host.toLowerCase().split(':')[0];
  if (h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0') return true;
  return PLATFORM_HOST_SUFFIXES.some(s => h.endsWith(s));
}

// Locale segments we allow at the URL root (must match SUPPORTED_LOCALES on the client).
const LOCALE_ROOTS = new Set(['es-ES', 'en-US', 'ca-ES', 'fr-FR', 'it-IT', 'de-DE', 'pt-PT']);

// Server-side host-based routing for custom author domains.
// On a custom (non-platform) host we resolve the matching author and expose
// the slug + locale on the response as `x-author-slug` / `x-author-locale`
// headers (useful for crawlers, CDN routing, and server-side log inspection).
// The SPA fetches `/api/authors/by-domain/:host` on mount and renders the
// AuthorPage inline at the bare root, so the URL stays at "/" or "/:locale"
// without any redirect. Other paths pass through unchanged.
async function customDomainRouter(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.method !== 'GET') return next();
    const host = (req.get('host') || '').toLowerCase();
    if (!host || isPlatformHost(host)) return next();

    // Skip API/asset/HMR paths so they always work on custom domains.
    const p = req.path;
    if (p.startsWith('/api') || p.startsWith('/assets') || p.startsWith('/@') || p.startsWith('/src/') || p.includes('.')) {
      return next();
    }

    // Only annotate bare root or a bare locale root; other paths pass through.
    const trimmed = p.replace(/\/+$/, '');
    const seg = trimmed.split('/').filter(Boolean);
    let locale = '';
    if (seg.length === 0) {
      locale = '';
    } else if (seg.length === 1 && LOCALE_ROOTS.has(seg[0])) {
      locale = seg[0];
    } else {
      return next();
    }

    const cleanHost = host.split(':')[0];
    const { storage } = await import('./storage');
    const author = await storage.getAuthorByDomain(cleanHost);
    if (!author || !author.isActive) return next();

    // Expose the resolved author to downstream handlers and HTTP clients.
    // The SPA itself looks up the author via /api/authors/by-domain/:host on
    // mount; these headers exist so crawlers, CDNs, and ops tooling can see
    // which author this hostname maps to without making an extra API call.
    res.setHeader('x-author-slug', author.slug);
    if (locale) res.setHeader('x-author-locale', locale);
    (req as Request & { customAuthor?: { slug: string; locale: string } })
      .customAuthor = { slug: author.slug, locale };
    return next();
  } catch (err) {
    console.error('customDomainRouter error:', err);
    return next();
  }
}

// Main server initialization function
async function startServer() {
  app.use(customDomainRouter);
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // Setup Vite (dev) or static files (production) BEFORE listening
  // This is just middleware setup, not expensive - ensures routes are properly configured
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // START LISTENING - Health check is now ready to respond
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Run ONLY database initialization tasks asynchronously in background
    // Health checks succeed immediately while these expensive operations happen
    Promise.all([
      initializeAdminUser().catch(err => {
        console.error('Warning: Admin user initialization failed:', err);
        return null;
      }),
      seedUiTexts().catch(err => {
        console.error('Warning: UI texts seed failed:', err);
        return null;
      })
    ]).catch(err => {
      console.error('Warning: Background initialization failed:', err);
      // Server continues running even if initialization fails
    });
  });
}

// Start the server - catch any errors but don't exit
startServer().catch(err => {
  console.error('Fatal error during server startup:', err);
  process.exit(1);
});
