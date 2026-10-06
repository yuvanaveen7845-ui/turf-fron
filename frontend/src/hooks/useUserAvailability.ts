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
      if (!trimmed) {
        setResult({
          checking: false,
          exists: null,
          message: null,
          field,
        });
        return;
      }

      let sanitizedQueryVal = trimmed;

      if (field === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          setResult({
            checking: false,
            exists: null,
            message: null,
            field,
          });
          return;
        }
      } else if (field === "phone") {
        let phoneDigits = trimmed.replace(/\D/g, "");
        if (phoneDigits.startsWith("91") && phoneDigits.length > 10) {
          phoneDigits = phoneDigits.slice(2);
        } else if (phoneDigits.startsWith("0") && phoneDigits.length > 10) {
          phoneDigits = phoneDigits.slice(1);
        }
        if (phoneDigits.length !== 10 || !/^[6-9]\d{9}$/.test(phoneDigits)) {
          setResult({
            checking: false,
            exists: null,
            message: null,
            field,
          });
          return;
        }
        sanitizedQueryVal = phoneDigits;
      }

      setResult((prev) => ({ ...prev, checking: true }));

      timerRef.current = setTimeout(async () => {
        const controller = new AbortController();
        abortControllerRef.current = controller;

        try {
          const res = await api.get("/auth/check-availability/", {
            params: { field, value: sanitizedQueryVal },
            signal: controller.signal,
          });

          const data = res.data;
          if (data.status === "INCOMPLETE") {
            setResult({
              checking: false,
              exists: null,
              message: null,
              field,
            });
            return;
          }

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
