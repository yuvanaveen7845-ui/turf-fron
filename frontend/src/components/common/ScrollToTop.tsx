import React, { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Enterprise Global Scroll Restoration Component.
 * Automatically resets window scroll to (0, 0) upon any route or search param navigation.
 */
export const ScrollToTop: React.FC = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Reset window scroll to top only on actual route navigation
    try {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: "instant",
      });
    } catch {
      // Fallback for older browsers
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};
