import React from "react";
import { cn } from "lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  pageSizeOptions?: number[];
}

export default function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  onPageChange,
  onPageSizeChange,
  hasNextPage,
  hasPrevPage,
  pageSizeOptions = [10, 25, 50, 100],
}: PaginationProps) {
  const startItem: number = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem: number = Math.min(page * pageSize, totalCount);

  const getPageNumbers = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis-start");
      }

      const start = Math.max(2, page - 1);
      const end = Math.min(totalPages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        pages.push("ellipsis-end");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-5 flex-wrap gap-3 md:gap-4 border-t border-border/50">
      <div className="text-sm text-muted-foreground">
        Showing {startItem} to {endItem} of {totalCount} items
      </div>

      <div className="flex items-center gap-1 md:gap-2 order-first sm:order-none">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-all duration-150"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-0.5 md:gap-1">
          {getPageNumbers().map((pageNum) => {
            if (typeof pageNum === "string") {
              return (
                <span key={pageNum} className="px-1 text-muted-foreground/50">
                  ...
                </span>
              );
            }
            return (
              <button
                key={pageNum}
                className={cn(
                  "inline-flex items-center justify-center min-w-8 h-8 md:min-w-9 md:h-9 rounded-lg text-sm font-medium transition-all duration-150",
                  pageNum === page
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          className="inline-flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:pointer-events-none transition-all duration-150"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground hidden sm:inline">Items per page:</span>
        <select
          value={pageSize}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onPageSizeChange(Number(e.target.value))}
          className="h-8 md:h-9 rounded-lg border border-border/60 bg-background px-2 md:px-3 text-sm focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10 focus-visible:border-primary/40"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
