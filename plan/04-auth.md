## 🔐 Authentication Architecture

### **Authentication Hook Pattern**

The `useAuth` hook (`src/hooks/useAuth.ts`) follows the same robust patterns as `useApiData`:

- ✅ **Request Cancellation**: Abort controllers for race condition handling
- ✅ **Retry Logic**: Exponential backoff for failed requests
- ✅ **Loading States**: Per-action loading states (login, register, resetPassword)
- ✅ **Error Handling**: Comprehensive error extraction and state management
- ✅ **Options Pattern**: Support for onSuccess/onError callbacks
- ✅ **Memory Management**: Proper cleanup and mounted state tracking

```tsx
// useAuth hook features
const {
  login, // Login function with options
  register, // Register function with options
  resetPassword, // Reset password function with options
  loading, // { login: false, register: false, resetPassword: false }
  isLoading, // Boolean - any action loading
  error, // Current error message
  hasError, // Boolean error state
  retry, // Retry failed request
  cancel, // Cancel current request
  clearError, // Clear error state
} = useAuth();
```

---

### **Dual Storage Strategy**

- **localStorage**: Used by Axios for API requests (client-side)
- **Cookies**: Used by Next.js middleware for route protection (server-side)

### **Key Components**

#### **1. Token Manager** (`src/lib/tokenManager.ts`)

```tsx
tokenManager.setToken(token); // Sets both localStorage + cookie
tokenManager.getToken(); // Gets from localStorage
tokenManager.removeToken(); // Clears both storages
tokenManager.hasToken(); // Checks if authenticated
```

#### **2. Axios Clients** (`src/lib/axiosClients.ts`)

- **apiClient** (Main client):
  - **Request Interceptor**: Adds `Authorization: Bearer {token}` to all requests
  - **Response Interceptor**: Handles 401 errors → clears tokens → redirects to login
- **apiAuth** (Auth client):
  - No Bearer token injection
  - No interceptors
  - Used for login/register/resetPassword requests

#### **3. Middleware** (`src/middleware.ts`)

- Protects routes server-side using cookies
- Redirects unauthenticated users to `/login`
- Redirects authenticated users away from auth pages

#### **4. Auth Store** (`src/store/auth/`)

```tsx
const { user, isAuthenticated, setAuth, clearAuth } = useAuthStore();
```

### **Security Features**

- ✅ Automatic token injection in all API requests
- ✅ Server-side route protection
- ✅ Token expiration handling
- ✅ Secure cookie settings (`SameSite=strict`)
- ✅ Automatic cleanup on logout/401 errors

---


### **Authentication Usage**

```tsx
// Login Process using useAuth hook
import { useAuth } from "@/hooks/useAuth";
const { login, loading, error } = useAuth();
const { setAuth } = useAuthStore();

const handleLogin = async (credentials) => {
  await login({
    data: credentials,
    onSuccess: (response) => {
      const { accessToken, user } = response.data;
      setAuth(user, accessToken); // Saves to localStorage + cookie
      router.push("/");
    },
  });
};

// Register Process
const { register } = useAuth();
const handleRegister = async (userData) => {
  await register({
    data: userData,
    onSuccess: (response) => {
      const { accessToken, user } = response.data;
      setAuth(user, accessToken);
      router.push("/");
    },
  });
};

// Reset Password Process
const { resetPassword } = useAuth();
const handleResetPassword = async (email) => {
  await resetPassword({
    data: { email },
    onSuccess: () => {
      // Show success message
    },
  });
};

// Logout Process
const { clearAuth } = useAuthStore();
const handleLogout = () => {
  clearAuth(); // Clears localStorage + cookie
  router.push("/login");
};
```
### **Token Management**

```tsx
import { tokenManager } from "@/lib/tokenManager";

// Check if user is authenticated
const isLoggedIn = tokenManager.hasToken();

// Manual token operations (rarely needed)
tokenManager.setToken("new-token");
tokenManager.removeToken();
```
 