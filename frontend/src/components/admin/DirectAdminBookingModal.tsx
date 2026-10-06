import React, { useState, useMemo, useEffect } from "react";
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
    id: string | number;
    start_time: string;
    end_time: string;
    price: number;
    status?: string;
    is_available?: boolean;
  } | null;
  allSlots?: any[];
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
  allSlots = [],
  date,
  onSuccess,
  onOpenAdvancedWizard,
  onBlockSlot,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "ON_ARRIVAL">("CASH");
  const [preferredDuration, setPreferredDuration] = useState<number>(60);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Helper: calculate minutes in a slot
  const calcSlotMinutes = (s: any): number => {
    if (!s?.start_time || !s?.end_time) return 60;
    const [sh, sm] = s.start_time.split(":").map(Number);
    const [eh, em] = s.end_time.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff > 0 ? diff : 60;
  };

  const is30MinPitch = useMemo(() => {
    if (slot && calcSlotMinutes(slot) === 30) return true;
    if (allSlots && allSlots.length > 0) {
      return allSlots.some((s) => calcSlotMinutes(s) === 30);
    }
    return false;
  }, [slot, allSlots]);

  // Duration Presets
  const durationPresets = useMemo(() => {
    if (is30MinPitch) {
      return [
        { mins: 60, label: "60 mins", sub: "1.0 hr" },
        { mins: 90, label: "90 mins", sub: "1.5 hrs", badge: "+½h" },
        { mins: 120, label: "120 mins", sub: "2.0 hrs" },
        { mins: 150, label: "150 mins", sub: "2.5 hrs", badge: "+½h" },
        { mins: 180, label: "180 mins", sub: "3.0 hrs" },
        { mins: 240, label: "240 mins", sub: "4.0 hrs" },
      ];
    }
    return [
      { mins: 60, label: "60 mins", sub: "1.0 hr" },
      { mins: 120, label: "120 mins", sub: "2.0 hrs" },
      { mins: 180, label: "180 mins", sub: "3.0 hrs" },
      { mins: 240, label: "240 mins", sub: "4.0 hrs" },
    ];
  }, [is30MinPitch]);

  // Auto-chain consecutive available slots starting from `slot`
  const chainedSlots = useMemo(() => {
    if (!slot) return [];
    const result = [slot];
    let totalMins = calcSlotMinutes(slot);
    let nextEndTime = slot.end_time;

    if (!allSlots || allSlots.length === 0) return result;

    while (totalMins < preferredDuration) {
      const next = allSlots.find(
        (s) =>
          s.id !== slot.id &&
          (s.status === "AVAILABLE" || s.is_available === true) &&
          s.start_time === nextEndTime
      );
      if (!next) break;
      result.push(next);
      totalMins += calcSlotMinutes(next);
      nextEndTime = next.end_time;
    }
    return result;
  }, [slot, allSlots, preferredDuration]);

  const totalDurationMins = useMemo(() => {
    return chainedSlots.reduce((acc, s) => acc + calcSlotMinutes(s), 0);
  }, [chainedSlots]);

  const totalFee = useMemo(() => {
    return chainedSlots.reduce((acc, s) => acc + Number(s.price || 0), 0);
  }, [chainedSlots]);

  const sessionStart = slot ? slot.start_time.substring(0, 5) : "";
  const sessionEnd = chainedSlots.length > 0 ? chainedSlots[chainedSlots.length - 1].end_time.substring(0, 5) : "";

  // Reset preferred duration when a new slot is opened
  useEffect(() => {
    if (isOpen) {
      setPreferredDuration(60);
      setErrorMsg("");
    }
  }, [isOpen, slot]);

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
      const slotIds = chainedSlots.map((s) => s.id);

      await api.post("/bookings/walk-in/", {
        turf_id: turf.id,
        date: date,
        slot_ids: slotIds,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        payment_type: paymentType,
        payment_method: paymentMethod,
        notes: `Direct schedule booking: ${totalDurationMins} mins (${paymentMode})`,
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

        {/* Match Duration Selection Presets */}
        <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-800 text-xs">
              Select Match Duration
            </label>
            <span className="text-[10px] font-semibold text-slate-500">
              {is30MinPitch ? "Supports 90m, 150m, etc." : "Full Hours"}
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {durationPresets.map((p) => {
              const isSelected = totalDurationMins === p.mins;
              return (
                <button
                  key={p.mins}
                  type="button"
                  onClick={() => setPreferredDuration(p.mins)}
                  className={`py-2 px-1 rounded-xl text-center border font-bold transition-all cursor-pointer relative ${
                    isSelected
                      ? "bg-[#059669] text-white border-[#059669] shadow-xs"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {p.badge && (
                    <span
                      className={`absolute -top-1 -right-1 text-[8px] font-black px-1 rounded-full border ${
                        isSelected
                          ? "bg-amber-400 text-slate-950 border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}
                    >
                      {p.badge}
                    </span>
                  )}
                  <div className="text-xs leading-none">{p.mins}m</div>
                  <div
                    className={`text-[9px] mt-0.5 ${
                      isSelected ? "text-emerald-100" : "text-slate-400"
                    }`}
                  >
                    {p.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Session Information Header */}
        <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Selected Session
            </div>
            <div className="font-black text-slate-900 text-sm flex items-center space-x-1.5">
              <span>{turf.name}</span>
              <span className="text-slate-300">•</span>
              <span className="text-[#059669]">
                {sessionStart} - {sessionEnd}
              </span>
            </div>
            <div className="text-[11px] text-slate-500">
              Date: <strong className="text-slate-700">{date}</strong> •{" "}
              <span className="font-bold text-[#059669]">
                {totalDurationMins} mins ({chainedSlots.length} slot{chainedSlots.length > 1 ? "s" : ""})
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Total Fee
            </div>
            <div className="text-lg font-black text-slate-900 font-mono">
              ₹{Number(totalFee).toLocaleString("en-IN")}
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
            {paymentMode === "ON_ARRIVAL"
              ? `Reserve ${totalDurationMins}m Match (Pay at Gate)`
              : `Reserve & Settle ₹${Number(totalFee).toLocaleString("en-IN")}`}
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
