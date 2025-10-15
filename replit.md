# Multi-Author Editorial Management Platform

## Overview

This is a full-stack web application for managing multiple authors (~30) within a single editorial platform. Built as a modern single-page application with a centralized admin panel, the site provides individual customizable landing pages for each author at `/autor/[slug]` URLs. Each author has their own books (standalone and series), biography, testimonials, newsletter system, blog, and completely customizable visual theme (colors, logo, favicon). The platform is managed by editorial staff, not individual authors, with all content centralized in a single PostgreSQL database with proper data scoping via `authorId` foreign keys.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for the user interface
- **Vite** as the build tool and development server
- **Wouter** for client-side routing (lightweight React Router alternative)
- **TanStack Query (React Query)** for server state management and API data fetching
- **Tailwind CSS** with **shadcn/ui** component library for styling
- **React Hook Form** with Zod validation for form handling
- **Custom CSS variables** for theming with light/dark mode support

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with organized route handlers
- **Drizzle ORM** for database operations with PostgreSQL
- **Zod schemas** for data validation shared between client and server
- **In-memory storage interface** with planned database integration
- **Middleware** for request logging and error handling

### Data Storage Solutions
- **PostgreSQL** database configured via Drizzle ORM
- **Neon Database** integration for serverless PostgreSQL hosting
- **Database migrations** managed through Drizzle Kit
- **Shared schema definitions** between frontend and backend for type safety

### Authentication and Authorization
- Currently uses a simple admin panel access pattern
- No complex authentication system implemented yet
- Session management prepared with connect-pg-simple for future implementation

### Multi-Author Architecture
- **Author Management System**:
  - Centralized author CRUD operations in admin panel
  - Authors table with `slug` field for URL routing (auto-generated from name)
  - All content tables (books, series, testimonials, newsletters, blog_posts, site_settings) have `authorId` foreign key
  - Admin context (`AdminAuthorContext`) for selecting current author with localStorage persistence
  - Author dropdown in admin header for easy switching between authors
  - Public author pages at `/autor/:slug` with proper SEO and 404 handling
- **Per-Author Data Scoping**:
  - All API routes support `?authorId=` query parameter for filtering
  - Storage interface methods accept `authorId` parameter
  - Admin components (books, series, blog, testimonials, settings) automatically scope to selected author
  - Proper data isolation ensures authors only see their own content
- **Per-Author Visual Themes**:
  - Each author can have custom colors (primary, secondary, accent, background, text)
  - Custom logo and favicon per author stored in object storage
  - `DynamicTheme` component loads and applies author-specific CSS variables
  - Homepage uses default theme; author pages use custom themes with proper CSS variable reset
- **Component Architecture**:
  - **Modular component structure** with clear separation of concerns
  - **Admin dashboard** with dedicated management interfaces for:
    - Author management (create, edit, delete authors)
    - Books and book series management (scoped to selected author)
    - Author biography editing
    - Testimonial management
    - Blog post management
    - Newsletter subscriber management
    - Site settings configuration (per-author theme customization)
    - **UI Text Personalization** - Complete customization of all visible text
    - **Visual Personalization** - Logo, favicon, and color scheme customization (per author)
  - **Public-facing components** for author portfolio display
  - **Reusable UI components** from shadcn/ui library

### API Design
- RESTful endpoints for all major entities (authors, books, series, testimonials, newsletter)
- CRUD operations with proper HTTP methods
- JSON response format with error handling
- Type-safe API requests using shared TypeScript interfaces

## External Dependencies

### Database Services
- **Neon Database** - Serverless PostgreSQL hosting
- **Drizzle ORM** - TypeScript ORM for database operations
- **connect-pg-simple** - PostgreSQL session store (prepared for future use)

### UI and Styling
- **Radix UI** - Headless component primitives for accessibility
- **shadcn/ui** - Pre-built component library built on Radix UI
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide Icons** - Icon library
- **Google Fonts** - Typography (Inter, Playfair Display)
- **Theme Applied** - Warm brown and ochre literary aesthetic:
  - Light Mode: Aged paper cream backgrounds with golden ochre accents
  - Dark Mode: Deep charcoal brown with warm golden ochre highlights
  - Color palette evokes vintage books, libraries, and classic literature

