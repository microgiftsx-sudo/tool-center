"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { tokenManager } from "@/lib/tokenManager"

// Import types from authTypes
import type { User } from './authTypes';

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

interface AuthActions {
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
  checkAuth: () => boolean
}

type AuthStore = AuthState & AuthActions

// Zustand Auth Store (following the plan pattern)
export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,

      // Actions
      setAuth: (user: User, token: string) => {
        // Save token using tokenManager (localStorage + cookies)
        tokenManager.setToken(token)
        
        // Update store state
        set({
          user,
          isAuthenticated: true,
          isLoading: false
        })
      },

      clearAuth: () => {
        // Clear token from localStorage + cookies
        tokenManager.removeToken()
        
        // Clear store state
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      },

      checkAuth: () => {
        const hasToken = tokenManager.hasToken()
        const { user } = get()
        const isAuth = hasToken && !!user
        
        // Update authentication state if it changed
        if (isAuth !== get().isAuthenticated) {
          set({ isAuthenticated: isAuth })
        }
        
        return isAuth
      }
    }),
    {
      name: "auth-store",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)