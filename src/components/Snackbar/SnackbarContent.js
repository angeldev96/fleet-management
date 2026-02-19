import React from "react";
import { cn } from "lib/utils";
import { X } from "lucide-react";

const colorClasses = {
  info: "bg-blue-500 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  primary: "bg-primary text-primary-foreground",
  rose: "bg-pink-500 text-white",
};

export default function SnackbarContent({ message, color = "info", close, icon }) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 shadow-sm",
        colorClasses[color] || colorClasses.info,
      )}
    >
      <div className="flex items-center gap-3">
        {icon !== undefined ? React.createElement(icon, { className: "h-5 w-5 flex-shrink-0" }) : null}
        <span className={cn("flex-1 text-sm", icon !== undefined && "ml-1")}>{message}</span>
        {close !== undefined ? (
          <button
            className="flex-shrink-0 rounded-md p-1 hover:bg-white/20 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
