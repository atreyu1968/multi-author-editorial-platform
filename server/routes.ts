import type { Express } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import express from "express";
import path from "path";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import type { Book, Author, InsertNewsletter } from "@shared/schema";
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
  insertBlogPostTranslationSchema,
  insertNewsletterListSchema,
  insertEmailTemplateSchema,
  insertBroadcastSchema
} from "@shared/schema";
import { z } from "zod";
// Referenced from blueprint:javascript_object_storage
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
// Referenced from blueprint:javascript_paypal
import { createPaypalOrder, capturePaypalOrder, loadPaypalDefault } from "./paypal";
// Local storage for non-Replit environments
import { upload, handleFileUpload, getStorageType } from "./storageService";
import { getPublicBaseUrl } from "./base-url";

// Authentication middleware to protect admin routes
function requireAuth(req: any, res: any, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Strip sensitive sender credentials from public author payloads.
// Authenticated admins still get the full record so they can see the saved key.
function sanitizeAuthorForResponse<T extends { emailApiKey?: string | null }>(
  author: T,
  req: { isAuthenticated?: () => boolean }
): T | Omit<T, 'emailApiKey'> {
  if (req.isAuthenticated && req.isAuthenticated()) return author;
  if (!author || typeof author !== 'object') return author;
  const { emailApiKey: _ignored, ...rest } = author;
  return rest;
}

function sanitizeAuthorsForResponse<T extends { emailApiKey?: string | null }>(
  authors: T[],
  req: { isAuthenticated?: () => boolean }
): (T | Omit<T, 'emailApiKey'>)[] {
  if (req.isAuthenticated && req.isAuthenticated()) return authors;
  return authors.map(a => sanitizeAuthorForResponse(a, req));
}

// Server-side canonical RGPD consent text. Stored verbatim on every new
// subscriber so we have a record of what they explicitly agreed to.
// IMPORTANT: keep this string in sync with the disclosure shown in the
// public newsletter form (`client/src/components/newsletter.tsx`).
const GDPR_CONSENT_TEXT =
  "Acepto recibir el libro gratuito (cuando aplica) y los correos comerciales del autor o editorial (novedades, ofertas y contenido). Puedo darme de baja en un solo clic desde cualquier email. Mis datos se tratan conforme al RGPD.";

// Lightweight HTML escape used by the unsubscribe confirmation page.
function escapeHtmlServer(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

// ----- Broadcast dispatch helper ------------------------------------------
// Shared by the inline "send now" POST handler and the background cron
// tick. Reads the persisted broadcast row, resolves recipients + previous
// books in the series, configures the per-author email provider, and sends
// best-effort per recipient (a single bounce never aborts the run). Honors
// `rateLimitPerMinute` by sleeping between sends so big lists don't trip
// provider spam-burst heuristics.
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// Returns the local calendar date (YYYY-MM-DD) and clock hour (0-23) of `now`
// expressed in the IANA `tz`. Used by the per-recipient scheduler to decide
// whether a given timezone group is currently in their 9 a.m. window.
// Returns `null` when the zone string is invalid so callers can skip safely.
function getLocalDateAndHour(tz: string, now: Date): { date: string; hour: number } | null {
  try {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
    const map = Object.fromEntries(
      fmt.formatToParts(now).filter(p => p.type !== 'literal').map(p => [p.type, p.value]),
    );
    if (!map.year || !map.month || !map.day || map.hour === undefined) return null;
    return { date: `${map.year}-${map.month}-${map.day}`, hour: parseInt(map.hour, 10) };
  } catch {
    return null;
  }
}

// Returns a UTC ISO timestamp early enough to guarantee the cron tick will
// pick a per-recipient broadcast up before the easternmost zone hits 9 a.m.
// on `localDate`. The earliest possible 9-a.m.-local instant on a given
// date is in UTC+14 (Pacific/Kiritimati): localDate at 09:00 in UTC+14 =
// (localDate - 1) at 19:00 UTC. We back off another few hours for safety.
export function earliestDispatchInstantForLocalDate(localDate: string): string {
  const [y, m, d] = localDate.split('-').map(Number);
  // localDate at 00:00 UTC minus 14h = previous day at 10:00 UTC. Comfortably
  // before any zone could reach 9 a.m. local time on the chosen date.
  return new Date(Date.UTC(y, m - 1, d) - 14 * 3600 * 1000).toISOString();
}

export async function dispatchBroadcast(broadcastId: string, baseUrl: string) {
  const broadcast = await storage.getBroadcastById(broadcastId);
  if (!broadcast) throw new Error(`Broadcast ${broadcastId} not found`);

  const author = await storage.getAuthorById(broadcast.authorId);
  if (!author) {
    return await storage.updateBroadcast(broadcastId, {
      status: 'failed',
      errorMessage: 'Author not found',
    });
  }
  if (!broadcast.bookId) {
    return await storage.updateBroadcast(broadcastId, {
      status: 'failed',
      errorMessage: 'bookId is required',
    });
  }
  const book = await storage.getBookById(broadcast.bookId);
  if (!book || book.authorId !== broadcast.authorId) {
    return await storage.updateBroadcast(broadcastId, {
      status: 'failed',
      errorMessage: 'Book not found for this author',
    });
  }

  const recipients = await storage.getActiveSubscribersForBroadcast(
    broadcast.authorId,
    broadcast.listIds || [],
  );
  let previousBooks: Book[] = [];
  if (book.seriesId) {
    const all = await storage.getBooksBySeriesId(book.seriesId);
    const myOrder = book.orderInSeries ?? Number.MAX_SAFE_INTEGER;
    previousBooks = all
      .filter(b => b.id !== book.id && (b.orderInSeries ?? 0) < myOrder)
      .sort((a, b) => (a.orderInSeries ?? 0) - (b.orderInSeries ?? 0));
  }

  await storage.updateBroadcast(broadcastId, {
    status: 'sending',
    recipientCount: recipients.length,
  });

  const editorialSettings = await storage.getEditorialSettings();
  const { emailService } = await import('./email-service.js');
  const configured = emailService.configureForAuthor('newsletter', author, editorialSettings);
  if (!configured) {
    return await storage.updateBroadcast(broadcastId, {
      status: 'failed',
      errorMessage: 'Email provider not configured for this author',
    });
  }

  const authorPageUrl = `${baseUrl}/autor/${author.slug}`;
  const from = emailService.getDefaultFrom();
  // Throttle: convert "emails per minute" to "ms per email". A throttle of
  // 0/null/undefined means no pacing — fire as fast as the provider allows.
  const rate = broadcast.rateLimitPerMinute ?? 0;
  const intervalMs = rate > 0 ? Math.ceil(60_000 / rate) : 0;

  let success = 0;
  let failure = 0;
  const promo = broadcast.type === 'promotion'
    && broadcast.promoPriceCents !== null
    && broadcast.promoPriceCents !== undefined
    && broadcast.promoCurrency
      ? {
          priceCents: broadcast.promoPriceCents,
          currency: broadcast.promoCurrency,
          startsAt: broadcast.promoStartsAt,
          endsAt: broadcast.promoEndsAt,
        }
      : undefined;

  for (let i = 0; i < recipients.length; i++) {
    const subscriber = recipients[i];
    const sentAtThisOne = Date.now();
    try {
      // RGPD: every campaign carries an in-body "darme de baja" link
      // and the RFC 8058 List-Unsubscribe / List-Unsubscribe-Post
      // headers, both pointing at the same one-click endpoint.
      const unsubscribeUrl = subscriber.preferencesToken
        ? `${baseUrl}/api/unsubscribe/${subscriber.preferencesToken}`
        : undefined;
      await emailService.sendBroadcastEmail({
        to: subscriber.email,
        subject: broadcast.subject,
        from,
        listUnsubscribeUrl: unsubscribeUrl,
        tags: { broadcast: broadcast.id, type: broadcast.type },
        rendererOpts: {
          type: broadcast.type as 'new_release' | 'promotion',
          author,
          from,
          book,
          previousBooks,
          customMessage: broadcast.customMessage,
          promo,
          unsubscribeUrl,
          baseUrl,
          authorPageUrl,
        },
      });
      success++;
    } catch (err) {
      console.error(`Broadcast ${broadcastId} failed for ${subscriber.email}:`, err);
      failure++;
    }
    // Pace the loop so we don't exceed the per-minute quota. Skip the wait
    // after the final send so we don't add latency for the last recipient.
    if (intervalMs > 0 && i < recipients.length - 1) {
      const elapsed = Date.now() - sentAtThisOne;
      const wait = intervalMs - elapsed;
      if (wait > 0) await sleep(wait);
    }
  }

  return await storage.updateBroadcast(broadcastId, {
    status: failure === 0 ? 'sent' : (success === 0 ? 'failed' : 'sent'),
    successCount: success,
    failureCount: failure,
    sentAt: new Date().toISOString(),
    errorMessage: failure > 0 && success === 0 ? 'All recipients failed' : null,
  });
}

// Per-recipient local-9-a.m. dispatch helper. A campaign in this mode stays
// in status="scheduled" across many ticks: each tick sends to the timezone
// groups whose local clock is currently in the 9 a.m. window, then writes the
// completed zones back to the row. Once every grouped zone has been served
// (or the 40-hour delivery window closes), the row is finalized to "sent".
//
// Concurrency: in-process `perRecipientLocks` prevents a slow tick from
// overlapping with the next one for the same broadcast id. We also re-fetch
// the row inside the helper so we always work from the latest persisted
// state (success counts + completedTimezones) instead of a stale snapshot.
const perRecipientLocks = new Set<string>();
const PER_RECIPIENT_WINDOW_MS = 40 * 60 * 60 * 1000; // 40h: covers UTC+14 → UTC-12

export async function dispatchPerRecipientLocal9amTick(
  broadcastId: string,
  baseUrl: string,
  now: Date = new Date(),
) {
  const broadcast = await storage.getBroadcastById(broadcastId);
  if (!broadcast) return;
  if (broadcast.scheduleMode !== 'per_recipient_local_9am') return;
  if (broadcast.status !== 'scheduled' && broadcast.status !== 'sending') return;

  const author = await storage.getAuthorById(broadcast.authorId);
  if (!author) {
    await storage.updateBroadcast(broadcastId, { status: 'failed', errorMessage: 'Author not found' });
    return;
  }
  if (!broadcast.bookId) {
    await storage.updateBroadcast(broadcastId, { status: 'failed', errorMessage: 'bookId is required' });
    return;
  }
  const book = await storage.getBookById(broadcast.bookId);
  if (!book || book.authorId !== broadcast.authorId) {
    await storage.updateBroadcast(broadcastId, { status: 'failed', errorMessage: 'Book not found for this author' });
    return;
  }

  const recipients = await storage.getActiveSubscribersForBroadcast(
    broadcast.authorId,
    broadcast.listIds || [],
  );

  // Group recipients by their effective IANA zone. Subscribers without a
  // stored timezone fall back to the broadcast's `timezone` field (the
  // admin's detected zone), then UTC as last resort.
  const fallbackTz = broadcast.timezone || 'UTC';
  const tzGroups = new Map<string, typeof recipients>();
  for (const sub of recipients) {
    const tz = (sub.timezone && sub.timezone.trim()) || fallbackTz;
    const list = tzGroups.get(tz) ?? [];
    list.push(sub);
    tzGroups.set(tz, list);
  }

  // Compute remaining zones (everything not yet processed in a previous tick).
  const completed = new Set<string>(broadcast.completedTimezones ?? []);
  const allZones = Array.from(tzGroups.keys());
  const remaining = allZones.filter(tz => !completed.has(tz));

  // Edge case: nobody to send to (no subscribers, or all already done).
  // Finalize immediately so the row leaves the queue.
  if (allZones.length === 0 || remaining.length === 0) {
    await storage.updateBroadcast(broadcastId, {
      status: 'sent',
      recipientCount: recipients.length,
      sentAt: new Date().toISOString(),
    });
    return;
  }

  // First time we touch the row: stamp the recipientCount + flip to "sending"
  // (we keep status="sending" while the multi-tick rollout is in progress).
  if (broadcast.status === 'scheduled') {
    await storage.updateBroadcast(broadcastId, {
      status: 'sending',
      recipientCount: recipients.length,
    });
  }

  // Find which of the remaining zones is currently in their 9-a.m. local
  // hour AND on/after the chosen local delivery date. Anything still
  // pending past the 40h window is force-completed below.
  const targetDate = broadcast.localDeliveryDate || '';
  const dueZones: string[] = [];
  for (const tz of remaining) {
    const local = getLocalDateAndHour(tz, now);
    if (!local) {
      // Invalid IANA string – skip the zone entirely so we don't stall the row.
      completed.add(tz);
      continue;
    }
    if (local.hour === 9 && (!targetDate || local.date >= targetDate)) {
      dueZones.push(tz);
    }
  }

  if (dueZones.length > 0) {
    // Configure the per-author email provider once per tick.
    const editorialSettings = await storage.getEditorialSettings();
    const { emailService } = await import('./email-service.js');
    const configured = emailService.configureForAuthor('newsletter', author, editorialSettings);
    if (!configured) {
      await storage.updateBroadcast(broadcastId, {
        status: 'failed',
        errorMessage: 'Email provider not configured for this author',
      });
      return;
    }

    let previousBooks: Book[] = [];
    if (book.seriesId) {
      const all = await storage.getBooksBySeriesId(book.seriesId);
      const myOrder = book.orderInSeries ?? Number.MAX_SAFE_INTEGER;
      previousBooks = all
        .filter(b => b.id !== book.id && (b.orderInSeries ?? 0) < myOrder)
        .sort((a, b) => (a.orderInSeries ?? 0) - (b.orderInSeries ?? 0));
    }

    const authorPageUrl = `${baseUrl}/autor/${author.slug}`;
    const from = emailService.getDefaultFrom();
    const rate = broadcast.rateLimitPerMinute ?? 0;
    const intervalMs = rate > 0 ? Math.ceil(60_000 / rate) : 0;
    const promo = broadcast.type === 'promotion'
      && broadcast.promoPriceCents !== null
      && broadcast.promoPriceCents !== undefined
      && broadcast.promoCurrency
        ? {
            priceCents: broadcast.promoPriceCents,
            currency: broadcast.promoCurrency,
            startsAt: broadcast.promoStartsAt,
            endsAt: broadcast.promoEndsAt,
          }
        : undefined;

    let success = broadcast.successCount ?? 0;
    let failure = broadcast.failureCount ?? 0;

    for (const tz of dueZones) {
      const group = tzGroups.get(tz) ?? [];
      for (let i = 0; i < group.length; i++) {
        const subscriber = group[i];
        const startedAt = Date.now();
        try {
          const unsubscribeUrl = subscriber.preferencesToken
            ? `${baseUrl}/api/unsubscribe/${subscriber.preferencesToken}`
            : undefined;
          await emailService.sendBroadcastEmail({
            to: subscriber.email,
            subject: broadcast.subject,
            from,
            listUnsubscribeUrl: unsubscribeUrl,
            tags: { broadcast: broadcast.id, type: broadcast.type, tz },
            rendererOpts: {
              type: broadcast.type as 'new_release' | 'promotion',
              author,
              from,
              book,
              previousBooks,
              customMessage: broadcast.customMessage,
              promo,
              unsubscribeUrl,
              baseUrl,
              authorPageUrl,
            },
          });
          success++;
        } catch (err) {
          console.error(`Per-recipient broadcast ${broadcastId} failed for ${subscriber.email}:`, err);
          failure++;
        }
        if (intervalMs > 0 && i < group.length - 1) {
          const elapsed = Date.now() - startedAt;
          const wait = intervalMs - elapsed;
          if (wait > 0) await sleep(wait);
        }
      }
      completed.add(tz);
    }

    await storage.updateBroadcast(broadcastId, {
      successCount: success,
      failureCount: failure,
      completedTimezones: Array.from(completed),
    });
  }

  // Decide whether the rollout is finished. We're done when every zone in
  // the recipient set has been processed, OR the 40h delivery window has
  // closed (anything still pending is treated as a no-op completion).
  const stillPending = allZones.filter(tz => !completed.has(tz));
  const startedAtMs = broadcast.scheduledFor ? new Date(broadcast.scheduledFor).getTime() : Date.now();
  const expired = Number.isFinite(startedAtMs) && now.getTime() - startedAtMs > PER_RECIPIENT_WINDOW_MS;

  if (stillPending.length === 0 || expired) {
    const finalized = await storage.updateBroadcast(broadcastId, {
      status: 'sent',
      sentAt: new Date().toISOString(),
      completedTimezones: Array.from(completed),
    });
    if (expired && stillPending.length > 0) {
      console.warn(
        `Per-recipient broadcast ${broadcastId} hit the 40h window with ` +
        `${stillPending.length} timezone(s) still unsent: ${stillPending.join(', ')}`,
      );
    }
    return finalized;
  }
}

// Background tick: every minute, claim any "scheduled" broadcasts whose
// scheduled_for has passed and dispatch them. For "fixed" mode, each row is
// flipped to "sending" inside `dispatchBroadcast` so a parallel tick won't
// double-send. For "per_recipient_local_9am", the row stays in
// "scheduled"/"sending" across many ticks (rolling out timezone-by-timezone)
// and an in-memory lock prevents overlap.
let scheduledTickStarted = false;
function startScheduledBroadcastTick() {
  if (scheduledTickStarted) return;
  scheduledTickStarted = true;

  const TICK_MS = 60_000; // 1 minute
  const baseUrl = process.env.PUBLIC_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

  const tick = async () => {
    try {
      const due = await storage.getDueScheduledBroadcasts(new Date().toISOString());
      for (const b of due) {
        if (b.scheduleMode === 'per_recipient_local_9am') {
          if (perRecipientLocks.has(b.id)) continue;
          perRecipientLocks.add(b.id);
          (async () => {
            try {
              await dispatchPerRecipientLocal9amTick(b.id, baseUrl);
            } catch (err) {
              console.error(`Per-recipient broadcast ${b.id} tick error:`, err);
              await storage.updateBroadcast(b.id, {
                status: 'failed',
                errorMessage: err instanceof Error ? err.message : String(err),
              }).catch(() => {});
            } finally {
              perRecipientLocks.delete(b.id);
            }
          })();
          continue;
        }
        // Reserve the row immediately so a concurrent tick (or restart
        // mid-tick) doesn't pick the same row up again. Only proceed if
        // the reservation actually changed status from "scheduled".
        const reserved = await storage.updateBroadcast(b.id, { status: 'sending' });
        if (!reserved || reserved.status !== 'sending') continue;
        try {
          await dispatchBroadcast(b.id, baseUrl);
        } catch (err) {
          console.error(`Scheduled broadcast ${b.id} dispatch error:`, err);
          await storage.updateBroadcast(b.id, {
            status: 'failed',
            errorMessage: err instanceof Error ? err.message : String(err),
          });
        }
      }
    } catch (err) {
      console.error('Scheduled broadcast tick error:', err);
    }
  };

  // Fire once shortly after boot so anything overdue from a restart is
  // picked up promptly, then every minute thereafter.
  setTimeout(() => { tick(); }, 5_000);
  setInterval(tick, TICK_MS);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Rate limiters for critical endpoints
  const newsletterLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 signups per hour per IP
    message: { message: "Too many newsletter signup attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const orderLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // 20 orders per 15 minutes per IP
    message: { message: "Too many order attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const paypalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // 30 PayPal calls per 15 minutes per IP
    message: { message: "Too many payment attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

  const downloadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 50, // 50 download attempts per hour per IP
    message: { message: "Too many download attempts, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  });

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
      res.json(sanitizeAuthorsForResponse(authors, req));
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
      
      res.json(sanitizeAuthorsForResponse(authorsWithContent, req));
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
      res.json(sanitizeAuthorForResponse(author, req));
    } catch (error) {
      res.status(500).json({ message: "Failed to get author" });
    }
  });

  // Author lookup by custom domain - MUST be registered before /api/authors/:id
  // so that the literal "by-domain" segment doesn't get matched as an :id.
  app.get("/api/authors/by-domain/:host", async (req, res) => {
    try {
      const host = (req.params.host || "").toLowerCase().replace(/:.*$/, "");
      const author = await storage.getAuthorByDomain(host);
      if (!author || !author.isActive) {
        res.status(404).json({ message: "Not found" });
        return;
      }
      res.json(sanitizeAuthorForResponse(author, req));
    } catch (error) {
      res.status(500).json({ message: "Failed to lookup domain" });
    }
  });

  app.get("/api/authors/:id", async (req, res) => {
    try {
      const author = await storage.getAuthorById(req.params.id);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      res.json(sanitizeAuthorForResponse(author, req));
    } catch (error) {
      res.status(500).json({ message: "Failed to get author" });
    }
  });

  // Nullable/unique-constrained columns (e.g. customDomain, emailFromEmail) must
  // never receive an empty string from the admin form because the DB has
  // UNIQUE(customDomain) and `""` is a real value, not NULL. Normalize blanks
  // to NULL so multiple authors can leave these fields unset without colliding.
  const NULLABLE_AUTHOR_FIELDS = [
    'customDomain',
    'emailFromEmail',
    'emailFromName',
    'emailProvider',
    'emailApiKey',
    'freeBookFile',
    'freeBookCover',
    'freeBookTitle',
    'freeBookDescription',
    'freeBookCtaText',
  ] as const;
  function normalizeAuthorPayload<T extends Record<string, unknown>>(body: T): T {
    const out: Record<string, unknown> = { ...body };
    for (const f of NULLABLE_AUTHOR_FIELDS) {
      if (typeof out[f] === 'string' && (out[f] as string).trim() === '') {
        out[f] = null;
      }
    }
    if (typeof out.customDomain === 'string') {
      out.customDomain = (out.customDomain as string).toLowerCase().trim() || null;
    }
    return out as T;
  }

  app.post("/api/authors", requireAuth, async (req, res) => {
    try {
      const validatedAuthor = insertAuthorSchema.parse(normalizeAuthorPayload(req.body));
      const author = await storage.createAuthor(validatedAuthor);
      res.status(201).json(author);
    } catch (error) {
      res.status(400).json({ message: "Invalid author data" });
    }
  });

  app.put("/api/authors/:id", requireAuth, async (req, res) => {
    try {
      const validatedAuthor = insertAuthorSchema.parse(normalizeAuthorPayload(req.body));
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

  app.post("/api/newsletter", newsletterLimiter, async (req, res) => {
    try {
      // RGPD: explicit consent is required to receive commercial emails. We
      // refuse the subscription if the visitor did not tick the consent box,
      // and stamp `consentedAt` + a server-side snapshot of the disclosure
      // text so we can prove what they accepted at signup.
      if (req.body?.consent !== true) {
        res.status(400).json({ message: "Debes aceptar recibir correos comerciales para suscribirte." });
        return;
      }
      // Capture the visitor's IANA timezone (browser-detected, optional). Used
      // by the per-recipient local-9-a.m. broadcast scheduler so subscribers
      // get the campaign at 9 a.m. their own local time. We accept any string
      // up to 64 chars; invalid IANA values fall back to the broadcast's
      // configured fallback zone at dispatch time.
      const reqTimezone = typeof req.body?.timezone === 'string' && req.body.timezone.trim()
        ? req.body.timezone.trim().slice(0, 64)
        : null;
      const validatedSubscriber = insertNewsletterSchema.parse({
        ...req.body,
        consentedAt: new Date().toISOString(),
        consentText: GDPR_CONSENT_TEXT,
        timezone: reqTimezone,
      });
      // Optional opt-in interest lists from the public signup form. Sanitised
      // below against this author's actual lists to prevent cross-author writes.
      const requestedListIds: string[] = Array.isArray(req.body?.listIds)
        ? req.body.listIds.filter((x: unknown) => typeof x === 'string')
        : [];

      // Resolve author (if scoped) and respect mailingListEnabled flag
      let author: Author | undefined;
      if (validatedSubscriber.authorId) {
        author = await storage.getAuthorById(validatedSubscriber.authorId);
        if (author && author.mailingListEnabled === false) {
          res.status(403).json({ message: "Mailing list disabled for this author" });
          return;
        }
      }

      const subscriber = await storage.createNewsletterSubscriber(validatedSubscriber);

      // Build the one-click unsubscribe URL we'll thread through the
      // welcome email body and the List-Unsubscribe header.
      const baseUrl = getPublicBaseUrl(req);
      const unsubscribeUrl = subscriber.preferencesToken
        ? `${baseUrl}/api/unsubscribe/${subscriber.preferencesToken}`
        : undefined;

      // Apply opt-in list memberships (active lists for this author only).
      if (requestedListIds.length > 0 && validatedSubscriber.authorId) {
        try {
          const authorLists = await storage.getNewsletterLists(validatedSubscriber.authorId, { activeOnly: true });
          const allowed = new Set(authorLists.map(l => l.id));
          const safe = requestedListIds.filter(id => allowed.has(id));
          if (safe.length > 0) {
            await storage.setSubscriberLists(subscriber.id, safe);
          }
        } catch (e) {
          console.error('Failed to set subscriber lists:', e);
        }
      }

      // Try to send welcome email with free book
      try {
        const editorialSettings = await storage.getEditorialSettings();

        // Per-author free book takes priority. We honor the optional
        // `format` field from the public form so the welcome mail links
        // to the file the subscriber actually wants (EPUB/PDF/AZW3/MOBI),
        // and fall back through any other configured format, then the
        // legacy generic file, then the global site-settings default.
        const requestedFormat = typeof req.body?.format === 'string'
          ? req.body.format.toLowerCase()
          : '';
        const formatToColumn = {
          epub: 'freeBookFileEpub',
          pdf:  'freeBookFilePdf',
          azw3: 'freeBookFileAzw3',
          mobi: 'freeBookFileMobi',
        } as const;
        type FmtKey = keyof typeof formatToColumn;
        let freeBookFile: string | undefined;
        let resolvedFormat: string = '';
        if (author && requestedFormat && (formatToColumn as any)[requestedFormat]) {
          const v = (author as any)[formatToColumn[requestedFormat as FmtKey]] as string | null | undefined;
          if (v) { freeBookFile = v; resolvedFormat = requestedFormat; }
        }
        if (!freeBookFile && author) {
          for (const fmt of ['epub', 'pdf', 'azw3', 'mobi'] as const) {
            const v = (author as any)[formatToColumn[fmt]] as string | null | undefined;
            if (v) { freeBookFile = v; resolvedFormat = fmt; break; }
          }
        }
        if (!freeBookFile && author?.freeBookFile) {
          freeBookFile = author.freeBookFile;
        }
        let freeBookTitle: string = author?.freeBookTitle || 'Libro de Regalo';
        let freeBookDescription: string = author?.freeBookDescription || 'Disfruta de este libro exclusivo como regalo de bienvenida.';
        let freeBookCover: string | undefined = author?.freeBookCover || undefined;

        if (!freeBookFile) {
          const siteSettings = await storage.getSiteSettings();
          const settingsMap = siteSettings.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as Record<string, string>);
          freeBookFile = settingsMap.freeBookFile;
          if (settingsMap.freeBookTitle) freeBookTitle = settingsMap.freeBookTitle;
          if (settingsMap.freeBookDescription) freeBookDescription = settingsMap.freeBookDescription;
          if (!freeBookCover && settingsMap.freeBookCover) freeBookCover = settingsMap.freeBookCover;
        }

        if (freeBookFile) {
          const { emailService } = await import('./email-service.js');
          const configured = emailService.configureForAuthor('newsletter', author, editorialSettings);

          if (configured) {
            // SECURITY: never email the raw file URL. Mint a one-time,
            // 7-day expiring token and email the tokenized endpoint —
            // same flow as /api/authors/:id/free-book/claim. Without
            // this, the welcome mail leaked a permanent public link
            // that could be shared/scraped indefinitely.
            const { randomUUID } = await import('crypto');
            const token = randomUUID();
            const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            // authorId on this legacy endpoint is optional; when the
            // signup is editorial-global (no author scope) we still need
            // a valid author reference for the token row. Fall back to
            // the editorial-default author id so the token row is valid;
            // the file URL stored on the token is the source of truth.
            const tokenAuthorId = validatedSubscriber.authorId
              || author?.id
              || (await storage.getAuthors())[0]?.id
              || '';
            if (tokenAuthorId) {
              await storage.createFreeBookToken({
                authorId: tokenAuthorId,
                email: validatedSubscriber.email,
                fileUrl: freeBookFile,
                token,
                expiresAt,
              });
            }
            const downloadUrl = tokenAuthorId
              ? `${baseUrl}/api/free-book/download/${token}`
              // Last-resort fallback: only used when no author exists at
              // all (fresh editorial install with zero authors). In that
              // case we cannot generate a token but the editor likely
              // hasn't published any signup form either.
              : (freeBookFile.startsWith('http') ? freeBookFile : `${baseUrl}${freeBookFile}`);

            const from = emailService.getDefaultFrom();
            await emailService.sendWelcomeEmail(
              validatedSubscriber.email,
              validatedSubscriber.name,
              freeBookTitle,
              freeBookDescription,
              downloadUrl,
              from,
              author,
              unsubscribeUrl,
              freeBookCover,
              resolvedFormat || null,
            );
          }
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

  // POST /api/authors/:id/free-book/claim
  // Subscribes the visitor under the author scope and emails a one-time, expiring
  // tokenized download link. Never returns the file URL directly.
  app.post("/api/authors/:id/free-book/claim", newsletterLimiter, async (req, res) => {
    try {
      const { id: authorId } = req.params;
      // RGPD: visitor must explicitly accept commercial emails before we
      // ship the gift. The disclosure shown on the form (and the snapshot
      // we persist on the subscriber row) make it clear that downloading
      // the book also subscribes them to the author's mailing list.
      if (req.body?.consent !== true) {
        res.status(400).json({ message: "Debes aceptar recibir correos comerciales para descargar el libro." });
        return;
      }
      const claimSchema = z.object({
        email: z.string().email(),
        name: z.string().min(1).max(120),
        locale: z.string().min(2).max(10).optional(),
        listIds: z.array(z.string()).optional(),
        // Browser-detected IANA timezone (optional). Same role as on the
        // /api/newsletter endpoint: enables per-recipient local-9-a.m. delivery.
        timezone: z.string().min(1).max(64).optional(),
      });
      const { email, name, locale, listIds, timezone } = claimSchema.parse(req.body);

      const author = await storage.getAuthorById(authorId);
      if (!author || !author.isActive) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      if (author.mailingListEnabled === false) {
        res.status(403).json({ message: "Mailing list disabled for this author" });
        return;
      }

      // Resolve the file URL: per-author format-specific first (driven by
      // the optional `format` field from the public form), then per-author
      // legacy generic file, then global site-settings fallback. The
      // four format columns let an author offer the same book in EPUB /
      // PDF / AZW3 / MOBI so the subscriber can pick what fits their
      // device. The legacy `freeBookFile` is kept so existing setups
      // don't need to be re-uploaded.
      const requestedFormat = typeof req.body?.format === 'string'
        ? req.body.format.toLowerCase()
        : '';
      const formatToColumn: Record<string, keyof typeof author> = {
        epub: 'freeBookFileEpub',
        pdf:  'freeBookFilePdf',
        azw3: 'freeBookFileAzw3',
        mobi: 'freeBookFileMobi',
      };
      let freeBookFile: string | undefined;
      let resolvedFormat: string = '';
      if (requestedFormat && formatToColumn[requestedFormat]) {
        const v = author[formatToColumn[requestedFormat]] as string | null | undefined;
        if (v) { freeBookFile = v; resolvedFormat = requestedFormat; }
      }
      // No format requested or that format isn't configured — fall back to
      // any per-author format-specific file (in a stable preference order)
      // before reaching for the legacy generic slot.
      if (!freeBookFile) {
        for (const fmt of ['epub', 'pdf', 'azw3', 'mobi'] as const) {
          const v = author[formatToColumn[fmt]] as string | null | undefined;
          if (v) { freeBookFile = v; resolvedFormat = fmt; break; }
        }
      }
      if (!freeBookFile && author.freeBookFile) {
        freeBookFile = author.freeBookFile;
      }
      let freeBookTitle: string = author.freeBookTitle || 'Libro de Regalo';
      let freeBookDescription: string = author.freeBookDescription || 'Disfruta de este libro exclusivo como regalo de bienvenida.';
      let freeBookCover: string | undefined = author.freeBookCover || undefined;
      if (!freeBookFile) {
        const siteSettings = await storage.getSiteSettings();
        const settingsMap = siteSettings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {} as Record<string, string>);
        freeBookFile = settingsMap.freeBookFile;
        if (settingsMap.freeBookTitle) freeBookTitle = settingsMap.freeBookTitle;
        if (settingsMap.freeBookDescription) freeBookDescription = settingsMap.freeBookDescription;
        if (!freeBookCover && settingsMap.freeBookCover) freeBookCover = settingsMap.freeBookCover;
      }
      if (!freeBookFile) {
        res.status(404).json({ message: "No free book configured" });
        return;
      }

      // Subscribe under author scope (idempotent: ignore duplicate errors).
      // We stamp the RGPD consent on the row at creation time. If the row
      // already exists we still update its consent stamp because the user
      // just re-confirmed by ticking the box again.
      const consentedAt = new Date().toISOString();
      const subscriberPayload: InsertNewsletter = insertNewsletterSchema.parse({
        email,
        name,
        authorId,
        locale: locale || 'es-ES',
        consentedAt,
        consentText: GDPR_CONSENT_TEXT,
        timezone: timezone || null,
      });
      let subscriberRow: Awaited<ReturnType<typeof storage.createNewsletterSubscriber>> | undefined;
      try {
        subscriberRow = await storage.createNewsletterSubscriber(subscriberPayload);
      } catch {
        // already subscribed - refresh the consent stamp for the audit trail
        // and keep the row reference so we can still apply list preferences below.
        const existing = await storage.getNewsletterSubscriberByEmail(authorId, email);
        if (existing) {
          subscriberRow = await storage.updateNewsletterSubscriber(existing.id, {
            consentedAt,
            consentText: GDPR_CONSENT_TEXT,
            unsubscribedAt: null,
            // Refresh the timezone if the visitor's browser detected one — keeps
            // the per-recipient scheduler accurate when subscribers move zones.
            ...(timezone ? { timezone } : {}),
          });
        }
      }

      // Apply opt-in list memberships (active lists for this author only).
      if (subscriberRow && Array.isArray(listIds) && listIds.length > 0) {
        try {
          const authorLists = await storage.getNewsletterLists(authorId, { activeOnly: true });
          const allowed = new Set(authorLists.map(l => l.id));
          const safe = listIds.filter(id => allowed.has(id));
          if (safe.length > 0) {
            await storage.setSubscriberLists(subscriberRow.id, safe);
          }
        } catch (e) {
          console.error('Failed to set subscriber lists on free-book claim:', e);
        }
      }

      // Create a one-time, expiring token (7 days)
      const { randomUUID } = await import('crypto');
      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await storage.createFreeBookToken({ authorId, email, fileUrl: freeBookFile, token, expiresAt });

      // Email tokenized URL only - never the raw file URL
      try {
        const editorialSettings = await storage.getEditorialSettings();
        const { emailService } = await import('./email-service.js');
        const configured = emailService.configureForAuthor('newsletter', author, editorialSettings);
        if (configured) {
          const baseUrl = getPublicBaseUrl(req);
          const downloadUrl = `${baseUrl}/api/free-book/download/${token}`;
          const unsubscribeUrl = subscriberRow?.preferencesToken
            ? `${baseUrl}/api/unsubscribe/${subscriberRow.preferencesToken}`
            : undefined;
          const from = emailService.getDefaultFrom();
          await emailService.sendWelcomeEmail(email, name, freeBookTitle, freeBookDescription, downloadUrl, from, author, unsubscribeUrl, freeBookCover, resolvedFormat || null, baseUrl);
        }
      } catch (emailError) {
        console.error('Failed to send free-book email:', emailError);
      }

      res.status(201).json({ success: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid claim data" });
        return;
      }
      console.error('Free book claim error:', error);
      res.status(500).json({ message: "Failed to process claim" });
    }
  });

  // ----- Free-book one-time download -----------------------------------
  //
  // Why a landing page instead of an immediate redirect:
  // Email security gateways (Microsoft SafeLinks, Mimecast, Proofpoint,
  // Barracuda, Gmail/Outlook preview, Slack/Teams unfurl, etc.) follow
  // every URL in incoming mail to scan it for malware BEFORE the user
  // ever sees the message. If the GET handler marks the token as "used"
  // on that first visit, the link is already burned by the time the
  // human clicks it — the user then sees "This download link has
  // already been used" without ever having downloaded anything.
  //
  // Solution: GET renders a small HTML interstitial with a "Descargar
  // libro" button. Clicking the button POSTs back to this same path,
  // which is what actually marks the token used and redirects to the
  // file. Email scanners overwhelmingly do GET (and HEAD), almost
  // never POST, so the token only burns on a real user interaction.
  // The interstitial also gives us a friendlier UX on the error states
  // (already used / expired / invalid) than a raw JSON 4xx response.

  function renderFreeBookPage(opts: {
    token: string;
    status: 'ready' | 'used' | 'expired' | 'invalid' | 'error';
    authorName?: string;
    authorSlug?: string;
  }): string {
    const { token, status, authorName, authorSlug } = opts;
    const safeAuthor = authorName ? escapeHtmlServer(authorName) : 'el autor';
    const heading =
      status === 'ready' ? 'Tu libro está listo'
      : status === 'used' ? 'Este enlace ya se usó'
      : status === 'expired' ? 'Enlace caducado'
      : status === 'invalid' ? 'Enlace no válido'
      : 'No hemos podido preparar tu descarga';
    const authorLink = authorSlug
      ? `<p style="margin-top:24px"><a href="/autor/${escapeHtmlServer(authorSlug)}" style="color:hsl(28, 50%, 40%);text-decoration:none;font-weight:600;">← Volver a la página de ${safeAuthor}</a></p>`
      : '';
    const body =
      status === 'ready'
        ? `<p>Pulsa el botón de abajo para descargar el libro que te ha enviado ${safeAuthor}.</p>
           <form method="POST" action="/api/free-book/download/${escapeHtmlServer(token)}" style="margin-top:24px;">
             <button type="submit" style="background:hsl(28, 50%, 40%);color:#fff;border:none;border-radius:6px;padding:14px 28px;font-size:16px;font-weight:600;cursor:pointer;">Descargar libro</button>
           </form>
           <p style="margin-top:20px;font-size:13px;color:#6b5a47;">El enlace funciona una sola vez. Si lo necesitas otra vez, vuelve a solicitarlo desde la página del autor.</p>`
        : status === 'used'
          ? `<p>Este enlace de descarga ya se ha utilizado anteriormente.</p>
             <p style="color:#6b5a47">Si descargaste el archivo y lo perdiste, o no te llegó el primer correo, puedes solicitar un nuevo enlace desde la página del autor (tendrás que volver a introducir tu email).</p>${authorLink}`
          : status === 'expired'
            ? `<p>El enlace ha caducado por motivos de seguridad.</p>
               <p style="color:#6b5a47">Solicita uno nuevo desde la página del autor.</p>${authorLink}`
            : status === 'invalid'
              ? `<p>No reconocemos este enlace. Es posible que se haya copiado mal o que pertenezca a una versión antigua del correo.</p>${authorLink}`
              : `<p>Hubo un problema al preparar tu descarga. Vuelve a intentarlo en unos minutos o solicita un nuevo enlace desde la página del autor.</p>${authorLink}`;
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><meta name="robots" content="noindex,nofollow"/><title>${heading}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/></head>
      <body style="margin:0;padding:48px 16px;background:#faf6ee;font-family:Helvetica,Arial,sans-serif;color:#2b1d10;line-height:1.6;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(43,29,16,0.08);padding:40px 32px;">
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0 0 16px 0;color:hsl(28, 50%, 40%);">${heading}</h1>
          ${body}
        </div>
      </body></html>`;
  }

  // GET renders the interstitial page. Never marks the token as used.
  app.get("/api/free-book/download/:token", downloadLimiter, async (req, res) => {
    try {
      const { token } = req.params;
      const row = await storage.getFreeBookToken(token);
      if (!row) {
        res.status(404).type('html').send(renderFreeBookPage({ token, status: 'invalid' }));
        return;
      }
      const author = row.authorId ? await storage.getAuthorById(row.authorId) : undefined;
      const ctx = { authorName: author?.name, authorSlug: author?.slug };
      if (row.usedAt) {
        res.status(410).type('html').send(renderFreeBookPage({ token, status: 'used', ...ctx }));
        return;
      }
      if (new Date() > new Date(row.expiresAt)) {
        res.status(410).type('html').send(renderFreeBookPage({ token, status: 'expired', ...ctx }));
        return;
      }
      res.type('html').send(renderFreeBookPage({ token, status: 'ready', ...ctx }));
    } catch (error) {
      console.error('Free book landing page error:', error);
      res.status(500).type('html').send(renderFreeBookPage({ token: req.params.token, status: 'error' }));
    }
  });

  // POST is the actual one-time download trigger. Bots/scanners almost
  // never POST, so this is what protects the token from being burned by
  // automated link inspection.
  app.post("/api/free-book/download/:token", downloadLimiter, async (req, res) => {
    try {
      const { token } = req.params;
      const row = await storage.getFreeBookToken(token);
      if (!row) {
        res.status(404).type('html').send(renderFreeBookPage({ token, status: 'invalid' }));
        return;
      }
      const author = row.authorId ? await storage.getAuthorById(row.authorId) : undefined;
      const ctx = { authorName: author?.name, authorSlug: author?.slug };
      if (row.usedAt) {
        res.status(410).type('html').send(renderFreeBookPage({ token, status: 'used', ...ctx }));
        return;
      }
      if (new Date() > new Date(row.expiresAt)) {
        res.status(410).type('html').send(renderFreeBookPage({ token, status: 'expired', ...ctx }));
        return;
      }
      // Atomic claim: only the request that flips usedAt from null to now()
      // gets to redirect to the file. Two near-simultaneous POSTs (e.g. user
      // double-clicks the button) cannot both win.
      const claimed = await storage.markFreeBookTokenUsed(token);
      if (!claimed) {
        res.status(410).type('html').send(renderFreeBookPage({ token, status: 'used', ...ctx }));
        return;
      }
      // Use a RELATIVE Location for in-app paths (e.g. /uploads/... or
      // /objects/...) so the browser preserves the current protocol and
      // host. Building an absolute URL from req.protocol breaks behind
      // nginx when the proxy terminates TLS but forwards as HTTP — the
      // resulting "http://" Location triggers a mixed-content block in
      // the user's browser and the EPUB never downloads. Off-platform
      // (http/https) URLs are passed through unchanged.
      res.redirect(row.fileUrl);
    } catch (error) {
      console.error('Free book download error:', error);
      res.status(500).type('html').send(renderFreeBookPage({ token: req.params.token, status: 'error' }));
    }
  });

  // ----- RGPD unsubscribe + preferences endpoints --------------------
  // Every transactional or commercial email we ship carries an unsubscribe
  // link to one of these routes. They accept the per-subscriber
  // `preferencesToken` so the action does not require the subscriber to
  // log in.

  // (Note: the canonical GET /api/preferences/:token handler is registered
  // further down — see "Subscriber preference center (public)". A previous
  // lightweight version that lived here was removed because Express picks
  // the first matching route and it shadowed the richer handler.)

  // GET /api/unsubscribe/:token - friendly HTML confirmation page. Pressing
  // the form button POSTs back to this same path. We render server-side
  // HTML (no SPA round-trip) so it works even when the user is offline
  // from our app.
  function renderUnsubscribePage(opts: { token: string; status: 'confirm' | 'done' | 'invalid'; subscriberEmail?: string; authorName?: string }): string {
    const { token, status, subscriberEmail, authorName } = opts;
    const safeEmail = subscriberEmail ? escapeHtmlServer(subscriberEmail) : '';
    const safeAuthor = authorName ? escapeHtmlServer(authorName) : 'la newsletter';
    const heading = status === 'done'
      ? '✓ Te has dado de baja'
      : status === 'invalid'
        ? 'Enlace no válido'
        : '¿Quieres darte de baja?';
    const body = status === 'done'
      ? `<p>Hemos eliminado <strong>${safeEmail}</strong> de la lista de ${safeAuthor}. No volverás a recibir nuestros correos comerciales.</p>
         <p>Si fue un error, vuelve a suscribirte desde la página del autor.</p>`
      : status === 'invalid'
        ? `<p>El enlace de baja ya no es válido o ha caducado. Si sigues recibiendo correos, por favor responde a uno de ellos para que te demos de baja manualmente.</p>`
        : `<p>Vas a darte de baja de los correos comerciales de ${safeAuthor}.</p>
           <p style="color:#6b5a47">Email: <strong>${safeEmail}</strong></p>
           <form method="POST" action="/api/unsubscribe/${escapeHtmlServer(token)}" style="margin-top: 24px;">
             <button type="submit" style="background:hsl(28, 50%, 40%);color:#fff;border:none;border-radius:6px;padding:12px 24px;font-size:16px;font-weight:600;cursor:pointer;">Confirmar baja</button>
           </form>`;
    return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>${heading}</title><link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet"/></head>
      <body style="margin:0;padding:48px 16px;background:#faf6ee;font-family:Helvetica,Arial,sans-serif;color:#2b1d10;line-height:1.6;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;box-shadow:0 4px 24px rgba(43,29,16,0.08);padding:40px 32px;">
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0 0 16px 0;color:hsl(28, 50%, 40%);">${heading}</h1>
          ${body}
        </div>
      </body></html>`;
  }

  app.get("/api/unsubscribe/:token", async (req, res) => {
    try {
      const subscriber = await storage.getNewsletterSubscriberByToken(req.params.token);
      if (!subscriber) {
        res.status(404).type('html').send(renderUnsubscribePage({ token: req.params.token, status: 'invalid' }));
        return;
      }
      const author = subscriber.authorId ? await storage.getAuthorById(subscriber.authorId) : undefined;
      const status = subscriber.unsubscribedAt ? 'done' : 'confirm';
      res.type('html').send(renderUnsubscribePage({
        token: req.params.token,
        status,
        subscriberEmail: subscriber.email,
        authorName: author?.name,
      }));
    } catch (error) {
      console.error('Unsubscribe page failed:', error);
      res.status(500).send('Internal error');
    }
  });

  // POST /api/unsubscribe/:token - performs the actual soft-unsubscribe.
  // Supports both the "Confirmar baja" form button above and the
  // RFC 8058 List-Unsubscribe-Post one-click POST mail clients fire
  // when the user hits the inbox-level "Unsubscribe" button.
  app.post("/api/unsubscribe/:token", async (req, res) => {
    try {
      const updated = await storage.unsubscribeNewsletterByToken(req.params.token);
      if (!updated) {
        // Mail clients want a 2xx for one-click; only return 404 to humans.
        const accept = (req.headers.accept || '').toLowerCase();
        if (accept.includes('text/html')) {
          res.status(404).type('html').send(renderUnsubscribePage({ token: req.params.token, status: 'invalid' }));
        } else {
          res.status(404).json({ message: "Token no válido" });
        }
        return;
      }
      const author = updated.authorId ? await storage.getAuthorById(updated.authorId) : undefined;
      const accept = (req.headers.accept || '').toLowerCase();
      if (accept.includes('text/html')) {
        res.type('html').send(renderUnsubscribePage({
          token: req.params.token,
          status: 'done',
          subscriberEmail: updated.email,
          authorName: author?.name,
        }));
      } else {
        res.json({ success: true });
      }
    } catch (error) {
      console.error('Unsubscribe failed:', error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // ----- Email broadcast (campaign) routes ---------------------------
  // Admin composes a campaign for one of their authors and we render the
  // author-branded email body, then deliver it to every active subscriber
  // (optionally filtered by mailing-list). The send pipeline is best-effort
  // per-recipient: a single bounce does not abort the rest of the run.

  // GET /api/authors/:id/broadcasts - list past campaigns (admin only)
  app.get("/api/authors/:id/broadcasts", requireAuth, async (req, res) => {
    try {
      const broadcasts = await storage.getBroadcasts(req.params.id);
      res.json(broadcasts);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
      res.status(500).json({ message: "Failed to fetch broadcasts" });
    }
  });

  // POST /api/authors/:id/broadcasts/preview - render the HTML for the
  // current draft without sending or persisting anything. Returns
  // `{ subject, html, recipientCount }` so the admin UI can show an
  // accurate "ready to send to N people" hint next to the preview.
  app.post("/api/authors/:id/broadcasts/preview", requireAuth, async (req, res) => {
    try {
      const authorId = req.params.id;
      const author = await storage.getAuthorById(authorId);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      const payload = insertBroadcastSchema.parse({ ...req.body, authorId });

      if (!payload.bookId) {
        res.status(400).json({ message: "bookId is required" });
        return;
      }
      const book = await storage.getBookById(payload.bookId);
      if (!book || book.authorId !== authorId) {
        res.status(404).json({ message: "Book not found for this author" });
        return;
      }

      // Previous-in-series books (only those before this book's order).
      let previousBooks: typeof book[] = [];
      if (book.seriesId) {
        const all = await storage.getBooksBySeriesId(book.seriesId);
        const myOrder = book.orderInSeries ?? Number.MAX_SAFE_INTEGER;
        previousBooks = all
          .filter(b => b.id !== book.id && (b.orderInSeries ?? 0) < myOrder)
          .sort((a, b) => (a.orderInSeries ?? 0) - (b.orderInSeries ?? 0));
      }

      const baseUrl = getPublicBaseUrl(req);
      const authorPageUrl = `${baseUrl}/autor/${author.slug}`;
      const { EmailService } = await import('./email-service.js');
      const html = EmailService.renderBroadcast({
        type: payload.type,
        author,
        from: { name: author.emailFromName || author.name, email: author.emailFromEmail || 'noreply@example.com' },
        book,
        previousBooks,
        customMessage: payload.customMessage,
        promo: payload.type === 'promotion' && payload.promoPriceCents !== null && payload.promoPriceCents !== undefined && payload.promoCurrency
          ? {
              priceCents: payload.promoPriceCents,
              currency: payload.promoCurrency,
              startsAt: payload.promoStartsAt,
              endsAt: payload.promoEndsAt,
            }
          : undefined,
        baseUrl,
        authorPageUrl,
      });

      const recipients = await storage.getActiveSubscribersForBroadcast(authorId, payload.listIds || []);

      res.json({
        subject: payload.subject,
        html,
        recipientCount: recipients.length,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid broadcast data", errors: error.errors });
        return;
      }
      console.error('Broadcast preview error:', error);
      res.status(500).json({ message: "Failed to render preview" });
    }
  });

  // POST /api/authors/:id/broadcasts/test - deliver the rendered campaign
  // to a single chosen inbox so the admin can verify rendering, sender,
  // and tracking before committing to a real send. We reuse the same
  // renderer + per-author email provider configuration as the dispatch
  // path so DKIM/SPF, headers, and tracking-pixel rewrites match exactly
  // what real subscribers will receive. Importantly, NO row is written to
  // the broadcasts table — this is a transient, one-shot send.
  app.post("/api/authors/:id/broadcasts/test", requireAuth, async (req, res) => {
    try {
      const authorId = req.params.id;
      const author = await storage.getAuthorById(authorId);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }

      const { recipientEmail, ...draft } = req.body || {};
      const emailSchema = z.string().trim().email("Dirección de email inválida");
      const recipient = emailSchema.parse(recipientEmail);

      const payload = insertBroadcastSchema.parse({ ...draft, authorId });

      if (!payload.bookId) {
        res.status(400).json({ message: "bookId is required" });
        return;
      }
      const book = await storage.getBookById(payload.bookId);
      if (!book || book.authorId !== authorId) {
        res.status(404).json({ message: "Book not found for this author" });
        return;
      }

      // Resolve previous-in-series books just like the real dispatch does.
      let previousBooks: typeof book[] = [];
      if (book.seriesId) {
        const all = await storage.getBooksBySeriesId(book.seriesId);
        const myOrder = book.orderInSeries ?? Number.MAX_SAFE_INTEGER;
        previousBooks = all
          .filter(b => b.id !== book.id && (b.orderInSeries ?? 0) < myOrder)
          .sort((a, b) => (a.orderInSeries ?? 0) - (b.orderInSeries ?? 0));
      }

      const editorialSettings = await storage.getEditorialSettings();
      const { emailService } = await import('./email-service.js');
      const configured = emailService.configureForAuthor('newsletter', author, editorialSettings);
      if (!configured) {
        res.status(400).json({ message: "Email provider not configured for this author" });
        return;
      }

      const baseUrl = getPublicBaseUrl(req);
      const authorPageUrl = `${baseUrl}/autor/${author.slug}`;
      const from = emailService.getDefaultFrom();
      const promo = payload.type === 'promotion'
        && payload.promoPriceCents !== null
        && payload.promoPriceCents !== undefined
        && payload.promoCurrency
          ? {
              priceCents: payload.promoPriceCents,
              currency: payload.promoCurrency,
              startsAt: payload.promoStartsAt,
              endsAt: payload.promoEndsAt,
            }
          : undefined;

      // The test send has no real subscriber row, so it carries no
      // preference token. We still tag it as a test so any provider
      // dashboards/analytics can filter it out from real campaign metrics.
      await emailService.sendBroadcastEmail({
        to: recipient,
        subject: `[PRUEBA] ${payload.subject}`,
        from,
        tags: { broadcast: 'test', type: payload.type },
        rendererOpts: {
          type: payload.type as 'new_release' | 'promotion',
          author,
          from,
          book,
          previousBooks,
          customMessage: payload.customMessage,
          promo,
          baseUrl,
          authorPageUrl,
        },
      });

      res.json({ success: true, sentTo: recipient });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.errors[0]?.message || "Invalid test send data", errors: error.errors });
        return;
      }
      console.error('Broadcast test send error:', error);
      // Surface the provider error verbatim so the admin can act on it.
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message });
    }
  });

  // POST /api/authors/:id/broadcasts - create a campaign.
  // If `scheduledFor` is omitted/null we send synchronously (legacy "send
  // now" flow) and wait for the per-recipient loop to finish so the admin
  // gets accurate success/failure counts. If `scheduledFor` is provided we
  // persist with status="scheduled" and return immediately; the cron tick
  // installed below will pick the row up at/after that UTC instant.
  app.post("/api/authors/:id/broadcasts", requireAuth, async (req, res) => {
    try {
      const authorId = req.params.id;
      const author = await storage.getAuthorById(authorId);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      const payload = insertBroadcastSchema.parse({ ...req.body, authorId });

      if (!payload.bookId) {
        res.status(400).json({ message: "bookId is required" });
        return;
      }
      const book = await storage.getBookById(payload.bookId);
      if (!book || book.authorId !== authorId) {
        res.status(404).json({ message: "Book not found for this author" });
        return;
      }

      if (payload.type === 'promotion') {
        if (payload.promoPriceCents === null || payload.promoPriceCents === undefined || !payload.promoCurrency) {
          res.status(400).json({ message: "Promotions require promoPriceCents and promoCurrency" });
          return;
        }
      }

      const isPerRecipient = payload.scheduleMode === 'per_recipient_local_9am';
      if (isPerRecipient && !payload.localDeliveryDate) {
        res.status(400).json({ message: "localDeliveryDate is required for per-recipient local-9am scheduling" });
        return;
      }

      // For per-recipient mode the server derives `scheduledFor` from the
      // chosen local date so the cron tick wakes up early enough to dispatch
      // the easternmost timezones at their 9 a.m. The admin-detected
      // `timezone` is still kept as a fallback for subscribers who never
      // shared one of their own.
      const scheduledIso = isPerRecipient
        ? earliestDispatchInstantForLocalDate(payload.localDeliveryDate as string)
        : (payload.scheduledFor ? new Date(payload.scheduledFor).toISOString() : null);
      const isFuture = scheduledIso !== null
        && (isPerRecipient || new Date(scheduledIso).getTime() > Date.now() + 5_000);

      // Persist the row. Scheduled rows wait for the worker; immediate rows
      // start as "draft" and are flipped to "sending" once we begin dispatching.
      const draft = await storage.createBroadcast({
        ...payload,
        scheduledFor: scheduledIso,
        scheduleMode: payload.scheduleMode || 'fixed',
        localDeliveryDate: isPerRecipient ? (payload.localDeliveryDate || null) : null,
      });
      if (isFuture) {
        const scheduled = await storage.updateBroadcast(draft.id, { status: 'scheduled' });
        res.status(201).json(scheduled ?? draft);
        return;
      }

      const baseUrl = getPublicBaseUrl(req);
      const result = await dispatchBroadcast(draft.id, baseUrl);
      res.status(201).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid broadcast data", errors: error.errors });
        return;
      }
      console.error('Broadcast send error:', error);
      res.status(500).json({ message: "Failed to send broadcast" });
    }
  });

  // ----- Newsletter list (interest topic) routes ---------------------
  // Lists are author-scoped. The GET endpoint is public so the signup form
  // and preference center can render the available interest checkboxes;
  // only active lists are returned to unauthenticated callers. The CRUD
  // mutations are admin-only.

  function slugify(input: string): string {
    return input
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60) || 'lista';
  }

  // Admin report: subscribers for an author together with the IDs of the
  // lists each one belongs to. Powers the "Suscriptores" admin view's
  // per-list filter and badge column without N+1 round-trips.
  app.get("/api/authors/:id/subscribers-with-lists", requireAuth, async (req, res) => {
    try {
      const author = await storage.getAuthorById(req.params.id);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      const rows = await storage.getSubscribersWithListsForAuthor(req.params.id);
      res.json(rows);
    } catch (error) {
      console.error('Failed to fetch subscribers with lists:', error);
      res.status(500).json({ message: "Failed to fetch subscribers with lists" });
    }
  });

  app.get("/api/authors/:id/newsletter-lists", async (req, res) => {
    try {
      const author = await storage.getAuthorById(req.params.id);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      const isAdmin = req.isAuthenticated && req.isAuthenticated();
      const lists = await storage.getNewsletterLists(req.params.id, { activeOnly: !isAdmin });
      res.json(lists);
    } catch (error) {
      console.error('Failed to fetch newsletter lists:', error);
      res.status(500).json({ message: "Failed to fetch newsletter lists" });
    }
  });

  app.post("/api/authors/:id/newsletter-lists", requireAuth, async (req, res) => {
    try {
      const author = await storage.getAuthorById(req.params.id);
      if (!author) {
        res.status(404).json({ message: "Author not found" });
        return;
      }
      const body = { ...req.body, authorId: req.params.id };
      if (!body.slug && body.name) body.slug = slugify(body.name);
      const data = insertNewsletterListSchema.parse(body);
      const created = await storage.createNewsletterList(data);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid list data", errors: error.errors });
        return;
      }
      console.error('Failed to create newsletter list:', error);
      res.status(500).json({ message: "Failed to create newsletter list" });
    }
  });

  app.patch("/api/newsletter-lists/:id", requireAuth, async (req, res) => {
    try {
      const existing = await storage.getNewsletterListById(req.params.id);
      if (!existing) {
        res.status(404).json({ message: "List not found" });
        return;
      }
      const patchSchema = insertNewsletterListSchema.partial();
      const patch = patchSchema.parse(req.body);
      if (patch.name && !patch.slug && !existing.slug) patch.slug = slugify(patch.name);
      const updated = await storage.updateNewsletterList(req.params.id, patch);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid list data", errors: error.errors });
        return;
      }
      console.error('Failed to update newsletter list:', error);
      res.status(500).json({ message: "Failed to update newsletter list" });
    }
  });

  app.delete("/api/newsletter-lists/:id", requireAuth, async (req, res) => {
    try {
      const ok = await storage.deleteNewsletterList(req.params.id);
      if (!ok) {
        res.status(404).json({ message: "List not found" });
        return;
      }
      res.json({ message: "List deleted" });
    } catch (error) {
      console.error('Failed to delete newsletter list:', error);
      res.status(500).json({ message: "Failed to delete newsletter list" });
    }
  });

  // ----- Admin subscriber CRUD --------------------------------------
  // The admin panel needs a per-subscriber edit / delete / list-membership
  // surface beyond the simple "list all" GET /api/newsletter. These routes
  // are admin-only and live alongside the public POST /api/newsletter.

  app.get("/api/newsletter/:id/lists", requireAuth, async (req, res) => {
    try {
      const sub = await storage.getNewsletterSubscriberById(req.params.id);
      if (!sub) {
        res.status(404).json({ message: "Subscriber not found" });
        return;
      }
      const subscribedListIds = await storage.getSubscriberListIds(sub.id);
      res.json({ subscribedListIds });
    } catch (error) {
      console.error('Failed to load subscriber list memberships:', error);
      res.status(500).json({ message: "Failed to load list memberships" });
    }
  });

  app.post("/api/newsletter/:id/lists", requireAuth, async (req, res) => {
    try {
      const schema = z.object({ listIds: z.array(z.string()) });
      const { listIds } = schema.parse(req.body);
      const sub = await storage.getNewsletterSubscriberById(req.params.id);
      if (!sub) {
        res.status(404).json({ message: "Subscriber not found" });
        return;
      }
      // Sanity-check the requested list ids belong to the same author so a
      // panel admin can't accidentally cross-link a subscriber to another
      // author's list.
      if (sub.authorId) {
        const allowed = new Set(
          (await storage.getNewsletterLists(sub.authorId)).map((l) => l.id),
        );
        const safe = listIds.filter((id) => allowed.has(id));
        await storage.setSubscriberLists(sub.id, safe);
      } else {
        await storage.setSubscriberLists(sub.id, listIds);
      }
      res.json({ message: "Lists updated" });
    } catch (error) {
      console.error('Failed to update subscriber lists:', error);
      res.status(400).json({ message: "Failed to update lists" });
    }
  });

  app.patch("/api/newsletter/:id", requireAuth, async (req, res) => {
    try {
      // Admin-editable fields only. The subscriber's `preferencesToken`,
      // `consentedAt`/`consentText` and `authorId` are immutable here —
      // changing those would either break unsubscribe links or rewrite the
      // RGPD consent record.
      const patchSchema = z.object({
        name: z.string().min(1).max(120).optional(),
        email: z.string().email().optional(),
        // Truthy → mark unsubscribed (now); falsy → resubscribe (clear).
        unsubscribed: z.boolean().optional(),
        timezone: z.string().min(1).max(64).nullable().optional(),
      });
      const body = patchSchema.parse(req.body);
      const patch: any = {};
      if (body.name !== undefined) patch.name = body.name;
      if (body.email !== undefined) patch.email = body.email;
      if (body.timezone !== undefined) patch.timezone = body.timezone;
      if (body.unsubscribed !== undefined) {
        patch.unsubscribedAt = body.unsubscribed ? new Date().toISOString() : null;
      }
      const updated = await storage.updateNewsletterSubscriber(req.params.id, patch);
      if (!updated) {
        res.status(404).json({ message: "Subscriber not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('Failed to update subscriber:', error);
      res.status(400).json({ message: "Failed to update subscriber" });
    }
  });

  app.delete("/api/newsletter/:id", requireAuth, async (req, res) => {
    try {
      const ok = await storage.deleteNewsletterSubscriber(req.params.id);
      if (!ok) {
        res.status(404).json({ message: "Subscriber not found" });
        return;
      }
      res.json({ message: "Subscriber deleted" });
    } catch (error) {
      console.error('Failed to delete subscriber:', error);
      res.status(500).json({ message: "Failed to delete subscriber" });
    }
  });

  // ----- Admin user CRUD --------------------------------------------
  // Lets the admin panel manage panel users (login accounts). The first
  // user is created automatically by `init-admin.ts`; everything beyond
  // that is exposed here. Passwords are always scrypt-hashed via auth.ts.

  app.get("/api/admin/users", requireAuth, async (_req, res) => {
    try {
      const users = await storage.getUsers();
      // Never ship the password hash to the client — even an admin doesn't
      // need to see another admin's hash.
      res.json(
        users.map((u) => ({ id: u.id, username: u.username, email: u.email ?? null })),
      );
    } catch (error) {
      console.error('Failed to list admin users:', error);
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.post("/api/admin/users", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(60),
        password: z.string().min(6).max(200),
        email: z.string().email().optional(),
      });
      const body = schema.parse(req.body);
      const existing = await storage.getUserByUsername(body.username);
      if (existing) {
        res.status(409).json({ message: "Ese nombre de usuario ya existe" });
        return;
      }
      const { hashPassword } = await import('./auth.js');
      const hashed = await hashPassword(body.password);
      const created = await storage.createUser({
        username: body.username,
        password: hashed,
        email: body.email ?? null,
      } as any);
      res.status(201).json({ id: created.id, username: created.username, email: created.email ?? null });
    } catch (error) {
      console.error('Failed to create admin user:', error);
      res.status(400).json({ message: "Datos inválidos" });
    }
  });

  app.patch("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      const schema = z.object({
        username: z.string().min(3).max(60).optional(),
        password: z.string().min(6).max(200).optional(),
        email: z.string().email().nullable().optional(),
      });
      const body = schema.parse(req.body);
      const patch: any = {};
      if (body.username !== undefined) {
        // Ensure the new username doesn't collide with another row.
        const conflict = await storage.getUserByUsername(body.username);
        if (conflict && conflict.id !== req.params.id) {
          res.status(409).json({ message: "Ese nombre de usuario ya existe" });
          return;
        }
        patch.username = body.username;
      }
      if (body.email !== undefined) patch.email = body.email;
      if (body.password) {
        const { hashPassword } = await import('./auth.js');
        patch.password = await hashPassword(body.password);
      }
      const updated = await storage.updateUser(req.params.id, patch);
      if (!updated) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }
      res.json({ id: updated.id, username: updated.username, email: updated.email ?? null });
    } catch (error) {
      console.error('Failed to update admin user:', error);
      res.status(400).json({ message: "Datos inválidos" });
    }
  });

  app.delete("/api/admin/users/:id", requireAuth, async (req, res) => {
    try {
      // Two safety nets: never let an admin delete their own session, and
      // never let them delete the LAST remaining admin (locks out everyone).
      const meId = (req.user as any)?.id;
      if (meId === req.params.id) {
        res.status(400).json({ message: "No puedes borrar tu propio usuario mientras estás conectado." });
        return;
      }
      const all = await storage.getUsers();
      if (all.length <= 1) {
        res.status(400).json({ message: "No se puede borrar el último usuario administrador." });
        return;
      }
      const ok = await storage.deleteUser(req.params.id);
      if (!ok) {
        res.status(404).json({ message: "Usuario no encontrado" });
        return;
      }
      res.json({ message: "Usuario eliminado" });
    } catch (error) {
      console.error('Failed to delete admin user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // ----- Subscriber preference center (public) -----------------------
  // The token is the random `preferencesToken` minted at subscription time
  // and embedded in the List-Unsubscribe / footer URLs of all outgoing
  // mail. It identifies the subscriber without requiring them to log in.

  app.get("/api/preferences/:token", async (req, res) => {
    try {
      const subscriber = await storage.getNewsletterSubscriberByToken(req.params.token);
      if (!subscriber) {
        res.status(404).json({ message: "Preference link not found or expired" });
        return;
      }
      const author = await storage.getAuthorById(subscriber.authorId);
      const lists = await storage.getNewsletterLists(subscriber.authorId, { activeOnly: true });
      const subscribedListIds = await storage.getSubscriberListIds(subscriber.id);
      res.json({
        subscriber: {
          id: subscriber.id,
          name: subscriber.name,
          email: subscriber.email,
          authorId: subscriber.authorId,
          unsubscribedAt: subscriber.unsubscribedAt,
        },
        author: author ? { id: author.id, name: author.name, slug: author.slug } : null,
        lists,
        subscribedListIds,
      });
    } catch (error) {
      console.error('Failed to load preferences:', error);
      res.status(500).json({ message: "Failed to load preferences" });
    }
  });

  app.post("/api/preferences/:token", async (req, res) => {
    try {
      const subscriber = await storage.getNewsletterSubscriberByToken(req.params.token);
      if (!subscriber) {
        res.status(404).json({ message: "Preference link not found or expired" });
        return;
      }
      const updateSchema = z.object({
        name: z.string().min(1).max(120).optional(),
        listIds: z.array(z.string()).optional(),
        unsubscribe: z.boolean().optional(),
      });
      const body = updateSchema.parse(req.body);

      const patch: Partial<typeof subscriber> = {};
      if (body.name && body.name !== subscriber.name) patch.name = body.name;
      if (body.unsubscribe === true) patch.unsubscribedAt = new Date().toISOString();
      // Re-subscribe: an authenticated preference save with unsubscribe=false
      // clears the soft-unsubscribe flag so future broadcasts include them.
      if (body.unsubscribe === false && subscriber.unsubscribedAt) patch.unsubscribedAt = null;

      if (Object.keys(patch).length > 0) {
        await storage.updateNewsletterSubscriber(subscriber.id, patch);
      }

      if (body.listIds) {
        // Validate each list belongs to this subscriber's author (defense in depth).
        const authorLists = await storage.getNewsletterLists(subscriber.authorId, { activeOnly: false });
        const allowed = new Set(authorLists.map(l => l.id));
        const safe = body.listIds.filter(id => allowed.has(id));
        await storage.setSubscriberLists(subscriber.id, safe);
      }

      const refreshed = await storage.getNewsletterSubscriberByToken(req.params.token);
      const subscribedListIds = refreshed ? await storage.getSubscriberListIds(refreshed.id) : [];
      res.json({
        subscriber: refreshed && {
          id: refreshed.id,
          name: refreshed.name,
          email: refreshed.email,
          authorId: refreshed.authorId,
          unsubscribedAt: refreshed.unsubscribedAt,
        },
        subscribedListIds,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid preferences", errors: error.errors });
        return;
      }
      console.error('Failed to save preferences:', error);
      res.status(500).json({ message: "Failed to save preferences" });
    }
  });

  // RFC 8058 List-Unsubscribe-Post one-click endpoint. Any POST to this URL
  // (with or without a body) immediately unsubscribes the bearer of the token.
  app.post("/api/preferences/:token/unsubscribe", async (req, res) => {
    try {
      const updated = await storage.unsubscribeNewsletterByToken(req.params.token);
      if (!updated) {
        res.status(404).json({ message: "Preference link not found or expired" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      res.status(500).json({ message: "Failed to unsubscribe" });
    }
  });

  // PATCH /api/authors/:id/broadcasts/:broadcastId - edit a campaign that
  // hasn't gone out yet. Only "scheduled" (or already-cancelled) rows are
  // editable; once a broadcast has begun "sending" / "sent" / "failed" the
  // record is historical and must not be mutated. Saving keeps the row in
  // status="scheduled" so the cron tick will pick it up at the new time.
  app.patch("/api/authors/:id/broadcasts/:broadcastId", requireAuth, async (req, res) => {
    try {
      const { id: authorId, broadcastId } = req.params;
      const existing = await storage.getBroadcastById(broadcastId);
      if (!existing || existing.authorId !== authorId) {
        res.status(404).json({ message: "Broadcast not found" });
        return;
      }
      if (existing.status !== "scheduled" && existing.status !== "cancelled") {
        res.status(409).json({ message: "Solo se pueden editar campañas programadas o canceladas." });
        return;
      }

      const payload = insertBroadcastSchema.parse({ ...req.body, authorId });

      if (!payload.bookId) {
        res.status(400).json({ message: "bookId is required" });
        return;
      }
      const book = await storage.getBookById(payload.bookId);
      if (!book || book.authorId !== authorId) {
        res.status(404).json({ message: "Book not found for this author" });
        return;
      }

      if (payload.type === 'promotion') {
        if (payload.promoPriceCents === null || payload.promoPriceCents === undefined || !payload.promoCurrency) {
          res.status(400).json({ message: "Promotions require promoPriceCents and promoCurrency" });
          return;
        }
      }

      const scheduledIso = payload.scheduledFor ? new Date(payload.scheduledFor).toISOString() : null;
      if (!scheduledIso || new Date(scheduledIso).getTime() <= Date.now() + 5_000) {
        res.status(400).json({ message: "scheduledFor must be a future timestamp" });
        return;
      }

      const updated = await storage.updateBroadcast(broadcastId, {
        type: payload.type,
        bookId: payload.bookId,
        subject: payload.subject,
        previewText: payload.previewText ?? null,
        customMessage: payload.customMessage ?? null,
        promoPriceCents: payload.promoPriceCents ?? null,
        promoCurrency: payload.promoCurrency ?? null,
        promoStartsAt: payload.promoStartsAt ?? null,
        promoEndsAt: payload.promoEndsAt ?? null,
        listIds: payload.listIds && payload.listIds.length > 0 ? payload.listIds : null,
        scheduledFor: scheduledIso,
        timezone: payload.timezone ?? null,
        rateLimitPerMinute: payload.rateLimitPerMinute ?? null,
        // Re-arm: editing a previously-cancelled draft re-schedules it.
        status: "scheduled",
        errorMessage: null,
      });
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid broadcast data", errors: error.errors });
        return;
      }
      console.error('Broadcast update error:', error);
      res.status(500).json({ message: "Failed to update broadcast" });
    }
  });

  // Cancel a scheduled campaign so it never sends. We flip status to
  // "cancelled" — the worker tick only claims status="scheduled" rows, so
  // the cancellation is purely a status change. The row stays in history
  // so admins can see what happened. Exposed under both POST .../cancel
  // (legacy / clearer intent) and DELETE on the broadcast itself (REST-y
  // shorthand) since the task description used the latter wording.
  const cancelBroadcastHandler = async (req: any, res: any) => {
    try {
      const { id: authorId, broadcastId } = req.params;
      const existing = await storage.getBroadcastById(broadcastId);
      if (!existing || existing.authorId !== authorId) {
        res.status(404).json({ message: "Broadcast not found" });
        return;
      }
      if (existing.status !== "scheduled") {
        res.status(409).json({ message: "Solo se pueden cancelar campañas programadas." });
        return;
      }
      const updated = await storage.updateBroadcast(broadcastId, { status: "cancelled" });
      res.json(updated);
    } catch (error) {
      console.error('Broadcast cancel error:', error);
      res.status(500).json({ message: "Failed to cancel broadcast" });
    }
  };
  app.post("/api/authors/:id/broadcasts/:broadcastId/cancel", requireAuth, cancelBroadcastHandler);
  app.delete("/api/authors/:id/broadcasts/:broadcastId", requireAuth, cancelBroadcastHandler);

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
  // Enhanced to support both Replit Object Storage and local file storage
  
  const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";
  const storageType = getStorageType();
  console.log(`[Storage] Using ${storageType} storage`);
  
  // Serve static uploads for local storage (non-Replit)
  if (storageType === "local") {
    app.use("/uploads", express.static(path.resolve(UPLOADS_DIR)));
  }
  
  // Endpoint to serve uploaded images (public access for landing pages)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    if (storageType === "local") {
      return res.sendStatus(404);
    }
    
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
    if (storageType === "local") {
      return res.json({ uploadURL: "/api/files/upload", useMultipart: true });
    }
    
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });
  
  // Local file upload endpoint (for non-Replit environments)
  app.post("/api/files/upload", requireAuth, upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        console.error("[Upload] No file in request");
        return res.status(400).json({ error: "No file uploaded" });
      }
      
      console.log(`[Upload] Received file: ${req.file.originalname} (${req.file.size} bytes)`);
      console.log(`[Upload] Saved to: ${req.file.path}`);
      
      const result = await handleFileUpload(req, req.file);
      console.log(`[Upload] URL: ${result.url}`);
      
      res.json({
        objectPath: result.url,
        url: result.url,
        filename: result.filename,
        size: result.size,
        mimetype: result.mimetype,
      });
    } catch (error) {
      console.error("[Upload] Error:", error);
      res.status(500).json({ error: "Failed to upload file" });
    }
  });

  // Endpoint to save uploaded image reference (protected - admin only)
  app.post("/api/images/upload", requireAuth, async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      // For local storage, just return the URL as-is
      if (storageType === "local") {
        return res.status(200).json({
          objectPath: req.body.imageURL,
        });
      }
      
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
  
  // Storage type info endpoint
  app.get("/api/storage-info", requireAuth, (req, res) => {
    res.json({
      type: storageType,
      uploadsDir: storageType === "local" ? UPLOADS_DIR : null,
    });
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
      let settings = await storage.getEditorialSettings();
      
      // Auto-create default settings if none exist
      if (!settings) {
        console.log("[Editorial Settings] Creating default settings...");
        settings = await storage.updateEditorialSettings({
          name: "Editorial",
          heroTitle: "Descubre Historias que Transforman Vidas",
          heroSubtitle: "Una editorial comprometida con nuevas voces literarias.",
        });
        
        if (!settings) {
          res.status(500).json({ message: "Failed to create default editorial settings" });
          return;
        }
      }
      
      // Remove sensitive PayPal credentials from public response
      const { paypalClientId, paypalClientSecret, paypalEnvironment, ...publicSettings } = settings;
      res.json(publicSettings);
    } catch (error) {
      console.error("Editorial settings error:", error);
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

  app.post("/api/orders", orderLimiter, async (req, res) => {
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

  // Valid order status values
  const orderStatusSchema = z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']);

  app.put("/api/orders/:id/status", requireAuth, async (req, res) => {
    try {
      const { status } = req.body;
      
      // Validate status with Zod
      const validationResult = orderStatusSchema.safeParse(status);
      if (!validationResult.success) {
        res.status(400).json({ 
          message: "Invalid status. Must be one of: pending, processing, completed, cancelled, refunded" 
        });
        return;
      }
      
      const order = await storage.updateOrderStatus(req.params.id, validationResult.data);
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
  app.get("/api/download/:token", downloadLimiter, async (req, res) => {
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
  app.get("/paypal/setup", paypalLimiter, async (req, res) => {
    await loadPaypalDefault(req, res);
  });

  app.post("/paypal/order", paypalLimiter, async (req, res) => {
    // Request body should contain: { intent, amount, currency }
    await createPaypalOrder(req, res);
  });

  app.post("/paypal/order/:orderID/capture", paypalLimiter, async (req, res) => {
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

  // Cache for exchange rates (24 hour TTL)
  let cachedRates: { rates: Record<string, number>; timestamp: number } | null = null;
  const RATES_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  // Fallback rates if API fails
  const FALLBACK_RATES: Record<string, number> = {
    EUR: 1.0, USD: 1.10, GBP: 0.85, JPY: 165.0, CNY: 7.85,
    KRW: 1450.0, BRL: 5.50, MXN: 18.50, ARS: 350.0, CAD: 1.48,
    AUD: 1.65, CHF: 0.95, SEK: 11.20, NOK: 11.50, DKK: 7.45,
  };

  async function getServerExchangeRates(): Promise<Record<string, number>> {
    // Check cache first
    if (cachedRates && Date.now() - cachedRates.timestamp < RATES_CACHE_TTL) {
      return cachedRates.rates;
    }

    try {
      const response = await fetch('https://api.frankfurter.app/latest?from=EUR');
      if (!response.ok) throw new Error('API error');
      
      const data = await response.json();
      const rates = { EUR: 1.0, ...data.rates };
      
      // Update cache
      cachedRates = { rates, timestamp: Date.now() };
      return rates;
    } catch (error) {
      console.error('Exchange rates API failed, using fallback:', error);
      return FALLBACK_RATES;
    }
  }

  app.get("/api/currency/convert", async (req, res) => {
    try {
      const { from = 'EUR', to = 'USD', amount = 100 } = req.query;
      
      // Validate inputs
      const amountNum = parseInt(amount as string, 10);
      if (isNaN(amountNum) || amountNum < 0) {
        res.status(400).json({ message: 'Invalid amount' });
        return;
      }

      // Get rates (cached or fresh)
      const rates = await getServerExchangeRates();
      
      // For non-EUR base, we need to convert through EUR
      let rate = 1.0;
      if (from === 'EUR') {
        rate = rates[to as string] || 1.0;
      } else if (to === 'EUR') {
        rate = 1.0 / (rates[from as string] || 1.0);
      } else {
        // Convert from -> EUR -> to
        const fromRate = rates[from as string] || 1.0;
        const toRate = rates[to as string] || 1.0;
        rate = toRate / fromRate;
      }
      
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

  // Kick off the background worker that polls for due scheduled broadcasts
  // and dispatches them. Idempotent — safe to call from re-registrations.
  startScheduledBroadcastTick();

  const httpServer = createServer(app);
  return httpServer;
}
