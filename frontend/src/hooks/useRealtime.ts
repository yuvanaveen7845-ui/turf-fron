import { useEffect, useCallback } from "react";
import { useRealtime, RealtimeEvent } from "../context/RealtimeContext";

/**
 * Hook to listen for real-time slot state changes (locks, bookings, cancellations)
 * for a specific turf arena and date.
 */
export const useSlotRealtime = (
  turfId?: string,
  date?: string,
  onSlotEvent?: (event: RealtimeEvent) => void
) => {
  const { subscribe, status } = useRealtime();

  useEffect(() => {
    if (!onSlotEvent) return;

    const unsubscribe = subscribe("slots", "*", (event: RealtimeEvent) => {
      // Filter by turfId and date if provided in payload
      const payloadTurf = event.payload?.turf_id;
      const payloadDate = event.payload?.date;

      if (turfId && payloadTurf && String(payloadTurf) !== String(turfId)) {
        return;
      }
      if (date && payloadDate && String(payloadDate) !== String(date)) {
        return;
      }

      onSlotEvent(event);
    });

    return unsubscribe;
  }, [subscribe, turfId, date, onSlotEvent]);

  return { status };
};

/**
 * Hook to listen for turnstile gate admission events and check-ins in real time.
 */
export const useGateRealtime = (onGateEvent: (event: RealtimeEvent) => void) => {
  const { subscribe, status } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe("gate", "*", (event: RealtimeEvent) => {
      onGateEvent(event);
    });
    return unsubscribe;
  }, [subscribe, onGateEvent]);

  return { status };
};

/**
 * Hook to listen for operational dashboard events (walk-ins, new bookings, price updates).
 */
export const useOperationsRealtime = (onOperationEvent: (event: RealtimeEvent) => void) => {
  const { subscribe, status } = useRealtime();

  useEffect(() => {
    const unsubscribe = subscribe("operations", "*", (event: RealtimeEvent) => {
      onOperationEvent(event);
    });
    return unsubscribe;
  }, [subscribe, onOperationEvent]);

  return { status };
};
