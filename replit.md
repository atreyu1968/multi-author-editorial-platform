# Multi-Author Editorial Management Platform

## Overview

This project is a full-stack web application designed to manage up to 30 authors within a single editorial platform. It provides each author with customizable landing pages, including sections for their books, biography, testimonials, newsletter, and blog. A centralized admin panel allows editorial staff to manage all content, which is stored in a single PostgreSQL database with data scoped by `authorId`. The platform aims to be a robust, modern single-page application solution for literary agencies or publishers to efficiently manage multiple author presences under one umbrella, offering features like dynamic theming, content personalization, promotional material management, multi-author series support, a proprietary analytics system, and a secure digital product download system.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS with shadcn/ui component library, custom CSS variables for theming with light/dark mode.
- **Forms**: React Hook Form with Zod for validation.
- **Theming**: Dynamic theming per author (colors, logo, favicon) via CSS variables, and customizable background images/colors for various pages.
- **UI Text Customization**: All visible UI text can be edited via the admin panel, supporting multi-locale.
- **Universal Search**: SearchBar component integrated in all navigation (desktop/mobile) with debounced search, keyboard navigation, and comprehensive results page with filters.

### Backend
- **Technology Stack**: Express.js with TypeScript, RESTful API.
- **Database Interaction**: Drizzle ORM for PostgreSQL, Zod schemas for shared validation.
- **Middleware**: For request logging and error handling.
- **Search API**: Case-insensitive search endpoints (GET /api/search, /api/search/authors, /api/search/series, /api/search/books) with 20-result limits and active/published filtering.

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM and Neon Database.
- **Schema Management**: Drizzle Kit for migrations, shared schema definitions for type safety.
- **File Storage**: Replit Object Storage for author logos, favicons, free book files, and private digital product files.

### Multi-Author System
- **Author Management**: Centralized CRUD in admin panel, `authorId` foreign keys for all content.
- **Data Scoping**: All API routes and admin components scope data to the selected author using `authorId`.
- **Public Pages**: Customizable author landing pages at `/autor/:slug` with SEO support.
- **Multi-Author Series/Collections**: Series are global entities that can contain books from multiple authors.
- **Promotional Content**: System for adding optional promotional materials (concept maps, family trees, press notes, media, Spotify playlists, YouTube booktrailers) to books/series.
- **Per-Author Custom Domains**: Each author can be assigned a unique hostname (UNIQUE column `customDomain`). On a non-platform host the SPA's `CustomDomainRedirect` (in `client/src/App.tsx`) calls `GET /api/authors/by-domain/:host` and renders `<AuthorPage slugOverride=...>` inline at the bare root, so the URL stays at `/` (or `/:locale`) without any client redirect. The server middleware `customDomainRouter` (in `server/index.ts`) also resolves the author and sets `x-author-slug` / `x-author-locale` response headers for crawlers and CDN logging. When rendered as a custom-domain root the AuthorPage emits canonical/hreflang URLs as `/` and `/:locale` instead of `/:locale/autor/:slug`. The lookup route is registered before `/api/authors/:id` so the literal `by-domain` segment is not shadowed.
- **Per-Author Mailing List & Email Sender**: Each author has an independent mailing list toggle, sender name/email, provider (Resend/SendGrid/Brevo/etc.) and API key. Email service uses `configureForAuthor()` with global fallback when fields are empty. The `emailApiKey` is treated as a secret: it is stripped from all unauthenticated API responses (only authenticated admins get the full record).
- **Per-Author Free Book**: Each author can ship a dedicated gift book (file, cover, title, description, CTA). The dedicated claim endpoint `POST /api/authors/:id/free-book/claim` subscribes under the author scope and emails a one-time, expiring tokenized URL (`free_book_tokens` table; 7-day expiry) served by `GET /api/free-book/download/:token`. Raw file URLs are never returned to clients. The public Newsletter component shows whenever `mailingListEnabled=true` (the only mailing-list gate); the form's submit endpoint is chosen at runtime: when `freeBookFile` is set it POSTs to the tokenized claim endpoint and the section uses gift-themed copy/cover, otherwise it POSTs to `/api/newsletter` as a plain subscription with neutral copy. A dedicated `free_book_tokens` table is used instead of the existing `download_tokens` table because the latter is keyed to paid order/product references and a foreign-key constraint to `orders`/`merchandise_products`; reusing it would require nullable order/product columns and weaken its invariant that every download token belongs to a real purchase. The free-book table keeps the gift flow isolated from commerce while sharing the same one-time/expiring semantics. The admin write paths normalize empty-string inputs to `NULL` for `customDomain` (UNIQUE) and the per-author email/free-book columns so multiple authors can leave optional fields blank without colliding on the unique constraint.

### Admin Dashboard
- **Comprehensive Management**: Interfaces for authors, books, series, biographies, testimonials, blog posts, newsletter subscribers, site settings, UI text, visual appearance, and editorial homepage content.
- **SEO Configuration**: Configurable SEO fields for authors and books.
- **Proprietary Analytics**: Integrated analytics dashboard providing pageviews, unique visitors, sessions, average duration, newsletter signups, downloads, top books, and top authors.
- **Digital Product Management**: Upload interface for digital files (EPUB, PDF, MOBI, AZW3) with direct sale configuration.

