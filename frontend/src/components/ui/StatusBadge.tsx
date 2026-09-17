import React from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ShieldCheck,
  Ban,
  HelpCircle,
} from "lucide-react";

export type StatusType =
  // Booking Statuses
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "PAYMENT_PENDING"
  | "NO_SHOW"
  | "REFUNDED"
  // Payment Statuses
  | "PAID"
  | "SUCCESSFUL"
  | "PROCESSING"
  | "FAILED"
  | "TIMEOUT"
  | "PARTIALLY_REFUNDED"
  // User Statuses
  | "ACTIVE"
  | "INVITED"
  | "SUSPENDED"
  | "DISABLED"
  // Slot Statuses
  | "AVAILABLE"
  | "LOCKED"
  | "BOOKED"
  | "MAINTENANCE";

export interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md";
  showIcon?: boolean;
}

const LABEL_MAP: Record<string, string> = {
  CONFIRMED: "Confirmed",
  CHECKED_IN: "Checked In",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  PAYMENT_PENDING: "Payment Pending",
  NO_SHOW: "No-Show",
  REFUNDED: "Refunded",
  PAID: "Paid",
  SUCCESSFUL: "Paid",
  PROCESSING: "Processing",
  FAILED: "Failed",
  TIMEOUT: "Timed Out",
  PARTIALLY_REFUNDED: "Partial Refund",
  ACTIVE: "Active",
  INVITED: "Invited",
  SUSPENDED: "Suspended",
  DISABLED: "Disabled",
  AVAILABLE: "Available",
  LOCKED: "Held",
  BOOKED: "Booked",
  MAINTENANCE: "Maintenance",
  UPCOMING: "Upcoming",
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const norm = (status || "").toUpperCase();
  const label = LABEL_MAP[norm] ?? status;

  let styles = "bg-slate-100 text-slate-700 border-slate-200";
  let icon = <HelpCircle className="w-3 h-3" />;

  switch (norm) {
    case "CONFIRMED":
    case "UPCOMING":
    case "PAID":
    case "SUCCESSFUL":
    case "ACTIVE":
    case "AVAILABLE":
      styles = "bg-emerald-50 text-[#059669] border-emerald-200";
      icon = <CheckCircle2 className="w-3 h-3 text-[#059669]" />;
      break;

    case "CHECKED_IN":
    case "COMPLETED":
      styles = "bg-blue-50 text-blue-700 border-blue-200";
      icon = <ShieldCheck className="w-3 h-3 text-blue-600" />;
      break;

    case "IN_PROGRESS":
    case "PROCESSING":
    case "LOCKED":
    case "INVITED":
    case "PAYMENT_PENDING":
      styles = "bg-amber-50 text-amber-800 border-amber-200";
      icon = <Clock className="w-3 h-3 text-amber-600" />;
      break;

    case "CANCELLED":
    case "FAILED":
    case "TIMEOUT":
    case "SUSPENDED":
    case "DISABLED":
    case "NO_SHOW":
      styles = "bg-rose-50 text-rose-700 border-rose-200";
      icon = <XCircle className="w-3 h-3 text-rose-600" />;
      break;

    case "REFUNDED":
    case "PARTIALLY_REFUNDED":
    case "MAINTENANCE":
      styles = "bg-purple-50 text-purple-700 border-purple-200";
      icon = <Ban className="w-3 h-3 text-purple-600" />;
      break;

    case "BOOKED":
      styles = "bg-rose-50 text-rose-800 border-rose-200";
      icon = <AlertCircle className="w-3 h-3 text-rose-600" />;
      break;
  }

  const sizeStyles =
    size === "sm"
      ? "text-[10px] px-2 py-0.5 gap-1 font-extrabold"
      : "text-xs px-2.5 py-1 gap-1.5 font-bold";

  return (
    <span
      className={`inline-flex items-center rounded-full border tracking-wide uppercase ${styles} ${sizeStyles}`}
    >
      {showIcon && icon}
      <span>{label}</span>
    </span>
  );
};
