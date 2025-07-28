# Agent Development Guide

## Build/Lint/Test Commands
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the production application
- `npm run lint` - Run ESLint to check for code issues
- `npm run start` - Start the production server locally

## Code Style Guidelines

### Imports
- Use absolute imports with `@/*` alias (e.g., `@/lib/utils`)
- Import React as a namespace: `import * as React from "react"`
- Group imports in order: built-in, external packages, internal modules

### Formatting
- Use single quotes for strings
- No semicolons at end of lines
- Trailing commas in object/array literals
- Arrow functions for components and callbacks

### Types
- Use TypeScript for all files (.ts or .tsx)
- Strict typing enabled in tsconfig.json
- Use interfaces for object shapes
- Use type aliases for unions/primitives

### Naming Conventions
- PascalCase for components and types
- camelCase for variables and functions
- UPPER_CASE for constants
- Descriptive variable names

### Error Handling
- Use try/catch blocks for async operations
- Check for authentication tokens before API calls
- Return appropriate HTTP status codes (401, 403, 500)
- Use `safeLog` function to avoid logging sensitive data

### Component Structure
- Use functional components with arrow function syntax
- Leverage Radix UI and Tailwind CSS for UI components
- Use class-variance-authority for component variants
- Implement proper accessibility attributes

### API Routes
- Use Next.js app directory structure for API routes
- Handle authentication with cookie-based tokens
- Return structured JSON responses with success/error fields
- Implement proper error responses with status codes