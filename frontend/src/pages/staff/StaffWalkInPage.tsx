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
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";
import { Button, Input, Select } from "../../components/ui";

export const StaffWalkInPage: React.FC = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI">("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => {
        setTurfs(res.data);
        if (res.data.length > 0) setSelectedTurfId(res.data[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedTurfId) return;
    api
      .get(`/turfs/${selectedTurfId}/availability/?date=${todayStr}`)
      .then((res) => setTodaySlots(res.data.slots || []))
      .catch((err) => console.error(err));
  }, [selectedTurfId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotIds.length === 0) {
      alert("Please select at least one open time slot.");
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
      setSuccessBooking(res.data);
      setSelectedSlotIds([]);
      setCustomerName("");
      setCustomerPhone("");
      setNotes("");
      // Refresh slots
      api
        .get(`/turfs/${selectedTurfId}/availability/?date=${todayStr}`)
        .then((r) => setTodaySlots(r.data.slots));
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to create walk-in booking.");
    } finally {
      setLoading(false);
    }
  };

  const selectedSlotsObjects = todaySlots.filter((s) => selectedSlotIds.includes(s.id));
  const totalAmount = selectedSlotsObjects.reduce((acc, s) => acc + Number(s.price), 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#ECFDF5] border border-emerald-200 text-xs font-bold uppercase tracking-wider text-[#059669]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Reception Desk Terminal</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-2">
          Express Walk-In Match Booking
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Reserve an immediate pitch slot and collect counter Cash or UPI payment
        </p>
      </div>

      {/* Success Notification */}
      {successBooking && (
        <div className="p-6 bg-[#F0FDF4] border border-emerald-200 rounded-3xl space-y-3 shadow-sm animate-in fade-in">
          <div className="flex items-center space-x-2 text-[#059669]">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-sm">Walk-in Booking Confirmed!</h3>
          </div>
          <p className="text-xs text-slate-700">
            Booking ID: <strong className="font-mono text-[#059669]">{successBooking.booking_id}</strong> for <strong>{successBooking.customer_details?.full_name || customerName}</strong>. Amount Collected: <strong>₹{successBooking.amount_paid}</strong>. Gate check-in pass activated.
          </p>
          <button
            type="button"
            onClick={() => setSuccessBooking(null)}
            className="text-xs font-bold text-[#059669] hover:underline cursor-pointer"
          >
            Register Another Player
          </button>
        </div>
      )}

      {/* Booking Form Card */}
      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-pitch-card"
      >
        {/* Step 1: Select Pitch */}
        <div>
          <Select
            label="1. Select Turf Arena"
            isRequired
            value={selectedTurfId}
            onChange={(e) => setSelectedTurfId(e.target.value)}
            options={turfs.map((t) => ({
              value: t.id,
              label: `${t.name} (${t.sport_type}) — ₹${Number(t.base_price).toLocaleString("en-IN")}/hr`,
            }))}
          />
        </div>

        {/* Step 2: Select Today's Slots */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700">
            2. Choose Today's Time Slots ({new Date().toLocaleDateString()})
          </label>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 bg-[#F8FAFC] border border-slate-200 rounded-2xl">
            {todaySlots.map((slot) => {
              const isAvailable = slot.status === "AVAILABLE";
              const isSelected = selectedSlotIds.includes(slot.id);

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    if (isSelected)
                      setSelectedSlotIds(
                        selectedSlotIds.filter((id) => id !== slot.id)
                      );
                    else setSelectedSlotIds([...selectedSlotIds, slot.id]);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#059669] border-[#059669] text-white font-bold shadow-sm"
                      : isAvailable
                      ? "bg-white border-slate-200 text-slate-800 hover:border-emerald-300"
                      : "bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed"
                  }`}
                >
                  <p className="font-bold">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                    ₹{slot.price} • {slot.status.toLowerCase()}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Player Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Player / Captain Name"
            isRequired
            placeholder="e.g. Suresh Raina"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
          />
          <Input
            label="Contact Phone"
            isRequired
            type="tel"
            placeholder="+91 98765 43210"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
          />
        </div>

        {/* Step 4: Payment Mode Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            Payment Mode Collected at Counter
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPaymentMode("CASH")}
              className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                paymentMode === "CASH"
                  ? "bg-emerald-50 border-[#059669] text-[#059669] ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Cash Payment</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMode("UPI")}
              className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                paymentMode === "UPI"
                  ? "bg-emerald-50 border-[#059669] text-[#059669] ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Counter UPI QR</span>
            </button>
          </div>
        </div>

        <Input
          label="Desk Notes"
          placeholder="e.g. Paid in cash at reception counter, bibs provided"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Submit */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            className="w-full py-3.5"
            isLoading={loading}
            disabled={selectedSlotIds.length === 0 || !customerName.trim()}
          >
            {loading ? "Processing..." : `Confirm Walk-In Booking (Collect ₹${totalAmount})`}
          </Button>
        </div>
      </form>
    </div>
  );
};
