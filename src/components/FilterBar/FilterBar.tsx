import React from "react";
import { cn } from "lib/utils";

interface Filter {
  value: string;
  label: string;
  count?: number | null;
}

interface FilterBarProps {
  filters: Filter[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
  className?: string;
}

export default function FilterBar({ filters, activeFilter, onFilterChange, className }: FilterBarProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-150 cursor-pointer",
            activeFilter === filter.value
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted",
          )}
        >
          {filter.label}
          {filter.count != null && (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-1.5 min-w-5 h-5 text-[10px] font-bold tabular-nums",
                activeFilter === filter.value
                  ? "bg-background/20 text-background"
                  : "bg-muted-foreground/10 text-muted-foreground",
              )}
            >
              {filter.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
