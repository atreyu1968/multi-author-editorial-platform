# Author Website

## Overview

This is a full-stack web application for an author's personal website, built as a modern single-page application with an admin panel. The site showcases the author's books (both standalone and series), biography, testimonials, and includes a newsletter subscription system. The application features a clean, responsive design with a professional author portfolio layout.

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

### Component Architecture
- **Modular component structure** with clear separation of concerns
- **Admin dashboard** with dedicated management interfaces for:
  - Books and book series management
  - Author biography editing
  - Testimonial management
  - Newsletter subscriber management
  - Site settings configuration
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