### Development Tools
- **Vite** - Build tool and development server
- **TypeScript** - Type safety across the entire application
- **ESBuild** - Fast JavaScript bundler for production builds
- **PostCSS** - CSS processing with Autoprefixer

### Form Handling and Validation
- **React Hook Form** - Form state management
- **Zod** - Schema validation library
- **@hookform/resolvers** - Integration between React Hook Form and Zod

### State Management
- **TanStack Query** - Server state management and caching
- **React Context** - Local state management for UI components

### Development Environment
- **Replit** integration with development plugins
- **Runtime error overlay** for development debugging
- **Hot module replacement** through Vite

### Email and Newsletter System
- **Email Service** - Custom email service supporting 6 providers with dynamic configuration instructions:
  - **Resend** (Recomendado) - Modern email API with excellent deliverability
  - **SendGrid** - Enterprise-grade email service by Twilio
  - **Mailchimp Transactional** (Mandrill) - Transactional emails from Mailchimp
  - **Brevo** (formerly Sendinblue) - All-in-one marketing platform
  - **Postmark** - Dedicated transactional email service
  - **Mailgun** - Developer-focused email API (requires APIKEY:DOMAIN format)
- **Welcome Email Automation** - Automatic welcome email with free book delivery upon newsletter subscription
- **File Upload System** - Replit Object Storage integration for hosting free book files (PDF, EPUB)
- **Configuration** - Admin panel with provider-specific setup instructions and email settings management
- **Dynamic Instructions** - Context-aware guidance for obtaining API keys from each provider
- **Note**: Email integration not using Replit connectors - requires EMAIL_API_KEY secret for the selected provider
- **Limitation**: File attachments currently not supported; welcome emails include download links instead

### Marketing and Promotion Tools
- **QR Code Generation** - Automatic QR code generation for book landing pages using the `qrcode` library
- **Landing Page Links** - Direct URLs to book landing pages in format `/libro/:id`
- **QR Code Features**:
  - Automatic generation when editing a book in admin panel
  - Downloadable as PNG files for print materials
  - Copy-to-clipboard functionality for landing page URLs
  - Integration in admin panel under "QR y Enlaces" tab
  - Suggested use cases: end of printed books, promotional materials, social media, author bio

### Promotional Content System
- **Additional Content for Books and Series** - Optional promotional materials to enrich reader experience
- **Content Types**:
  - **Concept Maps** - Visual diagrams of story world, themes, or plot structure
  - **Family Trees** - Character relationship diagrams and genealogies
  - **Press Notes** - Links to reviews, articles, and media coverage
  - **Additional Media** - Illustrations, infographics, maps, and visual materials
  - **Spotify Playlists** - Curated music to accompany reading (embedded players)
  - **YouTube Booktrailers** - Video promotions and teasers (embedded players)
- **Visibility Controls** (New):
  - Each content type has a dedicated visibility toggle in admin panel
  - Boolean flags control whether content appears on public landing pages
  - All visibility flags default to `true` when creating new books/series
  - Switches in admin: `promoShowConceptMap`, `promoShowFamilyTree`, `promoShowYoutubeBooktrailer`, `promoShowSpotifyPlaylist`, `promoShowPressNotes`, `promoShowAdditionalMedia`
- **Admin Management**:
  - Dedicated "Contenido Promocional" tab in book and series management
  - All fields are optional and can be added/removed as needed
  - Support for multiple links (press notes, media) via array fields
  - Individual visibility switches for each promotional content type
  - Real-time preview control: toggle switches to show/hide content on landing pages
