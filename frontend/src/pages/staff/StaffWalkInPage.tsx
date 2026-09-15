import React, { useState, useEffect } from "react";
import {
  UserPlus,
  Calendar,
  Clock,
  DollarSign,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";

export const StaffWalkInPage: React.FC = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
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
      alert("Please pick at least one available slot.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/bookings/staff/walk-in/", {
        turf_id: selectedTurfId,
        slot_ids: selectedSlotIds,
        customer_name: customerName,
        customer_phone: customerPhone,
        notes,
      });
      setSuccessBooking(res.data);
      setSelectedSlotIds([]);
      setCustomerName("");
      setCustomerPhone("");
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

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-6">
      <div className="border-b border-slate-800 pb-5">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center space-x-1.5">
          <UserPlus className="w-4 h-4" />
          <span>Reception Desk</span>
        </span>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Register Walk-in Player
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Book an immediate pitch slot and collect venue cash/UPI payment
        </p>
      </div>

      {successBooking && (
        <div className="p-6 bg-emerald-950/80 border border-emerald-500 rounded-3xl space-y-3">
          <div className="flex items-center space-x-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-bold text-sm">Walk-in Confirmed!</h3>
          </div>
          <p className="text-xs text-slate-300">
            Booking ID:{" "}
            <strong className="font-mono text-white">
              {successBooking.booking_id}
            </strong>{" "}
            for <strong>{successBooking.customer_details?.full_name}</strong>.
            Amount Collected: ₹{successBooking.amount_paid}.
          </p>
          <button
            onClick={() => setSuccessBooking(null)}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Create Another Walk-in
          </button>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6"
      >
        {/* Select Turf */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Pitch
          </label>
          <select
            value={selectedTurfId}
            onChange={(e) => setSelectedTurfId(e.target.value)}
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white outline-none focus:border-amber-500"
          >
            {turfs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.sport_type}) - ₹{t.base_price}/hr
              </option>
            ))}
          </select>
        </div>

        {/* Available Today Slots */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-2">
            Select Today's Time Slot ({todayStr})
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
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
                        selectedSlotIds.filter((id) => id !== slot.id),
                      );
                    else setSelectedSlotIds([...selectedSlotIds, slot.id]);
                  }}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "bg-amber-500 border-amber-400 text-slate-950 font-bold"
                      : isAvailable
                        ? "bg-slate-950 border-slate-800 text-slate-200 hover:border-amber-500"
                        : "bg-slate-950/30 border-slate-800/30 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <p className="font-bold">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </p>
                  <p className="text-[10px] mt-1">
                    ₹{slot.price} • {slot.status}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Player Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Player / Captain Name
            </label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Suresh Raina"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="+91 98765 00000"
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Staff Notes
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Cash collected at counter, team requested extra bibs"
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white outline-none focus:border-amber-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading || selectedSlotIds.length === 0}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
        >
          {loading
            ? "Confirming Walk-in..."
            : "Confirm Walk-in & Collect Payment"}
        </button>
      </form>
    </div>
  );
};
