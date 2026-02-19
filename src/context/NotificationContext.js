import React, { createContext, useContext, useCallback } from "react";
import PropTypes from "prop-types";
import { toast, Toaster } from "sonner";
import { AlertTriangle, CircleAlert, Bell } from "lucide-react";

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

const COLOR_MAP = {
  danger: { method: "error", icon: CircleAlert },
  warning: { method: "warning", icon: AlertTriangle },
  info: { method: "info", icon: Bell },
};

export function NotificationProvider({ children }) {
  const showNotification = useCallback(({ title, subtitle, color = "warning" }) => {
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

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NotificationContext;
