# 🔄 Context Management Guidelines

## 📁 Context Directory Structure

### Organization Rules
- **Single File Pattern**: Each context and its custom hook must be in the same file
- **Consistent Naming**: Use `{EntityName}Context` for context and `use{EntityName}Context` for hooks
- **Library Integration**: Wrap external library contexts (next-themes) with custom providers
- **Direct Imports**: Import contexts directly from individual files in `@src/app/Providers.tsx`
- **Type Safety**: Always include proper TypeScript interfaces for context values

```
src/
├── context/
│   ├── app-context.tsx           # App-level state with useApp hook
│   ├── sidebar-context.tsx       # Sidebar state with useSidebar hook
│   └── theme-context.tsx         # Theme management with useTheme hook
└── app/
    └── Providers.tsx             # Combined Providers component
```

## 🛠️ Implementation Pattern

### Basic Context Template
```tsx
// src/context/{entity}-context.tsx
"use client";

import React, { createContext, useContext } from "react";

// Context Interface
interface {Entity}ContextType {
  // Define your context properties here
}

// Context Creation
const {Entity}Context = createContext<{Entity}ContextType | undefined>(undefined);

// Provider Component
export function {Entity}Provider({ children }: { children: React.ReactNode }) {
  // Your provider logic here
  
  const value = {
    // Your context values
  };

  return (
    <{Entity}Context.Provider value={value}>
      {children}
    </{Entity}Context.Provider>
  );
}

// Custom Hook
export function use{Entity}() {
  const context = useContext({Entity}Context);
  if (context === undefined) {
    throw new Error("use{Entity} must be used within a {Entity}Provider");
  }
  return context;
}
```

### External Library Wrapper Pattern
```tsx
// src/context/theme-context.tsx
"use client";

import React, { createContext, useContext } from "react";
import {
  ThemeProvider as NextThemesProvider,
  useTheme as useNextTheme,
} from "next-themes";

// Context Interface
interface ThemeContextType {
  theme: string | undefined;
  setTheme: (theme: string) => void;
  toggleTheme: () => void;
  isLight: boolean;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider Component (wraps external library)
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContextWrapper>{children}</ThemeContextWrapper>
    </NextThemesProvider>
  );
}

// Internal wrapper to provide custom functionality
function ThemeContextWrapper({ children }: { children: React.ReactNode }) {
  const { theme, setTheme, resolvedTheme } = useNextTheme();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
    isLight: resolvedTheme === "light",
    isDark: resolvedTheme === "dark",
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// Custom Hook
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
```

## 🔗 Provider Composition

### Combined Providers Pattern
```tsx
// src/app/Providers.tsx
"use client";

import React from "react";
import { ThemeProvider } from "@/context/theme-context";
import { SidebarProvider } from "@/context/sidebar-context";
import { AppProvider } from "@/context/app-context";
import { UploadProvider } from "@/context/upload-context";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <AppProvider>
        <SidebarProvider>
          <UploadProvider>{children}</UploadProvider>
        </SidebarProvider>
      </AppProvider>
    </ThemeProvider>
  );
}
```

### Usage in Root Layout
```tsx
// app/layout.tsx
import { Providers } from "./Providers";

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## 📖 Usage Examples

### Individual Context Usage
```tsx
// Using individual contexts
import { useTheme } from "@/context/theme-context";
import { useSidebar } from "@/context/sidebar-context";

function MyComponent() {
  const { isDark, toggleTheme } = useTheme();
  const { isOpen, toggle } = useSidebar();

  return (
    <div>
      <button onClick={toggleTheme}>
        {isDark ? "Light Mode" : "Dark Mode"}
      </button>
      <button onClick={toggle}>{isOpen ? "Close" : "Open"} Sidebar</button>
    </div>
  );
}
```