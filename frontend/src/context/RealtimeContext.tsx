import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import api from "../services/api";

export interface RealtimeEvent {
  id: string;
  seq: number;
  channel: "slots" | "gate" | "operations" | "all";
  type: string;
  timestamp: number;
  iso_time: string;
  payload: Record<string, any>;
}

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "OFFLINE";

interface RealtimeContextType {
  status: ConnectionStatus;
  lastEvent: RealtimeEvent | null;
  subscribe: (channel: string, eventType: string, callback: (event: RealtimeEvent) => void) => () => void;
  broadcastTestPing: () => Promise<void>;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>("CONNECTING");
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);

  const listenersRef = useRef<Map<string, Set<(event: RealtimeEvent) => void>>>(new Map());
  const lastTimestampRef = useRef<number>(Date.now() / 1000);
  const eventSourceRef = useRef<EventSource | null>(null);
  const pollIntervalRef = useRef<any>(null);
  const reconnectTimerRef = useRef<any>(null);
  const reconnectAttemptsRef = useRef(0);

  const isMountedRef = useRef(true);
  const isPollingRef = useRef(false);

  // Dispatch an incoming event to registered subscribers
  const dispatchEvent = useCallback((event: RealtimeEvent) => {
    if (!isMountedRef.current) return;
    setLastEvent(event);
    lastTimestampRef.current = Math.max(lastTimestampRef.current, event.timestamp || 0);

    const specificKey = `${event.channel}:${event.type}`;
    const channelWildcard = `${event.channel}:*`;
    const globalWildcard = "*:*";

    [specificKey, channelWildcard, globalWildcard].forEach((key) => {
      const callbacks = listenersRef.current.get(key);
      if (callbacks) {
        callbacks.forEach((cb) => {
          try {
            cb(event);
          } catch (e) {
            console.error("Error executing realtime event handler:", e);
          }
        });
      }
    });
  }, []);

  // Safe Delta Polling
  const executeDeltaPoll = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;
    try {
      const res = await api.get(`/realtime/poll/?since=${lastTimestampRef.current}&channels=slots,gate,operations`);
      if (!isMountedRef.current) return;
      if (res.data && res.data.events && Array.isArray(res.data.events)) {
        res.data.events.forEach((ev: RealtimeEvent) => dispatchEvent(ev));
      }
      if (res.data.server_time) {
        lastTimestampRef.current = res.data.server_time;
      }
      setStatus("CONNECTED");
    } catch (err) {
      if (isMountedRef.current) {
        setStatus("OFFLINE");
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [dispatchEvent]);

  const startPolling = useCallback(() => {
    if (!pollIntervalRef.current) {
      pollIntervalRef.current = setInterval(executeDeltaPoll, 5000);
    }
  }, [executeDeltaPoll]);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (typeof EventSource === "undefined") {
      setStatus("CONNECTED");
      startPolling();
      return;
    }

    try {
      const rawApi = import.meta.env.VITE_API_URL || "/api";
      const apiUrl = rawApi.endsWith("/") ? rawApi.slice(0, -1) : rawApi;
      const sseUrl = `${apiUrl}/realtime/stream/?channels=slots,gate,operations`;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        if (!isMountedRef.current) return;
        setStatus("CONNECTED");
        reconnectAttemptsRef.current = 0;
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        stopPolling();
      };

      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.type) {
            dispatchEvent(parsed);
          }
        } catch (err) {}
      };

      const customEvents = [
        "SLOT_LOCKED",
        "SLOT_RELEASED",
        "BOOKING_CONFIRMED",
        "GATE_CHECK_IN",
        "PRICE_CHANGED",
        "OPERATIONS_UPDATE",
        "WALK_IN_CREATED",
      ];
      customEvents.forEach((evtName) => {
        es.addEventListener(evtName, (e: any) => {
          try {
            const parsed = JSON.parse(e.data);
            if (parsed) dispatchEvent(parsed);
          } catch (err) {}
        });
      });

      es.onerror = () => {
        if (!isMountedRef.current) return;
        es.close();
        eventSourceRef.current = null;
        startPolling();

        // Exponential backoff for SSE reconnect (10s, 20s, up to 60s)
        reconnectAttemptsRef.current += 1;
        const delay = Math.min(60000, 10000 * Math.pow(1.5, reconnectAttemptsRef.current - 1));
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) connectSSE();
        }, delay);
      };
    } catch (e) {
      if (isMountedRef.current) {
        setStatus("OFFLINE");
        startPolling();
      }
    }
  }, [dispatchEvent, startPolling, stopPolling]);

  useEffect(() => {
    isMountedRef.current = true;
    connectSSE();
    return () => {
      isMountedRef.current = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [executeDeltaPoll]);

  const subscribe = useCallback(
    (channel: string, eventType: string, callback: (event: RealtimeEvent) => void) => {
      const key = `${channel}:${eventType}`;
      if (!listenersRef.current.has(key)) {
        listenersRef.current.set(key, new Set());
      }
      listenersRef.current.get(key)!.add(callback);

      return () => {
        const set = listenersRef.current.get(key);
        if (set) {
          set.delete(callback);
          if (set.size === 0) {
            listenersRef.current.delete(key);
          }
        }
      };
    },
    []
  );

  const broadcastTestPing = async () => {
    try {
      await api.post("/realtime/publish/", {
        channel: "operations",
        type: "PING",
        payload: { msg: "Manual Live Ping from Client", timestamp: Date.now() },
      });
    } catch (e) {
      console.error("Test ping failed:", e);
    }
  };

  return (
    <RealtimeContext.Provider
      value={{
        status,
        lastEvent,
        subscribe,
        broadcastTestPing,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used within a RealtimeProvider");
  }
  return context;
};
