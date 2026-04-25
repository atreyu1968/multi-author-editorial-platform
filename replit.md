# Multi-Author Editorial Management Platform

## Overview

This project is a full-stack web application designed to manage up to 30 authors within a single editorial platform. It provides each author with customizable landing pages including sections for their books, biography, testimonials, newsletter, and blog. A centralized admin panel allows editorial staff to manage all content, which is stored in a single PostgreSQL database with data scoped by `authorId`. The platform aims to be a robust, modern single-page application solution for literary agencies or publishers to efficiently manage multiple author presences, offering features like dynamic theming, content personalization, promotional material management, multi-author series support, a proprietary analytics system, and a secure digital product download system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS with shadcn/ui component library, custom CSS variables for theming with light/dark mode.
- **Forms**: React Hook Form with Zod for validation.
- **Theming**: Dynamic theming per author (colors, logo, favicon) via CSS variables, and customizable background images/colors.
- **UI Text Customization**: All visible UI text can be edited via the admin panel, supporting multi-locale.
- **Universal Search**: Integrated search bar with debounced search, keyboard navigation, and comprehensive results page.

### Backend
- **Technology Stack**: Express.js with TypeScript, RESTful API.
- **Database Interaction**: Drizzle ORM for PostgreSQL, Zod schemas for shared validation.
- **Middleware**: For request logging and error handling.
- **Search API**: Case-insensitive search endpoints for authors, series, and books.

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM and Neon Database.
- **Schema Management**: Drizzle Kit for migrations, shared schema definitions for type safety.
- **File Storage**: Replit Object Storage for author assets, free books, and private digital product files.

### Multi-Author System
- **Author Management**: Centralized CRUD in admin panel, `authorId` foreign keys for all content.
- **Data Scoping**: All API routes and admin components scope data to the selected author using `authorId`.
- **Public Pages**: Customizable author landing pages at `/autor/:slug` with SEO support.
- **Multi-Author Series/Collections**: Series can contain books from multiple authors.
- **Promotional Content**: System for adding promotional materials to books/series.
- **Per-Author Custom Domains**: Each author can be assigned a unique custom domain handled by client-side redirection and server-side middleware.
- **Per-Author Mailing List & Email Sender**: Each author has an independent mailing list toggle, sender details, provider, and API key.
- **Per-Author Free Book**: Each author can offer a dedicated gift book with a secure, tokenized download system.

### RGPD / GDPR Compliance
- **Explicit signup consent**: Newsletter and free-book claim forms require explicit user consent, storing `consentedAt` and `consentText`.
- **One-click unsubscribe**: All author-branded emails include a visible unsubscribe link that sets `unsubscribedAt` on the subscriber record.

### Admin Dashboard
- **Comprehensive Management**: Interfaces for authors, books, series, biographies, testimonials, blog posts, newsletter subscribers, site settings, UI text, visual appearance, and editorial homepage content.
- **SEO Configuration**: Configurable SEO fields for authors and books.
- **Proprietary Analytics**: Integrated dashboard for pageviews, visitors, sessions, downloads, and newsletter signups.
- **Digital Product Management**: Upload and direct sale configuration for digital files.

### Proprietary Analytics System
- **Infrastructure**: Tracks user sessions, events (pageviews, clicks, downloads, signups, purchases), and aggregates daily metrics.
- **Client-side Tracking**: Auto-tracks pageviews on route changes, detects entities from URLs, persists sessionId.

