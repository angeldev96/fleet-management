import React from "react";
import { cn } from "lib/utils";

export default function CardFooter({
  className,
  children,
  plain,
  profile,
  pricing,
  testimonial,
  stats,
  chart,
  product,
  ...rest
}) {
  return (
    <div
      className={cn(
        "flex items-center px-5 py-3 border-t border-border/50",
        (stats || chart || product) && "text-sm text-muted-foreground",
        (profile || testimonial) && "justify-center",
        plain && "border-transparent",
        pricing && "justify-center",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
