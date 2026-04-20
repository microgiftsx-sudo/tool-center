// components/common/TableView.tsx
import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ApiResponse } from "@/types/common";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export interface ColumnDef<T> {
  key: keyof T | string;
  label: string;
  width?: number;
  align?: "start" | "center" | "end";
  render?: (item: T) => React.ReactNode;
}

interface ColumnOption {
  key: string;
  label: string;
}

interface ColumnFilterProps {
  columns: ColumnOption[];
  visibleColumns: Set<string>;
  onToggleColumn: (columnKey: string) => void;
  onResetColumns: () => void;
}

export interface TableViewProps<T extends { id: React.Key }> {
  tableData: ApiResponse<T>;
  columns: ColumnDef<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  contextMenuItems?: Array<{
    label: string;
    onClick: (item: T) => void;
    className?: string;
    condition?: (item: T) => boolean;
  }>;
  onPageChange?: (page: number) => void;
  currentPage?: number;
  isLoading?: boolean;
}

// ColumnFilter Component - Export for standalone use
export function ColumnFilter({
  columns,
  visibleColumns,
  onToggleColumn,
  onResetColumns,
}: ColumnFilterProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="ml-auto">
          الاعمدة <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {columns.map((column) => {
          return (
            <DropdownMenuCheckboxItem
              key={column.key}
              className="capitalize"
              checked={visibleColumns.has(column.key)}
              onCheckedChange={() => onToggleColumn(column.key)}
            >
              {column.label}
            </DropdownMenuCheckboxItem>
          );
        })}
        <div className="border-t pt-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={onResetColumns}
          >
            إعادة تعيين الأعمدة
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TableView<T extends { id: React.Key }>({
  tableData,
  columns,
  onEdit,
  onDelete,
  contextMenuItems = [],
  onPageChange,
  currentPage = 1,
  isLoading = false,
}: TableViewProps<T>) {
  const defaultContextMenuItems = [
    ...(onEdit
      ? [
          {
            label: "تعديل",
            onClick: onEdit,
            className: "",
          },
        ]
      : []),
    ...contextMenuItems,
    ...(onDelete
      ? [
          {
            label: "حذف",
            onClick: onDelete,
            className: "text-destructive",
          },
        ]
      : []),
  ];

  // Calculate pagination values
  const pagination =
    "pagination" in tableData.data ? tableData.data.pagination : null;
  const totalPages = pagination ? pagination.total_pages : 1;
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  // Generate page numbers to display
  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, "...");
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push("...", totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter(
      (item, index, array) => array.indexOf(item) === index
    );
  };

  return (
    <div className="space-y-4">
      <Card className="!py-0">
        <CardContent className="p-0 !py-0 overflow-hidden !rounded-lg relative">
          {isLoading && (
            <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  جاري التحميل...
                </span>
              </div>
            </div>
          )}
          <Table data-slot="table" className="w-full ">
            <TableHeader className="bg-muted sticky top-0 z-10">
              <TableRow className="">
                {columns.map((col) => (
                  <TableHead
                    className="!text-start "
                    key={String(col.key)}
                    style={{ width: col.width, textAlign: col.align }}
                  >
                    {col.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className="**:data-[slot=table-cell]:first:w-8">
              {tableData.data.items.map((item) => (
                <ContextMenu key={item.id}>
                  <ContextMenuTrigger asChild>
                    <TableRow className="relative z-0    cursor-pointer">
                      {columns.map((col) => {
                        // If it's our "actions" column, we only run render()
                        if (col.key === "actions") {
                          return (
                            <TableCell
                              key="actions"
                              className={cn(
                                col.width ? `w-[${col.width}px]` : ""
                              )}
                              style={{ textAlign: col.align }}
                            >
                              {col.render?.(item)}
                            </TableCell>
                          );
                        }

                        // Otherwise col.key is guaranteed to be keyof T
                        const dataKey = col.key as keyof T;
                        const value = col.render
                          ? col.render(item)
                          : String(item[dataKey] ?? "");

                        return (
                          <TableCell
                            key={String(col.key)}
                            className={cn(
                              col.width ? `w-[${col.width}px]` : ""
                            )}
                            style={{ width: col.width, textAlign: col.align }}
                          >
                            {value}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </ContextMenuTrigger>
                  {defaultContextMenuItems.length > 0 && (
                    <ContextMenuContent>
                      {defaultContextMenuItems
                        .filter((menuItem) => !menuItem.condition || menuItem.condition(item))
                        .map((menuItem, index) => (
                          <ContextMenuItem
                            key={index}
                            onClick={() => menuItem.onClick(item)}
                            className={menuItem.className}
                          >
                            {menuItem.label}
                          </ContextMenuItem>
                        ))}
                    </ContextMenuContent>
                  )}
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination Controls */}

      {totalPages > 1 && onPageChange && (
        <div className=" w-full flex items-center justify-between">
          <div className="text-sm text-muted-foreground w-full">
            {pagination && (
              <>
                عرض {(currentPage - 1) * pagination.per_page + 1} إلى{" "}
                {Math.min(
                  currentPage * pagination.per_page,
                  pagination.total_items
                )}{" "}
                من أصل {pagination.total_items} عنصر
              </>
            )}
          </div>
          <Pagination className="w-fit">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  disabled={!hasPrevPage}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(currentPage - 1);
                  }}
                >
                  السابق
                </PaginationPrevious>
              </PaginationItem>
              {getVisiblePages().map((page, index) => (
                <PaginationItem key={index}>
                  {page === "..." ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      href="#"
                      isActive={page === currentPage}
                      onClick={(e) => {
                        e.preventDefault();
                        onPageChange(page as number);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  disabled={!hasNextPage}
                  onClick={(e) => {
                    e.preventDefault();
                    onPageChange(currentPage + 1);
                  }}
                >
                  التالي
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