- **Public Display**:
  - Conditional "Contenido Adicional" section on landing pages
  - **YouTube & Spotify Embeds**: Full-width responsive iframes with proper aspect ratios
    - Helper functions convert regular URLs to embed formats automatically
    - YouTube: Supports youtube.com and youtu.be URLs
    - Spotify: Supports playlist, track, and album URLs
  - **Other Content**: Visual cards with icons for concept maps, family trees, press notes, and media
  - External links open in new tabs for better UX
  - Content only displays when both URL exists AND visibility flag is enabled

### UI Text Personalization System
- **Complete Text Customization** - System to personalize all visible text in the application without code changes
- **Database Structure**:
  - `ui_texts` table with fields: id, namespace, key, locale, value
  - Unique constraint on (namespace, key, locale) for upsert operations
  - Pre-seeded with 45+ default Spanish texts covering navigation, home sections, and common messages
- **Namespace Organization**:
  - `navigation` - Header menu items (home, series, books, bio, testimonials, admin)
  - `home` - Homepage section titles and subtitles (series, standalone, bio, testimonials, newsletter)
  - `footer` - Footer content and links
  - `book_landing` - Book landing page labels and buttons
  - `series_landing` - Series landing page labels and buttons
  - `admin` - Admin panel interface texts
  - `common` - Shared texts (loading, buttons like "read more", "subscribe")
- **Backend Implementation**:
  - Storage methods: `getUiTexts(locale?)`, `getUiTextsByNamespace()`, `getUiTextById()`, `updateUiText()`, `upsertUiText()`
  - RESTful API endpoints:
    - GET `/api/ui-texts?locale=es-ES` - Fetch texts by locale
    - GET `/api/ui-texts/:id` - Get specific text
    - PUT `/api/ui-texts/:id` - Update text (requires auth)
    - POST `/api/ui-texts` - Create/upsert text (requires auth)
- **Frontend Integration**:
  - `UiTextProvider` context wraps entire app, fetching texts on load
  - `useUiText(namespace, key, defaultValue)` hook for accessing texts in components
  - Texts cached with React Query for performance
  - Automatic cache invalidation on updates
  - Components: navigation, hero-section, newsletter, book-series, standalone-books, author-bio, testimonials
- **Admin Interface** ("Textos del Sitio"):
  - Tab-based organization by namespace for easy navigation
  - Inline editing: click "Editar" → modify text → save
  - Create new texts with controlled form (namespace, key, locale, value)
  - Real-time preview: changes reflect immediately on public pages after save
  - Toast notifications for success/error feedback
- **Localization Support**:
  - Multi-locale ready (currently Spanish "es-ES")
  - Architecture supports adding more languages easily
  - Locale parameter in all fetch operations
- **Use Cases**:
  - Change navigation menu labels
  - Customize section headings on homepage
  - Translate interface to other languages
  - A/B test different copy
  - Rebrand without code changes

### Visual Personalization System
- **Complete Visual Customization** - System to personalize all visual aspects without code changes
- **Customizable Elements**:
  - **Logo**: Upload custom logo image (replaces site name in navigation)
  - **Favicon**: Upload custom favicon for browser tabs
  - **Color Scheme**: 5 customizable colors:
    - Primary Color: Main brand color for buttons and highlights
    - Secondary Color: Supporting brand color
    - Accent Color: Call-to-action and emphasis
    - Background Color: Main site background
    - Text Color: Primary text color
- **Implementation**:
  - `DynamicTheme` component applies colors via CSS variables
  - Favicon updates dynamically with fallback to default
  - Logo displays in navigation when configured
  - All uploads stored in Replit Object Storage
- **Admin Interface** ("Apariencia" in Configuración):
  - Granular mutations prevent data loss (logo/favicon separate from colors)
  - Color picker inputs with hex validation
  - Real-time preview of changes
  - Upload UI with Replit Object Storage integration
- **Current Theme Applied**: Brown and ochre literary aesthetic
  - Primary: #D4A574 (Golden Ochre)
  - Secondary: #8B6F47 (Medium Brown)
  - Accent: #C19A6B (Camel)
  - Background: #2C2416 (Deep Brown)
  - Text: #E8DCC8 (Cream/Parchment)