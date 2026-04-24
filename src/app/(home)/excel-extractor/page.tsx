"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import * as XLSX from "xlsx"
import { FileSpreadsheet, Loader2, RefreshCw, X, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { FilterPanel } from "@/components/features/excel-extractor/filter-panel"
import { ResultsTable } from "@/components/features/excel-extractor/results-table"
import { ExportBar } from "@/components/features/excel-extractor/export-bar"
import { ProcessingProgress, ProcessingStep } from "@/components/features/excel-extractor/processing-progress"
import {
  ColorRuleModal, ColorRule, resolveCellColor,
} from "@/components/features/excel-extractor/color-rule-modal"
import { useExcelExtractorStore } from "@/store/excel/excelExtractorStore"
import { useExtractedSelectionStore } from "@/store/excel/extractedSelectionStore"
import { useActivityStore } from "@/store/activity/activityStore"
import { useExcelExtractorSync } from "@/hooks/useExcelExtractorSync"
import { toast } from "sonner"

export default function ExcelExtractorPage() {
  // ── Ephemeral local state ────────────────────────────────────────────────────
  const [step, setStep]           = useState<ProcessingStep>("idle")
  const [fileName, setFileName]   = useState("")
  const [headers, setHeaders]     = useState<string[]>([])
  const [allRows, setAllRows]     = useState<Record<string, unknown>[]>([])
  const [selectedKeys, setSelectedKeys] = useState<Set<number>>(new Set())
  const [activeTab, setActiveTab] = useState<"browse" | "selected">("browse")
  const [colorModalCol, setColorModalCol] = useState<string | null>(null)
  const [colorModalKey, setColorModalKey] = useState(0)
  const [dbHealth, setDbHealth] = useState<"idle" | "checking" | "ok" | "fail">("idle")
  const [dbLastCheckedAt, setDbLastCheckedAt] = useState<string>("")
  const dbCheckInFlightRef = useRef(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ── Persisted store state ────────────────────────────────────────────────────
  const {
    filterColumn, setFilterColumn,
    filterValue, setFilterValue,
    selectedColumns, setSelectedColumns, toggleColumn,
    colorRules, updateColorRule,
    resetSettings,
  } = useExcelExtractorStore()

  const logActivity = useActivityStore((s) => s.log)
  const savedSelection = useExtractedSelectionStore((s) => s.savedSelection)
  const savedSelectionInitialized = useExtractedSelectionStore((s) => s.isInitialized)
  const savedSelectionLoading = useExtractedSelectionStore((s) => s.isLoading)
  const loadSavedSelection = useExtractedSelectionStore((s) => s.fetchSavedSelection)
  const saveSelection = useExtractedSelectionStore((s) => s.saveSelection)
  const clearSavedSelection = useExtractedSelectionStore((s) => s.clearSavedSelection)
  useExcelExtractorSync()
  useEffect(() => {
    loadSavedSelection()
  }, [loadSavedSelection])

  // ── File parsing ─────────────────────────────────────────────────────────────
  function handleFile(file: File) {
    setStep("reading")
    const reader = new FileReader()
    reader.onload = (e) => {
      setStep("parsing")
      setTimeout(() => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const wb   = XLSX.read(data, { type: "array" })
          const ws   = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" })
          if (rows.length === 0) { toast.error("الملف فارغ"); setStep("idle"); return }
          setStep("rendering")
          setTimeout(() => {
            const hdrs = Object.keys(rows[0])
            setHeaders(hdrs)
            setAllRows(rows)
            setSelectedKeys(new Set())

            // Apply pre-loaded selectedColumns if they match new headers; else init to all
            const { selectedColumns: storedCols, colorRules: storedRules } =
              useExcelExtractorStore.getState()
            const matching = storedCols.filter((c) => hdrs.includes(c))
            setSelectedColumns(matching.length > 0 ? matching : hdrs)

            setFilterColumn("")
            setFilterValue("")

            const baseName = file.name.replace(/\.[^.]+$/, "")
            setFileName(baseName)

            setStep("done")
            logActivity({
              tool: "excel-extractor",
              label: `تحميل ${rows.length} صف من "${baseName}"`,
              detail: `${hdrs.length} عمود`,
            })
            toast.success(`تم تحميل ${rows.length} صف`)
            setTimeout(() => setStep("idle"), 1800)
          }, 300)
        } catch { toast.error("تعذّر قراءة الملف"); setStep("idle") }
      }, 400)
    }
    reader.onerror = () => { toast.error("فشل في قراءة الملف"); setStep("idle") }
    reader.readAsArrayBuffer(file)
  }

  // ── Filter ───────────────────────────────────────────────────────────────────
  const filteredIndices = useMemo(() => {
    if (activeTab !== "browse") return allRows.map((_, i) => i)
    const searchTerms = filterValue
      .split(/[\n,،]/)
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
    if (searchTerms.length === 0) return allRows.map((_, i) => i)
    return allRows.reduce<number[]>((acc, row, i) => {
      const cols = filterColumn ? [filterColumn] : headers
      const hasMatch = cols.some((c) => {
        const cellValue = String(row[c] ?? "").toLowerCase()
        return searchTerms.some((term) => cellValue.startsWith(term))
      })
      if (hasMatch) acc.push(i)
      return acc
    }, [])
  }, [activeTab, allRows, filterColumn, filterValue, headers])

  const filteredRows   = useMemo(() => filteredIndices.map((i) => allRows[i]), [filteredIndices, allRows])
  const visibleHeaders = useMemo(() => headers.filter((h) => selectedColumns.includes(h)), [headers, selectedColumns])
  const visibleRows    = useMemo(() => filteredRows.map((row) => {
    const out: Record<string, unknown> = {}
    visibleHeaders.forEach((h) => { out[h] = row[h] })
    return out
  }), [filteredRows, visibleHeaders])

  // ── Selection ────────────────────────────────────────────────────────────────
  const toggleRow = useCallback((key: number) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }, [])

  function selectAllVisible() {
    setSelectedKeys((prev) => { const next = new Set(prev); filteredIndices.forEach((k) => next.add(k)); return next })
  }
  function clearAllVisible() {
    setSelectedKeys((prev) => { const next = new Set(prev); filteredIndices.forEach((k) => next.delete(k)); return next })
  }

  const selectedRows = useMemo(() =>
    [...selectedKeys]
      .filter((k) => k < allRows.length)
      .map((k) => {
        const out: Record<string, unknown> = {}
        visibleHeaders.forEach((h) => { out[h] = allRows[k][h] })
        return out
      }),
    [selectedKeys, allRows, visibleHeaders]
  )
  const selectedRowsWithKey = useMemo(
    () =>
      [...selectedKeys]
        .filter((k) => k < allRows.length)
        .map((k) => ({
          key: k,
          row: visibleHeaders.reduce<Record<string, unknown>>((acc, h) => {
            acc[h] = allRows[k][h]
            return acc
          }, {}),
        })),
    [selectedKeys, allRows, visibleHeaders]
  )

  const savedRows = useMemo(() => {
    if (!savedSelection) return []
    return savedSelection.rows
  }, [savedSelection])

  const savedHeaders = useMemo(() => {
    if (!savedSelection) return []
    return savedSelection.headers
  }, [savedSelection])
  const savedRowsWithKey = useMemo(
    () => savedRows.map((row, i) => ({ key: `saved-${i}`, row })),
    [savedRows]
  )
  const selectedTabHeaders = selectedKeys.size > 0 ? visibleHeaders : savedHeaders
  const selectedTabRows = selectedKeys.size > 0 ? selectedRowsWithKey : savedRowsWithKey
  const filteredSelectedTabRows = useMemo(() => {
    if (activeTab !== "selected") return selectedTabRows
    const searchTerms = filterValue
      .split(/[\n,،]/)
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean)
    if (searchTerms.length === 0) return selectedTabRows
    return selectedTabRows.filter(({ row }) => {
      const cols = filterColumn && selectedTabHeaders.includes(filterColumn)
        ? [filterColumn]
        : selectedTabHeaders
      return cols.some((h) => {
        const cellValue = String(row[h] ?? "").toLowerCase()
        return searchTerms.some((term) => cellValue.startsWith(term))
      })
    })
  }, [activeTab, selectedTabRows, filterValue, filterColumn, selectedTabHeaders])

  async function handleSaveSelection() {
    if (selectedKeys.size === 0 || selectedRows.length === 0) {
      toast.error("لا توجد صفوف محددة للحفظ")
      return
    }
    try {
      await saveSelection({
        fileName: fileName || "extract",
        headers: visibleHeaders,
        rows: selectedRows,
        savedAt: new Date().toISOString(),
      })
      toast.success(`تم حفظ ${selectedRows.length} صف في قاعدة البيانات`)
    } catch {
      toast.error("تعذر حفظ الصفوف في قاعدة البيانات")
    }
  }

  // ── Color rules ──────────────────────────────────────────────────────────────
  function handleColorSave(rule: ColorRule | null) {
    if (!colorModalCol) return
    updateColorRule(colorModalCol, rule)
    setColorModalCol(null)
  }

  // ── Reset ────────────────────────────────────────────────────────────────────
  function reset() {
    setFileName(""); setHeaders([]); setAllRows([])
    setSelectedKeys(new Set()); setStep("idle")
    resetSettings()
  }

  function openAnotherFilePicker() {
    fileInputRef.current?.click()
  }

  const isProcessing = step !== "idle" && step !== "done"
  const isFilterActive = filterValue.trim().length > 0
  const hasActiveFileView = !!fileName && visibleHeaders.length > 0

  useEffect(() => {
    if (!hasActiveFileView && activeTab === "browse") {
      setActiveTab("selected")
    }
  }, [hasActiveFileView, activeTab])

  async function checkDatabaseHealth(showToast = true) {
    if (dbCheckInFlightRef.current) return
    dbCheckInFlightRef.current = true
    setDbHealth("checking")
    try {
      const res = await fetch("/api/db-health", { method: "GET", cache: "no-store" })
      const data = (await res.json()) as { ok?: boolean; message?: string }
      setDbLastCheckedAt(new Date().toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }))
      if (data.ok) {
        setDbHealth("ok")
        if (showToast) toast.success("اتصال قاعدة البيانات يعمل")
      } else {
        setDbHealth("fail")
        if (showToast) toast.error(data.message || "قاعدة البيانات غير متصلة")
      }
    } catch {
      setDbHealth("fail")
      if (showToast) toast.error("فشل فحص قاعدة البيانات")
    } finally {
      dbCheckInFlightRef.current = false
    }
  }

  useEffect(() => {
    checkDatabaseHealth(false)
    const intervalId = window.setInterval(() => {
      checkDatabaseHealth(false)
    }, 15000)
    return () => window.clearInterval(intervalId)
  }, [])

  return (
    <div className="space-y-4 sm:space-y-5 w-full">

      {/* ── Page header ── */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold">استخراج بيانات Excel</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">صفّ البيانات، لوّن الأعمدة، حدّد الصفوف، وصدّر ما تحتاجه</p>
        </div>

        {/* Auto-save indicator */}
        {fileName && !isProcessing && (
          <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 flex items-center gap-1.5 mr-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            حفظ تلقائي للإعدادات
          </span>
        )}

        {/* File reset button */}
        {fileName && !isProcessing && (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground w-full sm:w-auto justify-center sm:justify-start" onClick={reset}>
            <X className="w-4 h-4" />
            {fileName}
          </Button>
        )}
      </div>

      {!isProcessing && (
        <div className="flex justify-start">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 w-full sm:w-auto"
            onClick={openAnotherFilePicker}
          >
            <RefreshCw className="w-4 h-4" />
            اختيار ملف آخر
          </Button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.currentTarget.value = ""
        }}
      />

      {/* ── Progress ── */}
      {step !== "idle" && <ProcessingProgress step={step} />}

      {/* ── Main content (tabs) ── */}
      {!isProcessing && (hasActiveFileView || savedRows.length > 0 || savedSelectionLoading || !savedSelectionInitialized) && (
        <div className="space-y-4">

          {/* Filter panel */}
          {hasActiveFileView && (
            <FilterPanel
              headers={headers}
              filterColumn={filterColumn}
              filterValue={filterValue}
              selectedColumns={selectedColumns}
              onColumnChange={setFilterColumn}
              onValueChange={setFilterValue}
              onToggleColumn={toggleColumn}
              onClearFilter={() => setFilterValue("")}
            />
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "browse" | "selected")}>
            <div className="overflow-x-auto -mx-1 px-1 pb-1">
              <TabsList className="w-full min-w-max sm:min-w-0 sm:w-full">
              {hasActiveFileView && (
                <TabsTrigger value="browse" className="flex-1 min-w-[130px] sm:min-w-0 gap-2 text-xs sm:text-sm">
                  جميع الصفوف
                  <Badge variant="secondary" className="text-xs">{filteredIndices.length}</Badge>
                  {isFilterActive && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="مفلتر" />
                  )}
                </TabsTrigger>
              )}
              {hasActiveFileView && (
                <TabsTrigger value="selected" className="flex-1 min-w-[130px] sm:min-w-0 gap-2 text-xs sm:text-sm">
                  الصفوف المحددة
                  {(selectedKeys.size > 0 || savedRows.length > 0) && (
                    <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                      {selectedKeys.size > 0 ? selectedKeys.size : savedRows.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              {!hasActiveFileView && (
                <TabsTrigger value="selected" className="flex-1 min-w-[130px] sm:min-w-0 gap-2 text-xs sm:text-sm">
                  الصفوف المحددة
                  {(savedRows.length > 0 || selectedKeys.size > 0) && (
                    <Badge className="text-xs bg-primary/15 text-primary border-primary/30">
                      {selectedKeys.size > 0 ? selectedKeys.size : savedRows.length}
                    </Badge>
                  )}
                </TabsTrigger>
              )}
              </TabsList>
            </div>

            {/* ── Tab 1: Browse & select ── */}
            {hasActiveFileView && (
              <TabsContent value="browse" className="mt-3">
                <div className="border rounded-xl overflow-hidden">
                  <ResultsTable
                    headers={visibleHeaders}
                    rows={visibleRows}
                    rowKeys={filteredIndices}
                    selectedKeys={selectedKeys}
                    onToggleRow={toggleRow}
                    onSelectAll={selectAllVisible}
                    onClearAll={clearAllVisible}
                    totalCount={filteredIndices.length}
                    colorRules={colorRules}
                    onColorHeader={(col) => { setColorModalCol(col); setColorModalKey((k) => k + 1) }}
                  />
                </div>
                {Object.keys(colorRules).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    انقر على رأس العمود الملوّن لتعديل قاعدة التلوين
                  </p>
                )}
              </TabsContent>
            )}

            {/* ── Tab 2: Selected rows + export ── */}
            {(hasActiveFileView || savedRows.length > 0 || !savedSelectionInitialized || savedSelectionLoading) && (
              <TabsContent value="selected" className="mt-3">
              <div className="border rounded-xl overflow-hidden">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b bg-primary/5">
                  <span className="font-semibold text-sm text-primary">
                    {selectedKeys.size > 0 ? "الصفوف المحددة" : savedRows.length > 0 ? "الصفوف المحفوظة" : "الصفوف المحددة"}
                  </span>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Badge className="bg-primary/15 text-primary border-primary/30 hover:bg-primary/20">
                      {filteredSelectedTabRows.length}
                      {(selectedKeys.size > 0 ? selectedRowsWithKey.length : savedRowsWithKey.length) !== filteredSelectedTabRows.length
                        ? ` / ${selectedKeys.size > 0 ? selectedRowsWithKey.length : savedRowsWithKey.length}`
                        : ""}
                      {" "}صف
                    </Badge>
                    {selectedKeys.size > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => setSelectedKeys(new Set())}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {selectedKeys.size === 0 && savedRows.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={async () => {
                          try {
                            await clearSavedSelection()
                            toast.success("تم مسح الصفوف المحفوظة من قاعدة البيانات")
                          } catch {
                            toast.error("تعذر مسح الصفوف المحفوظة")
                          }
                        }}
                      >
                        مسح الحفظ
                      </Button>
                    )}
                  </div>
                </div>

                {(selectedKeys.size === 0 && savedRows.length === 0) ? (
                  (!savedSelectionInitialized || savedSelectionLoading) ? (
                    <div className="flex items-center justify-center gap-2 py-16 px-6 text-center text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm">جاري تحميل الصفوف المحفوظة...</p>
                    </div>
                  ) : (
                  <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-muted-foreground">
                    <FileSpreadsheet className="w-10 h-10 mb-3 opacity-20" />
                    <p className="text-sm">انتقل إلى تبويب &quot;جميع الصفوف&quot; وحدّد ما تريد</p>
                  </div>
                  )
                ) : (
                  <div className="flex flex-col">
                    {selectedKeys.size > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b bg-muted/20">
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          احفظ التحديد الحالي ليبقى بعد إعادة تحميل الصفحة
                        </p>
                        <Button size="sm" className="w-full sm:w-auto" onClick={handleSaveSelection}>
                          حفظ التحديد
                        </Button>
                      </div>
                    )}
                    <div className="overflow-auto max-h-[460px] border-b">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            {selectedTabHeaders.map((h) => (
                              <TableHead key={h} className="whitespace-nowrap text-right text-xs font-semibold py-2">
                                {h}
                              </TableHead>
                            ))}
                            <TableHead className="w-8" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSelectedTabRows.map(({ key: originalKey, row }) => {
                            const headersToRender = selectedTabHeaders
                            const rowColor = headersToRender.reduce<string | undefined>((found, h) => {
                              if (found) return found
                              return resolveCellColor(colorRules, h, row[h])
                            }, undefined)
                            return (
                              <TableRow
                                key={originalKey}
                                className="text-xs"
                                style={rowColor ? { backgroundColor: rowColor + "44" } : undefined}
                              >
                                {headersToRender.map((h) => {
                                  const cellColor = resolveCellColor(colorRules, h, row[h])
                                  return (
                                    <TableCell
                                      key={h}
                                      className="whitespace-nowrap text-right py-2"
                                      style={cellColor ? {
                                        backgroundColor: cellColor + "55",
                                        borderInlineStart: `3px solid ${cellColor}`,
                                      } : undefined}
                                    >
                                      {String(row[h] ?? "")}
                                    </TableCell>
                                  )
                                })}
                                <TableCell className="py-2 px-2">
                                  {selectedKeys.size > 0 && (
                                    <button
                                      onClick={() => {
                                        if (typeof originalKey === "number") toggleRow(originalKey)
                                      }}
                                      className="text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </TableCell>
                              </TableRow>
                            )
                          })}
                        </TableBody>
                      </Table>
                    </div>
                    <div className="p-2 sm:p-3">
                      <ExportBar
                        headers={selectedTabHeaders}
                        allRows={filteredSelectedTabRows.map(({ row }) => row)}
                        selectedRows={[]}
                        fileName={selectedKeys.size > 0 ? fileName : `${savedSelection?.fileName ?? "saved"}_saved`}
                      />
                    </div>
                  </div>
                )}
              </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-30 sm:static sm:z-auto sm:flex sm:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 shadow-sm bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          onClick={() => { checkDatabaseHealth(true) }}
          disabled={dbHealth === "checking"}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              dbHealth === "ok"
                ? "bg-emerald-500"
                : dbHealth === "fail"
                  ? "bg-red-500"
                  : "bg-muted-foreground/40"
            }`}
          />
          {dbHealth === "checking" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {dbHealth === "ok" ? "DB متصل" : dbHealth === "fail" ? "DB غير متصل" : "حالة DB"}
          {dbLastCheckedAt && (
            <span className="text-[10px] text-muted-foreground/80 mr-1">
              {dbLastCheckedAt}
            </span>
          )}
        </Button>
      </div>

      {/* ── Color Rule Modal — key forces full remount every open so useState initializers always re-run with latest existingRule ── */}
      {colorModalCol && (
        <ColorRuleModal
          key={`${colorModalCol}-${colorModalKey}`}
          column={colorModalCol}
          allRows={allRows}
          existingRule={colorRules[colorModalCol]}
          open={!!colorModalCol}
          onClose={() => setColorModalCol(null)}
          onSave={handleColorSave}
        />
      )}
    </div>
  )
}
