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

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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

// Main server initialization function
async function startServer() {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // START LISTENING IMMEDIATELY - This is critical for health checks
  // All other initialization happens in the background after this
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
    
    // Setup Vite (dev) or static files (production) AFTER server is listening
    const setupPromise = app.get("env") === "development" 
      ? setupVite(app, server)
      : Promise.resolve(serveStatic(app));
    
    // Run all initialization tasks asynchronously in background
    // Health checks will succeed immediately while initialization happens
    Promise.all([
      setupPromise,
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
