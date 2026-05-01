"use client"

import { Clock, FileSpreadsheet, RotateCcw, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { RecentFileEntry } from "@/store/excel/excelExtractorStore"

interface RecentFilesSectionProps {
  recentFiles: RecentFileEntry[]
  isLoading: boolean
  isInitialized: boolean
  onRestore: (entry: RecentFileEntry) => void
  onRemove: (fileId: number | string) => void
  onClear: () => void
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("ar-SA", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function RecentFilesSection({
  recentFiles,
  isLoading,
  isInitialized,
  onRestore,
  onRemove,
  onClear,
}: RecentFilesSectionProps) {
  if (!isLoading && isInitialized && recentFiles.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>الملفات الأخيرة</span>
        </div>
        {!isLoading && recentFiles.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 text-xs text-muted-foreground hover:text-destructive px-2"
            onClick={onClear}
          >
            مسح الكل
          </Button>
        )}
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))
          : recentFiles.map((entry) => (
              <div
                key={entry.id ?? entry.fileName}
                className="border rounded-lg p-3 flex flex-col gap-2 hover:bg-muted/30 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-sm font-medium truncate" title={entry.fileName}>
                      {entry.fileName}
                    </span>
                  </div>
                  <button
                    onClick={() => onRemove(entry.id ?? entry.fileName)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{entry.rowCount.toLocaleString("ar-SA")} صف</span>
                  <span>{entry.headers.length} عمود</span>
                  <span className="mr-auto">{formatDate(entry.uploadedAt)}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5 w-full"
                  onClick={() => onRestore(entry)}
                >
                  <RotateCcw className="w-3 h-3" />
                  استعادة الإعدادات
                </Button>
              </div>
            ))}
      </div>
    </div>
  )
}
