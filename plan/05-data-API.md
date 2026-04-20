## 🧱 Architecture Layers

### 1. **Data Layer** — `src/hooks/useApi/`

Handles **all API interactions** and **server state**:

- Custom hook: `useApiData()`
- Supports:
  - ✅ `GET`, `POST`, `PUT`, `DELETE`
  - ✅ Request cancellation
  - ✅ Race condition handling
  - ✅ Retry logic
  - ✅ Optimistic updates
  - ✅ Caching
  - ✅ Loading/error state management
  - ✅ **Automatic Authentication** via Axios interceptors
    **Files:**
- `index.tsx` – API hook logic
- `types.ts` – API response/request typings
- `utils.ts` – Utility helpers for error/response handling

🧠 `useApiData` Hook – Usage Guide

A universal React hook to handle **all API cases** (GET, POST, PUT, PATCH, DELETE) with built-in features like:

- ✅ Retry logic
- ✅ Optimistic updates
- ✅ Pagination & infinite scroll
- ✅ Auto-refetch (on focus, reconnect, or interval)
- ✅ Debounced search/filtering

---

#### ⚙️ Hook Signature

```ts
const api = useApiData<T>(endpoint: string, options?: HookOptions);
```

Returns:

```ts
{
  data,
  loading,
  fetchError,
  get,
  post,
  put,
  patch,
  delete,
  refetch,
  retry,
  reset,
  updateParams,
  updatePage,
  loadMore,
  clearFetchError,
  mutationLoading,
  ...
}
```

---

#### 📘 Basic GET Request

```tsx
const { data, loading, fetchError, get, refetch } = useApiData<User>("/users", {
  enableFetch: true,
});
```

- `enableFetch: true` → auto-fetches on mount
- `refetch()` or `get()` → manually re-fetch

---

#### 📄 Pagination & Infinite Scroll

```tsx
const { data, params, loadMore, updatePage } = useApiData<User>("/users", {
  enableFetch: true,
  pagination: true,
});

// Load next page
await loadMore();

// Jump to a specific page
updatePage(3);
```

Data will include `{ items, total, page, limit }`.

---

#### 🔍 Search / Filtering

```tsx
const { updateParams } = useApiData<User>("/users", { enableFetch: true });

// Trigger search (debounced)
updateParams({ search: "john" });
```

---

#### 📝 POST (Create Resource)

```tsx
import { toast } from "sonner";

const { formData, setFormField } = useUserStore(); 

const { post, mutationLoading, get } = useApiData<User>("/users");

await post({
  data: formData,
  onSuccess: (res) => {
    get(); // Refetch data to update UI
    toast.success("User created successfully!");
  },
  onError: (err) => {
    console.error("Failed", err);
    toast.error("Failed to create user");
  },
  optimistic: true, // optional
});
```

- `mutationLoading.post` → shows loading state
- `optimistic: true` → adds to UI instantly

---

#### ✏️ PUT (Replace Resource)

```tsx
import { toast } from "sonner";

const { formData, setFormField } = useUserStore(); 
const { put, get } = useApiData<User>("/users", { resourceId: 1 });

await put({
  data: formData,
  onSuccess: (res) => {
    get(); // Refetch data to update UI
    toast.success("User updated successfully!");
  },
  onError: (err) => {
    console.error("Failed", err);
    toast.error("Failed to update user");
  },
  optimistic: true, // optional
});
```

---

#### 🧩 PATCH (Partial Update)

```tsx
import { toast } from "sonner";

const { formData, setFormField } = useUserStore();
const { patch, get } = useApiData<User>("/users", { resourceId: 1 });

await patch({
  data: formData,
  onSuccess: (res) => {
    get(); // Refetch data to update UI
    toast.success("User updated successfully!");
  },
  onError: (err) => {
    console.error("Failed", err);
    toast.error("Failed to update user");
  },
  optimistic: true, // optional
});
```

---

#### ❌ DELETE

```tsx
const { delete: del } = useApiData<User>("/users", { resourceId: 1 });

await del({
  optimistic: true,
});
```

---

#### **🔁 Retry & Error Handling**

```tsx
const { fetchError, retry, clearFetchError } = useApiData<User>(
  "/unstable-api",
  {
    enableFetch: true,
    retryCount: 3,
    retryDelay: 1000,
  }
);

// Retry manually
retry();

// Clear error
clearFetchError();
```

---

#### **🔄 Auto-Refetch Options**

```tsx
const { data } = useApiData<User>("/users", {
  enableFetch: true,
  refetchOnWindowFocus: true,
  refetchOnReconnect: true,
  refetchInterval: 10000, // 10 seconds
});
```

---

#### **🧹 Reset State**

```tsx
const { reset } = useApiData<User>("/users");

reset(); // clears data, errors, retry counters
```

---

#### **🧾 Cheat Sheet Table**

| Action          | Method                | Notes                                  |
| --------------- | --------------------- | -------------------------------------- |
| Fetch (GET)     | `get()` / `refetch()` | `enableFetch: true` auto-fetches       |
| Create (POST)   | `post({ data })`      | `optimistic: true` → instant UI update |
| Replace (PUT)   | `put({ data })`       | Requires `resourceId`                  |
| Patch (PATCH)   | `patch({ data })`     | Partial update                         |
| Delete (DELETE) | `del({})`             | `optimistic: true` → remove instantly  |
| Pagination      | `loadMore()`          | Auto-increments page                   |
| Change Page     | `updatePage(n)`       | Jump to specific page                  |
| Search / Filter | `updateParams({...})` | Debounced refetch                      |
| Retry           | `retry()`             | Manual retry after error               |
| Clear Error     | `clearFetchError()`   | Clears error message                   |
| Reset All       | `reset()`             | Clears data, error, retries            |

