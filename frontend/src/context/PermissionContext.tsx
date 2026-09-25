import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";
import { UserRole, FeatureFlagKey } from "../types";

export interface PermissionContextType {
  hasPermission: (permission: string) => boolean;
  hasFeature: (feature: FeatureFlagKey | string) => boolean;
  canAccess: (permission: string, feature?: FeatureFlagKey | string) => boolean;
  featureFlags: Record<string, boolean>;
  loadingFlags: boolean;
  toggleFeatureFlag: (key: string, value: boolean) => Promise<void>;
  refreshFeatureFlags: () => Promise<void>;
  // Safe Access Preview Mode (Admins only)
  previewRole: UserRole | null;
  setPreviewRole: (role: UserRole | null) => void;
  isSimulating: boolean;
  effectiveRole: UserRole | undefined;
}

const DEFAULT_FEATURE_FLAGS: Record<string, boolean> = {
  RECURRING_BOOKINGS: true,
  PARTIAL_PAYMENTS: true,
  WALK_IN_BOOKINGS: true,
  DYNAMIC_PRICING: true,
  QR_CHECKIN: true,
  ONLINE_PAYMENTS: true,
  OFFLINE_PAYMENTS: true,
  COUPONS: true,
  REVIEWS: true,
  ADVANCED_REPORTING: true,
};

// Client-side simulation permissions matrix for Safe Admin Preview
const ROLE_SIMULATION_PERMISSIONS: Record<UserRole, string[]> = {
  CUSTOMER: [
    "BOOKING_VIEW_OWN",
    "BOOKING_CREATE",
    "BOOKING_CANCEL_OWN",
    "BOOKING_RESCHEDULE_OWN",
    "PAYMENT_VIEW_OWN",
    "FACILITY_VIEW",
    "PROFILE_MANAGE",
  ],
  STAFF: [
    "BOOKING_VIEW_OWN",
    "BOOKING_CREATE",
    "BOOKING_CANCEL_OWN",
    "BOOKING_RESCHEDULE_OWN",
    "PAYMENT_VIEW_OWN",
    "FACILITY_VIEW",
    "PROFILE_MANAGE",
    "BOOKING_VIEW",
    "BOOKING_EDIT",
    "CHECKIN_VIEW",
    "CHECKIN_SCAN",
    "CHECKIN_MANUAL",
    "CUSTOMER_VIEW",
    "PAYMENT_RECORD_OFFLINE",
    "PAYMENT_VIEW",
  ],
  ADMIN: [
    "BOOKING_VIEW_OWN",
    "BOOKING_CREATE",
    "BOOKING_CANCEL_OWN",
    "BOOKING_RESCHEDULE_OWN",
    "PAYMENT_VIEW_OWN",
    "FACILITY_VIEW",
    "PROFILE_MANAGE",
    "BOOKING_VIEW",
    "BOOKING_EDIT",
    "CHECKIN_VIEW",
    "CHECKIN_SCAN",
    "CHECKIN_MANUAL",
    "CUSTOMER_VIEW",
    "PAYMENT_RECORD_OFFLINE",
    "PAYMENT_VIEW",
    "BOOKING_CANCEL",
    "BOOKING_RESCHEDULE",
    "PAYMENT_REFUND",
    "PRICING_VIEW",
    "PRICING_EDIT",
    "FACILITY_EDIT",
    "FACILITY_BLOCK",
    "CUSTOMER_EDIT",
    "CUSTOMER_NOTES",
    "REPORT_VIEW",
    "REPORT_EXPORT",
    "STAFF_VIEW",
    "PRICING_OVERRIDE",
    "FACILITY_CREATE",
    "FACILITY_DELETE",
    "STAFF_CREATE",
    "STAFF_EDIT",
    "STAFF_SUSPEND",
    "AUDIT_VIEW",
    "SETTINGS_VIEW",
    "SETTINGS_EDIT",
    "PAYMENT_ADJUST",
    "CHECKIN_OVERRIDE",
    "FEATURES_MANAGE",
  ],
};

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const PermissionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(DEFAULT_FEATURE_FLAGS);
  const [loadingFlags, setLoadingFlags] = useState<boolean>(true);
  const [previewRole, setPreviewRoleState] = useState<UserRole | null>(null);

  // Load backend feature flags
  const fetchFlags = async () => {
    try {
      const res = await api.get("/auth/features/");
      if (res.data && typeof res.data === "object") {
        setFeatureFlags((prev) => ({ ...prev, ...res.data }));
      }
    } catch (err) {
      console.warn("Could not fetch remote feature flags, using defaults:", err);
    } finally {
      setLoadingFlags(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  // Only allow preview mode if actual logged-in user is an Admin
  const canUsePreview = !!user && (user.role === "ADMIN" || !!user.is_superuser);

  const setPreviewRole = (role: UserRole | null) => {
    if (!canUsePreview && role !== null) {
      console.warn("Unauthorized attempt to activate preview mode");
      return;
    }
    setPreviewRoleState(role);
  };

  const isSimulating = canUsePreview && previewRole !== null;
  const effectiveRole = isSimulating ? (previewRole as UserRole) : user?.role;

  // Compute permissions based on user status and preview mode
  const effectivePermissions = useMemo<Set<string>>(() => {
    if (!user) return new Set();

    // Inactive or suspended users have no active permissions
    if (user.status && user.status !== "ACTIVE") {
      return new Set();
    }

    // If safe preview is active, use simulated permissions for that role
    if (isSimulating && previewRole) {
      return new Set(ROLE_SIMULATION_PERMISSIONS[previewRole] || []);
    }

    // Superuser has all permissions
    if (user.is_superuser) {
      return new Set(ROLE_SIMULATION_PERMISSIONS.ADMIN);
    }

    // Use server-provided permissions if available, or fall back to role catalog
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.length > 0) {
      return new Set(user.permissions);
    }

    return new Set(ROLE_SIMULATION_PERMISSIONS[user.role] || []);
  }, [user, isSimulating, previewRole]);

  const hasPermission = (permission: string): boolean => {
    return effectivePermissions.has(permission);
  };

  const hasFeature = (feature: FeatureFlagKey | string): boolean => {
    return featureFlags[feature] ?? true;
  };

  const canAccess = (permission: string, feature?: FeatureFlagKey | string): boolean => {
    const permOk = hasPermission(permission);
    const featOk = feature ? hasFeature(feature) : true;
    return permOk && featOk;
  };

  const toggleFeatureFlag = async (key: string, value: boolean) => {
    const updated = { ...featureFlags, [key]: value };
    setFeatureFlags(updated);
    try {
      await api.put("/auth/features/", { [key]: value });
    } catch (err) {
      // Revert if API fails
      setFeatureFlags(featureFlags);
      throw err;
    }
  };

  return (
    <PermissionContext.Provider
      value={{
        hasPermission,
        hasFeature,
        canAccess,
        featureFlags,
        loadingFlags,
        toggleFeatureFlag,
        refreshFeatureFlags: fetchFlags,
        previewRole,
        setPreviewRole,
        isSimulating,
        effectiveRole,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
};
