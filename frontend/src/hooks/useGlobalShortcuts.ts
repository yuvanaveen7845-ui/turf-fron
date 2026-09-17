import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface GlobalShortcutOptions {
  onSearch?: () => void;
  onToggleSidebar?: () => void;
}

/**
 * Single consolidated global keyboard shortcut handler.
 * Register this ONCE at the layout level — replaces duplicated handlers
 * in AdminLayout, StaffLayout, and Navbar.
 *
 * Shortcuts:
 *   ⌘K / Ctrl+K / '/'  → open search
 *   ⌘B / Ctrl+B / '['  → toggle sidebar (admin only)
 *   ⌘Q / Ctrl+Q / 'q'  → navigate to gate QR scanner (staff/admin only)
 */
export const useGlobalShortcuts = ({
  onSearch,
  onToggleSidebar,
}: GlobalShortcutOptions = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isStaffOrAdmin =
    !!user &&
    (user.role === "STAFF" || user.role === "ADMIN" || !!user.is_superuser);

  const scannerRoute =
    user?.role === "ADMIN" || user?.is_superuser
      ? "/admin/scanner"
      : "/staff/scanner";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName ?? ""
      );
      const meta = e.metaKey || e.ctrlKey;

      // ⌘K / '/' → Global Search
      if (onSearch) {
        if ((meta && e.key === "k") || (e.key === "/" && !isInput)) {
          e.preventDefault();
          onSearch();
          return;
        }
      }

      // ⌘B / '[' → Toggle sidebar
      if (onToggleSidebar) {
        if (
          (meta && e.key === "b") ||
          (e.key === "[" && !isInput)
        ) {
          e.preventDefault();
          onToggleSidebar();
          return;
        }
      }

      // ⌘Q / 'q' → QR Scanner (staff/admin only)
      if (isStaffOrAdmin) {
        if (
          (meta && e.key.toLowerCase() === "q") ||
          (e.key === "q" && !isInput)
        ) {
          e.preventDefault();
          navigate(scannerRoute);
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onSearch, onToggleSidebar, isStaffOrAdmin, navigate, scannerRoute]);
};
