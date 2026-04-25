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
- **Functionality**: Per-author campaigns with various types (new release, promotion), customizable content, and recipient filtering.
- **Renderer**: Campaigns reuse author-branded email templates.
- **Processing**: Admin-only routes for history, preview, and sending, with robust error handling and individual recipient processing.
- **Recipient resolution**: Retrieves active subscribers, optionally filtered by lists.
- **Admin UI**: Dedicated section in the admin sidebar for managing and sending broadcasts with live preview.

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