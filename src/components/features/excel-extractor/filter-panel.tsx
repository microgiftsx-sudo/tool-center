"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface FilterPanelProps {
  headers: string[]
  filterColumn: string
  filterValue: string
  selectedColumns: string[]
  onColumnChange: (col: string) => void
  onValueChange: (val: string) => void
  onToggleColumn: (col: string) => void
  onClearFilter: () => void
}

export function FilterPanel({
  headers,
  filterColumn,
  filterValue,
  selectedColumns,
  onColumnChange,
  onValueChange,
  onToggleColumn,
  onClearFilter,
}: FilterPanelProps) {
  return (
    <div className="space-y-4 p-3 sm:p-5 border rounded-xl bg-muted/20">
      {/* Filter row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Label>البحث في عمود</Label>
          <Select
            value={filterColumn || "__all__"}
            onValueChange={(v) => onColumnChange(v === "__all__" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="اختر عموداً أو ابحث في الكل" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">— البحث في كل الأعمدة —</SelectItem>
              {headers.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>قيم البحث (متعدد)</Label>
          <div className="flex gap-2">
            <Textarea
              placeholder={"مثال:\nاحمد\nمحمد, خالد"}
              value={filterValue}
              onChange={(e) => onValueChange(e.target.value)}
              className="text-sm min-h-[92px] resize-y"
            />
            {filterValue && (
              <Button variant="ghost" size="icon" onClick={onClearFilter} className="shrink-0">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            أدخل أكثر من قيمة (كل سطر أو فاصلة). سيتم عرض الصف إذا طابق أي قيمة.
          </p>
        </div>
      </div>

      {/* Column visibility */}
      <div className="space-y-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Label className="text-sm">الأعمدة المعروضة</Label>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <button
              onClick={() => headers.forEach((h) => !selectedColumns.includes(h) && onToggleColumn(h))}
              className="px-2 py-1 rounded-md border hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              تحديد الكل
            </button>
            <button
              onClick={() => headers.forEach((h) => selectedColumns.includes(h) && onToggleColumn(h))}
              className="px-2 py-1 rounded-md border hover:text-foreground hover:border-foreground/30 transition-colors"
            >
              إلغاء الكل
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-3 gap-y-2 pt-1 max-h-44 overflow-auto pr-1">
          {headers.map((h) => (
            <label key={h} className="flex items-center gap-2 cursor-pointer select-none min-w-0">
              <Checkbox
                checked={selectedColumns.includes(h)}
                onCheckedChange={() => onToggleColumn(h)}
              />
              <span className="text-sm truncate">{h}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
