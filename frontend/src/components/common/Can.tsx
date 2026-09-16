import React from "react";
import { usePermission } from "../../context/PermissionContext";

interface CanProps {
  permission: string;
  feature?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Enterprise RBAC Action Primitive:
 * Conditionally renders children only if the active user possesses the required permission
 * and optional business feature flag is enabled.
 */
export const Can: React.FC<CanProps> = ({
  permission,
  feature,
  fallback = null,
  children,
}) => {
  const { canAccess } = usePermission();

  if (!canAccess(permission, feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default Can;
