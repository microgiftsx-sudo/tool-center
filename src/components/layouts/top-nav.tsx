"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutGrid } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TopNav() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="w-full px-6 md:px-10 h-16 flex items-center justify-between">

        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-extrabold shadow">
            أ
          </div>
          <span className="font-bold text-base tracking-tight text-foreground">مركز الأدوات</span>
        </Link>

        {/* Home link only */}
        <nav>
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              pathname === "/"
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                : "text-muted-foreground hover:text-primary hover:bg-primary/10"
            )}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">الرئيسية</span>
          </Link>
        </nav>

      </div>
    </header>
  )
}
