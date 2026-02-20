import React from "react";
import { cn } from "lib/utils";
import { Inbox, LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4 text-center", className)}>
      <div className="rounded-2xl bg-muted/50 p-5 mb-5 ring-1 ring-border/50">
        <Icon className="h-7 w-7 text-muted-foreground/60" />
      </div>
      <h3 className="text-sm font-semibold text-foreground mb-1.5 tracking-[-0.01em]">{title}</h3>
      {description && <p className="text-sm text-muted-foreground/80 max-w-sm mb-5">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
