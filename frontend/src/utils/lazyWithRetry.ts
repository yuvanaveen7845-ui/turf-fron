import React from "react";

/**
 * Enhanced React.lazy wrapper with automatic deployment chunk reload recovery.
 *
 * When a new frontend deployment is pushed, asset hashes change (e.g. Page-ABC.js -> Page-XYZ.js).
 * Browsers with cached HTML will attempt to fetch the old chunk, which returns 404/index.html (MIME text/html).
 * This utility detects the chunk loading failure, force-refreshes the browser once to fetch the latest index.html,
 * and seamlessly loads the updated module without user-visible white screens or error crashes.
 */
export function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    const pageHasBeenForceRefreshed = sessionStorage.getItem("ft_chunk_retry_attempted");

    try {
      const module = await factory();
      // On successful module resolution, clear the retry flag
      sessionStorage.removeItem("ft_chunk_retry_attempted");
      return module;
    } catch (error: any) {
      const errorMsg = String(error?.message || "");
      const isChunkError =
        errorMsg.includes("dynamically imported module") ||
        errorMsg.includes("Failed to fetch") ||
        errorMsg.includes("MIME type") ||
        errorMsg.includes("Loading chunk") ||
        error?.name === "ChunkLoadError";

      if (isChunkError && !pageHasBeenForceRefreshed) {
        // Tag retry attempted to prevent infinite loops on permanent network disconnect
        sessionStorage.setItem("ft_chunk_retry_attempted", "true");
        window.location.reload();
        // Return a promise that never resolves while the page is reloading
        return new Promise<{ default: T }>(() => {});
      }

      // If already reloaded once and still failing, throw so ChunkErrorBoundary catches it cleanly
      throw error;
    }
  });
}
