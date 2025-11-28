# Tic-Tac-Toe Game

## Overview

A classic two-player Tic-Tac-Toe game built with React and TypeScript. The application provides an interactive 3x3 grid where players alternate turns placing X and O marks, with automatic win detection and game state management. The UI follows Material Design principles with playful game elements, emphasizing clarity and immediate feedback.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server for fast hot module replacement
- Wouter for lightweight client-side routing
- Single-page application (SPA) architecture

**UI Component System**
- shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom design tokens
- Class Variance Authority (CVA) for managing component variants
- Responsive design with mobile-first approach

**State Management**
- React hooks (useState, useCallback) for local game state
- TanStack Query for server state management and caching
- No global state management library - state kept close to components

**Design System**
- Material Design principles with playful game aesthetics
- Custom color scheme using HSL color space with CSS variables
- Consistent spacing units (2, 4, 6, 8, 12, 16) via Tailwind
- Typography hierarchy using clean sans-serif fonts (Inter/Poppins/Outfit)
- Interactive states with hover and active elevations

### Backend Architecture

**Server Framework**
- Express.js REST API server
- HTTP server creation with Node's native http module
- Middleware-based request processing pipeline

**API Structure**
- RESTful endpoints prefixed with `/api`
- JSON request/response format
- Centralized error handling and logging
- Request timing and logging middleware

**Development vs Production**
- Development: Vite dev server integration with HMR
- Production: Static file serving from compiled build
- Environment-based configuration via NODE_ENV

**Build Process**
- esbuild for server-side bundling with selective dependency bundling
- Vite for client-side bundling and optimization
- Separate build outputs (dist/public for client, dist for server)

### Data Storage

**Database**
- PostgreSQL configured via Drizzle ORM
- Neon serverless database driver for connections
- Schema-first approach with type-safe queries

**ORM Layer**
- Drizzle ORM for database operations
- Drizzle Zod for runtime validation from schema
- Migration support via drizzle-kit

**Storage Abstraction**
- IStorage interface for CRUD operations
- MemStorage in-memory implementation for development/testing
- Designed for easy swapping between storage backends
- Currently implements user storage (id, username, password)

### External Dependencies

**UI Component Libraries**
- Radix UI primitives for accessible, unstyled components
- lucide-react for consistent iconography
- cmdk for command palette functionality
- embla-carousel-react for carousel components
- react-day-picker for date selection

**Styling**
- Tailwind CSS with PostCSS processing
- tailwind-merge and clsx for conditional class merging
- Custom CSS variables for theming

**Form Management**
- React Hook Form for form state and validation
- Hookform Resolvers for integrating validation schemas
- Zod for runtime type validation

**Development Tools**
- TypeScript for static type checking
- tsx for TypeScript execution in development
- Replit-specific plugins for development experience
- Hot module replacement and error overlays

**Session Management**
- express-session for server-side sessions
- connect-pg-simple for PostgreSQL session storage
- Configured for cookie-based session tracking

**Database Tooling**
- drizzle-kit for schema migrations and database push
- SQL migrations stored in /migrations directory