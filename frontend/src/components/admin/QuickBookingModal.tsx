import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Layers,
  CreditCard,
  CheckCircle,
  AlertCircle,
  DollarSign,
  PlusCircle,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import api from "../../services/api";

interface QuickBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
  defaultDate?: string;
  defaultTurfId?: number;
}

export const QuickBookingModal: React.FC<QuickBookingModalProps> = ({
  isOpen,
  onClose,
  onBookingCreated,
  defaultDate,
  defaultTurfId,
}) => {
  const [turfs, setTurfs] = useState<any[]>([]);
  const [selectedTurfId, setSelectedTurfId] = useState<number | "">("");
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [bookingType, setBookingType] = useState<"WALK_IN" | "REGULAR">("WALK_IN");

  // Customer Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");

  // Payment Details
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [paymentType, setPaymentType] = useState<"FULL" | "PARTIAL">("FULL");
  const [notes, setNotes] = useState("");

  // Price breakdown
  const [priceData, setPriceData] = useState<any>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Fetch turfs
  useEffect(() => {
    if (isOpen) {
      api.get("/turfs/").then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
            ? raw.results
            : [];
        setTurfs(list);
        if (defaultTurfId) {
          setSelectedTurfId(defaultTurfId);
        } else if (list.length > 0) {
          setSelectedTurfId(list[0].id);
        }
      }).catch((err) => {
        console.error(err);
        setTurfs([]);
      });
    }
  }, [isOpen, defaultTurfId]);

  // Fetch slots
  useEffect(() => {
    if (selectedTurfId && date) {
      api.get(`/turfs/${selectedTurfId}/slots/?date=${date}`)
        .then((res) => {
          const raw = res.data;
          const list = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.slots)
              ? raw.slots
              : Array.isArray(raw?.results)
                ? raw.results
                : [];
          setAvailableSlots(list);
          setSelectedSlotIds([]);
          setPriceData(null);
        })
        .catch((err) => {
          console.error(err);
          setAvailableSlots([]);
        });
    }
  }, [selectedTurfId, date]);

  // Calculate pricing when slots change
  useEffect(() => {
    if (selectedTurfId && date && selectedSlotIds.length > 0) {
      setLoadingPrice(true);
      setErrorMsg("");
      api.post("/bookings/price-preview/", {
        turf_id: selectedTurfId,
        date: date,
        slot_ids: selectedSlotIds,
      })
        .then((res) => setPriceData(res.data))
        .catch((err) => {
          console.error(err);
          setErrorMsg("Could not calculate price preview.");
        })
        .finally(() => setLoadingPrice(false));
    } else {
      setPriceData(null);
    }
  }, [selectedTurfId, date, selectedSlotIds]);

  const toggleSlot = (id: number) => {
    setSelectedSlotIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurfId || selectedSlotIds.length === 0) {
      setErrorMsg("Please select at least one match slot.");
      return;
    }
    if (!customerName || !customerPhone) {
      setErrorMsg("Customer name and contact phone number are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      let res;
      if (bookingType === "WALK_IN") {
        res = await api.post("/bookings/walk-in/", {
          turf_id: selectedTurfId,
          date: date,
          slot_ids: selectedSlotIds,
          customer_name: customerName,
          customer_phone: customerPhone,
          payment_type: paymentType,
          payment_method: paymentMethod,
          notes: notes,
        });
      } else {
        res = await api.post("/bookings/", {
          turf_id: selectedTurfId,
          date: date,
          slot_ids: selectedSlotIds,
          booking_type: "REGULAR",
          payment_type: paymentType,
          payment_method: paymentMethod,
          notes: notes,
        });
      }

      setSuccessMsg(`Booking ${res.data.booking_id} created successfully!`);
      if (onBookingCreated) {
        onBookingCreated(res.data);
      }
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Match Reservation & Walk-In Desk"
      description="Create rapid counter bookings, walk-in reservations, and collect immediate on-spot payments"
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-xs">
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#059669] rounded-xl flex items-center space-x-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Booking Type Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setBookingType("WALK_IN")}
            className={`flex-1 py-2 rounded-xl font-bold transition cursor-pointer ${
              bookingType === "WALK_IN"
                ? "bg-[#059669] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Walk-in (Counter Cash / Spot UPI)
          </button>
          <button
            type="button"
            onClick={() => setBookingType("REGULAR")}
            className={`flex-1 py-2 rounded-xl font-bold transition cursor-pointer ${
              bookingType === "REGULAR"
                ? "bg-[#059669] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Admin Reservation (Phone / Online)
          </button>
        </div>

        {/* Facility & Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Arena Pitch
            </label>
            <select
              value={selectedTurfId}
              onChange={(e) => setSelectedTurfId(Number(e.target.value))}
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-[#059669]"
            >
              {turfs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.sport_type} — ₹{t.base_price}/hr)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Match Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-[#059669]"
            />
          </div>
        </div>

        {/* Slot Selector */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5">
            Available Time Slots ({availableSlots.filter((s) => s.is_available).length} free)
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlotIds.includes(slot.id);
              const isAvailable = slot.is_available;
              const isOngoing = slot.is_ongoing || slot.slot_state === "ONGOING";
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => toggleSlot(slot.id)}
                  title={isOngoing ? "In Session" : isAvailable ? "Available" : "Unavailable / Past"}
                  className={`p-2 rounded-xl text-center font-bold text-[11px] transition ${
                    isSelected
                      ? "bg-[#059669] text-white shadow-sm cursor-pointer"
                      : isAvailable
                      ? "bg-[#F8FAFC] hover:bg-slate-100 text-slate-800 border border-slate-200 cursor-pointer"
                      : isOngoing
                      ? "bg-amber-50 text-amber-800 border border-amber-200 cursor-not-allowed"
                      : "bg-slate-100 text-slate-400 border border-slate-100 cursor-not-allowed line-through"
                  }`}
                >
                  {slot.start_time.slice(0, 5)}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Information */}
        <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
          <span className="font-extrabold text-[10px] uppercase text-slate-400 block tracking-wider">
            Player / Captain Information
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Player / Team Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Rahul Sharma / Red Dragons FC"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-[#059669]"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-[#059669]"
              />
            </div>
          </div>
        </div>

        {/* Payment & Price Row */}
        {priceData && (
          <div className="p-4 rounded-2xl bg-[#ECFDF5] border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                Calculated Total ({selectedSlotIds.length} Slots)
              </span>
              <p className="text-2xl font-black text-[#059669]">
                ₹{priceData.final_amount}
              </p>
              <span className="text-[10px] text-emerald-700 font-semibold">
                Base: ₹{priceData.subtotal} | Tax: ₹{priceData.tax_amount}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="px-3 py-2 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
              >
                <option value="CASH">Cash on Counter</option>
                <option value="UPI">Spot UPI / QR</option>
                <option value="CARD">Debit / Credit Card</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label className="block font-bold text-slate-700 mb-1">
            Internal Operations Note
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Needs referee / tournament warmup / corporate booking..."
            className="w-full p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={submitting}
            disabled={selectedSlotIds.length === 0}
          >
            Confirm & Issue Pass
          </Button>
        </div>
      </form>
    </Modal>
  );
};
