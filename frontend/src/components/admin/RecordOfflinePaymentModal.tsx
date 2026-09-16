import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  CheckCircle,
  AlertCircle,
  DollarSign,
  User,
  Calendar,
  Clock,
  ArrowRight,
  ShieldCheck,
  Receipt,
  FileText,
} from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import api from "../../services/api";

interface RecordOfflinePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedBookingId?: string | number;
  onPaymentSuccess?: (res: any) => void;
}

export const RecordOfflinePaymentModal: React.FC<RecordOfflinePaymentModalProps> = ({
  isOpen,
  onClose,
  preselectedBookingId,
  onPaymentSuccess,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);

  // Form State
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "UPI" | "CARD" | "BANK_TRANSFER" | "OTHER"
  >("CASH");
  const [amount, setAmount] = useState<string>("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Load preselected booking if provided
  useEffect(() => {
    if (isOpen && preselectedBookingId) {
      api
        .get(`/bookings/${preselectedBookingId}/`)
        .then((res) => {
          setSelectedBooking(res.data);
          setAmount(String(res.data.balance_due || res.data.final_amount || "0"));
        })
        .catch(console.error);
    } else if (isOpen) {
      setSelectedBooking(null);
      setReceiptData(null);
      setErrorMsg("");
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [isOpen, preselectedBookingId]);

  // Live search for bookings
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/bookings/?search=${encodeURIComponent(searchQuery.trim())}`);
        const list = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
          ? res.data.results
          : [];
        setSearchResults(list.slice(0, 5));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectBooking = (booking: any) => {
    setSelectedBooking(booking);
    setAmount(String(booking.balance_due || booking.final_amount || "0"));
    setSearchResults([]);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBooking) {
      setErrorMsg("Please select a booking to record payment for.");
      return;
    }
    const payAmount = parseFloat(amount);
    if (!payAmount || payAmount <= 0) {
      setErrorMsg("Please enter a valid positive payment amount.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const res = await api.post("/payments/manual-collect/", {
        booking_id: selectedBooking.id,
        amount: payAmount,
        payment_method: paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      setReceiptData(res.data);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to record offline payment."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Offline Payment"
      description="Quickly record cash, UPI, or card collections received directly at the turf desk"
      maxWidth="md"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Success / Receipt Screen */}
        {receiptData ? (
          <div className="p-5 bg-[#F0FDF4] border border-emerald-200 rounded-2xl space-y-4 text-center">
            <div className="w-12 h-12 bg-emerald-100 text-[#059669] rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Payment Recorded Successfully!
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                Receipt #{receiptData.payment?.payment_id || "OFFLINE-REC"} •{" "}
                <span className="font-bold text-[#059669]">
                  ₹{Number(receiptData.payment?.amount || amount).toLocaleString("en-IN")} ({paymentMethod})
                </span>
              </p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-100 text-left space-y-1.5 font-medium text-slate-700">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Booking Reference:</span>
                <strong className="font-mono text-slate-900">
                  #{receiptData.booking?.booking_number || selectedBooking?.booking_id || selectedBooking?.id}
                </strong>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">New Booking Status:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-[#059669]">
                  {receiptData.booking?.status || "CONFIRMED"}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Remaining Balance:</span>
                <strong className="font-mono text-slate-900">
                  ₹{Number(receiptData.booking?.balance_due || 0).toLocaleString("en-IN")}
                </strong>
              </div>
            </div>

            <div className="pt-2 flex justify-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReceiptData(null);
                  setSelectedBooking(null);
                  setSearchQuery("");
                }}
              >
                Record Another Payment
              </Button>
              <Button variant="primary" size="sm" onClick={onClose}>
                Done & Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleRecordPayment} className="space-y-4">
            {/* Step 1: Select Booking */}
            {!selectedBooking ? (
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">
                  Step 1: Find Customer Booking
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search by Booking ID, Customer name, Phone, or Pitch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                    autoFocus
                  />
                  {isSearching && (
                    <span className="text-[10px] text-slate-400 absolute right-3 top-3 animate-pulse">
                      Searching...
                    </span>
                  )}
                </div>

                {/* Search Dropdown Results */}
                {searchResults.length > 0 && (
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto bg-white shadow-lg">
                    {searchResults.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelectBooking(b)}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            #{b.booking_id || b.id} • {b.customer_details?.full_name || "Guest"}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.turf_details?.name || "Pitch"} • {b.date} ({b.start_time?.slice(0, 5)})
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#059669]">
                            ₹{Number(b.final_amount).toLocaleString("en-IN")}
                          </span>
                          {Number(b.balance_due) > 0 && (
                            <div className="text-[10px] text-amber-600 font-bold">
                              Due: ₹{Number(b.balance_due).toLocaleString("en-IN")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Selected Booking Summary Card */
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-[#059669] tracking-wider">
                    Selected Match Booking
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(null)}
                    className="text-[11px] text-slate-500 hover:text-rose-600 font-bold transition"
                  >
                    Change Booking
                  </button>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">
                      #{selectedBooking.booking_id || selectedBooking.id} •{" "}
                      {selectedBooking.customer_details?.full_name || "Guest"}
                    </h4>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      {selectedBooking.turf_details?.name || "Pitch"} • {selectedBooking.date} at{" "}
                      {selectedBooking.start_time?.slice(0, 5)} - {selectedBooking.end_time?.slice(0, 5)}
                    </p>
                    {selectedBooking.customer_details?.phone && (
                      <p className="text-[11px] text-slate-500">
                        Phone: {selectedBooking.customer_details.phone}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">
                      Amount Due
                    </span>
                    <span className="text-base font-black text-amber-600 font-mono">
                      ₹{Number(selectedBooking.balance_due || selectedBooking.final_amount || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {selectedBooking && (
              <>
                <div className="space-y-1.5">
                  <label className="block font-bold text-slate-700">
                    How was the payment received?
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {[
                      { id: "CASH", label: "💵 Cash" },
                      { id: "UPI", label: "📱 UPI / QR" },
                      { id: "CARD", label: "💳 POS Card" },
                      { id: "BANK_TRANSFER", label: "🏦 Transfer" },
                      { id: "OTHER", label: "✨ Other" },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as any)}
                        className={`py-2 px-1.5 rounded-xl font-bold text-xs text-center border transition cursor-pointer ${
                          paymentMethod === m.id
                            ? "bg-emerald-50 text-[#059669] border-[#059669] ring-2 ring-emerald-500/20"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Step 3: Amount */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Input
                      label="Amount Received (₹)"
                      isRequired
                      type="number"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 1400"
                    />
                  </div>
                  <div>
                    <Input
                      label="Payment Reference / Transaction ID (Optional)"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="e.g. UPI Ref #402910394"
                    />
                  </div>
                </div>

                {/* Quick Quickfill Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-semibold">Quick Set:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(
                        String(
                          selectedBooking.balance_due || selectedBooking.final_amount || 0
                        )
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                  >
                    Full Balance (₹{selectedBooking.balance_due || selectedBooking.final_amount || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAmount(
                        String(
                          Math.round(
                            Number(
                              selectedBooking.balance_due || selectedBooking.final_amount || 0
                            ) / 2
                          )
                        )
                      )
                    }
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[11px] font-bold text-slate-700"
                  >
                    50% Advance
                  </button>
                </div>

                {/* Internal Notes */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Internal Front-Desk Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Collected cash at entrance desk from captain"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                  />
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                  <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={submitting}
                    leftIcon={<DollarSign className="w-4 h-4" />}
                  >
                    Record Payment
                  </Button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </Modal>
  );
};
