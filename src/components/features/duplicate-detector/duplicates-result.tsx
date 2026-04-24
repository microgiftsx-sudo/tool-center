"use client"

import { useEffect, useRef, useState } from "react"
import { Copy, ChevronDown, ChevronUp, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { DuplicateResult } from "@/lib/detectDuplicates"
import { copyTableToClipboard } from "@/lib/copyTable"
import { toast } from "sonner"

interface DuplicatesResultProps {
  results: DuplicateResult[]
  totalRows: number
  /** Full rows from Excel (optional — only in Excel tab) */
  allRows?: Record<string, unknown>[]
  headers?: string[]
  scannedColumn?: string
}

export function DuplicatesResult({
  results,
  totalRows,
  allRows,
  headers,
  scannedColumn,
}: DuplicatesResultProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const uniqueCount = totalRows - results.reduce((acc, r) => acc + r.count - 1, 0)

  function toggleExpand(value: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(value)) { next.delete(value) } else { next.add(value) }
      return next
    })
  }

  async function copyDuplicates() {
    if (allRows && headers && results.length > 0) {
      // Copy as full table of all duplicate rows
      const dupRows = results.flatMap((r) =>
        r.indices.map((idx) => allRows[idx]).filter(Boolean)
      )
      try {
        await copyTableToClipboard(headers, dupRows)
        setCopied(true)
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
        copiedTimerRef.current = setTimeout(() => setCopied(false), 1800)
        toast.success(`تم نسخ ${dupRows.length} صف مكرر`)
      } catch { toast.error("تعذّر النسخ") }
    } else {
      // Text-only mode (text tab)
      const text = results.map((r) => `${r.value} (${r.count} مرات)`).join("\n")
      await navigator.clipboard.writeText(text)
      setCopied(true)
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
      copiedTimerRef.current = setTimeout(() => setCopied(false), 1800)
      toast.success("تم النسخ")
    }
  }

  useEffect(() => {
    return () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold">{totalRows}</p>
            <p className="text-xs text-muted-foreground mt-1">إجمالي القيم</p>
          </CardContent>
        </Card>
        <Card className={results.length > 0 ? "border-destructive/50" : "border-emerald-500/50"}>
          <CardContent className="pt-4 pb-3 text-center">
            <p className={`text-2xl font-bold ${results.length > 0 ? "text-destructive" : "text-emerald-600"}`}>
              {results.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">قيم مكررة</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{uniqueCount}</p>
            <p className="text-xs text-muted-foreground mt-1">قيم فريدة</p>
          </CardContent>
        </Card>
      </div>

      {results.length === 0 ? (
        <p className="text-center text-emerald-600 font-medium py-4">
          لا توجد قيم مكررة 🎉
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              القيم المكررة
              {scannedColumn && (
                <span className="text-muted-foreground font-normal"> — عمود: {scannedColumn}</span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={copyDuplicates}
              className={`gap-1.5 transition-all ${copied ? "bg-emerald-50 border-emerald-300 text-emerald-700" : ""}`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "تم النسخ" : "نسخ الكل"}
            </Button>
          </div>

          <div className="space-y-2 max-h-[520px] overflow-y-auto">
            {results.map((r) => {
              const isOpen = expanded.has(r.value)
              const rowsForValue = allRows
                ? r.indices.map((idx) => allRows[idx]).filter(Boolean)
                : []

              return (
                <div key={r.value} className="border rounded-xl overflow-hidden">
                  {/* Value header row */}
                  <button
                    className="w-full flex items-center justify-between px-4 py-3 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                    onClick={() => allRows && toggleExpand(r.value)}
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="destructive" className="shrink-0">
                        {r.count} مرات
                      </Badge>
                      <span className="text-sm font-semibold">{r.value || <em className="text-muted-foreground">فارغ</em>}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {allRows && (
                        <span className="text-xs text-muted-foreground">
                          الصفوف: {r.indices.map((i) => i + 2).join("، ")}
                        </span>
                      )}
                      {allRows && (
                        isOpen
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  </button>

                  {/* Expandable rows table */}
                  {isOpen && headers && rowsForValue.length > 0 && (
                    <div className="border-t overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableHead className="w-12 text-right text-xs font-semibold py-2 text-muted-foreground">
                              الصف
                            </TableHead>
                            {headers.map((h) => (
                              <TableHead
                                key={h}
                                className={`whitespace-nowrap text-right text-xs font-semibold py-2 ${h === scannedColumn ? "text-destructive" : ""}`}
                              >
                                {h}
                                {h === scannedColumn && " ★"}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rowsForValue.map((row, i) => (
                            <TableRow key={i} className="text-xs">
                              <TableCell className="text-right py-2 text-muted-foreground font-mono">
                                {r.indices[i] + 2}
                              </TableCell>
                              {headers.map((h) => (
                                <TableCell
                                  key={h}
                                  className={`whitespace-nowrap text-right py-2 ${h === scannedColumn ? "font-semibold text-destructive/80" : ""}`}
                                >
                                  {String(row[h] ?? "")}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
