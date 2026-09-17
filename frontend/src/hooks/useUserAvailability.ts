import { useState, useEffect, useRef, useCallback } from "react";
import api from "../services/api";

export interface AvailabilityResult {
  checking: boolean;
  exists: boolean | null;
  message: string | null;
  maskedPhone?: string;
  maskedEmail?: string;
  field?: string;
}

export function useUserAvailability(
  field: "email" | "phone" | "username",
  debounceMs = 350
) {
  const [result, setResult] = useState<AvailabilityResult>({
    checking: false,
    exists: null,
    message: null,
    field,
  });

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const checkAvailability = useCallback(
    (value: string) => {
      const trimmed = (value || "").trim();

      // Clear any pending timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Abort any ongoing fetch
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // If value is too short or empty, reset
      if (!trimmed || (field === "email" && !trimmed.includes("@")) || (field === "phone" && trimmed.replace(/\D/g, "").length < 10)) {
        setResult({
          checking: false,
          exists: null,
          message: null,
          field,
        });
        return;
      }

      setResult((prev) => ({ ...prev, checking: true }));

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const res = await api.get("/auth/check-availability/", {
            params: { field, value: trimmed },
            signal: controller.signal,
          });

          const data = res.data;
          setResult({
            checking: false,
            exists: data.exists ?? false,
            message: data.message || (data.exists ? "Account already exists" : "Available"),
            maskedPhone: data.masked_phone,
            maskedEmail: data.masked_email,
            field,
          });
        } catch (err: any) {
          if (err.name === "CanceledError" || err.name === "AbortError") {
            return;
          }
          setResult({
            checking: false,
            exists: null,
            message: null,
            field,
          });
        }
      }, debounceMs);
    },
    [field, debounceMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  return {
    ...result,
    check: checkAvailability,
  };
}
