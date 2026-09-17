import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Printer,
  ArrowLeft,
  Receipt,
  Building2,
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
} from "lucide-react";
import api from "../../services/api";

export const PrintReceiptPage: React.FC = () => {
  const { identifier } = useParams<{ identifier: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const autoPrint = searchParams.get("autoprint") === "true";

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);
    api
      .get(`/payments/${identifier}/receipt/`)
      .then((res) => {
        setReceipt(res.data);
        if (autoPrint) {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      })
      .catch((err) => {
        console.error("Failed to load invoice receipt:", err);
        setError("Could not load official tax invoice data.");
      })
      .finally(() => setLoading(false));
  }, [identifier, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3 text-white">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold">Generating Official GST Tax Invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Invoice Not Found</h2>
          <p className="text-xs text-slate-500">{error || "No tax invoice record matches this reference."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const taxAmount = Number(receipt.pricing?.tax_amount || receipt.financial_summary?.gst_amount || 0);
  const cgst = taxAmount / 2;
  const sgst = taxAmount / 2;

  const totalAmount = Number(
    receipt.pricing?.total_amount || receipt.financial_summary?.final_amount || 0
  );
  const baseAmount = Number(
    receipt.pricing?.base_amount || receipt.financial_summary?.base_subtotal || 0
  );
  const discountAmount = Number(
    receipt.pricing?.discount_amount || receipt.financial_summary?.total_discount || 0
  );
  const taxableAmount = baseAmount - discountAmount;

  const customerName =
    receipt.customer?.name ||
    receipt.customer?.full_name ||
    receipt.customer?.username ||
    "Valued Sports Player";

  return (
    <div className="min-h-screen bg-slate-900 print:bg-white text-slate-900 font-sans antialiased py-6 px-4 sm:px-6 print:p-0 flex flex-col items-center justify-center">
      {/* ── Top Bar Controls (Hidden in PDF/Print) ── */}
      <div className="w-full max-w-3xl mb-4 flex flex-wrap items-center justify-between gap-3 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-2xl p-3.5 shadow-xl print:hidden text-white">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-700/60 transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to App</span>
        </button>

        <div className="flex items-center space-x-3">
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            GST Tax Invoice (1 Page Strict Fit)
          </span>
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-black shadow-emerald-glow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Invoice / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* ── Printable Official Tax Invoice Document Template (Strict 1-Page A4) ── */}
      <div className="w-full max-w-3xl bg-white border border-slate-300 print:border-0 rounded-3xl print:rounded-none shadow-2xl print:shadow-none p-6 sm:p-8 space-y-5 print:w-full print:max-w-none printable-card">
        
        {/* Header Section with Brand Logo & GST details */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="Friends Turf"
                className="w-14 h-14 object-contain rounded-xl bg-slate-50 p-1 border border-slate-200 shrink-0"
              />
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
                  FRIENDS TURF
                </h1>
                <span className="text-[10px] font-bold text-[#059669] uppercase tracking-widest block mt-0.5">
                  Sports Complex Arena LLP
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 max-w-sm leading-relaxed mt-1">
              Near Sirupooluvapatti, Kamatchepuram, Tiruppur, TN 641603
              <br />
              <strong>GSTIN:</strong> 33ABCDE1234F1Z5 | <strong>SAC Code:</strong> 999651
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <span className="inline-block px-3 py-0.5 bg-[#ECFDF5] border border-emerald-200 text-[#059669] font-black text-[10px] rounded-full uppercase tracking-wider">
              TAX INVOICE & RECEIPT
            </span>
            <p className="text-xs font-bold text-slate-900 mt-1">
              Invoice: <span className="font-mono">{receipt.receipt_number}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Date: {new Date(receipt.created_at || receipt.issued_at || Date.now()).toLocaleDateString("en-IN", { dateStyle: "long" })}
            </p>
            <p className="text-[11px] text-slate-500">
              Booking Ref: <span className="font-mono font-bold text-slate-800">{receipt.booking_id || receipt.booking?.booking_id}</span>
            </p>
          </div>
        </div>

        {/* Bill To & Match Context Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F8FAFC] border border-slate-200 rounded-xl p-4 text-xs">
          <div>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
              Billed To Customer
            </span>
            <p className="text-sm font-bold text-slate-900">{customerName}</p>
            <p className="text-slate-600">{receipt.customer?.email}</p>
            <p className="text-slate-600">{receipt.customer?.phone}</p>
          </div>

          <div className="sm:text-right">
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 block mb-0.5">
              Venue & Slot Details
            </span>
            <p className="text-sm font-bold text-slate-900">{receipt.turf?.name || receipt.booking?.turf_name}</p>
            <p className="text-slate-600">{receipt.turf?.location || receipt.booking?.location}</p>
            <p className="text-xs font-bold text-[#059669] mt-0.5">
              {receipt.booking?.date || receipt.booking?.match_date} ({receipt.booking?.start_time || receipt.booking?.slot_timings})
            </p>
          </div>
        </div>

        {/* Itemized Pricing Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider text-[9px]">
              <tr>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-2 text-center">SAC Code</th>
                <th className="py-2.5 px-2 text-right">Base Fee</th>
                <th className="py-2.5 px-2 text-right">Discount</th>
                <th className="py-2.5 px-2 text-right">Taxable Amt</th>
                <th className="py-2.5 px-2 text-right">GST (18%)</th>
                <th className="py-2.5 px-3 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              <tr>
                <td className="py-3 px-3 font-bold text-slate-900">
                  {receipt.turf?.name || receipt.booking?.turf_name || "Turf Arena"} — Match Reservation
                  <div className="text-[10px] font-normal text-slate-500">
                    Surface: FIFA Quality Pro 50mm | 500 Lux Arena Floodlights
                  </div>
                </td>
                <td className="py-3 px-2 text-center font-mono text-slate-500">999651</td>
                <td className="py-3 px-2 text-right font-medium">₹{baseAmount.toFixed(2)}</td>
                <td className="py-3 px-2 text-right font-medium text-emerald-600">
                  {discountAmount > 0 ? `-₹${discountAmount.toFixed(2)}` : "₹0.00"}
                </td>
                <td className="py-3 px-2 text-right font-medium">₹{taxableAmount.toFixed(2)}</td>
                <td className="py-3 px-2 text-right font-medium">₹{taxAmount.toFixed(2)}</td>
                <td className="py-3 px-3 text-right font-black text-slate-900">
                  ₹{totalAmount.toFixed(2)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Calculation & Taxes Breakdown */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-3 border-t border-slate-200">
          <div className="space-y-1.5 text-xs text-slate-500 max-w-sm">
            <span className="text-[9px] font-bold uppercase text-slate-400 block">
              Payment Summary & Terms
            </span>
            <p>
              <strong>Payment Method:</strong> {receipt.payment?.payment_origin || receipt.payment?.method || "Online Payment"}
            </p>
            <p className="font-mono text-[11px]">
              <strong>Transaction Ref:</strong> {receipt.payment?.transaction_reference || receipt.payment?.gateway_payment_id || receipt.payment?.payment_id || "N/A"}
            </p>
            <p className="text-[10px] text-slate-400 italic">
              This is a computer-generated tax invoice. No physical signature is required under IT Act.
            </p>
          </div>

          <div className="w-full sm:w-64 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Taxable Value</span>
              <span className="font-bold">₹{taxableAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>CGST (9.0%)</span>
              <span className="font-bold">₹{cgst.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>SGST (9.0%)</span>
              <span className="font-bold">₹{sgst.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t-2 border-slate-900 flex justify-between text-sm font-black text-slate-900">
              <span>Total Match Fee</span>
              <span className="text-[#059669]">₹{totalAmount.toFixed(2)}</span>
            </div>

            <div className="pt-1 flex justify-between text-xs font-bold text-slate-800">
              <span>Amount Settled</span>
              <span className="text-emerald-700">
                ₹{Number(receipt.payment?.amount || receipt.payment?.amount_paid_in_this_transaction || totalAmount).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Seal & Verification */}
        <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-[#059669]" />
            <span className="text-[11px]">Official Digitally Signed Electronic Invoice</span>
          </div>

          <div className="text-right">
            <p className="font-bold text-slate-700 text-[11px]">For FRIENDS TURF SPORTS ARENA</p>
            <p className="text-[9px] text-slate-400">Authorized Billing & Finance Department</p>
          </div>
        </div>
      </div>
    </div>
  );
};
