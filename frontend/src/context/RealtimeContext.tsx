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

  // Dispatch an incoming event to registered subscribers
  const dispatchEvent = useCallback((event: RealtimeEvent) => {
    setLastEvent(event);
    lastTimestampRef.current = Math.max(lastTimestampRef.current, event.timestamp);

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

  // Polling fallback when SSE is not supported or re-connecting
  const executeDeltaPoll = useCallback(async () => {
    try {
      const res = await api.get(`/realtime/poll/?since=${lastTimestampRef.current}&channels=slots,gate,operations`);
      if (res.data && res.data.events && Array.isArray(res.data.events)) {
        res.data.events.forEach((ev: RealtimeEvent) => dispatchEvent(ev));
      }
      if (res.data.server_time) {
        lastTimestampRef.current = res.data.server_time;
      }
      setStatus("CONNECTED");
    } catch (err) {
      setStatus("OFFLINE");
    }
  }, [dispatchEvent]);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (typeof EventSource === "undefined") {
      // Fallback to periodic polling for older environments
      setStatus("CONNECTED");
      pollIntervalRef.current = setInterval(executeDeltaPoll, 3000);
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://127.0.0.1:8001/api";
      const sseUrl = `${apiUrl}/realtime/stream/?channels=slots,gate,operations`;

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus("CONNECTED");
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      };

      es.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data);
          if (parsed && parsed.type) {
            dispatchEvent(parsed);
          }
        } catch (err) {}
      };

      // Listen to specific custom event types
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
        setStatus("CONNECTING");
        es.close();
        // Start polling fallback while disconnected
        if (!pollIntervalRef.current) {
          pollIntervalRef.current = setInterval(executeDeltaPoll, 3000);
        }
        // Attempt SSE reconnection in 5 seconds
        setTimeout(connectSSE, 5000);
      };
    } catch (e) {
      setStatus("OFFLINE");
      if (!pollIntervalRef.current) {
        pollIntervalRef.current = setInterval(executeDeltaPoll, 3000);
      }
    }
  }, [dispatchEvent, executeDeltaPoll]);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [connectSSE]);

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
