import React from "react";
import { cn } from "lib/utils";

interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  background?: boolean;
  plain?: boolean;
  formHorizontal?: boolean;
  pricing?: boolean;
  signup?: boolean;
  color?: string;
  profile?: boolean;
  calendar?: boolean;
}

export default function CardBody({
  className,
  children,
  background,
  plain,
  formHorizontal,
  pricing,
  signup,
  color,
  profile,
  calendar,
  ...rest
}: CardBodyProps) {
  return (
    <div
      className={cn(
        "px-5 py-3 flex-1",
        plain && "p-0",
        profile && "text-center",
        formHorizontal && "flex flex-row flex-wrap",
        pricing && "py-4",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
