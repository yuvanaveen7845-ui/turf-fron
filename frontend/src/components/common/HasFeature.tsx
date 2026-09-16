import React from "react";
import { usePermission } from "../../context/PermissionContext";
import { FeatureFlagKey } from "../../types";

interface HasFeatureProps {
  feature: FeatureFlagKey | string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Enterprise Feature Flag Primitive:
 * Conditionally renders children only if the specified business feature flag is enabled.
 */
export const HasFeature: React.FC<HasFeatureProps> = ({
  feature,
  fallback = null,
  children,
}) => {
  const { hasFeature } = usePermission();

  if (!hasFeature(feature)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default HasFeature;