### Email Broadcast (Campaign) System
- **Schema**: `broadcasts` table stores per-author campaigns (`type` = `"new_release"` or `"promotion"`, `bookId`, `subject`, `previewText`, `customMessage`, `promoPriceCents`/`promoCurrency`/`promoStartsAt`/`promoEndsAt`, optional `listIds[]` for list filtering, scheduling fields `scheduledFor` (UTC ISO) + `timezone` (IANA) + `rateLimitPerMinute`, **per-recipient local-9am scheduling** fields `scheduleMode` (`fixed` | `per_recipient_local_9am`) + `localDeliveryDate` (`YYYY-MM-DD`) + `completedTimezones text[]`, lifecycle `status` = `draft|scheduled|sending|sent|failed` with `recipientCount`/`successCount`/`failureCount`/`errorMessage`/`sentAt`). Index `idx_broadcasts_status_scheduled` powers the worker's "due rows" query (migration `004_broadcast_scheduling.sql`, extended by `005_per_recipient_local_delivery.sql`). Subscribers' optional IANA `timezone` lives on `newsletters.timezone`, captured client-side at signup via `Intl.DateTimeFormat().resolvedOptions().timeZone`.
- **Renderer**: `EmailService.renderBroadcast()` reuses `renderAuthorBrandedEmail()` so campaign emails inherit the gold gradient hero, Playfair headlines, circular avatar and cream background of the author landing page. Body is composed of: optional admin intro paragraph, featured book card (cover + title + description), promo block (was/now price + validity dates) when `type="promotion"`, primary CTA (Amazon link if available, falls back to author page), and a "Si te perdiste los anteriores" grid for series books — built from `getBooksBySeriesId(book.seriesId)` filtered by `orderInSeries < book.orderInSeries`. URLs are absolutized through `PUBLIC_BASE_URL`.
- **Routes** (all admin-only): `GET /api/authors/:id/broadcasts` (history), `POST /api/authors/:id/broadcasts/preview` (returns `{subject, html, recipientCount}` without persisting), `POST /api/authors/:id/broadcasts` (creates the campaign; **send now** → status flips to `sending`, runs the dispatch loop synchronously, returns final `sent`/`failed` counts; **scheduled** → row is persisted with status `scheduled` and the request returns immediately). All sends are routed through the shared `dispatchBroadcast(broadcastId, baseUrl)` helper in `server/routes.ts`, which resolves recipients via `getActiveSubscribersForBroadcast(authorId, listIds?)`, configures the per-author email provider via `emailService.configureForAuthor('newsletter', ...)`, and loops sending best-effort per recipient with `List-Unsubscribe`/`tags` headers via `sendBroadcastEmail`. A single bounce never aborts the run. When `rateLimitPerMinute` is set the loop sleeps `60_000 / rate` ms between sends so big lists don't trip provider spam-burst heuristics.
- **Background worker**: `startScheduledBroadcastTick()` is invoked once at the end of `registerRoutes` and registers a `setInterval` (60s) plus a one-shot 5s warm-up tick. Each tick calls `storage.getDueScheduledBroadcasts(now)` and branches by `scheduleMode`. **Fixed mode**: reserves each row by flipping status to `sending` (atomic update prevents double-dispatch on overlapping ticks) and runs `dispatchBroadcast` for the whole list. **Per-recipient local 9 a.m. mode**: `dispatchPerRecipientLocal9amTick()` keeps the row in `sending` across many ticks (initial `scheduledFor` is set ~14h before UTC midnight of `localDeliveryDate` so the earliest timezones get picked up); each tick groups active subscribers by their `timezone` (defaulting to the broadcast's fallback `timezone`, then `UTC`), checks each group's local hour against the `localDeliveryDate` via `getLocalDateAndHour(tz, now)`, and dispatches only the groups whose local clock currently reads 09:xx on the target date AND whose IANA zone is not already in `completedTimezones`. Per-tick locks (`perRecipientLocks` Set keyed by `${broadcastId}:${tz}`) prevent overlapping ticks from double-sending the same zone. After 40 hours past the earliest dispatch instant the row is finalized to `sent`. Failures are recorded on the row's `errorMessage`.
- **Recipient resolution**: `DatabaseStorage.getActiveSubscribersForBroadcast(authorId, listIds?)` returns subscribers with `unsubscribedAt IS NULL`; when `listIds` is non-empty it intersects with `newsletterListSubscriptions` membership (otherwise it returns the whole active list).
- **Admin UI**: `client/src/components/admin/broadcast-management.tsx` is registered as the `broadcasts` section of the admin sidebar (Mail icon, label "Campañas") under the selected-author scope. Provides type toggle, book selector (sourced from `/api/books?authorId=...`), subject + preview-text + optional custom message, conditional promo fields (price in euros + currency + dates), a **scheduling block** with three radios — "Enviar ahora" / "Programar envío (UTC)" / "9 a.m. local de cada suscriptor": fixed mode exposes Fecha + Hora + Zona horaria selector (seeded from a curated IANA list plus the admin's detected zone — wall-clock + tz is converted to a UTC ISO timestamp client-side via `Intl.DateTimeFormat` so DST is handled correctly); per-recipient mode exposes only a date picker + a fallback-timezone helper line ("Quienes no tengan zona detectada usarán <admin tz>") and the wire payload uses `scheduleMode: "per_recipient_local_9am"` + `localDeliveryDate`. Also: an **optional rate-limit input** (emails per minute), optional list multi-select (gracefully tolerates the lists endpoint not existing yet), live HTML preview rendered into a sandboxed iframe, recipient count badge, confirm-before-send dialog whose title and CTA flip between "Enviar" / "Programar" / "Programar entrega local", and a history tab listing past campaigns with status / timestamp / success-fail counts. Fixed scheduled rows show "Programada para …" with the timezone and rate; per-recipient rows show "Entrega local: 9:00 hora local de cada suscriptor el <date>"; in-progress per-recipient rows additionally show "zonas listas: N" so the admin can watch the rollout. The history list uses an explicit `queryFn` to hit the nested REST URL (the default fetcher would otherwise collapse hierarchical query keys). Public newsletter signup (`client/src/components/newsletter.tsx`) and the free-book claim form attach `Intl.DateTimeFormat().resolvedOptions().timeZone` to the POST body so subscriber rows store an IANA zone for per-recipient delivery.

### Digital Product Downloads System
- **Secure Downloads**: Token-based, one-time use, and expiring download system for digital files stored privately.
- **Order Integration**: Tokens generated automatically upon order completion.

### Internationalization System (7 Languages)
- **Supported Languages**: Spanish, English, Catalan, French, Italian, German, Portuguese.
- **UI Text Translation**: Complete translation of UI texts via admin panel.
- **Market-Based Default Locale**: Configurable default language and auto-detection.
- **Dynamic Content Translation System**: Dedicated translation tables for authors, books, series, testimonials, and blog posts with locale-scoped fallback.
- **SEO Multi-language Infrastructure**: Locale-prefixed URLs, `hreflang` tags, localized OG metadata, and dynamic sitemaps.
- **Regional Currency System**: Automatic currency selection, real-time exchange rates, and locale-aware price formatting.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: TypeScript ORM.

### UI and Styling
- **Radix UI**: Headless component primitives.
- **shadcn/ui**: Component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **Google Fonts**: Inter, Playfair Display.

### Email and Newsletter
- **Custom Email Service**: Supports 7 email providers (Resend, SendGrid, Mailchimp Transactional, Brevo, Postmark, Mailgun, Gmail).
- **Author-branded mailing-list emails**: All newsletter and free-book emails use a custom rendering service to mirror author landing page aesthetics.

### File Storage
- **Replit Object Storage**: For all file uploads and digital product storage.

### Marketing & Promotional Tools
- **qrcode library**: For automatic QR code generation.

### Development Tools
- **Vite**: Build tool and dev server.
- **TypeScript**: Language.

### Form Handling
- **React Hook Form**.
- **Zod**: Schema validation.

### State Management
- **TanStack Query**: Server state.
- **React Context**: Local state.