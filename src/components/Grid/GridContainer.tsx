import React from "react";
import { cn } from "lib/utils";

export default function GridContainer({ children, className, ...rest }) {
  return (
    <div className={cn("grid grid-cols-12 gap-4 md:gap-6", className)} {...rest}>
      {children}
    </div>
  );
}
