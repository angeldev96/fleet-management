import React from "react";
import { useHistory } from "react-router-dom";

// Lucide icons
import { Car, Smartphone, User, Bell, Shield, Building, ChevronRight } from "lucide-react";

// core components
import GridContainer from "components/Grid/GridContainer.js";
import GridItem from "components/Grid/GridItem.js";

import { cn } from "lib/utils";

const colorMap = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-600" },
  primary: { bg: "bg-primary/10", text: "text-primary" },
  violet: { bg: "bg-violet-500/10", text: "text-violet-600" },
  amber: { bg: "bg-amber-500/10", text: "text-amber-600" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-600" },
  sky: { bg: "bg-sky-500/10", text: "text-sky-600" },
};

const settingsOptions = [
  {
    id: "vehicles",
    title: "Vehicle Data Upload",
    description:
      "Add vehicles to your fleet individually or upload customer data in bulk via CSV.",
    icon: Car,
    color: "blue",
    path: "/admin/settings/vehicles",
    enabled: true,
  },
  {
    id: "devices",
    title: "Device Management",
    description:
      "Link GPS devices to your fleet vehicles. Manage device configurations, firmware versions, and assignments.",
    icon: Smartphone,
    color: "primary",
    path: "/admin/settings/devices",
    enabled: true,
  },
  {
    id: "users",
    title: "User Management",
    description: "Manage team members, roles, and permissions for your organization.",
    icon: User,
    color: "violet",
    path: "/admin/settings/users",
    enabled: true,
  },
  {
    id: "notifications",
    title: "Notifications",
    description: "Configure alert preferences, email notifications, and push settings.",
    icon: Bell,
    color: "amber",
    path: "/admin/settings/notifications",
    enabled: false,
  },
  {
    id: "security",
    title: "Security",
    description: "Password settings, two-factor authentication, and session management.",
    icon: Shield,
    color: "emerald",
    path: "/admin/settings/security",
    enabled: false,
  },
  {
    id: "fleet",
    title: "Fleet Settings",
    description: "Customize your fleet branding. Upload your organization's logo.",
    icon: Building,
    color: "sky",
    path: "/admin/settings/fleet",
    enabled: true,
  },
];

export default function Settings() {
  const history = useHistory();

  const handleCardClick = (option) => {
    if (option.enabled) {
      history.push(option.path);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-foreground m-0 tracking-[-0.02em]">Settings</h1>
        <p className="text-xs text-muted-foreground/70 font-medium mt-0.5 m-0">
          Manage your fleet configuration, users, and preferences
        </p>
      </div>

      <GridContainer spacing={3}>
        {settingsOptions.map((option) => {
          const colors = colorMap[option.color] || colorMap.blue;
          return (
            <GridItem xs={12} sm={6} lg={4} key={option.id}>
              <div
                className={cn(
                  "group rounded-xl p-5 flex items-center border transition-all duration-200",
                  option.enabled
                    ? "bg-card border-border/60 cursor-pointer shadow-none hover:shadow-(--shadow-card) hover:-translate-y-px"
                    : "bg-muted/30 border-border/40 opacity-60 cursor-not-allowed"
                )}
                onClick={() => handleCardClick(option)}
              >
                <div
                  className={cn("w-12 h-12 rounded-xl flex items-center justify-center mr-4 shrink-0", colors.bg)}
                >
                  <option.icon className={cn("w-6 h-6", colors.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground mb-0.5 tracking-[-0.01em]">{option.title}</div>
                  <div className="text-xs text-muted-foreground/70 leading-snug">{option.description}</div>
                  {!option.enabled && (
                    <div className="text-[11px] text-muted-foreground/50 font-medium uppercase tracking-[0.05em] mt-1.5">
                      Coming Soon
                    </div>
                  )}
                </div>
                {option.enabled && (
                  <ChevronRight className="w-5 h-5 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0 ml-2" />
                )}
              </div>
            </GridItem>
          );
        })}
      </GridContainer>
    </div>
  );
}
