import React from "react";
import { cn } from "lib/utils";

const colorClasses = {
  primary: "bg-primary text-primary-foreground",
  info: "bg-blue-500 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
  danger: "bg-red-500 text-white",
  rose: "bg-pink-500 text-white",
};

export default function CardText({ className, children, color, ...rest }) {
  return (
    <div
      className={cn(
        "inline-block rounded-lg px-5 py-3",
        color ? colorClasses[color] : undefined,
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
