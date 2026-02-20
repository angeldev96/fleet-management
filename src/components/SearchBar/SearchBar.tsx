import React from "react";
import { cn } from "lib/utils";
import { Search } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder = "Search...", className }) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-10 w-full rounded-xl border border-border/60 bg-background pl-10 pr-4 text-sm transition-all duration-200 placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-primary/10 focus-visible:border-primary/40"
      />
    </div>
  );
}
