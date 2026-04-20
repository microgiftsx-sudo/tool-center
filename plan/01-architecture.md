# 🏗️ Architecture Guidelines

## 📁 Project Structure Rules

### File Organization Pattern
```
src/
├── app/                    # Next.js pages and routing
├── context/                # Context providers and hooks
├── hooks/                  # Custom hooks
├── store/{entity}/         # Zustand state & Zod validation
├── components/{entity}/    # UI components per entity
├── lib/                    # Utilities and configurations
├── middleware.ts           # Route protection
├── styles/                 # Global and component styles
└── types/                  # TypeScript definitions
```

### Directory Naming Conventions
- Use lowercase with hyphens for directories
- Group related functionality under entity-based folders
- Separate concerns into distinct layers

### Entity-Based Organization
For each entity (users, products, orders, etc.):
```
store/{entity}/
├── {entity}Store.ts         # Zustand store
├── {entity}Validation.ts    # Zod schemas
└── {entity}Types.ts         # TypeScript types

components/{entity}/
├── common/                  # Shared UI components
├── features/                # Entity-specific features
├── layouts/                 # Layout components
└── ui/                      # Base UI components
```

## 🏛️ Three-Layer Architecture

### 1. Data Layer (API & Services)
- Location: `src/hooks/useApi/`
- Responsibility: API communication, data fetching
- Pattern: Custom hooks for each entity

### 2. State Layer (Store Management)
- Location: `src/store/{entity}/`
- Technology: Zustand + Zod validation
- Handles:
  - Form modal state
  - Filters & selections
  - Bulk operations
  - Form data + validation

### 3. Presentation Layer (UI Components)
- Location: `src/components/{entity}/`
- Organization:
  - `common/` → Shared UI logic
  - `features/` → Page-specific features
  - `layouts/` → App layouts
  - `ui/` → Base/wrapped components

## 📋 Adding New Entities

### Quick Setup Process
1. Duplicate existing `store/{entity}` folder
2. Duplicate existing `components/features/{entity}` folder
3. Update types, validation, and API routes
4. Everything else (filtering, modals, CRUD) works automatically
5. **No authentication setup needed** - All API calls are automatically authenticated

### Required Files for New Entity
```
store/{newEntity}/
├── {newEntity}Store.ts
├── {newEntity}Validation.ts
└── {newEntity}Types.ts

components/features/{newEntity}/
├── {newEntity}List.tsx
├── {newEntity}Form.tsx
└── {newEntity}Details.tsx
```