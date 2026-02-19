import React from "react";
import { cn } from "lib/utils";
import { STATUS_CLASSES, SEVERITY_CLASSES } from "types/database";

const allClasses = { ...STATUS_CLASSES, ...SEVERITY_CLASSES };

export default function StatusBadge({ status, label, className }) {
  const classes = allClasses[status];
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        classes?.badge || "bg-gray-100 text-gray-600",
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", classes?.dot || "bg-gray-400")} />
      {displayLabel}
    </span>
  );
}
