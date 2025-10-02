# Overview

This is a comprehensive social media automation platform called "Lucifer Trading" designed for trading professionals. The application features AI-powered content generation, multi-platform social media management (Instagram, TikTok, YouTube, Telegram), advanced safety controls, and analytics. Built with modern web technologies, it provides a unified interface for automating social media presence while maintaining platform-specific rate limits and safety measures.

## Recent Changes (October 2025)

### Telegram Video Upload Integration
- **Video & Cover Upload**: Full support for uploading videos (up to 500MB) and cover images to Telegram posts using Replit Object Storage with presigned URLs
- **Database Enhancement**: Added `title` field to posts table for video titles alongside content
- **Storage Methods**: Added `getPlatformByName`, `getPostsByPlatformAndStatus`, `updatePostStatus` methods for bot integration
- **Bot Publishing**: Telegram bot now checks database for scheduled posts with media, publishes videos with captions combining title + content, and automatically updates post status
- **Bug Fixes**: Fixed critical setInterval bug in telegramBot.ts (cache cleanup was incorrectly placed inside checkRateLimit function)
- **UI Components**: TelegramMediaUploader component for video/cover uploads, TelegramPost page for scheduling posts with media

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Authentication**: Session-based authentication with automatic redirect handling

## Backend Architecture
- **Framework**: Express.js with TypeScript using ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: OpenID Connect integration with Replit Auth
- **Session Management**: Express sessions with PostgreSQL storage using connect-pg-simple
- **API Design**: RESTful endpoints with comprehensive error handling and logging
- **Background Processing**: Service-based architecture with dedicated modules for AI, social media, safety, analytics, and scheduling

## Database Design
- **Primary Database**: PostgreSQL via Neon serverless with WebSocket connections
- **Schema Management**: Drizzle ORM with migrations and type-safe queries
- **Core Tables**: Users, platforms, user accounts, posts, analytics, AI content logs, safety logs, rate limits, activity logs, and sessions
- **Data Relationships**: Proper foreign key relationships between users, platforms, and their associated data

## Service Layer Architecture
- **AI Content Service**: OpenAI GPT-5 integration for content generation with cost tracking
- **Social Media Service**: Platform-specific API integrations with unified interface
- **Safety Service**: Rate limiting and safety monitoring with platform-specific controls
- **Analytics Service**: Dashboard data aggregation and performance tracking
- **Scheduler Service**: Background job processing with emergency stop capabilities
- **Storage Service**: Centralized data access layer with type-safe operations

## Safety and Rate Limiting
- **Multi-Platform Monitoring**: Platform-specific rate limit tracking and enforcement
- **Real-time Safety Status**: Continuous monitoring with warning and critical alert systems
- **Emergency Controls**: Immediate stop functionality for all automation activities
- **Action Logging**: Comprehensive audit trail for all automated actions

## Frontend Component Architecture
- **Page Components**: Dashboard, platform details, AI content, safety center, scheduler, and settings
- **Shared Components**: Reusable UI components for platform cards, activity feeds, analytics charts, and safety status
- **Custom Hooks**: Authentication state management and toast notifications
- **Utility Functions**: API request handling with proper error management and unauthorized user redirects

# External Dependencies

## Core Backend Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless database connection with WebSocket support
- **drizzle-orm**: Type-safe ORM for database operations and schema management
- **express**: Web application framework with middleware support
- **openid-client**: OpenID Connect authentication for Replit integration
- **connect-pg-simple**: PostgreSQL session store for Express sessions

## Frontend Dependencies
- **@tanstack/react-query**: Server state management with caching and synchronization
- **@radix-ui/react-**: Comprehensive set of accessible UI primitives
- **tailwindcss**: Utility-first CSS framework with custom design system
- **wouter**: Lightweight routing library for React applications
- **class-variance-authority**: Utility for managing component variants

## AI and External Services
- **OpenAI API**: GPT-5 integration for AI-powered content generation
- **Social Media APIs**: Platform-specific integrations for Instagram, TikTok, YouTube, and Telegram
- **Authentication Provider**: Replit OpenID Connect for user authentication

## Development Tools
- **Vite**: Fast build tool with hot module replacement and TypeScript support
- **ESBuild**: JavaScript bundler for production builds
- **TypeScript**: Type safety across the entire application stack
- **Drizzle Kit**: Database migration and schema management tools