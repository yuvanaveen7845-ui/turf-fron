import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
  Sparkles,
  Layers,
  Phone,
  User,
  CreditCard,
  Printer,
  QrCode,
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";
import { Button, Input, Select } from "../ui";
import { formatTime12h } from "../../utils/timeFormat";
import { useToast } from "../../context/ToastContext";

interface WalkInPOSEmbedProps {
  onSuccess?: (booking: any) => void;
}

export const WalkInPOSEmbed: React.FC<WalkInPOSEmbedProps> = ({ onSuccess }) => {
  const toast = useToast();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
        setTurfs(list);
        if (list.length > 0) setSelectedTurfId(String(list[0].id));
      })
      .catch((err) => {
        console.error(err);
        setTurfs([]);
      });
  }, []);

  const loadSlots = () => {
    if (!selectedTurfId) return;
    setSlotsLoading(true);
    api
      .get(`/turfs/${selectedTurfId}/availability/?date=${todayStr}`)
      .then((res) => setTodaySlots(res.data?.slots || []))
      .catch((err) => {
        console.error(err);
        setTodaySlots([]);
      })
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    loadSlots();
    setSelectedSlotIds([]);
  }, [selectedTurfId]);

  const toggleSlot = (slotId: string) => {
    setSelectedSlotIds((prev) =>
      prev.includes(slotId) ? prev.filter((id) => id !== slotId) : [...prev, slotId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotIds.length === 0) {
      toast.warning("Please select at least one open time slot.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/bookings/staff/walk-in/", {
        turf_id: selectedTurfId,
        slot_ids: selectedSlotIds,
        customer_name: customerName,
        customer_phone: customerPhone,
        notes: `${notes ? notes + " • " : ""}Paid via ${paymentMode} at reception counter`,
      });

      const data = res.data;
      setSuccessBooking(data);
      toast.success("Walk-in booking created and paid successfully!");
      setSelectedSlotIds([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      loadSlots();

      if (onSuccess) onSuccess(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create walk-in booking.");
    } finally {
      setLoading(false);
    }
  };

  const selectedSlotsObjects = todaySlots.filter((s) => selectedSlotIds.includes(s.id));
  const totalAmount = selectedSlotsObjects.reduce((acc, s) => acc + Number(s.price), 0);

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-[#ECFDF5] text-[#059669]">
            <UserPlus className="w-5 h-5" />
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Instant Walk-In & Counter POS
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Fast-track spot reservation with immediate cash or UPI payment recording
        </p>
      </div>

      {successBooking ? (
        <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-[#059669] text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">Walk-In Booking Confirmed!</h4>
            <p className="text-xs text-emerald-800 font-mono mt-1">
              Booking Ref: <strong>#{successBooking.booking_id}</strong>
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                window.open(
                  `/print/receipt/${successBooking.booking_id}?autoprint=true`,
                  "_blank"
                )
              }
              leftIcon={<Printer className="w-4 h-4" />}
            >
              Print Receipt
            </Button>
            <Button
              size="sm"
              onClick={() => setSuccessBooking(null)}
            >
              New Walk-In
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Turf Arena Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Select Pitch Arena
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {turfs.map((turf) => (
                <button
                  key={turf.id}
                  type="button"
                  onClick={() => setSelectedTurfId(String(turf.id))}
                  className={`p-3 rounded-xl border text-left transition ${
                    selectedTurfId === String(turf.id)
                      ? "border-[#059669] bg-emerald-50/70 text-slate-900 font-black shadow-xs ring-1 ring-[#059669]"
                      : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold">{turf.name}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{turf.sport_type}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Today's Slots Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Select Available Slot(s)
              </label>
              <span className="text-[11px] text-[#059669] font-bold">
                {todaySlots.filter((s) => s.is_available).length} open slots today
              </span>
            </div>

            {slotsLoading ? (
              <div className="h-20 bg-slate-100 rounded-xl animate-pulse" />
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1">
                {todaySlots.map((slot) => {
                  const isSelected = selectedSlotIds.includes(slot.id);
                  const isAvail = slot.is_available;

                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!isAvail}
                      onClick={() => toggleSlot(slot.id)}
                      className={`p-2 rounded-xl text-center text-xs transition font-mono ${
                        isSelected
                          ? "bg-[#059669] text-white font-bold shadow-sm"
                          : isAvail
                          ? "bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-slate-800 font-semibold"
                          : "bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed line-through"
                      }`}
                    >
                      <div>{formatTime12h(slot.start_time)}</div>
                      <div className="text-[10px] font-bold mt-0.5">
                        ₹{Number(slot.price)}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Customer & Payment Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Player / Squad Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. John Doe / Thunder FC"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#059669] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Phone Number (for SMS Match Pass)
              </label>
              <input
                type="tel"
                required
                placeholder="e.g. +91 98765 43210"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-[#059669] focus:outline-none"
              />
            </div>
          </div>

          {/* Payment Method & Submit */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 bg-[#F8FAFC] -mx-6 -mb-6 p-6 rounded-b-3xl">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-600">Payment:</span>
              <button
                type="button"
                onClick={() => setPaymentMode("CASH")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  paymentMode === "CASH"
                    ? "bg-[#059669] text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                💵 Cash Collected
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode("UPI")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  paymentMode === "UPI"
                    ? "bg-[#059669] text-white"
                    : "bg-white border border-slate-200 text-slate-700"
                }`}
              >
                📱 Counter UPI QR
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total Due</span>
                <p className="text-lg font-black text-slate-900 font-mono">₹{totalAmount.toLocaleString("en-IN")}</p>
              </div>

              <Button
                type="submit"
                isLoading={loading}
                disabled={selectedSlotIds.length === 0}
                className="shadow-emerald-glow"
              >
                Confirm Walk-In & Admit →
              </Button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
