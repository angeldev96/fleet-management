import React from "react";
import { cn } from "lib/utils";

const colorClasses = {
  primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
  info: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
  success: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
  warning: "bg-gradient-to-br from-amber-500 to-amber-600 text-white",
  danger: "bg-gradient-to-br from-red-500 to-red-600 text-white",
  rose: "bg-gradient-to-br from-pink-500 to-pink-600 text-white",
};

export default function CardHeader({
  className,
  children,
  color,
  plain,
  image,
  contact,
  signup,
  stats,
  icon,
  text,
  ...rest
}) {
  return (
    <div
      className={cn(
        // Icon variant: floating colored box
        icon && "flex items-center justify-center w-fit rounded-xl p-4 -mt-5 ml-5 shadow-md",
        icon && (color ? colorClasses[color] : "bg-muted"),
        // Stats variant: flex row layout
        stats && !icon && "flex items-center justify-between px-5 pt-4",
        // Text variant
        text && !icon && !stats && "px-5 pt-4",
        // Default layout
        !icon && !stats && !text && "px-5 pt-5",
        // Color on non-icon headers: floating colored header
        !icon && color && colorClasses[color] && "rounded-xl mx-4 -mt-6 p-4 shadow-md",
        !icon && color && colorClasses[color],
        // Plain: no background/shadow
        plain && "bg-transparent shadow-none p-0",
        // Image: no padding, rounded top
        image && "p-0 overflow-hidden rounded-t-xl",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
