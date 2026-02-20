import React from "react";
import { cn } from "lib/utils";

interface GridContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  spacing?: number;
}

export default function GridContainer({ children, className, ...rest }: GridContainerProps) {
  return (
    <div className={cn("grid grid-cols-12 gap-4 md:gap-6", className)} {...rest}>
      {children}
    </div>
  );
}
