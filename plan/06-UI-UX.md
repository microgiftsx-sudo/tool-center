## 🎨 UI/UX Best Practices

### Loading & Error States

- **AVOID** full page refreshes for loading/error states
- **USE** inline loading states within content areas
- **SHOW** loading spinners in specific sections, not entire page
- **DISPLAY** errors contextually within the content flow
- **MAINTAIN** page layout and navigation during state changes

### Image Handling

- **ALWAYS** use Next.js `Image` component for optimized loading
- **CONFIGURE** `next.config.ts` with allowed image domains/patterns
- **USE** image utilities (`src/lib/imageUtils.ts`) for consistent URL handling
- **VALIDATE** image paths before rendering
- **PROVIDE** meaningful alt text for accessibility

### shadcn UI

- any component you wint use from shadcn UI make suer if is existe in @src\components\ui
- instull component if not existe use `npx shadcn@latest add [COMPONENT-NAME]`

### Example Implementations

#### Loading States

```tsx
// ❌ Bad - Full page loading
if (isLoading) return <div>Loading...</div>

// ✅ Good - Contextual loading
<div className="content-area">
  {isLoading ? (
    <div className="flex justify-center p-8">
      <Loader2 className="animate-spin" />
    </div>
  ) : (
    <ContentComponent data={data} />
  )}
</div>
//  Loader2
<div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
<div className="flex items-center gap-2">
<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
<span className="text-sm text-muted-foreground">
جاري التحميل...
</span>
</div>
</div>
```

#### Image Handling

```tsx
import Image from "next/image";
import { getImageUrl, getImageAlt, isValidImagePath } from "@/lib/imageUtils";

// ❌ Bad - Direct path without validation
<img src={`http://localhost:8000/${imagePath}`} alt="image" />;

// ✅ Good - Proper Next.js Image with utilities
{
  imageData && isValidImagePath(imageData.path) && (
    <div className="relative h-64 w-full">
      <Image
        src={getImageUrl(imageData.path)}
        alt={getImageAlt(imageData.altText, "الصورة الافتراضية")}
        fill
        className="object-cover"
      />
    </div>
  );
}

// ✅ Good - With fallback for missing images
{
  imageData && isValidImagePath(imageData.path) ? (
    <Image
      src={getImageUrl(imageData.path)}
      alt={getImageAlt(imageData.altText)}
      width={400}
      height={300}
      className="rounded-lg"
    />
  ) : (
    <div className="w-full h-64 bg-gray-200 flex items-center justify-center rounded-lg">
      <span className="text-gray-500">لا توجد صورة</span>
    </div>
  );
}
```

#### Next.js Configuration

```tsx
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
      // Add production domains here
    ],
  },
};
```

---


