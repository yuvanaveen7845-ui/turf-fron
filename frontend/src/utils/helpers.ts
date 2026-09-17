/**
 * Normalizes paginated or flat API list responses into a typed array.
 * Handles both `data` (flat array) and `data.results` (DRF pagination).
 */
export function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.results)) return obj.results as T[];
  }
  return [];
}

/**
 * Formats a rupee amount with Indian locale thousands separator.
 * Accepts number or string, safely falls back to 0.
 */
export function formatRupees(
  amount: number | string | null | undefined
): string {
  const n = Number(amount ?? 0);
  if (isNaN(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

/**
 * Returns true if the booking date+time is in the past.
 */
export function isBookingPast(dateStr: string, endTime: string): boolean {
  try {
    const [h, m] = endTime.slice(0, 5).split(":").map(Number);
    const [y, mo, d] = dateStr.split("-").map(Number);
    const end = new Date(y, mo - 1, d, h, m);
    return end < new Date();
  } catch {
    return false;
  }
}

/**
 * Clamps a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
