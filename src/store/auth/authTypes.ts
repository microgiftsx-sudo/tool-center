// Auth-related TypeScript types

export interface User {
  id: number
  userName: string
  fullName: string
  role: string
  isTempPass: boolean
  createdAt?: string
  updatedAt?: string
}

export interface LoginCredentials {
  userName: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}

export interface AuthError {
  message: string
  field?: string
  code?: string
}

// API Response types for authentication endpoints
// Register user types
export interface RegisterUserData {
  fullName: string
  userName: string
  role: string
}

export interface RegisterResponse {
  id: number
  fullName: string
  userName: string
  role: string
  isTempPass: boolean
  defaultPassword: string
}

// Change password types
export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ChangePasswordResponse {
  success: boolean
}

// Users list types
export interface UsersListResponse {
  items: User[]
  pagination: {
    current_page: number
    per_page: number
    total_items: number
    total_pages: number
  }
}

export interface AuthApiResponse<T = unknown> {
  status: "success" | "error"
  message?: string
  data: T
  errors?: AuthError[]
}