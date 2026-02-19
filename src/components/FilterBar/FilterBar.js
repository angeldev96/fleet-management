import React from "react";
import { cn } from "lib/utils";

export default function FilterBar({ filters, activeFilter, onFilterChange, className }) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
            activeFilter === filter.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
          )}
        >
          {filter.label}
          {filter.count != null && (
            <span
              className={cn(
                "inline-flex items-center justify-center rounded-full px-1.5 min-w-[1.25rem] h-5 text-xs font-semibold",
                activeFilter === filter.value
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-background text-muted-foreground",
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
