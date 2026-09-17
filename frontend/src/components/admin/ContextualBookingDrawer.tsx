import React, { useState } from "react";
import {
  X,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CreditCard,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  ChevronDown,
  ChevronUp,
  FileText,
  Send,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { Modal } from "../ui/Modal";
import { Input } from "../ui/Input";
import api from "../../services/api";
import { formatTimeWithRelative } from "../../utils/timeFormat";
import { useToast } from "../../context/ToastContext";

interface ContextualBookingDrawerProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onBookingUpdated?: () => void;
  onRecordPaymentClick?: (bookingId: string | number) => void;
}

export const ContextualBookingDrawer: React.FC<ContextualBookingDrawerProps> = ({
  booking,
  isOpen,
  onClose,
  onBookingUpdated,
  onRecordPaymentClick,
}) => {
  const toast = useToast();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Sub-action modal states
  const [rescheduleModal, setRescheduleModal] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState("");
  const [newRescheduleTime, setNewRescheduleTime] = useState("19:00");
  const [reschedulePriceDiff, setReschedulePriceDiff] = useState<number>(0);
  const [rescheduling, setRescheduling] = useState(false);

  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("Customer Request");
  const [cancelling, setCancelling] = useState(false);

  const [refundModal, setRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Customer cancellation refund");
  const [refunding, setRefunding] = useState(false);

  const [checkinSubmitting, setCheckinSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Preserve scroll position and add Escape key listener
  const prevScrollY = React.useRef(0);

  React.useEffect(() => {
    if (isOpen) {
      prevScrollY.current = window.scrollY;
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onClose();
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      window.scrollTo({ top: prevScrollY.current, behavior: "instant" });
    }, 50);
  };

  if (!isOpen || !booking) return null;

  const balanceDue = Number(booking.balance_due || 0);
  const isPaid = balanceDue <= 0 && booking.status !== "PENDING";

  // Manual Check-In
  const handleCheckIn = async () => {
    setCheckinSubmitting(true);
    setActionFeedback(null);
    try {
      await api.post("/qr/override/", {
        booking_id: booking.id,
        reason: "Admin desk manual admission check-in",
      });
      setActionFeedback("Player successfully admitted & checked in!");
      toast.success("Player successfully checked in!");
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Check-in failed.");
    } finally {
      setCheckinSubmitting(false);
    }
  };

  // Reschedule Execution
  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRescheduleDate || !newRescheduleTime) return;

    setRescheduling(true);
    try {
      await api.post(`/bookings/${booking.id}/reschedule/`, {
        new_date: newRescheduleDate,
        new_start_time: newRescheduleTime,
      });
      setRescheduleModal(false);
      setActionFeedback("Match booking rescheduled successfully!");
      toast.success("Booking rescheduled successfully!");
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Reschedule failed.");
    } finally {
      setRescheduling(false);
    }
  };

  // Cancellation Execution
  const handleCancelBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCancelling(true);
    try {
      await api.post(`/bookings/${booking.id}/cancel/`, {
        reason: cancelReason,
      });
      setCancelModal(false);
      setActionFeedback("Booking cancelled. Released match slot to calendar.");
      toast.success("Booking cancelled successfully.");
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Cancellation failed.");
    } finally {
      setCancelling(false);
    }
  };

  // Refund Execution
  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(refundAmount);
    if (!amountNum || amountNum <= 0) return;

    setRefunding(true);
    try {
      await api.post(`/payments/refunds/`, {
        booking_id: booking.id,
        amount: amountNum,
        reason: refundReason,
      });
      setRefundModal(false);
      setActionFeedback(`Refund of ₹${amountNum} initiated successfully!`);
      toast.success(`Refund of ₹${amountNum} initiated!`);
      if (onBookingUpdated) onBookingUpdated();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Refund initiation failed.");
    } finally {
      setRefunding(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 transition-opacity"
        onClick={onClose}
      />

      {/* Slide-over Right Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-lg w-full bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-black text-slate-900 text-lg">
                #{booking.booking_id || booking.id}
              </span>
              <StatusBadge status={booking.status} size="sm" />
            </div>
            <p className="text-xs font-bold text-slate-600 mt-1">
              {booking.turf_details?.name || "Pitch Arena"} • {booking.date}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Close drawer (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Feedback Banner with Actionable Options */}
        {actionFeedback && (
          <div className="p-3.5 bg-emerald-50 border-b border-emerald-200 text-[#059669] text-xs font-bold flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#059669]" />
              <span>{actionFeedback}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActionFeedback(null);
                  handleClose();
                }}
                className="px-2 py-0.5 rounded-md bg-[#059669] text-white hover:bg-[#047857] text-[11px] font-bold cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* Quick Action Buttons */}
          <div className="p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-500 tracking-wider">
              Quick Operations
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              {balanceDue > 0 && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (onRecordPaymentClick) {
                      onRecordPaymentClick(booking.id);
                    }
                  }}
                  leftIcon={<DollarSign className="w-3.5 h-3.5" />}
                >
                  Record Payment (₹{balanceDue})
                </Button>
              )}

              {booking.status === "CONFIRMED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckIn}
                  isLoading={checkinSubmitting}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />}
                >
                  Admit / Check-In
                </Button>
              )}

              {booking.status !== "CANCELLED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewRescheduleDate(booking.date);
                    setRescheduleModal(true);
                  }}
                  leftIcon={<Clock className="w-3.5 h-3.5 text-blue-600" />}
                >
                  Reschedule Slot
                </Button>
              )}

              {booking.status !== "CANCELLED" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelModal(true)}
                  className="text-rose-600 hover:bg-rose-50 border-rose-200"
                  leftIcon={<AlertTriangle className="w-3.5 h-3.5" />}
                >
                  Cancel Match
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRefundAmount(String(booking.final_amount || 0));
                  setRefundModal(true);
                }}
                leftIcon={<RotateCcw className="w-3.5 h-3.5 text-purple-600" />}
              >
                Issue Refund
              </Button>
            </div>
          </div>

          {/* Player & Match Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Player Info</span>
              <div className="font-bold text-slate-900 text-sm">
                {booking.customer_details?.full_name || "Guest Customer"}
              </div>
              <div className="text-slate-600 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>{booking.customer_details?.phone || "No phone"}</span>
              </div>
              <div className="text-slate-500 truncate flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span className="truncate">{booking.customer_details?.email}</span>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <span className="text-[10px] font-bold uppercase text-slate-400">Match Details</span>
              <div className="font-bold text-slate-900 text-sm">
                {booking.turf_details?.name || "Pitch"}
              </div>
              <div className="text-slate-700 font-medium flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[#059669]" />
                <span>{booking.date}</span>
              </div>
              <div className="text-slate-600 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                <span className="font-semibold text-slate-800">
                  {formatTimeWithRelative(booking.date, booking.start_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Financials & Balance */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase text-[#059669]">Financial Summary</span>
              <span className="text-[11px] font-bold text-slate-600">
                {booking.payment_type || "FULL"} Payment
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs text-slate-500">Gross Price:</span>
                <div className="text-lg font-black text-slate-900 font-mono">
                  ₹{Number(booking.final_amount).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500">Outstanding Balance:</span>
                <div
                  className={`text-lg font-black font-mono ${
                    balanceDue > 0 ? "text-amber-600" : "text-[#059669]"
                  }`}
                >
                  ₹{balanceDue.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          {/* Turnstile Pass Status */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center">
                <QrCode className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Digital Match Pass</div>
                <div className="text-[11px] text-slate-500">
                  {booking.status === "CONFIRMED" ? "Active for gate entry" : "Pass inactive"}
                </div>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                booking.status === "CHECKED_IN"
                  ? "bg-emerald-100 text-[#059669]"
                  : "bg-purple-100 text-purple-700"
              }`}
            >
              {booking.status === "CHECKED_IN" ? "ADMITTED" : "PASS READY"}
            </span>
          </div>

          {/* Visual Operational Timeline */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase text-slate-400">Match Timeline</span>
            <div className="space-y-2 pl-2 border-l-2 border-slate-200 ml-1">
              <div className="relative pl-3">
                <span className="w-2 h-2 rounded-full bg-[#059669] absolute -left-[13px] top-1" />
                <div className="font-bold text-slate-800 text-xs">Booking Created</div>
                <div className="text-[10px] text-slate-400">{booking.created_at || "Initial reservation logged"}</div>
              </div>
              {isPaid && (
                <div className="relative pl-3">
                  <span className="w-2 h-2 rounded-full bg-[#059669] absolute -left-[13px] top-1" />
                  <div className="font-bold text-slate-800 text-xs">Payment Verified</div>
                  <div className="text-[10px] text-slate-400">₹{booking.final_amount} settled</div>
                </div>
              )}
              {booking.status === "CHECKED_IN" && (
                <div className="relative pl-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 absolute -left-[13px] top-1" />
                  <div className="font-bold text-[#059669] text-xs">Checked In at Turnstile</div>
                  <div className="text-[10px] text-slate-400">Player admitted to pitch</div>
                </div>
              )}
            </div>
          </div>

          {/* Progressive Disclosure: Advanced Metadata */}
          <div className="border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-slate-500 hover:text-slate-800 font-bold text-xs"
            >
              <span>Advanced System Details</span>
              {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showAdvanced && (
              <div className="mt-2 p-3 bg-slate-100 rounded-xl space-y-1 font-mono text-[10px] text-slate-600">
                <div>UUID: {booking.id}</div>
                <div>Turf ID: {booking.turf}</div>
                <div>Customer ID: {booking.customer}</div>
                <div>Payment Method: {booking.payment_method || "ONLINE"}</div>
                <div>Hold Token: {booking.hold_token || "N/A"}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reschedule Modal */}
      {rescheduleModal && (
        <Modal
          isOpen={rescheduleModal}
          onClose={() => setRescheduleModal(false)}
          title="Reschedule Match Slot"
          description={`Booking #${booking.booking_id || booking.id} • ${booking.turf_details?.name}`}
          maxWidth="sm"
        >
          <form onSubmit={handleReschedule} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Match Date</label>
              <input
                type="date"
                value={newRescheduleDate}
                onChange={(e) => setNewRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">New Start Time</label>
              <input
                type="time"
                value={newRescheduleTime}
                onChange={(e) => setNewRescheduleTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              />
            </div>
            <div className="p-3 bg-[#F0FDF4] border border-emerald-200 rounded-xl text-xs text-emerald-900">
              The engine will automatically release previous slots and update digital pass validity.
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setRescheduleModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={rescheduling}>
                Confirm Reschedule
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Cancel Modal */}
      {cancelModal && (
        <Modal
          isOpen={cancelModal}
          onClose={() => setCancelModal(false)}
          title="Cancel Match Booking?"
          description={`This will release the ${booking.start_time?.slice(0, 5)} slot for booking discovery.`}
          maxWidth="sm"
        >
          <form onSubmit={handleCancelBooking} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Cancellation Reason</label>
              <select
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900"
              >
                <option value="Customer Request">Customer Request</option>
                <option value="Weather / Rain Out">Weather / Rain Out</option>
                <option value="Turf Maintenance">Turf Maintenance</option>
                <option value="Emergency Closure">Emergency Closure</option>
              </select>
            </div>
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1 text-rose-800">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Slot Release Consequence Warning:</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                Cancelling this match will immediately unreserve the slot and release it back to the live public booking schedule. The automated refund policy will calculate dues according to the cutoff rules.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setCancelModal(false)}>
                Keep Booking
              </Button>
              <Button
                type="submit"
                variant="primary"
                className="bg-rose-600 hover:bg-rose-700 text-white"
                isLoading={cancelling}
              >
                Cancel Booking
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Refund Modal */}
      {refundModal && (
        <Modal
          isOpen={refundModal}
          onClose={() => setRefundModal(false)}
          title="Issue Booking Refund"
          description={`Booking #${booking.booking_id || booking.id} • Customer: ${booking.customer_details?.full_name}`}
          maxWidth="sm"
        >
          <form onSubmit={handleIssueRefund} className="space-y-4 text-xs">
            <Input
              label="Refund Amount (₹)"
              isRequired
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRefundAmount(String(booking.final_amount || 0))}
                className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 text-[11px]"
              >
                100% Full (₹{booking.final_amount})
              </button>
              <button
                type="button"
                onClick={() => setRefundAmount(String(Math.round(Number(booking.final_amount || 0) / 2)))}
                className="px-2.5 py-1 bg-slate-100 rounded-lg font-bold text-slate-700 text-[11px]"
              >
                50% (₹{Math.round(Number(booking.final_amount || 0) / 2)})
              </button>
            </div>
            <Input
              label="Refund Reason / Notes"
              isRequired
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
            />
            <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
              <div className="font-bold flex items-center gap-1 text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Irrevocable Financial Transaction:</span>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Issuing this refund will credit the customer and log an immediate outgoing debit entry in the daily cash reconciliation register.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setRefundModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={refunding}>
                Process Refund
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
};
