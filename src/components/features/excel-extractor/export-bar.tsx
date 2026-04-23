"use client"

import { Download, Copy, Printer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { copyTableToClipboard } from "@/lib/copyTable"

interface ExportBarProps {
  headers: string[]
  allRows: Record<string, unknown>[]
  selectedRows: Record<string, unknown>[]
  fileName: string
}

export function ExportBar({ headers, allRows, selectedRows, fileName }: ExportBarProps) {
  const exportTarget = selectedRows.length > 0 ? selectedRows : allRows
  const label = selectedRows.length > 0
    ? `تصدير المحدد (${selectedRows.length})`
    : `تصدير الكل (${allRows.length})`
  const hasData = headers.length > 0 && exportTarget.length > 0

  function buildPrintHtml() {
    const thCells = headers
      .map((h) => `<th>${h}</th>`)
      .join("")
    const bodyRows = exportTarget
      .map((row) => {
        const tds = headers.map((h) => `<td>${String(row[h] ?? "")}</td>`).join("")
        return `<tr>${tds}</tr>`
      })
      .join("")

    return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <title>طباعة — ${fileName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Cairo', Arial, sans-serif;
      direction: rtl;
      padding: 24px;
      color: #111;
      background: #fff;
    }
    h2 { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    p.meta { font-size: 11px; color: #666; margin-bottom: 16px; }
    table { border-collapse: collapse; width: 100%; font-size: 12px; }
    thead tr { background: #1e40af; color: #fff; }
    th { padding: 8px 12px; text-align: right; font-weight: 600; border: 1px solid #1e3a8a; }
    td { padding: 7px 12px; text-align: right; border: 1px solid #d1d5db; }
    tbody tr:nth-child(even) { background: #f0f4ff; }
    tbody tr:hover { background: #dbeafe; }
    @media print {
      body { padding: 10px; }
      @page { margin: 1cm; size: A4 landscape; }
    }
  </style>
</head>
<body>
  <h2>${fileName}</h2>
  <p class="meta">
    ${exportTarget.length} صف · ${headers.length} عمود
    ${selectedRows.length > 0 ? "· صفوف محددة فقط" : ""}
  </p>
  <table>
    <thead><tr>${thCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <script>window.onload = () => { window.print(); window.close(); }<\/script>
</body>
</html>`
  }

  function exportExcel() {
    if (!hasData) {
      toast.error("لا توجد بيانات للتصدير")
      return
    }
    const data = exportTarget.map((row) => {
      const r: Record<string, unknown> = {}
      headers.forEach((h) => { r[h] = row[h] ?? "" })
      return r
    })
    const ws = XLSX.utils.json_to_sheet(data, { header: headers })
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "النتائج")
    XLSX.writeFile(wb, `${fileName}_extracted.xlsx`)
    toast.success("تم تصدير الملف بنجاح")
  }

  async function copyToClipboard() {
    if (!hasData) {
      toast.error("لا توجد بيانات للنسخ")
      return
    }
    try {
      await copyTableToClipboard(headers, exportTarget)
      toast.success(`تم نسخ ${exportTarget.length} صف — الصقها في Excel أو Word`)
    } catch {
      try {
        // Fallback for browsers/webviews where Clipboard API is blocked
        const tsv = [
          headers.join("\t"),
          ...exportTarget.map((r) => headers.map((h) => String(r[h] ?? "")).join("\t")),
        ].join("\n")
        const ta = document.createElement("textarea")
        ta.value = tsv
        ta.style.position = "fixed"
        ta.style.top = "-9999px"
        document.body.appendChild(ta)
        ta.focus()
        ta.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(ta)
        if (!ok) throw new Error("execCommand copy failed")
        toast.success(`تم نسخ ${exportTarget.length} صف`)
      } catch {
        toast.error("تعذّر النسخ على هذا المتصفح")
      }
    }
  }

  function printTable() {
    if (!hasData) {
      toast.error("لا توجد بيانات للطباعة")
      return
    }

    const win = window.open("", "_blank", "width=1000,height=700")
    if (win) {
      win.document.write(buildPrintHtml())
      win.document.close()
      return
    }

    // Fallback for popup-blocked mobile browsers: print via hidden iframe
    const iframe = document.createElement("iframe")
    iframe.style.position = "fixed"
    iframe.style.right = "0"
    iframe.style.bottom = "0"
    iframe.style.width = "0"
    iframe.style.height = "0"
    iframe.style.border = "0"
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc || !iframe.contentWindow) {
      toast.error("تعذّر فتح الطباعة")
      document.body.removeChild(iframe)
      return
    }
    doc.open()
    doc.write(buildPrintHtml())
    doc.close()
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      setTimeout(() => document.body.removeChild(iframe), 1000)
    }, 250)
  }

  return (
    <div className="flex flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 border rounded-xl bg-primary/5 border-primary/20">
      {selectedRows.length > 0 && (
        <Badge className="text-xs gap-1 bg-primary/15 text-primary border-primary/30 hover:bg-primary/20 w-full sm:w-auto justify-center">
          {selectedRows.length} صف محدد
        </Badge>
      )}
      <Button onClick={exportExcel} className="gap-2 w-full sm:w-auto">
        <Download className="w-4 h-4" />
        {label}
      </Button>
      <Button variant="outline" onClick={copyToClipboard} className="gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary flex-1 sm:flex-none" disabled={!hasData}>
        <Copy className="w-4 h-4" />
        نسخ
      </Button>
      <Button variant="outline" onClick={printTable} className="gap-2 border-primary/30 hover:bg-primary/10 hover:text-primary flex-1 sm:flex-none" disabled={!hasData}>
        <Printer className="w-4 h-4" />
        طباعة {selectedRows.length > 0 ? `(${selectedRows.length})` : `(${allRows.length})`}
      </Button>
    </div>
  )
}
