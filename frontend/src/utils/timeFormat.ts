/**
 * Utility functions for human-friendly relative and exact time representations.
 */

export function formatRelativeTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr || !timeStr) return "";

  try {
    // Normalise timeStr if e.g. "19:00:00" -> "19:00"
    const cleanTime = timeStr.slice(0, 5);
    const [hours, minutes] = cleanTime.split(":").map(Number);
    
    // Construct target Date object
    const [year, month, day] = dateStr.split("-").map(Number);
    const targetDate = new Date(year, month - 1, day, hours, minutes);
    const now = new Date();

    const diffMs = targetDate.getTime() - now.getTime();
    const diffMins = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));

    // Future
    if (diffMins > 0) {
      if (diffMins < 60) {
        return `Starts in ${diffMins} min`;
      }
      if (diffHours < 24 && targetDate.getDate() === now.getDate()) {
        const remainingHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        return remainingMins > 0
          ? `Starts in ${remainingHours}h ${remainingMins}m`
          : `Starts in ${remainingHours}h`;
      }
      if (diffHours >= 24 && diffHours < 48) {
        return "Tomorrow";
      }
      const days = Math.round(diffHours / 24);
      return `In ${days} days`;
    }

    // Past / In Progress
    const pastMins = Math.abs(diffMins);
    if (pastMins <= 60) {
      return `Started ${pastMins} min ago`;
    }
    if (pastMins < 120) {
      return "Currently in play";
    }

    return "Completed";
  } catch {
    return "";
  }
}

export function formatTimeWithRelative(dateStr?: string, timeStr?: string): string {
  if (!timeStr) return "";
  const relative = formatRelativeTime(dateStr, timeStr);
  const cleanTime = timeStr.slice(0, 5);

  // Convert 24h cleanTime to 12h AM/PM
  const [h, m] = cleanTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const formatted12h = `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;

  if (!relative) return formatted12h;
  return `${formatted12h} • ${relative}`;
}

export function formatTime12h(timeStr?: string): string {
  if (!timeStr) return "";
  const cleanTime = timeStr.slice(0, 5);
  const [h, m] = cleanTime.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${period}`;
}
