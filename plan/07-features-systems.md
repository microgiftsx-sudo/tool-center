# 🔧 Feature Systems Guidelines

## Reports System

### Overview
The reports system is a ready-to-use, portable solution that can be copied to any project. It provides automatic PDF generation, column filtering, and customizable styling.

### Required Files
```
src/components/common/report-modal.tsx
src/styles/report-modal.css
src/app/(home)/reports/page.tsx
```

### Implementation Steps

#### 1. Copy Required Files
Copy the three files listed above to your project in the same directory structure.

#### 2. Basic Usage Pattern
```tsx
import { ReportModal } from "@/components/common/report-modal";

// Define your data columns
const columns = [
  { key: "id", label: "#", width: 50 },
  { key: "name", label: "Name", width: 200 },
  { key: "email", label: "Email", width: 250 },
];

// Use in any component
<ReportModal
  trigger={<Button>Generate Report</Button>}
  data={yourData}
  columns={columns}
  title="Your Report Title"
  onGenerateReport={(config) => console.log("Report config:", config)}
/>;
```

#### 3. API Integration
```tsx
// Replace sample data with API data using useApiData hook
const { data, isLoading } = useApiData('/api/your-endpoint');

<ReportModal
  data={data || []}
  // ... other props
/>
```

### Features Included
- ✅ Automatic PDF generation and printing
- ✅ Column selection and filtering
- ✅ Custom colors and styling
- ✅ Responsive design
- ✅ RTL support
- ✅ Works with any data structure

### Column Configuration
```tsx
interface ColumnConfig {
  key: string;      // Data property key
  label: string;    // Display label
  width: number;    // Column width in pixels
  type?: 'text' | 'number' | 'date' | 'currency';
  format?: (value: any) => string;
}
```

### Customization Options
```tsx
interface ReportConfig {
  title: string;
  subtitle?: string;
  selectedColumns: string[];
  includeFilters: boolean;
  colorScheme: 'default' | 'blue' | 'green' | 'purple';
  orientation: 'portrait' | 'landscape';
  pageSize: 'A4' | 'A3' | 'Letter';
}
```

## Authentication System

### Auto-Authentication Pattern
All API calls in the system are automatically authenticated through:
- Token management in `lib/tokenManager.ts`
- Axios interceptors in `lib/axiosClients.ts`
- Route protection via `middleware.ts`

### No Manual Auth Setup Required
When adding new entities or API endpoints:
1. Use the existing `useApi` hooks
2. Follow the established API patterns
3. Authentication headers are automatically added
4. Token refresh is handled automatically

## File Upload System

### Core Components
- `hooks/use-upload-file.ts` - Independent file upload hook
- `components/common/upload-file.tsx` - Reusable upload component
- `types/attachment.ts` - File upload type definitions

### Usage Pattern
```tsx
import { useUploadFile } from "@/hooks/use-upload-file";
import { UploadFile } from "@/components/common/upload-file";

function MyComponent() {
  const { uploadFile, isUploading, progress } = useUploadFile();

  const handleUpload = async (files: File[]) => {
    const results = await uploadFile(files);
    console.log('Upload results:', results);
  };

  return (
    <UploadFile
      onUpload={handleUpload}
      maxFiles={5}
      acceptedTypes={['image/*', 'application/pdf']}
      maxSize={10 * 1024 * 1024} // 10MB
    />
  );
}
```

##  Theme System

### Implementation
- Wraps `next-themes` with custom functionality
- Provides additional theme utilities
- Supports system theme detection
- Includes theme persistence

### Usage
```tsx
import { useTheme } from "@/context/theme-context";

function ThemeToggle() {
  const { isDark, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Switch to {isDark ? 'Light' : 'Dark'} Mode
    </button>
  );
}
```

##  Mobile Detection

### Hook Usage
```tsx
import { useMobile } from "@/hooks/use-mobile";

function ResponsiveComponent() {
  const isMobile = useMobile();

  return (
    <div className={isMobile ? "mobile-layout" : "desktop-layout"}>
      Content adapts to screen size
    </div>
  );
}
```