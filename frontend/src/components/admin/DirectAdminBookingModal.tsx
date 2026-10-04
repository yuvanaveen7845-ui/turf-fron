import React, { useState } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  DollarSign,
  Lock,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import api from "../../services/api";
import { Turf } from "../../types";

interface DirectAdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  turf: Turf | null;
  slot: {
    id: string;
    start_time: string;
    end_time: string;
    price: number;
  } | null;
  date: string;
  onSuccess: () => void;
  onOpenAdvancedWizard?: () => void;
  onBlockSlot?: () => void;
}

export const DirectAdminBookingModal: React.FC<DirectAdminBookingModalProps> = ({
  isOpen,
  onClose,
  turf,
  slot,
  date,
  onSuccess,
  onOpenAdvancedWizard,
  onBlockSlot,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "ON_ARRIVAL">("CASH");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!turf || !slot) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!customerName.trim()) {
      setErrorMsg("Please enter the player or team name.");
      return;
    }

    if (!customerPhone.trim() || customerPhone.replace(/\D/g, "").length < 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    setSubmitting(true);
    try {
      const paymentType = paymentMode === "ON_ARRIVAL" ? "ON_ARRIVAL" : "FULL";
      const paymentMethod = paymentMode === "ON_ARRIVAL" ? "CASH" : paymentMode;

      await api.post("/bookings/walk-in/", {
        turf_id: turf.id,
        date: date,
        slot_ids: [slot.id],
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        payment_type: paymentType,
        payment_method: paymentMethod,
        notes: `Direct counter booking via Schedule Matrix (${paymentMode})`,
      });

      // Reset local state
      setCustomerName("");
      setCustomerPhone("");
      setPaymentMode("CASH");
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        "Failed to create direct booking. Slot might have been booked.";
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900 leading-tight">
              Direct Slot Booking
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Instant Reserve & Pay for {turf.name}
            </p>
          </div>
        </div>
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Selected Slot Information Header */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Selected Session
            </div>
            <div className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
              <span>{turf.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#059669]">
                {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Date: <strong className="text-slate-700">{date}</strong>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Slot Fee
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">
              ₹{Number(slot.price).toLocaleString("en-IN")}
            </div>
          </div>
        </div>

        {/* Customer Information Form */}
        <div className="space-y-3">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Customer / Team Name <span className="text-rose-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="e.g. Vignesh (Thunder FC)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
              autoFocus
              className="text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Customer Mobile Number <span className="text-rose-500">*</span>
            </label>
            <Input
              type="tel"
              placeholder="10-digit number e.g. 98422 12345"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              required
              className="text-xs font-mono"
            />
          </div>

          {/* Payment Mode Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Payment Settlement Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "CASH", label: "💵 Paid Cash", sub: "Desk Cash" },
                { id: "UPI", label: "📱 Paid UPI", sub: "Spot QR" },
                { id: "ON_ARRIVAL", label: "⏳ Pay on Arrival", sub: "Reserve Only" },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMode(m.id as any)}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    paymentMode === m.id
                      ? "bg-emerald-50 text-[#059669] border-[#059669] ring-2 ring-emerald-500/20 font-bold shadow-2xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-medium"
                  }`}
                >
                  <div className="text-xs">{m.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{m.sub}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-2 space-y-2">
          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full"
            isLoading={submitting}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            {paymentMode === "ON_ARRIVAL" ? "Reserve Slot (Pay at Gate)" : "Reserve & Settle Payment"}
          </Button>

          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onBlockSlot) onBlockSlot();
              }}
              className="text-slate-500 hover:text-slate-800 text-[11px] font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <Lock className="w-3 h-3 text-slate-400" />
              <span>Block Slot Instead</span>
            </button>

            {onOpenAdvancedWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdvancedWizard();
                }}
                className="text-[#059669] hover:underline text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
              >
                <span>Advanced 4-Step Wizard</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
