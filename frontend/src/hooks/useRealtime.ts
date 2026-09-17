import { useEffect, useCallback, useRef } from "react";
import { useRealtime, RealtimeEvent } from "../context/RealtimeContext";

/**
 * Returns a debounced version of a callback.
 * Useful for preventing rapid-fire API refetches on multiple SSE events.
 */
function useDebounced<T extends (...args: any[]) => void>(fn: T, delay: number): T {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}

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
  const debouncedHandler = useDebounced(
    useCallback(
      (event: RealtimeEvent) => {
        if (!onSlotEvent) return;
        onSlotEvent(event);
      },
      [onSlotEvent]
    ),
    350
  );

  useEffect(() => {
    if (!onSlotEvent) return;

    const unsubscribe = subscribe("slots", "*", (event: RealtimeEvent) => {
      const payloadTurf = event.payload?.turf_id;
      const payloadDate = event.payload?.date;

      if (turfId && payloadTurf && String(payloadTurf) !== String(turfId)) return;
      if (date && payloadDate && String(payloadDate) !== String(date)) return;

      debouncedHandler(event);
    });

    return unsubscribe;
  }, [subscribe, turfId, date, debouncedHandler]);

  return { status };
};

/**
 * Hook to listen for turnstile gate admission events and check-ins in real time.
 * Debounced to prevent multiple refetches on rapid sequential check-ins.
 */
export const useGateRealtime = (onGateEvent: (event: RealtimeEvent) => void) => {
  const { subscribe, status } = useRealtime();
  const debouncedHandler = useDebounced(onGateEvent, 350);

  useEffect(() => {
    const unsubscribe = subscribe("gate", "*", debouncedHandler);
    return unsubscribe;
  }, [subscribe, debouncedHandler]);

  return { status };
};

/**
 * Hook to listen for operational dashboard events (walk-ins, new bookings, price updates).
 * Debounced to coalesce rapid updates into a single refetch.
 */
export const useOperationsRealtime = (onOperationEvent: (event: RealtimeEvent) => void) => {
  const { subscribe, status } = useRealtime();
  const debouncedHandler = useDebounced(onOperationEvent, 350);

  useEffect(() => {
    const unsubscribe = subscribe("operations", "*", debouncedHandler);
    return unsubscribe;
  }, [subscribe, debouncedHandler]);

  return { status };
};
