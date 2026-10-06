import React, { useState, useEffect, useMemo } from "react";
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
import { useToast } from "../../context/ToastContext";
import { normalizeList } from "../../utils/helpers";

import { initiateRazorpayCheckout } from "../../services/razorpay";

export const StaffWalkInPage: React.FC = () => {
  const toast = useToast();
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"CASH" | "UPI" | "RAZORPAY">("CASH");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [successBooking, setSuccessBooking] = useState<any>(null);

  const todayStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => {
        const list = normalizeList<Turf>(res.data);
        setTurfs(list);
        if (list.length > 0) setSelectedTurfId(list[0].id);
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!selectedTurfId) return;
    api
      .get(`/turfs/${selectedTurfId}/availability/?date=${todayStr}`)
      .then((res) => setTodaySlots(res.data?.slots || []))
      .catch((err) => {
        console.error(err);
        setTodaySlots([]);
      });
  }, [selectedTurfId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSlotIds.length === 0) {
      toast.warning("Please select at least one open time slot.");
      return;
    }
    if (totalDurationMins < 60) {
      toast.warning("Minimum match duration is 60 minutes (1 hour). Please select at least two consecutive 30-minute slots.");
      return;
    }
    setLoading(true);
    try {
      if (paymentMode === "RAZORPAY") {
        // Create server walk-in booking and unified Razorpay order in single request
        const res = await api.post("/bookings/staff/walk-in/", {
          turf_id: selectedTurfId,
          slot_ids: selectedSlotIds,
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_method: "RAZORPAY",
          notes: `${notes ? notes + " • " : ""}Desk Razorpay Digital Payment`,
        });
        const orderData = res.data;
        const bookingData = orderData.booking || orderData;

        await initiateRazorpayCheckout({
          orderData: {
            order_id: orderData.order_id,
            amount: orderData.amount,
            currency: orderData.currency || "INR",
            key_id: orderData.key_id,
            booking_id: orderData.booking_id || bookingData.booking_id,
            description: `Walk-in Match Pass (${orderData.booking_id || bookingData.booking_id})`,
          },
          user: {
            full_name: customerName || "Walk-in Guest",
            phone: customerPhone,
          },
          onSuccess: async (verifyPayload) => {
            const verifyRes = await api.post("/payments/razorpay/verify/", {
              razorpay_order_id: verifyPayload.razorpay_order_id,
              razorpay_payment_id: verifyPayload.razorpay_payment_id,
              razorpay_signature: verifyPayload.razorpay_signature,
              booking_id: orderData.booking_id || bookingData.booking_id,
            });
            setSuccessBooking(verifyRes.data?.booking || bookingData);
            toast.success("Walk-in payment verified & match pass activated!");
            setSelectedSlotIds([]);
            setCustomerName("");
            setCustomerPhone("");
            setNotes("");
            api
              .get(`/turfs/${selectedTurfId}/availability/?date=${todayStr}`)
              .then((r) => setTodaySlots(r.data.slots));
          },
          onError: (errMsg) => {
            toast.error(errMsg || "Walk-in payment was not completed.");
          },
        });
      } else {
        const res = await api.post("/bookings/staff/walk-in/", {
          turf_id: selectedTurfId,
          slot_ids: selectedSlotIds,
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_method: paymentMode,
          notes: `${notes ? notes + " • " : ""}Paid via ${paymentMode} at reception counter`,
        });
        setSuccessBooking(res.data);
        toast.success("Walk-in booking created and confirmed!");
        setSelectedSlotIds([]);
        setCustomerName("");
        setCustomerPhone("");
        setNotes("");
        api
          .get(`/turfs/${selectedTurfId}/availability/?date=${todayStr}`)
          .then((r) => setTodaySlots(r.data.slots));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create walk-in booking.");
    } finally {
      setLoading(false);
    }
  };

  const [preferredDuration, setPreferredDuration] = useState<number>(60);

  const calcSlotMinutes = (slot: TimeSlot): number => {
    if (!slot?.start_time || !slot?.end_time) return 60;
    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff > 0 ? diff : 60;
  };

  const selectedSlotsObjects = todaySlots.filter((s) => selectedSlotIds.includes(s.id));
  const totalAmount = selectedSlotsObjects.reduce((acc, s) => acc + Number(s.price), 0);
  const totalDurationMins = useMemo(() => {
    if (selectedSlotsObjects.length === 0) return 0;
    return selectedSlotsObjects.reduce((acc, s) => acc + calcSlotMinutes(s), 0);
  }, [selectedSlotsObjects]);

  const is30MinPitch = useMemo(() => {
    if (!todaySlots || todaySlots.length === 0) return false;
    return todaySlots.some((s) => calcSlotMinutes(s) === 30);
  }, [todaySlots]);

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

  const activeDurationMins = totalDurationMins > 0 ? totalDurationMins : preferredDuration;

  const handleDurationPresetClick = (mins: number) => {
    setPreferredDuration(mins);
    if (selectedSlotIds.length > 0) {
      const firstSelected = todaySlots.find((s) => s.id === selectedSlotIds[0]);
      if (firstSelected) {
        const newIds: string[] = [firstSelected.id];
        let accumulatedMins = calcSlotMinutes(firstSelected);
        let nextEndTime = firstSelected.end_time;
        while (accumulatedMins < mins) {
          const nextSlot = todaySlots.find(
            (s) => s.is_available && s.start_time === nextEndTime
          );
          if (!nextSlot) break;
          newIds.push(nextSlot.id);
          accumulatedMins += calcSlotMinutes(nextSlot);
          nextEndTime = nextSlot.end_time;
        }
        setSelectedSlotIds(newIds);
      }
    }
  };

  const handleSlotClick = (slot: TimeSlot) => {
    if (!slot.is_available) return;

    if (selectedSlotIds.includes(slot.id)) {
      setSelectedSlotIds((prev) => prev.filter((id) => id !== slot.id));
      return;
    }

    const targetMins = preferredDuration || 60;
    const newIds: string[] = [slot.id];
    let accumulatedMins = calcSlotMinutes(slot);
    let nextEndTime = slot.end_time;

    while (accumulatedMins < targetMins) {
      const nextSlot = todaySlots.find(
        (s) => s.is_available && s.start_time === nextEndTime
      );
      if (!nextSlot) break;
      newIds.push(nextSlot.id);
      accumulatedMins += calcSlotMinutes(nextSlot);
      nextEndTime = nextSlot.end_time;
    }

    setSelectedSlotIds(newIds);
  };

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
          Reserve an immediate pitch slot and collect counter Cash, UPI, or Razorpay payment
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
            Booking ID: <strong className="font-mono text-[#059669]">{successBooking.booking_id}</strong> for <strong>{successBooking.customer_details?.full_name || customerName}</strong>. Amount Collected: <strong>₹{successBooking.amount_paid || totalAmount}</strong>. Gate check-in pass activated.
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
        <div className="space-y-3">
          {/* Match Duration Selector */}
          <div className="space-y-1.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs">
                Target Match Duration
              </label>
              <span className="text-[10px] font-semibold text-slate-500">
                {is30MinPitch ? "30-min intervals (90m, 150m supported)" : "60-min intervals"}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {durationPresets.map((p) => {
                const isSelected = activeDurationMins === p.mins;
                return (
                  <button
                    key={p.mins}
                    type="button"
                    onClick={() => handleDurationPresetClick(p.mins)}
                    className={`py-2 px-1.5 rounded-xl text-center border font-bold transition-all cursor-pointer relative ${
                      isSelected
                        ? "bg-[#059669] text-white border-[#059669] shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {p.badge && (
                      <span className={`absolute -top-1 -right-1 text-[8px] font-black px-1 rounded-full border ${
                        isSelected ? "bg-amber-400 text-slate-950 border-amber-300" : "bg-emerald-100 text-emerald-800 border-emerald-200"
                      }`}>
                        {p.badge}
                      </span>
                    )}
                    <div className="text-xs leading-none">{p.mins}m</div>
                    <div className={`text-[9px] mt-0.5 ${isSelected ? "text-emerald-100" : "text-slate-400"}`}>
                      {p.sub}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              2. Choose Match Time Slots ({new Date().toLocaleDateString()})
            </label>
            {totalDurationMins > 0 && (
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${totalDurationMins < 60 ? "bg-amber-50 text-amber-800 border-amber-300" : "bg-emerald-50 text-[#059669] border-emerald-200"}`}>
                {totalDurationMins} Mins ({totalDurationMins / 60} hrs • {selectedSlotIds.length} Slots)
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1 bg-[#F8FAFC] border border-slate-200 rounded-2xl">
            {todaySlots.map((slot) => {
              const isAvailable = slot.is_available;
              const isOngoing = slot.is_ongoing || slot.slot_state === "ONGOING";
              const isSelected = selectedSlotIds.includes(slot.id);

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleSlotClick(slot)}
                  className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                    isSelected
                      ? "bg-[#059669] border-[#059669] text-white font-bold shadow-sm cursor-pointer"
                      : isAvailable
                      ? "bg-white border-slate-200 text-slate-800 hover:border-emerald-300 cursor-pointer"
                      : isOngoing
                      ? "bg-amber-50 border-amber-300 text-amber-900 cursor-not-allowed"
                      : "bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed opacity-60"
                  }`}
                >
                  <p className="font-bold">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${isSelected ? "text-emerald-100" : isOngoing ? "text-amber-700" : "text-slate-500"}`}>
                    {isAvailable ? `₹${slot.price} • open` : isOngoing ? "in session" : "ended / past"}
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <button
              type="button"
              onClick={() => setPaymentMode("RAZORPAY")}
              className={`p-3 rounded-xl border text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer ${
                paymentMode === "RAZORPAY"
                  ? "bg-emerald-50 border-[#059669] text-[#059669] ring-2 ring-emerald-500/20"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Razorpay Digital</span>
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
            disabled={selectedSlotIds.length === 0 || !customerName.trim() || totalDurationMins < 60}
          >
            {loading
              ? "Processing..."
              : totalDurationMins > 0 && totalDurationMins < 60
              ? "Min 1 Hr Required (Select 2+ Slots)"
              : `Confirm Walk-In Booking (${totalDurationMins} Mins • Collect ₹${totalAmount})`}
          </Button>
        </div>
      </form>
    </div>
  );
};