---

#### **✅ Features Recap**

- [x] Works for all HTTP verbs
- [x] Pagination & infinite scroll
- [x] Retry with exponential delay
- [x] Auto-refetch on focus/reconnect/interval
- [x] Optimistic UI updates
- [x] Debounced search/filtering
- [x] Clear error & retry manually
- [x] Type-safe (with generics)

#### **🔐 Authentication Integration:**

- **Main Axios Client** (`apiClient`) automatically includes Bearer token in all requests
- **Auth Axios Client** (`apiAuth`) for authentication requests without Bearer token
- **Token Management** (`src/lib/tokenManager.ts`) handles localStorage + cookies sync
- **Auth Hook** (`src/hooks/useAuth.ts`) handles login/register/resetPassword using apiAuth
- **Auto-redirect** to login on 401 errors

####

---


### 3. api project

- read file @plan\Promotions_API.postman_collection.json
- this file api project
- contan data response and request for all endpoint project
- if you don't know what data response or request tall me to send it to you (don't make it in you self)



## 📁 File Upload Architecture

### **Independent Upload System**

File uploads are handled by a **separate hook** that doesn't depend on `useApiData`:

- **Direct Axios Integration**: Uses `apiClient` directly for FormData uploads
- **FormData Structure**: Automatically sends `file` + `collection` fields
- **Progress Tracking**: Real-time upload progress with percentage
- **Authentication**: Automatic token inclusion via axios interceptors
- **Type Safety**: Full TypeScript support with attachment types

### **Key Components**

#### **1. Upload Hook** (`src/hooks/use-upload-file.ts`)

```tsx
// Independent hook with direct axios calls
const {
  handleUploadFiles,
  files,
  uploadedFiles,
  deleteFile,
  finish,
  isUploading,
} = useUploadFile(endpoint, multiple, initialValue, { collection });

// Features:
// - FormData with file + collection
// - Progress tracking via onUploadProgress
// - Server-side file deletion
// - No dependency on useApiData
```

#### **2. Upload Component** (`src/components/common/upload-file.tsx`)

```tsx
<UploadFile
  endpoint="/attachments/upload"
  collection="articles" // Required: documents, articles, etc.
  type="image/*" // File type restriction
  multiple={true} // Single or multiple files
  onValueChange={callback} // Returns UploadedFile[]
/>
```

#### **3. API Structure** (Based on Postman Collection)

```
POST /attachments/upload
Content-Type: multipart/form-data

Body:
- file: [File]
- collection: "documents" | "articles" | etc.

Response:
{
  "status": "success",
  "data": {
    "id": 123,
    "originalName": "image.jpg",
    "path": "uploads/articles/image.jpg",
    ...
  }
}
```

### **Separation from useApiData**

- ✅ **Independent**: Upload hook doesn't use `useApiData`
- ✅ **Direct FormData**: Sends FormData body directly via axios
- ✅ **Clean Architecture**: Keeps data fetching and file uploads separate
- ✅ **Specialized**: Optimized specifically for file upload operations

---

### **File Upload Usage** (Independent Hook)

```tsx
import UploadFile from '@/components/common/upload-file';
import { useUploadFile } from '@/hooks/use-upload-file';
import type { UploadedFile } from '@/types/attachment';

// Single file upload component
<UploadFile
  endpoint="/attachments/upload"
  collection="articles"
  type="image/*"
  onValueChange={(file: UploadedFile) => {
    setMainImageId(Number(file.id));
  }}
/>

// Multiple files upload component
<UploadFile
  endpoint="/attachments/upload"
  collection="documents"
  multiple
  type="image/*,application/pdf"
  onValueChange={(files: UploadedFile[]) => {
    setAttachmentIds(files.map(f => Number(f.id)));
  }}
/>

// Using the upload hook directly (independent of useApiData)
const { handleUploadFiles, files, uploadedFiles, deleteFile, finish, isUploading } =
  useUploadFile('/attachments/upload', true, undefined, { collection: 'articles' });

// The upload hook uses direct axios calls with FormData
// - No dependency on useApiData hook
// - Direct FormData body with file + collection
// - Built-in progress tracking and authentication
```

---


## 🔁 Data Flow

```
User → Zustand Store → useApiData Hook → Axios (with Auth) → API Call → Store Update → UI Re-render
```

**Example Flow:**

1. User clicks "Create User"
2. Store opens modal and sets form state
3. User fills form → Zod validates data
4. On submit → `useApiData().post()` triggered
5. **Axios automatically adds Bearer token** to request headers
6. On success → Store updates → UI re-renders
7. On 401 error → Auto-redirect to login page

### **🔐 Authentication Flow:**

```
Login → Save Token (localStorage + Cookie) → All API Requests Include Token → Middleware Protects Routes
```

**Login Process:**

1. User submits credentials via login form
2. `POST /auth/login` → Server returns `{ accessToken, user }`
3. Token saved to **localStorage** (for Axios) + **Cookie** (for middleware)
4. create middleware next js in `/src` to Route protection with cookies
5. Zustand auth store updated with user data
6. Redirect to mane page `/`

**Protected Request Process:**

1. Any API call via `useApiData()`
2. Axios interceptor adds `Authorization: Bearer {token}` header automatically
3. Server validates token and processes request
4. If token invalid (401) → Token cleared → Redirect to login

---
