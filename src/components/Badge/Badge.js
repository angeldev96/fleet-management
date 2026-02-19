import React from "react";
import { cn } from "lib/utils";

const colorClasses = {
  primary: "bg-primary/10 text-primary",
  info: "bg-blue-500/10 text-blue-600",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  danger: "bg-red-500/10 text-red-600",
  rose: "bg-pink-500/10 text-pink-600",
  gray: "bg-zinc-100 text-zinc-600",
};

export default function Badge({ color, children }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-current/10",
        colorClasses[color] || colorClasses.gray,
      )}
    >
      {children}
    </span>
  );
}