### Proprietary Analytics System
- **Infrastructure**: Tracks user sessions, events (pageviews, clicks, downloads, newsletter signups, purchases), and aggregates daily metrics.
- **Client-side Tracking**: Auto-tracks pageviews on route changes, detects entities from URLs, persists sessionId.
- **Reporting**: Authenticated API endpoints for metrics, top books, and top authors.

### Email Broadcast (Campaign) System
- **Schema**: `broadcasts` table stores per-author campaigns (`type` = `"new_release"` or `"promotion"`, `bookId`, `subject`, `previewText`, `customMessage`, `promoPriceCents`/`promoCurrency`/`promoStartsAt`/`promoEndsAt`, optional `listIds[]` for list filtering, lifecycle `status` = `draft|sending|sent|failed` with `recipientCount`/`successCount`/`failureCount`/`errorMessage`/`sentAt`).
- **Renderer**: `EmailService.renderBroadcast()` reuses `renderAuthorBrandedEmail()` so campaign emails inherit the gold gradient hero, Playfair headlines, circular avatar and cream background of the author landing page. Body is composed of: optional admin intro paragraph, featured book card (cover + title + description), promo block (was/now price + validity dates) when `type="promotion"`, primary CTA (Amazon link if available, falls back to author page), and a "Si te perdiste los anteriores" grid for series books — built from `getBooksBySeriesId(book.seriesId)` filtered by `orderInSeries < book.orderInSeries`. URLs are absolutized through `PUBLIC_BASE_URL`.
- **Routes** (all admin-only): `GET /api/authors/:id/broadcasts` (history), `POST /api/authors/:id/broadcasts/preview` (returns `{subject, html, recipientCount}` without persisting), `POST /api/authors/:id/broadcasts` (persists draft → resolves recipients via `getActiveSubscribersForBroadcast(authorId, listIds?)` → loops sending best-effort per recipient with `List-Unsubscribe`/`tags` headers via `sendBroadcastEmail` → updates `status/successCount/failureCount/sentAt`). Configures the per-author email provider through `emailService.configureForAuthor('newsletter', ...)`. A single bounce never aborts the whole run.
- **Recipient resolution**: `DatabaseStorage.getActiveSubscribersForBroadcast(authorId, listIds?)` returns subscribers with `unsubscribedAt IS NULL`; when `listIds` is non-empty it intersects with `newsletterListSubscriptions` membership (otherwise it returns the whole active list).
- **Admin UI**: `client/src/components/admin/broadcast-management.tsx` is registered as the `broadcasts` section of the admin sidebar (Mail icon, label "Campañas") under the selected-author scope. Provides type toggle, book selector (sourced from `/api/books?authorId=...`), subject + preview-text + optional custom message, conditional promo fields (price in euros + currency + dates), optional list multi-select (gracefully tolerates the lists endpoint not existing yet), live HTML preview rendered into a sandboxed iframe, recipient count badge, confirm-before-send dialog, and a history tab listing past campaigns with status / timestamp / success-fail counts.

### Digital Product Downloads System
- **Secure Downloads**: Token-based, one-time use, and expiring download system for digital files stored privately in Object Storage.
- **Order Integration**: Tokens generated automatically upon order completion for digital products.
- **Admin Management**: Upload digital files, configure direct sales (price, stock).

### Internationalization System (7 Languages)
- **Supported Languages**: Spanish (es-ES), English (en-US), Catalan (ca-ES), French (fr-FR), Italian (it-IT), German (de-DE), Portuguese (pt-PT).
- **UI Text Translation**: Complete translation of UI texts across all 7 languages, managed via admin panel with namespace organization.
- **Market-Based Default Locale**: Admins configure default language and auto-detection based on target market, with priority chain.
- **Dynamic Content Translation System**: Dedicated translation tables for authors, books, series, testimonials, and blog posts with locale-scoped fallback logic.
- **SEO Multi-language Infrastructure**: Locale-prefixed URLs, centralized SEOHead component with hreflang tags, OG metadata localization, dynamic sitemaps per locale, and Robots.txt with localized sitemaps.
- **Regional Currency System**: Automatic currency selection, real-time exchange rate fetching with cache and fallback, precise currency conversion, and locale-aware price formatting.

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
- **Custom Email Service**: Supports 7 email providers - Resend, SendGrid, Mailchimp Transactional, Brevo, Postmark, Mailgun, Gmail.
- **Author-branded mailing-list emails**: All newsletter / free-book emails are rendered through `renderAuthorBrandedEmail()` in `server/email-service.ts`, which mirrors the public `/autor/:slug` look — warm gold `.hero-gradient`, Playfair Display serif headlines, cream `#faf6ee` background, accent-coloured rounded CTA — and shows the author's circular avatar (`author.photo`) at the top of the hero. The author's `backgroundColor` (when set) overrides the wallpaper. Relative photo URLs are absolutized via `process.env.PUBLIC_BASE_URL` so they load in the inbox. The `sendWelcomeEmail()` signature accepts an optional `author` argument; both `POST /api/newsletter` and `POST /api/authors/:id/free-book/claim` pass the resolved author so per-author branding shows up end-to-end.

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