import React from "react";
import { cn } from "lib/utils";

const colorClasses = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  info: "bg-blue-500 text-white hover:bg-blue-600",
  success: "bg-emerald-500 text-white hover:bg-emerald-600",
  warning: "bg-amber-500 text-white hover:bg-amber-600",
  danger: "bg-red-500 text-white hover:bg-red-600",
  rose: "bg-pink-500 text-white hover:bg-pink-600",
  white: "bg-white text-zinc-800 hover:bg-zinc-100 border border-zinc-200",
  transparent: "bg-transparent text-current hover:bg-black/5",
};

const simpleColorClasses = {
  primary: "text-primary hover:bg-primary/10",
  info: "text-blue-500 hover:bg-blue-500/10",
  success: "text-emerald-500 hover:bg-emerald-500/10",
  warning: "text-amber-500 hover:bg-amber-500/10",
  danger: "text-red-500 hover:bg-red-500/10",
  rose: "text-pink-500 hover:bg-pink-500/10",
  white: "text-white hover:bg-white/10",
  transparent: "text-current hover:bg-black/5",
};

const sizeClasses = {
  sm: "h-8 px-3 text-xs",
  lg: "h-12 px-8 text-base",
};

const RegularButton = React.forwardRef((props, ref) => {
  const {
    color,
    round,
    children,
    fullWidth,
    disabled,
    simple,
    size,
    block,
    link,
    justIcon,
    className,
    muiClasses,
    ...rest
  } = props;

  return (
    <button
      ref={ref}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        // Default size
        !size && !justIcon && "h-10 px-4 py-2",
        size && sizeClasses[size],
        // Simple (outline/ghost) variant
        simple && "bg-transparent border border-current/20",
        simple && (color ? simpleColorClasses[color] : simpleColorClasses.primary),
        // Link variant
        link && "bg-transparent underline-offset-4 hover:underline text-primary h-auto p-0 border-none",
        // Solid color (when not simple or link)
        !simple && !link && "shadow-sm",
        !simple && !link && (color ? colorClasses[color] : colorClasses.primary),
        // Shape and layout
        round && "rounded-full",
        (fullWidth || block) && "w-full",
        justIcon && !size && "h-10 w-10 p-0",
        justIcon && size === "sm" && "h-8 w-8 p-0",
        justIcon && size === "lg" && "h-12 w-12 p-0",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});

RegularButton.displayName = "RegularButton";

export default RegularButton;
