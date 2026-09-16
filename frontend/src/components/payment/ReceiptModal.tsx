import React, { useState, useEffect } from "react";
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  Receipt,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CreditCard,
  Wallet,
} from "lucide-react";
import api from "../../services/api";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  identifier?: string; // payment_id or booking_id
  initialData?: any;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  identifier,
  initialData,
}) => {
  const [receipt, setReceipt] = useState<any | null>(initialData || null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setReceipt(initialData);
        setError("");
      } else if (identifier) {
        setLoading(true);
        setError("");
        api
          .get(`/payments/${identifier}/receipt/`)
          .then((res) => {
            setReceipt(res.data);
          })
          .catch((err) => {
            console.error("Failed to load receipt:", err);
            setError("Could not load receipt details. Please try again.");
          })
          .finally(() => setLoading(false));
      }
    } else {
      setReceipt(null);
      setError("");
    }
  }, [isOpen, identifier, initialData]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        {/* Top Modal Controls (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#F8FAFC] print:hidden">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <Receipt className="w-4 h-4 text-[#059669]" />
            <span>Official Booking Tax Invoice & Receipt</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1.5 shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5 text-[#059669]" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Body */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-6 print:p-0 print:overflow-visible text-slate-800">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-[#059669] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-500">Generating official receipt...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-xs font-semibold text-rose-600 space-y-2">
              <p>{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          ) : receipt ? (
            <div id="printable-receipt" className="space-y-6">
              {/* Receipt Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-200">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-lg bg-[#059669] text-white flex items-center justify-center font-black text-sm shadow-sm">
                      FT
                    </span>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      FRIENDS TURF
                    </h2>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-500 mt-1">
                    {receipt.business?.company_name || "Friends Turf Sports Arena"}
                  </p>
                  <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mt-0.5">
                    {receipt.business?.address || "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)"}
                  </p>
                  <p className="text-[11px] font-bold text-slate-600 mt-1">
                    GSTIN: <span className="font-mono text-slate-900">{receipt.business?.gstin || "29ABCDE1234F1Z5"}</span>
                  </p>
                </div>

                <div className="sm:text-right space-y-1">
                  <div className="inline-block px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200">
                    TAX INVOICE
                  </div>
                  <p className="text-xs font-bold text-slate-900 font-mono">
                    {receipt.receipt_number}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Issued: {new Date(receipt.issued_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="text-[11px] font-bold text-slate-600">
                    Booking: <span className="font-mono text-[#059669]">{receipt.booking?.booking_id}</span>
                  </p>
                </div>
              </div>

              {/* Bill To & Match Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Customer Details
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{receipt.customer?.name || "Player"}</p>
                  <p className="text-slate-600">{receipt.customer?.email}</p>
                  {receipt.customer?.phone && (
                    <p className="text-slate-600">Phone: {receipt.customer?.phone}</p>
                  )}
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    Pitch & Schedule
                  </span>
                  <p className="font-bold text-slate-900 text-sm">{receipt.booking?.turf_name}</p>
                  <p className="text-slate-600">
                    {receipt.booking?.match_date} ({receipt.booking?.slot_timings})
                  </p>
                  <p className="text-[11px] text-slate-500">{receipt.booking?.location}</p>
                </div>
              </div>

              {/* Line Items & Calculation Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold border-b border-slate-200">
                      <th className="p-3 pl-4">Item & Description</th>
                      <th className="p-3 text-right">Base</th>
                      <th className="p-3 text-right">Discounts</th>
                      <th className="p-3 text-right pr-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="p-3.5 pl-4">
                        <p className="font-bold text-slate-900">
                          {receipt.booking?.turf_name} — {receipt.booking?.sport_type}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Slot Session: {receipt.booking?.slot_timings} on {receipt.booking?.match_date}
                        </p>
                      </td>
                      <td className="p-3.5 text-right font-semibold text-slate-700">
                        ₹{Number(receipt.financial_summary?.base_subtotal || 0).toFixed(2)}
                      </td>
                      <td className="p-3.5 text-right font-semibold text-emerald-600">
                        {Number(receipt.financial_summary?.total_discount || 0) > 0
                          ? `-₹${Number(receipt.financial_summary?.total_discount).toFixed(2)}`
                          : "₹0.00"}
                      </td>
                      <td className="p-3.5 text-right pr-4 font-bold text-slate-900">
                        ₹{Number(receipt.financial_summary?.taxable_amount || 0).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Subtotals & Taxes */}
                <div className="bg-slate-50/70 p-4 border-t border-slate-200 space-y-1.5 font-medium text-slate-600">
                  <div className="flex justify-between">
                    <span>Taxable Value</span>
                    <span>₹{Number(receipt.financial_summary?.taxable_amount || 0).toFixed(2)}</span>
                  </div>

                  {Number(receipt.financial_summary?.gst_amount || 0) > 0 && (
                    <>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>Central GST (CGST @ 9%)</span>
                        <span>₹{Number(receipt.financial_summary?.cgst_amount || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-[11px]">
                        <span>State GST (SGST @ 9%)</span>
                        <span>₹{Number(receipt.financial_summary?.sgst_amount || 0).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                  <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                    <span>Total Amount (INR)</span>
                    <span className="text-[#059669]">
                      ₹{Number(receipt.financial_summary?.final_amount || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs font-bold text-slate-700 pt-1">
                    <span>Amount Paid in this Transaction</span>
                    <span>₹{Number(receipt.payment?.amount_paid_in_this_transaction || 0).toFixed(2)}</span>
                  </div>

                  {Number(receipt.financial_summary?.balance_due || 0) > 0 && (
                    <div className="flex justify-between text-xs font-black text-amber-600">
                      <span>Remaining Balance Due</span>
                      <span>₹{Number(receipt.financial_summary?.balance_due).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Mode & Settlement Stamp */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-[#ECFDF5] text-[#059669] flex items-center justify-center border border-emerald-300">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      Payment Mode: {receipt.payment?.payment_origin || "Paid"}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Ref: <span className="font-mono">{receipt.payment?.transaction_reference || "VERIFIED"}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#059669] text-white tracking-wider">
                    {receipt.payment?.status === "PAID" ? "VERIFIED & SETTLED" : receipt.payment?.status}
                  </span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-2 text-[10px] text-slate-400 leading-relaxed border-t border-slate-100">
                <p>
                  Thank you for playing at Friends Turf. This is a computer-generated tax invoice.
                </p>
                <p>
                  Support: {receipt.business?.email} | Hotline: {receipt.business?.phone}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
