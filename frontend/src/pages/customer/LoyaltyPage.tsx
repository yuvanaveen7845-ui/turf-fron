import React from "react";
import { Navigate } from "react-router-dom";

export const LoyaltyPage: React.FC = () => {
  return <Navigate to="/wallet" replace />;
};
