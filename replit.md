# Multi-Author Editorial Management Platform

## Overview

This project is a full-stack web application designed to manage up to 30 authors within a single editorial platform. It provides each author with customizable landing pages, including sections for their books, biography, testimonials, newsletter, and blog. A centralized admin panel allows editorial staff to manage all content, which is stored in a single PostgreSQL database with data scoped by `authorId`. The platform aims to be a robust, modern single-page application solution for literary agencies or publishers to efficiently manage multiple author presences under one umbrella, offering features like dynamic theming, content personalization, promotional material management, and multi-author series support. It also includes a proprietary analytics system and a secure digital product download system.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Universal Search System (October 2025)
- **Search Infrastructure**: Implemented comprehensive search across authors, series, and books with 4 API endpoints (global + per-entity)
- **SearchBar Component**: Debounced universal search (300ms) with keyboard navigation, grouped dropdown results, and multi-language support integrated into all navigation components
- **Search Results Page**: Full-page search with filter tabs (All/Authors/Series/Books), localized routes for all 7 languages (/buscar, /search, /cercar, /rechercher, /cerca, /suchen, /procurar)
- **UI Translations**: Added 98 new UI texts across 7 languages in "search" namespace
- **Features**: Case-insensitive search, 20-result limit, active/published filtering, locale-aware navigation, responsive design for desktop and mobile
- **Architect Review**: Approved - scalable for current use, recommend full-text search indexing for future growth beyond few thousand records

### Navigation System Overhaul (October 2025)
- **Fixed cross-page navigation**: Updated Navigation component to use intelligent basePath logic with Link components, enabling navigation from series/book pages back to author pages with correct anchor scrolling
- **Fixed editorial navigation**: Implemented context-aware EditorialNavigation with route normalization to distinguish home page (scroll buttons) from sub-pages (navigation links)
- **Route normalization**: Added trailing slash handling to correctly identify home routes (/es-ES/ → /es-ES) across all 7 locales
- **Section IDs**: Added missing IDs (#inicio, #standalone) to home page for proper scroll navigation
- **Testing**: Comprehensive e2e tests verify navigation works correctly across all page types and locales
- **Result**: Navigation now works seamlessly from any page (home, author, series, book) in both desktop and mobile views

### Previous Updates
- Completed 3 internationalization enhancements: dynamic content translation system (5 entity types), advanced multi-language SEO (localized URLs, hreflang tags, dynamic sitemaps), and regional currency conversion (8+ currencies with 24h cache)
- Fixed book cover display: changed from square format to proper book aspect ratio (aspect-[2/3]) across all components
- All changes production-ready: 0 LSP errors, clean logs, architect approved

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

### Admin Dashboard
- **Comprehensive Management**: Interfaces for authors, books, series, biographies, testimonials, blog posts, newsletter subscribers, site settings, UI text, visual appearance, and editorial homepage content.
- **SEO Configuration**: Configurable SEO fields for authors and books.
- **Proprietary Analytics**: Integrated analytics dashboard providing pageviews, unique visitors, sessions, average duration, newsletter signups, downloads, top books, and top authors.
- **Digital Product Management**: Upload interface for digital files (EPUB, PDF, MOBI, AZW3) with direct sale configuration.

### Proprietary Analytics System
- **Infrastructure**: Tracks user sessions, events (pageviews, clicks, downloads, newsletter signups, purchases), and aggregates daily metrics.
- **Client-side Tracking**: Auto-tracks pageviews on route changes, detects entities from URLs, persists sessionId.
- **Reporting**: Authenticated API endpoints for metrics, top books, and top authors.

### Digital Product Downloads System
- **Secure Downloads**: Token-based, one-time use, and expiring download system for digital files stored privately in Object Storage.
- **Order Integration**: Tokens generated automatically upon order completion for digital products.
- **Admin Management**: Upload digital files, configure direct sales (price, stock).

### Internationalization System (7 Languages)
- **Supported Languages**: Spanish (es-ES), English (en-US), Catalan (ca-ES), French (fr-FR), Italian (it-IT), German (de-DE), Portuguese (pt-PT).
- **UI Text Translation**: Complete translation of 10,205 UI texts across all 7 languages (including 98 search-related texts), managed via admin panel with namespace organization (public, admin.books, admin.authors, search, etc.).
- **Market-Based Default Locale**: Admins configure default language and auto-detection based on target market, with priority chain (localStorage → browser detection → admin default → fallback).
- **Dynamic Content Translation System**: 
  - Dedicated translation tables for authors, books, series, testimonials, and blog posts.
  - Locale-scoped fallback logic (user preference → default locale → source language).
  - API endpoints (GET/POST) for each entity translation with Zod validation.
  - Helper utility `getTranslatedField()` for seamless content retrieval.
- **SEO Multi-language Infrastructure**:
  - Locale-prefixed URLs (/:locale/libro/:id, /:locale/autor/:slug).
  - Centralized SEOHead component with hreflang tags for all 7 languages.
  - OG metadata localization (og:locale, og:locale:alternate).
  - Dynamic sitemaps per locale (/sitemap-:locale.xml) with proper hreflang alternates.
  - Robots.txt with references to all localized sitemaps.
- **Regional Currency System**:
  - Automatic currency selection based on user's locale (EUR for European locales, USD for en-US).
  - Real-time exchange rate fetching from Frankfurter API with 24-hour cache and fallback rates.
  - Precise currency conversion using integer mathematics (avoiding floating-point errors).
  - Locale-aware price formatting with Intl.NumberFormat (automatic decimal handling for zero-decimal currencies like JPY/KRW).
  - API endpoints for currency rates and conversion (/api/currency/rates, /api/currency/convert).

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
- **Custom Email Service**: Supports Resend, SendGrid, Mailchimp Transactional, Brevo, Postmark, Mailgun.

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