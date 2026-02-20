import React from "react";
import { cn } from "lib/utils";
import { LucideIcon } from "lucide-react";

type InfoAreaColor = "primary" | "info" | "success" | "warning" | "danger" | "rose" | "gray";

const colorClasses: Record<InfoAreaColor, string> = {
  primary: "text-primary",
  info: "text-blue-500",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  rose: "text-pink-500",
  gray: "text-zinc-500",
};

interface InfoAreaProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: InfoAreaColor;
}

export default function InfoArea({ icon: Icon, title, description, iconColor = "gray" }: InfoAreaProps) {
  return (
    <div className="flex gap-4 p-4">
      <div className={cn("flex-shrink-0", colorClasses[iconColor] || colorClasses.gray)}>
        <Icon className="h-8 w-8" />
      </div>
      <div>
        <h4 className="text-base font-semibold text-foreground mb-1">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
