// components/content-view/CustomPagination.tsx
import React from "react";
import { Button } from "@/components/ui/button";

export interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
}: CustomPaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-end space-x-2 py-4">
      {pages.map((p) => (
        <Button
          key={p}
          size="sm"
          variant={p === currentPage ? "default" : "outline"}
          onClick={() => onPageChange(p)}
        >
          {p}
        </Button>
      ))}
    </div>
  );
}
