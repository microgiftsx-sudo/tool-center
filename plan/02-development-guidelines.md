# 💻 Development Guidelines

## 🚀 Quick Start Rules

### New Entity Implementation
When adding a new entity to the system:

1. **Duplicate Existing Structure**
   - Copy `store/{existingEntity}` → `store/{newEntity}`
   - Copy `components/features/{existingEntity}` → `components/features/{newEntity}`

2. **Update Configuration**
   - Modify types in `{newEntity}Types.ts`
   - Update validation schemas in `{newEntity}Validation.ts`
   - Configure API routes in store file

3. **Automatic Features**
   - Filtering, modals, and CRUD operations work automatically
   - Authentication is handled automatically
   - No additional setup required for basic functionality

### File Naming Conventions
- Use PascalCase for component files: `UserForm.tsx`
- Use camelCase for utility files: `tokenManager.ts`
- Use kebab-case for CSS files: `report-modal.css`
- Use descriptive, specific names: `useApiData.ts` not `useData.ts`

## 🏗️ Code Organization Principles

### Single Responsibility
- Each file should have one primary purpose
- Components should handle one specific UI concern
- Hooks should manage one type of state or behavior
- Utils should perform one type of operation

### Dependency Management
- Keep dependencies minimal and purposeful
- Use existing project dependencies before adding new ones
- Prefer native solutions over external libraries when simple

### Import Organization
```tsx
// 1. React and Next.js imports
import React from "react";
import { useRouter } from "next/navigation";

// 2. External library imports
import { Button } from "@/components/ui/button";

// 3. Internal imports (grouped by type)
import { useAuth } from "@/hooks/useAuth";
import { UserStore } from "@/store/users/userStore";
import { User } from "@/types/user";

// 4. Relative imports
import "./styles.css";
```

## 🎯 Component Patterns

### Component Structure Template
```tsx
"use client"; // Only if needed

import React from "react";
// ... other imports

interface ComponentProps {
  // Define props with TypeScript
}

export function Component({ prop1, prop2 }: ComponentProps) {
  // 1. Hooks (state, effects, custom hooks)
  
  // 2. Event handlers and computed values
  
  // 3. Early returns (loading, error states)
  
  // 4. Main render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### Hook Patterns
```tsx
// Custom hook template
export function useCustomHook(param: string) {
  // State management
  const [state, setState] = useState();
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Helper functions
  const helperFunction = () => {
    // Implementation
  };
  
  // Return object (prefer object over array for multiple values)
  return {
    state,
    helperFunction,
    // ... other exports
  };
}
```

## 🔧 State Management Rules

### Zustand Store Pattern
```tsx
// store/{entity}/{entity}Store.ts
import { create } from 'zustand';
import { {Entity}Type } from './{entity}Types';

interface {Entity}Store {
  // State properties
  items: {Entity}Type[];
  selectedItem: {Entity}Type | null;
  isModalOpen: boolean;
  
  // Actions
  setItems: (items: {Entity}Type[]) => void;
  setSelectedItem: (item: {Entity}Type | null) => void;
  toggleModal: () => void;
  
  // Computed properties
  selectedCount: number;
}

export const use{Entity}Store = create<{Entity}Store>((set, get) => ({
  // Initial state
  items: [],
  selectedItem: null,
  isModalOpen: false,
  
  // Actions
  setItems: (items) => set({ items }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  toggleModal: () => set((state) => ({ isModalOpen: !state.isModalOpen })),
  
  // Computed properties
  get selectedCount() {
    return get().items.filter(item => item.selected).length;
  },
}));
```

### Validation Schema Pattern
```tsx
// store/{entity}/{entity}Validation.ts
import { z } from 'zod';

export const {entity}Schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  // ... other fields
});

export const create{Entity}Schema = {entity}Schema.omit({ id: true });
export const update{Entity}Schema = {entity}Schema.partial();

export type {Entity}FormData = z.infer<typeof {entity}Schema>;
```

## 🎨 Styling Guidelines

### CSS Organization
- Global styles in `styles/globals.css`
- Component-specific styles as CSS modules or inline
- Utility classes with Tailwind CSS
- Custom styles only when necessary

### Responsive Design
- Mobile-first approach
- Use provided `useMobile()` hook for JavaScript-based responsive logic
- Prefer CSS for layout responsiveness

### Theme Integration
- Use theme context for dynamic theming
- Support both light and dark modes
- Maintain consistent color schemes

## 🚦 Error Handling

### API Error Handling
- Use existing error boundaries
- Provide meaningful error messages
- Handle loading and error states consistently

### Form Validation
- Use Zod schemas for validation
- Provide real-time validation feedback
- Handle both client and server-side validation

## 📋 Testing Patterns

### Component Testing
- Test component behavior, not implementation
- Mock external dependencies
- Test user interactions and edge cases

### API Testing
- Mock API responses
- Test error scenarios
- Verify data transformations