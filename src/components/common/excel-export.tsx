"use client";

import React, { useState } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Loader2 } from "lucide-react";

export interface ExcelColumn<T> {
  key: keyof T;
  label: string;
  width?: number;
  render?: (item: T) => React.ReactNode | string | number;
}

export interface ExcelExportProps<T> {
  data: T[];
  columns: ExcelColumn<T>[];
  filename?: string;
  sheetName?: string;
  trigger?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onExportStart?: () => void;
  onExportComplete?: () => void;
  onExportError?: (error: Error) => void;
  onGenerateReport?: () => void | Promise<void>;
}

export function ExcelExport<T extends Record<string, any>>({
  data,
  columns,
  filename = "export",
  sheetName = "Sheet1",
  trigger,
  className,
  disabled = false,
  onExportStart,
  onExportComplete,
  onExportError,
  onGenerateReport,
}: ExcelExportProps<T>) {
  const [isExporting, setIsExporting] = useState(false);

  const formatCellValue = (value: any): string | number => {
    if (value === null || value === undefined) {
      return "";
    }
    
    if (React.isValidElement(value)) {
      // Extract text content from React elements
      const extractText = (element: any): string => {
        if (typeof element === "string" || typeof element === "number") {
          return element.toString();
        }
        if (React.isValidElement(element)) {
          if (typeof (element.props as any).children === "string") {
            return (element.props as any).children;
          }
          if (Array.isArray((element.props as any).children)) {
            return (element.props as any).children
              .map(extractText)
              .filter(Boolean)
              .join(" ");
          }
          return extractText((element.props as any).children) || "";
        }
        return "";
      };
      return extractText(value);
    }
    
    if (typeof value === "object") {
      return JSON.stringify(value);
    }
    
    return value.toString();
  };

  const handleExport = async () => {
    if (disabled || isExporting) return;

    try {
      setIsExporting(true);
      onExportStart?.();
      
      // Call onGenerateReport if provided (for fetching data)
      if (onGenerateReport) {
        await onGenerateReport();
      }
      
      // Check if we have data after potential fetch
      if (!data.length) {
        console.warn("No data available for export - but proceeding to create empty file");
        // Don't return - allow empty export or show message
      }

      // Prepare data for Excel
      const excelData = data.map((item) => {
        const row: Record<string, any> = {};
        columns.forEach((col) => {
          const value = col.render ? col.render(item) : item[col.key];
          row[col.label] = formatCellValue(value);
        });
        return row;
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths if specified
      const colWidths = columns.map((col) => ({
        wch: col.width ? col.width / 8 : 15, // Convert pixels to character width approximation
      }));
      ws["!cols"] = colWidths;

      // Style the header row
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1:A1");
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_cell({ r: 0, c: C });
        if (!ws[address]) continue;
        ws[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "CCCCCC" } },
          alignment: { horizontal: "center" },
        };
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      // Generate Excel file and trigger download
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
      const finalFilename = `${filename}_${timestamp}.xlsx`;

      saveAs(blob, finalFilename);
      onExportComplete?.();
    } catch (error) {
      console.error("Excel export error:", error);
      onExportError?.(error as Error);
    } finally {
      setIsExporting(false);
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={className}
      disabled={disabled || isExporting}
      onClick={handleExport}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
          جاري التصدير...
        </>
      ) : (
        <>
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          تصدير Excel
        </>
      )}
    </Button>
  );

  if (trigger) {
    return React.cloneElement(trigger as React.ReactElement, {
      onClick: handleExport,
      disabled: disabled || isExporting,
    } as any);
  }

  return defaultTrigger;
}

// Utility function to create Excel-compatible columns from table columns
export function createExcelColumns<T>(
  tableColumns: Array<{
    key: string;
    label: string;
    width?: number;
    render?: (item: T) => any;
  }>
): ExcelColumn<T>[] {
  return tableColumns.map((col) => ({
    key: col.key as keyof T,
    label: col.label,
    width: col.width,
    render: col.render,
  }));
}