# Comprehensive Project Report

This document consolidates the previous planning and guideline reports into one source of truth.

## 1) Overview

The project follows a scalable structure based on clear separation of concerns:

- Data layer for API communication
- State layer for domain state and validation
- Presentation layer for UI and user workflows

Core goals:

- Reusability across entities
- Consistent patterns for development speed
- Strong authentication and route protection
- Maintainable feature expansion

## 2) Architecture

### Recommended Structure

```text
src/
|- app/                     # Next.js routing and API routes
|- context/                 # React context providers and hooks
|- hooks/                   # Custom hooks
|- store/{entity}/          # Zustand state + Zod validation
|- components/{entity}/     # UI per entity
|- lib/                     # Utilities, DB, auth, shared helpers
|- middleware.ts            # Route protection
|- styles/                  # Global/component styles
`- types/                   # TypeScript contracts
```

### Three-Layer Pattern

1. Data Layer: API calls and remote state behavior.
2. State Layer: local domain state, validation, UI workflow state.
3. Presentation Layer: pages, components, interactions, and UX.

### Entity-Based Scalability

For each new entity:

- Duplicate and adapt `store/{entity}`.
- Duplicate and adapt `components/features/{entity}`.
- Update schemas, types, and API endpoints.

## 3) Development Guidelines

### Naming and Organization

- Components: PascalCase (`UserForm.tsx`)
- Utilities/hooks/helpers: camelCase (`tokenManager.ts`)
- Stylesheets: kebab-case (`report-modal.css`)

### Code Principles

- Single responsibility per file/component/hook.
- Keep dependencies minimal.
- Prefer existing project conventions over introducing new patterns.
- Keep imports grouped and predictable.

### Component Pattern

- Define typed props.
- Place hooks first.
- Keep handlers/computed values organized.
- Handle loading/error early.
- Render with clear, readable JSX structure.

### State + Validation

- Zustand for state stores.
- Zod for schemas and form/data validation.
- Keep actions explicit and predictable.

## 4) Context Management

### Rules

- Keep each context and its custom hook in the same file.
- Use consistent naming (`XContext`, `useX`).
- Add TypeScript interfaces for context values.
- Compose providers in `app/Providers.tsx`.

### Provider Composition

Typical composition order:

- Theme provider
- App-level provider
- Sidebar/provider-level UI state
- Feature-specific providers (upload, etc.)

## 5) Authentication and Security

### Auth Architecture

- Dual token storage strategy:
  - localStorage for client API usage
  - cookies for middleware route protection
- Token manager handles set/get/remove centrally.
- Axios interceptors attach Bearer tokens automatically.
- Middleware redirects unauthenticated users to login.

### Security Behavior

- Automatic token injection for protected requests.
- Automatic cleanup on logout and unauthorized responses.
- Token expiration handling.
- Server-side route protection via middleware.

## 6) Data and API Patterns

### `useApiData` Capabilities

- GET/POST/PUT/PATCH/DELETE
- Retry logic
- Request cancellation
- Error/loading state management
- Pagination and load-more behavior
- Debounced parameter updates
- Auto-refetch options
- Optional optimistic updates

### Data Flow

User action -> Store update -> API hook call -> Axios request with auth -> API response -> Store update -> UI re-render

### API Contract Discipline

- Follow documented request/response contracts.
- Do not invent response structures when contract source exists.
- Keep validation aligned between client and server.

## 7) UI/UX Best Practices

### Loading and Error UX

- Avoid full page flashes for loading/error.
- Prefer contextual loading placeholders/spinners.
- Keep layout stable while data states change.

### Image Handling

- Use Next.js `Image`.
- Validate image paths before render.
- Centralize URL/alt helpers in shared utilities.
- Configure `next.config.ts` image remote patterns.

### UI Library Usage

- Use existing shadcn components from `components/ui`.
- Add missing components through official shadcn install flow.

## 8) Feature Systems

### Reports System

- Portable report module with configurable columns.
- PDF/print workflow support.
- Filter and style customization support.
- Works across entities with shared configuration pattern.

### File Upload System

- Independent upload hook, separate from generic API hook.
- Uses FormData (`file` + `collection`).
- Progress tracking and upload/delete lifecycle handling.
- Integrates with authentication automatically via Axios.

### Theme and Responsiveness

- Theme context wraps `next-themes`.
- Supports light/dark/system themes and persistence.
- Mobile behavior supported through responsive patterns and `useMobile`.

## 9) Implementation Checklist

When adding a new feature/entity:

1. Add or adapt types and Zod schema.
2. Add/update store actions and UI state.
3. Implement API integration through standard hooks.
4. Ensure auth protection is respected for secure routes.
5. Apply loading/error and responsive UX rules.
6. Add audit/logging if action is operationally sensitive.
7. Verify consistency with existing project conventions.

## 10) Final Notes

- This report replaces the previous segmented planning documents.
- Keep this file as the single documentation reference for architecture and implementation rules.
- Update this file whenever project conventions evolve.
