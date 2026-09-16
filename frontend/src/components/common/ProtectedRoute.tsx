import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { usePermission } from "../../context/PermissionContext";
import { UserRole, FeatureFlagKey } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: UserRole[];
  requireB2B?: boolean;
  requiredPermission?: string;
  requiredFeature?: FeatureFlagKey | string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requireB2B = false,
  requiredPermission,
  requiredFeature,
}) => {
  const { user, loading } = useAuth();
  const { hasPermission, hasFeature, effectiveRole } = usePermission();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-[#059669] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-400">Verifying session...</p>
      </div>
    );
  }

  // Not logged in -> redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Suspended or disabled account
  if (user.status && user.status !== "ACTIVE") {
    return <Navigate to="/access-denied" state={{ reason: "ACCOUNT_SUSPENDED" }} replace />;
  }

  // B2B requirement check
  const role = effectiveRole || user.role;
  if (requireB2B && !["STAFF", "ADMIN"].includes(role)) {
    return <Navigate to="/access-denied" state={{ reason: "NOT_B2B" }} replace />;
  }

  // Specific role check
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/unauthorized" state={{ requiredRoles: allowedRoles }} replace />;
  }

  // Specific permission check
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/access-denied" state={{ reason: "PERMISSION_DENIED", permission: requiredPermission }} replace />;
  }

  // Business feature flag check
  if (requiredFeature && !hasFeature(requiredFeature)) {
    return <Navigate to="/access-denied" state={{ reason: "FEATURE_DISABLED", feature: requiredFeature }} replace />;
  }

  return children;
};
