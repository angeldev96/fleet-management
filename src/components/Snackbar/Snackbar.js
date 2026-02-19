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

export default function Snackbar({ message, color = "info", close, icon, place, open, closeNotification }) {
  if (!open) return null;

  const positionClasses = {
    tl: "top-5 left-5",
    tr: "top-5 right-5",
    tc: "top-5 left-1/2 -translate-x-1/2",
    bl: "bottom-5 left-5",
    br: "bottom-5 right-5",
    bc: "bottom-5 left-1/2 -translate-x-1/2",
  };

  return (
    <div
      className={cn(
        "fixed z-[9999] min-w-[300px] max-w-md rounded-lg px-4 py-3 shadow-lg",
        "animate-in fade-in slide-in-from-top-2 duration-300",
        colorClasses[color] || colorClasses.info,
        positionClasses[place] || positionClasses.tr,
      )}
    >
      <div className="flex items-center gap-3">
        {icon !== undefined ? React.createElement(icon, { className: "h-5 w-5 flex-shrink-0" }) : null}
        <span className={cn("flex-1 text-sm", icon !== undefined && "ml-1")}>{message}</span>
        {close !== undefined ? (
          <button
            onClick={() => closeNotification()}
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
