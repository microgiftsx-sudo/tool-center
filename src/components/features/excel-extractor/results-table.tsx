"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface ResultsTableProps {
  headers: string[]
  rows: Record<string, unknown>[]
  /** Original index in allRows for stable selection tracking */
  rowKeys: number[]
  selectedKeys: Set<number>
  onToggleRow: (key: number) => void
  onSelectAll: () => void
  onClearAll: () => void
  totalCount: number
}

const PAGE_SIZE = 200

export function ResultsTable({
  headers,
  rows,
  rowKeys,
  selectedKeys,
  onToggleRow,
  onSelectAll,
  onClearAll,
  totalCount,
}: ResultsTableProps) {
  const displayRows = rows.slice(0, PAGE_SIZE)
  const displayKeys = rowKeys.slice(0, PAGE_SIZE)
  const allSelected = displayKeys.length > 0 && displayKeys.every((k) => selectedKeys.has(k))
  const someSelected = displayKeys.some((k) => selectedKeys.has(k))

  return (
    <div>
      <div className="flex items-center justify-between text-xs px-4 py-2 border-b bg-muted/10 text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{totalCount}</span> صف
          {totalCount > PAGE_SIZE && <span> · يُعرض أول {PAGE_SIZE}</span>}
        </span>
        {selectedKeys.size > 0 && (
          <span className="text-primary font-medium">
            {selectedKeys.size} محدد
          </span>
        )}
      </div>

      <div className="overflow-auto max-h-[520px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="w-10 text-center px-3">
                <Checkbox
                  checked={allSelected}
                  data-state={someSelected && !allSelected ? "indeterminate" : undefined}
                  onCheckedChange={() => allSelected ? onClearAll() : onSelectAll()}
                  aria-label="تحديد الكل"
                />
              </TableHead>
              {headers.map((h) => (
                <TableHead key={h} className="whitespace-nowrap text-right font-semibold">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length + 1} className="text-center text-muted-foreground py-10">
                  لا توجد نتائج مطابقة
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, i) => {
                const key = displayKeys[i]
                const selected = selectedKeys.has(key)
                return (
                  <TableRow
                    key={key}
                    data-selected={selected}
                    className="cursor-pointer data-[selected=true]:bg-primary/8 data-[selected=true]:hover:bg-primary/12"
                    onClick={() => onToggleRow(key)}
                  >
                    <TableCell className="w-10 text-center px-3" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => onToggleRow(key)}
                        aria-label="تحديد الصف"
                      />
                    </TableCell>
                    {headers.map((h) => (
                      <TableCell key={h} className="whitespace-nowrap text-right">
                        {String(row[h] ?? "")}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

