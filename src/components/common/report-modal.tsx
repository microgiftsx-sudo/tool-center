"use client";

import React, { useState, useMemo, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import "@/styles/report-modal.css"; // Import your custom styles for the report modal
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { ColumnDef } from "./table-view";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dateUtils";

export interface ReportModalProps<T extends { id: React.Key }> {
  trigger: React.ReactNode;
  data: T[];
  columns: ColumnDef<T>[];
  title?: string;
  rowColors?: {
    header?: string;
    evenRow?: string;
    oddRow?: string;
  };
  borderStyle?: {
    table?: string;
    cell?: string;
  };
  onGenerateReport?: (config: ReportConfig) => void;
}

export interface ReportConfig {
  title: string;
  selectedColumns: string[];
  textSize: string;
  rowColors: {
    header: string;
    evenRow: string;
    oddRow: string;
  };
  borderStyle: {
    table: string;
    cell: string;
  };
}
const textSizeOptions = [
  { value: "text-[8px]", label: "صغير جداً جداً" },
  { value: "text-[10px]", label: "صغير جداً" },
  { value: "text-xs", label: "صغير" },
  { value: "text-sm", label: "متوسط" },
  { value: "text-base", label: "كبير" },
];

const colorOptions = [
  { value: "bg-white", label: "أبيض" },
  { value: "bg-gray-50", label: "رمادي فاتح" },
  { value: "bg-blue-50", label: "أزرق فاتح" },
  { value: "bg-green-50", label: "أخضر فاتح" },
  { value: "bg-yellow-50", label: "أصفر فاتح" },
  { value: "bg-red-50", label: "أحمر فاتح" },
];

const borderOptions = [
  { value: "border-none", label: "بلا حدود" },
  { value: "border border-gray-200", label: "حدود رفيعة" },
  { value: "border-2 border-gray-300", label: "حدود متوسطة" },
  { value: "border-2 border-gray-500", label: "حدود سميكة" },
];

export function ReportModal<T extends { id: React.Key }>({
  trigger,
  data,
  columns,
  title = "تقرير جديد",
  rowColors = {
    header: "bg-gray-100",
    evenRow: "bg-white",
    oddRow: "bg-gray-50",
  },
  borderStyle = {
    table: "border border-gray-200",
    cell: "border-b border-gray-200",
  },
  onGenerateReport,
}: ReportModalProps<T>) {
  const [open, setOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState(title);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map((col) => String(col.key))
  );
  const [textSize, setTextSize] = useState("text-sm");
  const [headerColor, setHeaderColor] = useState(
    rowColors.header || "bg-gray-100"
  );
  const [evenRowColor, setEvenRowColor] = useState(
    rowColors.evenRow || "bg-white"
  );
  const [oddRowColor, setOddRowColor] = useState(
    rowColors.oddRow || "bg-gray-50"
  );
  const [tableBorder, setTableBorder] = useState(
    borderStyle.table || "border border-gray-200"
  );
  const [cellBorder, setCellBorder] = useState(
    borderStyle.cell || "border-b border-gray-200"
  );

  const printRef = useRef<HTMLDivElement>(null);

  const filteredColumns = useMemo(() => {
    return columns.filter((col) => selectedColumns.includes(String(col.key)));
  }, [columns, selectedColumns]);

  const handleColumnToggle = (columnKey: string) => {
    setSelectedColumns((prev) => {
      if (prev.includes(columnKey)) {
        return prev.filter((key) => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: reportTitle,
  });

  const handleGenerateReport = () => {
    const config: ReportConfig = {
      title: reportTitle,
      selectedColumns,
      textSize,
      rowColors: {
        header: headerColor,
        evenRow: evenRowColor,
        oddRow: oddRowColor,
      },
      borderStyle: {
        table: tableBorder,
        cell: cellBorder,
      },
    };
    onGenerateReport?.(config);
    handlePrint();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="w-fit max-w-[95vw] max-h-[95vh] p-4 overflow-auto"
        style={{ minWidth: "calc(300px + 20mm + 2rem + 1rem)" }}
      >
        <DialogHeader className="py-2 flex ">
          <DialogTitle>معاينة وإنشاء التقرير</DialogTitle> 
        </DialogHeader>

        <div
          className="flex gap-4 "
          style={{ minWidth: "calc(300px + 220mm + 1rem)" }}
        >
          {/* Left Panel - Configuration */}
          <div className="w-[300px] flex-shrink-0 max-h-[calc(95vh-150px)]">
            <Card className="h-full">
              <CardContent className="p-4 space-y-4 overflow-y-auto h-full">
                {/* Report Title */}
                <div className="space-y-2">
                  <Label htmlFor="report-title">عنوان التقرير</Label>
                  <Input
                    id="report-title"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    placeholder="أدخل عنوان التقرير"
                    className="w-full"
                  />
                </div>

                <Separator />

                {/* Column Selection */}
                <div className="space-y-2">
                  <Label>الأعمدة المعروضة</Label>
                  <div className="space-y-2  border rounded p-3  ">
                    {columns.map((col) => (
                      <div
                        key={String(col.key)}
                        className="flex items-center gap-4"
                      >
                        <Checkbox
                          id={`col-${String(col.key)}`}
                          checked={selectedColumns.includes(String(col.key))}
                          onCheckedChange={() =>
                            handleColumnToggle(String(col.key))
                          }
                          className="data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600 data-[state=checked]:text-white dark:data-[state=checked]:border-blue-700 dark:data-[state=checked]:bg-blue-700"
                        />
                        <Label htmlFor={`col-${String(col.key)}`}>
                          {col.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Text Size */}
                <div className="space-y-2 ">
                  <Label>حجم النص</Label>
                  <Select value={textSize} onValueChange={setTextSize}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {textSizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                {/* Row Colors */}
                <div className="space-y-2">
                  <Label>ألوان الصفوف</Label>

                  <div className="space-y-1">
                    <Label className="text-xs">لون رأس الجدول</Label>
                    <Select value={headerColor} onValueChange={setHeaderColor}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">لون الصفوف الزوجية</Label>
                    <Select
                      value={evenRowColor}
                      onValueChange={setEvenRowColor}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">لون الصفوف الفردية</Label>
                    <Select value={oddRowColor} onValueChange={setOddRowColor}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {colorOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Border Style */}
                <div className="space-y-2">
                  <Label>نمط الحدود</Label>

                  <div className="space-y-1">
                    <Label className="text-xs">حدود الجدول</Label>
                    <Select value={tableBorder} onValueChange={setTableBorder}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {borderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">حدود الخلايا</Label>
                    <Select value={cellBorder} onValueChange={setCellBorder}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {borderOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />
              </CardContent>
              <CardFooter className="flex flex-col gap-2 ">
                {/* Actions */}
               
                  <Button onClick={handleGenerateReport} className="w-full">
                    إنشاء التقرير
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    className="w-full"
                  >
                    إغلاق
                  </Button>
              
              </CardFooter>
            </Card>
          </div>
          {/* Right Panel - Report Preview */}
          <div
            className="bg-gray-100 max-h-[calc(95vh-150px)] overflow-y-auto p-4 rounded-2xl"
            style={{ width: "220mm", minWidth: "220mm" }}
          >
            <div
              className="bg-white shadow-lg border border-gray-200 p-6 print:pt-0 print:bg-white print:shadow-none print:border-none report-preview"
              ref={printRef}
              style={{
                width: "210mm",
                minHeight: "297mm",
                margin: "0 auto",
                direction: "rtl",
              }}
            >
              <div className="text-center mb-6 flex justify-between items-center">
                <h3 className={cn("font-bold text-zinc-950 text-sm  ")}>
                  {reportTitle}
                </h3>
                <p className="text-sm text-zinc-700 mt-2">
                  تاريخ الإنشاء: {formatDate(new Date())}
                </p>
              </div>

              <div className="w-full">
                <table
                  className={cn("w-full border-collapse", tableBorder)}
                  style={{
                    tableLayout: "auto",
                    width: "100%",
                  }}
                >
                  <thead>
                    <tr className={headerColor}>
                      {filteredColumns.map((col, index) => (
                        <th
                          key={String(col.key)}
                          className={cn(
                            "px-3 py-2 text-right text-zinc-950 font-semibold",
                            textSize,
                            cellBorder
                          )}
                          style={{
                            textAlign:
                              col.align === "center"
                                ? "center"
                                : col.align === "end"
                                ? "right"
                                : "right",
                          }}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="text-zinc-950">
                    {data.map((item, index) => (
                      <tr
                        key={item.id}
                        className={index % 2 === 0 ? evenRowColor : oddRowColor}
                      >
                        {filteredColumns.map((col) => {
                          const dataKey = col.key as keyof T;
                          const value = col.render
                            ? col.render(item)
                            : String(item[dataKey] ?? "");

                          return (
                            <td
                              key={String(col.key)}
                              className={cn(
                                "px-3 py-2 text-zinc-950",
                                textSize,
                                cellBorder
                              )}
                              style={{
                                textAlign:
                                  col.align === "center"
                                    ? "center"
                                    : col.align === "end"
                                    ? "right"
                                    : "right",
                              }}
                            >
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
