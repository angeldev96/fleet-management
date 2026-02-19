import React from "react";
import { cn } from "lib/utils";

export default function CardAvatar({
  children,
  className,
  plain,
  profile,
  testimonial,
  testimonialFooter,
  ...rest
}) {
  return (
    <div
      className={cn(
        "overflow-hidden mx-auto -mt-12",
        profile && "w-32 h-32 rounded-full shadow-lg",
        testimonial && "w-24 h-24 rounded-full shadow-lg",
        testimonialFooter && "w-10 h-10 rounded-full",
        plain && "mt-0",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
