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
  UserPlus,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import api from "../../services/api";

interface NewBookingWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookingCreated?: (booking: any) => void;
  defaultDate?: string;
  defaultTurfId?: number;
  preselectedCustomerId?: string | number;
}

export const NewBookingWizardModal: React.FC<NewBookingWizardModalProps> = ({
  isOpen,
  onClose,
  onBookingCreated,
  defaultDate,
  defaultTurfId,
  preselectedCustomerId,
}) => {
  // Wizard Steps: 1: Customer -> 2: Turf -> 3: Time -> 4: Payment
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Turfs & Slots
  const [turfs, setTurfs] = useState<any[]>([]);
  const [selectedTurf, setSelectedTurf] = useState<any | null>(null);
  const [date, setDate] = useState<string>(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<number[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Customer selection / creation
  const [customerMode, setCustomerMode] = useState<"SEARCH" | "NEW">("SEARCH");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");

  // Payment Selection
  const [paymentOption, setPaymentOption] = useState<
    "PAID_CASH" | "PAID_UPI" | "PAY_ON_ARRIVAL" | "PARTIAL"
  >("PAID_CASH");
  const [notes, setNotes] = useState("");

  // Price Calculation
  const [priceData, setPriceData] = useState<any | null>(null);
  const [calculatingPrice, setCalculatingPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successBooking, setSuccessBooking] = useState<any | null>(null);

  // Load Turfs
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg("");
      setSuccessBooking(null);
      api
        .get("/turfs/")
        .then((res) => {
          const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
          setTurfs(list);
          if (defaultTurfId) {
            const match = list.find((t: any) => t.id === defaultTurfId);
            if (match) setSelectedTurf(match);
          } else if (list.length > 0 && !selectedTurf) {
            setSelectedTurf(list[0]);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, defaultTurfId]);

  // Customer search debounce
  useEffect(() => {
    if (!customerSearch || customerSearch.trim().length < 2) {
      setCustomerSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get(`/auth/admin/customers/?search=${encodeURIComponent(customerSearch.trim())}`);
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setCustomerSearchResults(list.slice(0, 5));
      } catch (err) {
        console.error(err);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Fetch slots whenever turf or date changes
  useEffect(() => {
    if (selectedTurf && date) {
      setSlotsLoading(true);
      api
        .get(`/turfs/${selectedTurf.id}/availability/?date=${date}`)
        .then((res) => {
          const slotList = Array.isArray(res.data)
            ? res.data
            : Array.isArray(res.data?.slots)
            ? res.data.slots
            : [];
          setAvailableSlots(slotList);
          setSelectedSlotIds([]);
          setPriceData(null);
        })
        .catch(console.error)
        .finally(() => setSlotsLoading(false));
    }
  }, [selectedTurf, date]);

  // Price Calculation
  useEffect(() => {
    if (selectedTurf && date && selectedSlotIds.length > 0) {
      setCalculatingPrice(true);
      api
        .post("/bookings/price-preview/", {
          turf_id: selectedTurf.id,
          date: date,
          slot_ids: selectedSlotIds,
        })
        .then((res) => setPriceData(res.data))
        .catch(console.error)
        .finally(() => setCalculatingPrice(false));
    } else {
      setPriceData(null);
    }
  }, [selectedTurf, date, selectedSlotIds]);

  const toggleSlot = (id: number) => {
    setSelectedSlotIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleCreateBooking = async () => {
    setErrorMsg("");
    setSubmitting(true);

    try {
      const custName = selectedCustomer
        ? selectedCustomer.full_name || selectedCustomer.email
        : newCustomerName;
      const custPhone = selectedCustomer
        ? selectedCustomer.phone
        : newCustomerPhone;
      const custEmail = selectedCustomer
        ? selectedCustomer.email
        : newCustomerEmail;

      const isWalkIn =
        paymentOption === "PAID_CASH" ||
        paymentOption === "PAID_UPI" ||
        paymentOption === "PAY_ON_ARRIVAL";

      let res;
      if (isWalkIn) {
        res = await api.post("/bookings/walk-in/", {
          turf_id: selectedTurf.id,
          slot_ids: selectedSlotIds,
          customer_name: custName,
          customer_phone: custPhone,
          notes: notes,
        });

        // If paid cash/upi immediately, record payment
        if (
          (paymentOption === "PAID_CASH" || paymentOption === "PAID_UPI") &&
          res.data.id
        ) {
          await api.post("/payments/manual-collect/", {
            booking_id: res.data.id,
            amount: parseFloat(res.data.final_amount || res.data.total_amount || 0),
            payment_method: paymentOption === "PAID_CASH" ? "CASH" : "UPI",
            reference: "Instant Walk-in Desk Collection",
          });
        }
      } else {
        res = await api.post("/bookings/", {
          turf_id: selectedTurf.id,
          date: date,
          slot_ids: selectedSlotIds,
          booking_type: "REGULAR",
          payment_type: paymentOption === "PARTIAL" ? "PARTIAL" : "FULL",
          payment_method: "CASH",
          notes: notes,
        });
      }

      setSuccessBooking(res.data);
      if (onBookingCreated) {
        onBookingCreated(res.data);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to create booking."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Match Booking"
      description="Fast 4-step wizard for front-desk reservations and walk-in counter bookings"
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success Screen */}
        {successBooking ? (
          <div className="p-6 bg-[#F0FDF4] border border-emerald-200 rounded-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-[#059669] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Match Booking Confirmed!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Ref <strong className="font-mono text-slate-900">#{successBooking.booking_id || successBooking.id}</strong> •{" "}
                {selectedTurf?.name} • {date}
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 text-left space-y-2 text-slate-700">
              <div className="flex justify-between">
                <span className="text-slate-500">Player Name:</span>
                <strong className="text-slate-900">
                  {selectedCustomer?.full_name || newCustomerName || "Walk-In Guest"}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Venue Pitch:</span>
                <strong className="text-slate-900">{selectedTurf?.name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Booking Amount:</span>
                <strong className="text-[#059669] font-mono text-sm">
                  ₹{Number(priceData?.final_amount || selectedTurf?.base_price || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex justify-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSuccessBooking(null);
                  setSelectedSlotIds([]);
                  setStep(1);
                }}
              >
                + Create Another Booking
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Done & Close
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {/* Step Progress Pills */}
            <div className="flex items-center justify-between gap-1 p-1.5 bg-slate-100 rounded-2xl mb-4 text-[11px] font-bold">
              {[
                { s: 1, label: "1. Player" },
                { s: 2, label: "2. Pitch" },
                { s: 3, label: "3. Time Slot" },
                { s: 4, label: "4. Payment" },
              ].map((item) => (
                <button
                  key={item.s}
                  type="button"
                  onClick={() => setStep(item.s as any)}
                  className={`flex-1 py-1.5 rounded-xl transition cursor-pointer ${
                    step === item.s
                      ? "bg-[#059669] text-white shadow-sm"
                      : step > item.s
                      ? "bg-emerald-100 text-[#059669]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Step 1: Customer */}
            {step === 1 && (
              <div className="space-y-4">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setCustomerMode("SEARCH")}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                      customerMode === "SEARCH" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500"
                    }`}
                  >
                    Search Existing Player
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomerMode("NEW")}
                    className={`flex-1 py-1.5 rounded-lg font-bold transition ${
                      customerMode === "NEW" ? "bg-white text-[#059669] shadow-xs" : "text-slate-500"
                    }`}
                  >
                    + New Player / Walk-In
                  </button>
                </div>

                {customerMode === "SEARCH" ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Search player name, phone, or email..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />

                    {selectedCustomer && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                        <div>
                          <strong className="text-slate-900">{selectedCustomer.full_name || selectedCustomer.email}</strong>
                          <div className="text-[11px] text-slate-600">
                            {selectedCustomer.phone} • {selectedCustomer.email}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCustomer(null)}
                          className="text-xs text-slate-500 hover:text-rose-600 font-bold"
                        >
                          Change
                        </button>
                      </div>
                    )}

                    {customerSearchResults.length > 0 && !selectedCustomer && (
                      <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-36 overflow-y-auto">
                        {customerSearchResults.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCustomer(c)}
                            className="p-2.5 hover:bg-slate-50 cursor-pointer flex justify-between items-center"
                          >
                            <div>
                              <div className="font-bold text-slate-900">{c.full_name || c.email}</div>
                              <div className="text-[11px] text-slate-500">{c.phone || "No phone"}</div>
                            </div>
                            <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full">
                              Select
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Player Full Name"
                      isRequired
                      placeholder="e.g. Rahul Sharma"
                      value={newCustomerName}
                      onChange={(e) => setNewCustomerName(e.target.value)}
                    />
                    <Input
                      label="Phone Number"
                      isRequired
                      placeholder="e.g. 9876543210"
                      value={newCustomerPhone}
                      onChange={(e) => setNewCustomerPhone(e.target.value)}
                    />
                    <div className="sm:col-span-2">
                      <Input
                        label="Email Address (Optional)"
                        placeholder="e.g. rahul@example.com"
                        value={newCustomerEmail}
                        onChange={(e) => setNewCustomerEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStep(2)}
                    disabled={!selectedCustomer && (!newCustomerName || !newCustomerPhone)}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Next: Choose Pitch
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Turf */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                  {turfs.map((t) => {
                    const isSelected = selectedTurf?.id === t.id;
                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTurf(t)}
                        className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50/80 border-[#059669] ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {t.sport_type}
                          </span>
                          <span className="font-mono font-black text-[#059669] text-xs">
                            ₹{t.base_price}/hr
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm mt-1.5">{t.name}</h4>
                        <p className="text-[11px] text-slate-500">{t.surface_spec || "FIFA Synthetic Turf"}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setStep(1)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStep(3)}
                    disabled={!selectedTurf}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Next: Pick Time Slot
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Time Slot */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="block font-bold text-slate-700 mb-1">Match Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    />
                  </div>
                  <div className="pt-5">
                    <span className="text-[11px] font-bold text-slate-500">
                      {selectedTurf?.name}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Available Time Slots ({availableSlots.filter((s) => s.is_available).length} Open)
                  </label>
                  {slotsLoading ? (
                    <div className="p-8 text-center text-slate-400 animate-pulse">Loading slots...</div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1">
                      {availableSlots.map((slot) => {
                        const isAvailable = slot.is_available;
                        const isOngoing = slot.is_ongoing || slot.slot_state === "ONGOING";
                        const isSelected = selectedSlotIds.includes(slot.id);
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => toggleSlot(slot.id)}
                            className={`p-2 rounded-xl text-center border font-bold transition ${
                              isSelected
                                ? "bg-[#059669] text-white border-[#059669] shadow-sm cursor-pointer"
                                : isAvailable
                                ? "bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100 cursor-pointer"
                                : isOngoing
                                ? "bg-amber-50 text-amber-900 border-amber-300 cursor-not-allowed"
                                : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60 line-through"
                            }`}
                          >
                            <div className="text-xs">{slot.start_time.slice(0, 5)}</div>
                            <div className="text-[10px] font-normal">
                              {isAvailable ? `₹${slot.price}` : isOngoing ? "in session" : "past"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {priceData && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#059669]">Calculated Amount</span>
                      <div className="text-base font-black text-slate-900 font-mono">
                        ₹{Number(priceData.final_amount).toLocaleString("en-IN")}
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {selectedSlotIds.length} Slot(s) Selected
                    </span>
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setStep(2)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setStep(4)}
                    disabled={selectedSlotIds.length === 0}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Next: Payment
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Payment & Review */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">Select Payment Terms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "PAID_CASH", label: "💵 Paid Cash (Desk)", desc: "Collect cash now" },
                      { id: "PAID_UPI", label: "📱 Paid UPI (Spot)", desc: "Direct QR scan paid" },
                      { id: "PAY_ON_ARRIVAL", label: "⏳ Pay on Arrival", desc: "Collect at check-in" },
                      { id: "PARTIAL", label: "💳 Partial / Advance", desc: "Deposit paid" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPaymentOption(p.id as any)}
                        className={`p-3 rounded-xl text-left border transition cursor-pointer ${
                          paymentOption === p.id
                            ? "bg-emerald-50 text-[#059669] border-[#059669] ring-2 ring-emerald-500/20"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        <div className="font-bold text-xs">{p.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{p.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 text-xs">Summary Review:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                    <div>Player: <strong>{selectedCustomer?.full_name || newCustomerName}</strong></div>
                    <div>Pitch: <strong>{selectedTurf?.name}</strong></div>
                    <div>Date: <strong>{date}</strong></div>
                    <div>Slots: <strong>{selectedSlotIds.length} hour(s)</strong></div>
                  </div>
                  <div className="pt-2 flex justify-between items-center border-t border-slate-200">
                    <span className="font-bold text-slate-700">Total Booking Price:</span>
                    <span className="text-base font-black text-[#059669] font-mono">
                      ₹{Number(priceData?.final_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between pt-3 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setStep(3)} leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}>
                    Back
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreateBooking}
                    isLoading={submitting}
                    leftIcon={<CheckCircle className="w-4 h-4" />}
                  >
                    Confirm & Create Booking
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
