import { Turf, TimeSlot } from "../types";

export interface PendingBookingIntent {
  turfId: string;
  turfName: string;
  date: string;
  slotIds: string[];
  turf?: Turf;
  selectedSlots?: TimeSlot[];
  totalAmount?: number;
  returnUrl?: string;
  createdAt: number;
}

const INTENT_KEY = "ft_pending_booking_intent";
const INTENT_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes matching authoritative server slot lock

/**
 * Persists a customer's unauthenticated booking intent to sessionStorage.
 */
export function saveBookingIntent(intent: Omit<PendingBookingIntent, "createdAt">): void {
  try {
    const payload: PendingBookingIntent = {
      ...intent,
      createdAt: Date.now(),
    };
    sessionStorage.setItem(INTENT_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn("Failed to persist booking intent:", err);
  }
}

/**
 * Retrieves the active pending booking intent from sessionStorage if not expired.
 */
export function getBookingIntent(): PendingBookingIntent | null {
  try {
    const raw = sessionStorage.getItem(INTENT_KEY);
    if (!raw) return null;
    const data: PendingBookingIntent = JSON.parse(raw);
    if (Date.now() - data.createdAt > INTENT_MAX_AGE_MS) {
      clearBookingIntent();
      return null;
    }
    return data;
  } catch (err) {
    console.warn("Failed to parse booking intent:", err);
    return null;
  }
}

/**
 * Clears the active pending booking intent.
 */
export function clearBookingIntent(): void {
  try {
    sessionStorage.removeItem(INTENT_KEY);
  } catch {}
}

/**
 * Checks if a valid, unexpired booking intent is stored.
 */
export function hasValidBookingIntent(): boolean {
  return getBookingIntent() !== null;
}
