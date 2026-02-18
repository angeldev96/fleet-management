import { useEffect, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";
import { useNotification } from "context/NotificationContext";

/**
 * Subscribes to critical telemetry events via Supabase Realtime
 * and shows toast notifications when they occur.
 *
 * Listens for: power_event (physical connect/disconnect only)
 *
 * NOTE: Only physical device connect/disconnect triggers real-time notifications.
 * Non-physical power events (e.g. ignition on/off) are ignored.
 */
export default function useRealtimeAlerts() {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const subscriptionsRef = useRef([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Cache for vehicle names so we don't re-fetch on every event
    const vehicleNameCache = {};

    const getVehicleName = async (vehicleId) => {
      if (vehicleNameCache[vehicleId]) return vehicleNameCache[vehicleId];
      const { data } = await supabase
        .from("vehicles")
        .select("name, plate_number")
        .eq("id", vehicleId)
        .single();
      const name = data ? `${data.name} (${data.plate_number})` : "Unknown Vehicle";
      vehicleNameCache[vehicleId] = name;
      return name;
    };

    const normalize = (value) => (typeof value === "string" ? value.trim().toLowerCase() : "");

    const handleEvent = async (payload) => {
      const event = payload.new;
      if (!event) return;

      const vehicleName = await getVehicleName(event.vehicle_id);
      const eventData = event.event_data || {};

      switch (event.event_type) {
        case "power_event": {
          const alarmName = normalize(eventData.alarm_name);
          const alarmType = normalize(eventData.alarm_type);
          const eventSubtype = normalize(event.event_subtype);

          const isPhysicalDisconnect =
            alarmName === "power off alarm" || alarmType === "0x0e" || eventSubtype === "0x0e";
          const isPhysicalConnect =
            alarmName === "power on alarm" || alarmType === "0x09" || eventSubtype === "0x09";

          // Ignore non-physical power transitions (ignition_on/off, low battery, etc.)
          if (!isPhysicalDisconnect && !isPhysicalConnect) break;

          if (isPhysicalDisconnect) {
            showNotification({
              title: `Device Removed — ${vehicleName}`,
              subtitle: "Device was unplugged or lost power. Possible tampering.",
              color: "danger",
            });
          } else if (isPhysicalConnect) {
            showNotification({
              title: `Device Connected — ${vehicleName}`,
              subtitle: "Device has been powered on and connected.",
              color: "info",
            });
          }
          break;
        }

        default:
          break;
      }
    };

    // Subscribe only to power events. Handler filters to physical connect/disconnect alarms.
    const eventTypes = ["power_event"];

    const subs = eventTypes.map((eventType) => {
      return supabase
        .from(`events:event_type=eq.${eventType}`)
        .on("INSERT", handleEvent)
        .subscribe();
    });

    subscriptionsRef.current = subs;

    // Cleanup subscriptions on unmount
    return () => {
      subscriptionsRef.current.forEach((sub) => {
        supabase.removeSubscription(sub);
      });
      subscriptionsRef.current = [];
    };
  }, [isAuthenticated, showNotification]);
}
