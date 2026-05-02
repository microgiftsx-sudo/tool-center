"use client"

import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime"
import { toast } from "sonner"
import apiClient from "@/lib/axiosClients"
import { isRemoteAuthEnabled } from "@/lib/auth-endpoints"

export async function logoutAndRedirect(params: {
  clearAuth: () => void
  router: AppRouterInstance
  showToast?: boolean
}) {
  const { clearAuth, router, showToast = true } = params
  try {
    if (!isRemoteAuthEnabled()) {
      await apiClient.post("/api/auth/logout")
    }
  } catch {
    // ignore server logout errors, always clear local session
  }
  clearAuth()
  if (showToast) toast.success("تم تسجيل الخروج")
  router.push("/login")
}
