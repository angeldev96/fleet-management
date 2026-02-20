import React from "react";
import { cn } from "lib/utils";

type CardIconColor = "primary" | "info" | "success" | "warning" | "danger" | "rose";

const colorClasses: Record<CardIconColor, string> = {
  primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-primary/30",
  info: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30",
  success: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-emerald-500/30",
  warning: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-500/30",
  danger: "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-500/30",
  rose: "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-pink-500/30",
};

interface CardIconProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  color?: CardIconColor;
}

export default function CardIcon({ className, children, color, ...rest }: CardIconProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl p-4 -mt-5 ml-5 shadow-lg",
        color ? colorClasses[color] : "bg-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
