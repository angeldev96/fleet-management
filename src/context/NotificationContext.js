import React, { createContext, useContext, useState, useCallback, useRef } from "react";
import PropTypes from "prop-types";

// @material-ui/core components
import Snack from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";

// @material-ui/icons
import Close from "@material-ui/icons/Close";
import Warning from "@material-ui/icons/Warning";
import Error from "@material-ui/icons/Error";
import NotificationsActive from "@material-ui/icons/NotificationsActive";

const NotificationContext = createContext({});

export const useNotification = () => useContext(NotificationContext);

const useStyles = makeStyles(() => ({
  snackbar: {
    zIndex: 9999,
  },
  danger: {
    backgroundColor: "#DC2626",
    color: "#FFFFFF",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(220, 38, 38, 0.35)",
    minWidth: "340px",
    maxWidth: "480px",
  },
  warning: {
    backgroundColor: "#F59E0B",
    color: "#FFFFFF",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(245, 158, 11, 0.35)",
    minWidth: "340px",
    maxWidth: "480px",
  },
  info: {
    backgroundColor: "#3B82F6",
    color: "#FFFFFF",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(59, 130, 246, 0.35)",
    minWidth: "340px",
    maxWidth: "480px",
  },
  messageContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    width: "100%",
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: "2px",
  },
  icon: {
    fontSize: "24px",
  },
  textWrapper: {
    flex: 1,
  },
  title: {
    fontSize: "14px",
    fontWeight: "600",
    lineHeight: "1.3",
    marginBottom: "4px",
  },
  subtitle: {
    fontSize: "12px",
    opacity: 0.85,
    lineHeight: "1.3",
  },
  closeButton: {
    color: "#FFFFFF",
    opacity: 0.7,
    padding: "4px",
    "&:hover": {
      opacity: 1,
    },
  },
}));

const COLOR_ICONS = {
  danger: Error,
  warning: Warning,
  info: NotificationsActive,
};

export function NotificationProvider({ children }) {
  const classes = useStyles();
  const [notification, setNotification] = useState(null);
  const timerRef = useRef(null);

  const showNotification = useCallback(({ title, subtitle, color = "warning" }) => {
    // Clear any existing timer
    if (timerRef.current) clearTimeout(timerRef.current);

    setNotification({ title, subtitle, color });

    // Auto-dismiss after 8 seconds
    timerRef.current = setTimeout(() => {
      setNotification(null);
    }, 8000);
  }, []);

  const closeNotification = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setNotification(null);
  }, []);

  const IconComponent = notification ? COLOR_ICONS[notification.color] || Warning : Warning;

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <Snack
        className={classes.snackbar}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={!!notification}
        onClose={closeNotification}
      >
        <SnackbarContent
          className={notification ? classes[notification.color] || classes.info : classes.info}
          message={
            notification ? (
              <div className={classes.messageContainer}>
                <div className={classes.iconWrapper}>
                  <IconComponent className={classes.icon} />
                </div>
                <div className={classes.textWrapper}>
                  <div className={classes.title}>{notification.title}</div>
                  {notification.subtitle && (
                    <div className={classes.subtitle}>{notification.subtitle}</div>
                  )}
                </div>
              </div>
            ) : null
          }
          action={
            <IconButton
              className={classes.closeButton}
              onClick={closeNotification}
              size="small"
            >
              <Close fontSize="small" />
            </IconButton>
          }
        />
      </Snack>
    </NotificationContext.Provider>
  );
}

NotificationProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default NotificationContext;
