"use client";

import { useAuthStore } from "@/store/auth/authStore";

export const usePermissions = () => {
  const { user, isAuthenticated } = useAuthStore();

  const hasRole = (role: string): boolean => {
    return isAuthenticated && user?.role === role;
  };

  const hasAnyRole = (roles: string[]): boolean => {
    return isAuthenticated && user?.role ? roles.includes(user.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isUser = (): boolean => {
    return hasRole('user');
  };

  const canAccess = (allowedRoles?: string[]): boolean => {
    if (!allowedRoles || allowedRoles.length === 0) {
      // If no specific roles required, just check if user is authenticated
      return isAuthenticated;
    }
    return hasAnyRole(allowedRoles);
  };

  return {
    user,
    isAuthenticated,
    hasRole,
    hasAnyRole,
    isAdmin,
    isUser,
    canAccess,
  };
};