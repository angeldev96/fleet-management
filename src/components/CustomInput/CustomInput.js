import React from "react";
import { cn } from "lib/utils";

export default function CustomInput({
  formControlProps,
  labelText,
  id,
  labelProps,
  inputProps,
  error,
  white,
  inputRootCustomClasses,
  success,
  helperText,
  rtlActive,
}) {
  return (
    <div
      {...formControlProps}
      className={cn("mb-4 w-full relative", formControlProps?.className)}
    >
      {labelText !== undefined ? (
        <label
          htmlFor={id}
          className={cn(
            "mb-1.5 block text-sm font-medium text-muted-foreground",
            error && "text-red-500",
            success && !error && "text-emerald-500",
          )}
          {...labelProps}
        >
          {labelText}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-red-500 focus-visible:ring-red-500",
          success && !error && "border-emerald-500 focus-visible:ring-emerald-500",
          white && "text-white border-white/30 placeholder:text-white/50",
          inputRootCustomClasses,
        )}
        {...inputProps}
      />
      {helperText !== undefined ? (
        <p
          className={cn(
            "mt-1 text-xs",
            error ? "text-red-500" : success ? "text-emerald-500" : "text-muted-foreground",
          )}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
