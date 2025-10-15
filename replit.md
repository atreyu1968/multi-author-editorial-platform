# Multi-Author Editorial Management Platform

## Overview

This project is a full-stack web application designed for managing up to 30 authors within a single editorial platform. It provides each author with customizable landing pages, including sections for their books, biography, testimonials, newsletter, and blog. The platform features a centralized admin panel for editorial staff to manage all content, which is stored in a single PostgreSQL database with data scoped by `authorId`. The core purpose is to offer a robust, modern single-page application solution for literary agencies or publishers to manage multiple author presences efficiently under one umbrella.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Technology Stack**: React 18 with TypeScript, Vite, Wouter for routing, TanStack Query for state management.
- **Styling**: Tailwind CSS with shadcn/ui component library, custom CSS variables for theming with light/dark mode.
- **Forms**: React Hook Form with Zod for validation.
- **Theming**: Dynamic theming per author (colors, logo, favicon) via CSS variables.

### Backend
- **Technology Stack**: Express.js with TypeScript, RESTful API.
- **Database Interaction**: Drizzle ORM for PostgreSQL, Zod schemas for shared validation.
- **Middleware**: For request logging and error handling.

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM and Neon Database for hosting.
- **Schema Management**: Drizzle Kit for migrations, shared schema definitions for type safety.

### Multi-Author System
- **Author Management**: Centralized CRUD in admin panel, `authorId` foreign keys for all content.
- **Data Scoping**: All API routes and admin components scope data to the selected author using `authorId`.
- **Public Pages**: Customizable author landing pages at `/autor/:slug` with SEO support.
- **Visual Theming**: Each author can customize colors, logo, and favicon, applied dynamically.
- **Content Personalization**: UI text customization system allowing all visible text to be edited via the admin panel, supporting multi-locale.
- **Promotional Content**: System for adding optional promotional materials (concept maps, family trees, press notes, media, Spotify playlists, YouTube booktrailers) to books/series, with visibility toggles.
- **Multi-Author Series/Collections**: Series are global entities that can contain books from multiple authors (e.g., anthologies, collaborative collections). The `authorId` field in `book_series` is nullable. Admin manages series globally, and author pages display series containing their books.

### Admin Dashboard
- Comprehensive management interfaces for authors, books, series, biographies, testimonials, blog posts, newsletter subscribers, site settings, UI text, and visual appearance.
- QR code generation for book landing pages.
- **Editorial Homepage Configuration**: Dedicated admin panel section ("Página Editorial") for managing global editorial homepage content including hero section, feature cards, SEO metadata, and footer information. All content is dynamically loaded from a single `editorial_settings` database record.

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting.
- **Drizzle ORM**: TypeScript ORM.
- **connect-pg-simple**: PostgreSQL session store (for future use).

### UI and Styling
- **Radix UI**: Headless component primitives.
- **shadcn/ui**: Component library.
- **Tailwind CSS**: Utility-first CSS framework.
- **Lucide Icons**: Icon library.
- **Google Fonts**: Inter, Playfair Display.

### Email and Newsletter
- **Custom Email Service**: Supports Resend, SendGrid, Mailchimp Transactional, Brevo, Postmark, Mailgun.
- **Welcome Email Automation**: Sends welcome emails with free book downloads (files hosted on Replit Object Storage).

### File Storage
- **Replit Object Storage**: For author logos, favicons, and free book files.

### Marketing & Promotional Tools
- **qrcode library**: For automatic QR code generation.

### Development Tools
- **Vite**: Build tool and dev server.
- **TypeScript**: Language.
- **ESBuild**: Bundler.
- **PostCSS**: CSS processing.

### Form Handling
- **React Hook Form**.
- **Zod**: Schema validation.

### State Management
- **TanStack Query**: Server state.
- **React Context**: Local state.

## Recent Changes

### Multi-Author Series/Collections Implementation (October 15, 2025)
- **Database Schema**: Made `book_series.author_id` nullable to support global series not tied to a single author
- **Admin Panel**: Series management is now global (not author-restricted), showing all series with book counts from all authors
- **Book Management**: Shows all available series in dropdown for cross-author assignments
- **Public Pages**: Author pages filter and display series based on book participation (shows series containing at least one book by that author)
- **Cache Management**: Book mutations invalidate both author-scoped `['/api/books', authorId]` and global `['/api/books']` queries for real-time updates
- **Validation Schema**: Updated `insertBookSeriesSchema` to properly handle all nullable and optional fields
- **Testing**: End-to-end tests confirm multi-author series creation, display, and book count updates work correctly across admin and public pages

### Editorial Branding & Navigation Configuration (October 15, 2025)
- **Logo Configuration**: Added support for editorial logo in header and footer via `editorial_settings.logo_url`
- **Favicon Support**: Added favicon configuration via `editorial_settings.favicon_url`, dynamically injected via SEOHead component
- **Footer Navigation**: Added configurable footer quick links stored as array in `editorial_settings.footer_quick_links` (format: "Label|URL" per line)
- **Admin Interface**: New "Branding" tab in editorial settings allows configuration of logo, favicon, and footer menu links
- **UI Updates**: Logo displays in EditorialNavigation header and footer, favicon updates dynamically when configured
- **Modal Improvements**: Fixed transparent background issue in AlertDialog components - now use solid backgrounds (white/dark gray)
- **Color Scheme Update**: Updated primary color to warm ochre tone (HSL: 40 65% 50% light mode, 42 70% 58% dark mode) for improved visual consistency across admin panel and public pages
- **File Upload Fix**: Fixed image upload functionality by adding Uppy CSS imports (@uppy/core/css/style.min.css and @uppy/dashboard/css/style.min.css) to main.tsx, enabling the upload modal to display and function correctly
- **Admin Panel Menu Reorganization**: Separated sidebar menu into two clear sections - "Autor Seleccionado" (author-specific options: Dashboard, Libros, Biografía, Testimonios, Blog, Textos del Sitio, Configuración) and "Editorial (Global)" (editorial-wide options: Series, Autores, Página Editorial, Ayuda) with visual separators and section headers