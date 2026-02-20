import React, { createContext, useContext, useCallback } from "react";
import { toast, Toaster } from "sonner";
import { AlertTriangle, CircleAlert, Bell } from "lucide-react";

type NotificationColor = "danger" | "warning" | "info";

interface NotificationPayload {
  title: string;
  subtitle?: string;
  color?: NotificationColor;
}

interface NotificationContextValue {
  showNotification: (payload: NotificationPayload) => void;
}

const NotificationContext = createContext<NotificationContextValue>({} as NotificationContextValue);

export const useNotification = (): NotificationContextValue => useContext(NotificationContext);

const COLOR_MAP: Record<NotificationColor, { method: "error" | "warning" | "info"; icon: typeof Bell }> = {
  danger: { method: "error", icon: CircleAlert },
  warning: { method: "warning", icon: AlertTriangle },
  info: { method: "info", icon: Bell },
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const showNotification = useCallback(({ title, subtitle, color = "warning" }: NotificationPayload) => {
    const config = COLOR_MAP[color] || COLOR_MAP.warning;
    toast[config.method](title, {
      description: subtitle,
      duration: 8000,
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "font-sans",
        }}
      />
    </NotificationContext.Provider>
  );
}
