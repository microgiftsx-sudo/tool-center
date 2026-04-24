"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutGrid, LogOut, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth/authStore"
import apiClient from "@/lib/axiosClients"
import { toast } from "sonner"

export default function TopNav() {
  const pathname = usePathname()
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  async function handleLogout() {
    try {
      await apiClient.post("/api/auth/logout")
    } catch {
      // ignore server logout errors, always clear local session
    }
    clearAuth()
    toast.success("تم تسجيل الخروج")
    router.push("/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="w-full px-3 sm:px-4 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-2">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-extrabold shadow shrink-0">
            أ
          </div>
          <span className="font-bold text-lg sm:text-base tracking-tight text-foreground truncate">مركز الأدوات</span>
        </Link>

        {/* Navigation + auth actions */}
        <nav className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="hidden lg:inline">الرئيسية</span>
          </Link>
          {user?.role === "admin" && (
            <Link
              href="/admin-dashboard"
              className={cn(
                "flex items-center gap-2 px-2.5 sm:px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                pathname === "/admin-dashboard"
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:text-primary hover:bg-primary/10"
              )}
            >
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline">لوحة الأدمن</span>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 px-2.5 sm:px-3 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </Button>
        </nav>

      </div>
    </header>
  )
}
