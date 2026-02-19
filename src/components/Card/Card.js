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

export default function Card({
  className,
  children,
  plain,
  profile,
  blog,
  raised,
  background,
  pricing,
  color,
  product,
  testimonial,
  chart,
  login,
  ...rest
}) {
  return (
    <div
      className={cn(
        "rounded-xl bg-card text-card-foreground border border-border/60 flex flex-col mb-6",
        !plain && "shadow-(--shadow-card) hover:shadow-(--shadow-card-hover) transition-all duration-200",
        plain && "shadow-none border-transparent bg-transparent",
        raised && "shadow-(--shadow-elevated)",
        (profile || testimonial) && "mt-8 text-center",
        chart && "overflow-hidden",
        login && "max-w-md mx-auto",
        background && "bg-cover bg-center",
        pricing && "text-center",
        color && colorClasses[color],
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
