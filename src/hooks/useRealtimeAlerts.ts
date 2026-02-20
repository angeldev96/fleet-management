import { useEffect, useRef } from "react";
import { supabase } from "lib/supabase";
import { useAuth } from "context/AuthContext";
import { useNotification } from "context/NotificationContext";

export default function useRealtimeAlerts(): void {
  const { isAuthenticated } = useAuth();
  const { showNotification } = useNotification();
  const subscriptionsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const vehicleNameCache: Record<string, string> = {};

    const getVehicleName = async (vehicleId: string): Promise<string> => {
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

    const normalize = (value: any): string => (typeof value === "string" ? value.trim().toLowerCase() : "");

    const handleEvent = async (payload: any) => {
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

    const eventTypes = ["power_event"];

    const subs = eventTypes.map((eventType) => {
      return supabase.from(`events:event_type=eq.${eventType}`).on("INSERT", handleEvent).subscribe();
    });

    subscriptionsRef.current = subs;

    return () => {
      subscriptionsRef.current.forEach((sub) => {
        supabase.removeSubscription(sub);
      });
      subscriptionsRef.current = [];
    };
  }, [isAuthenticated, showNotification]);
}
