/**
 * Image URL Resolution and Guaranteed Fallback Utilities for Friends Turf
 * Provides zero-network SVG turf backgrounds if external CDNs (Unsplash, etc.) are blocked or offline.
 */

// High-fidelity SVG vector graphic for Football pitch with floodlight glow
const FOOTBALL_TURF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="grass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23064e3b" />
      <stop offset="50%" stop-color="%23047857" />
      <stop offset="100%" stop-color="%23065f46" />
    </linearGradient>
    <radialGradient id="floodlight" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="%23ffffff" stop-opacity="0.25" />
      <stop offset="100%" stop-color="%23000000" stop-opacity="0.4" />
    </radialGradient>
    <pattern id="stripes" width="80" height="500" patternUnits="userSpaceOnUse">
      <rect width="40" height="500" fill="%23ffffff" fill-opacity="0.04" />
    </pattern>
  </defs>
  <rect width="800" height="500" fill="url(%23grass)" />
  <rect width="800" height="500" fill="url(%23stripes)" />
  <rect width="800" height="500" fill="url(%23floodlight)" />
  <!-- Pitch boundary -->
  <rect x="40" y="30" width="720" height="440" rx="4" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <!-- Halfway line -->
  <line x1="400" y1="30" x2="400" y2="470" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <!-- Center circle -->
  <circle cx="400" cy="250" r="65" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <circle cx="400" cy="250" r="4" fill="%23ffffff" fill-opacity="0.9" />
  <!-- Left penalty box -->
  <rect x="40" y="140" width="120" height="220" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <rect x="40" y="190" width="45" height="120" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <circle cx="120" cy="250" r="3" fill="%23ffffff" fill-opacity="0.9" />
  <!-- Right penalty box -->
  <rect x="640" y="140" width="120" height="220" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <rect x="715" y="190" width="45" height="120" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.75" />
  <circle cx="680" cy="250" r="3" fill="%23ffffff" fill-opacity="0.9" />
</svg>`;

// High-fidelity SVG vector graphic for Box Cricket pitch & nets
const CRICKET_TURF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="cricketGrass" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%23064e3b" />
      <stop offset="50%" stop-color="%23059669" />
      <stop offset="100%" stop-color="%23022c22" />
    </linearGradient>
    <radialGradient id="cricketLight" cx="50%" cy="50%" r="65%">
      <stop offset="0%" stop-color="%23ffffff" stop-opacity="0.22" />
      <stop offset="100%" stop-color="%23000000" stop-opacity="0.45" />
    </radialGradient>
    <linearGradient id="pitchStrip" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="%23d4a373" />
      <stop offset="50%" stop-color="%23e9edc9" />
      <stop offset="100%" stop-color="%23d4a373" />
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23cricketGrass)" />
  <rect width="800" height="500" fill="url(%23cricketLight)" />
  <!-- Boundary Ring -->
  <ellipse cx="400" cy="250" rx="360" ry="210" fill="none" stroke="%23ffffff" stroke-width="3" stroke-opacity="0.6" stroke-dasharray="8 6" />
  <!-- Pitch Rectangle 22 yards -->
  <rect x="250" y="210" width="300" height="80" rx="3" fill="url(%23pitchStrip)" stroke="%23ffffff" stroke-width="2" stroke-opacity="0.8" />
  <!-- Crease lines -->
  <line x1="280" y1="200" x2="280" y2="300" stroke="%23ffffff" stroke-width="3" />
  <line x1="520" y1="200" x2="520" y2="300" stroke="%23ffffff" stroke-width="3" />
  <!-- Bowling stumps -->
  <circle cx="265" cy="242" r="3" fill="%23ffffff" />
  <circle cx="265" cy="250" r="3" fill="%23ffffff" />
  <circle cx="265" cy="258" r="3" fill="%23ffffff" />
  <!-- Batsman stumps -->
  <circle cx="535" cy="242" r="3" fill="%23ffffff" />
  <circle cx="535" cy="250" r="3" fill="%23ffffff" />
  <circle cx="535" cy="258" r="3" fill="%23ffffff" />
</svg>`;

// High-fidelity SVG vector graphic for Multi-Sport Arena
const MULTISPORT_TURF_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="100%" height="100%">
  <defs>
    <linearGradient id="multiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%230f172a" />
      <stop offset="50%" stop-color="%23064e3b" />
      <stop offset="100%" stop-color="%23022c22" />
    </linearGradient>
    <radialGradient id="arenaLight" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="%2338bdf8" stop-opacity="0.25" />
      <stop offset="100%" stop-color="%23000000" stop-opacity="0.5" />
    </radialGradient>
  </defs>
  <rect width="800" height="500" fill="url(%23multiGrad)" />
  <rect width="800" height="500" fill="url(%23arenaLight)" />
  <!-- Court Borders -->
  <rect x="60" y="40" width="680" height="420" rx="6" fill="none" stroke="%2310b981" stroke-width="3" stroke-opacity="0.75" />
  <line x1="400" y1="40" x2="400" y2="460" stroke="%23f59e0b" stroke-width="2.5" stroke-opacity="0.75" />
  <circle cx="400" cy="250" r="70" fill="none" stroke="%2310b981" stroke-width="3" stroke-opacity="0.75" />
  <!-- Badminton / Volleyball Inner Court -->
  <rect x="180" y="90" width="440" height="320" fill="none" stroke="%2338bdf8" stroke-width="2" stroke-opacity="0.75" />
</svg>`;

export function getTurfFallbackImage(sportType?: string): string {
  const sport = (sportType || "").toUpperCase();
  if (sport === "CRICKET") return CRICKET_TURF_SVG;
  if (sport === "MULTI_SPORT" || sport === "BADMINTON" || sport === "TENNIS") return MULTISPORT_TURF_SVG;
  return FOOTBALL_TURF_SVG;
}

export function resolveImageUrl(url?: string | null, sportType?: string): string {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return getTurfFallbackImage(sportType);
  }

  const trimmed = url.trim();

  // If already a Data URL or inline SVG
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) {
    return trimmed;
  }

  // If it's a relative media URL e.g. /media/turfs/... or media/turfs/...
  if (trimmed.startsWith("/media/") || trimmed.startsWith("media/")) {
    const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
    // When running under vite or deployed, if backend is on another host/port
    const apiUrl = import.meta.env.VITE_API_URL || "";
    if (apiUrl.startsWith("http")) {
      const backendOrigin = new URL(apiUrl).origin;
      return `${backendOrigin}${cleanPath}`;
    }
    return cleanPath;
  }

  // External full URLs (e.g. Unsplash)
  return trimmed;
}

/**
 * Handle image onError gracefully.
 * Replaces the failed image source with a zero-network vector turf SVG.
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  sportType?: string
) {
  const target = e.currentTarget;
  // Prevent infinite loop if fallback fails
  target.onerror = null;
  target.src = getTurfFallbackImage(sportType);
}
