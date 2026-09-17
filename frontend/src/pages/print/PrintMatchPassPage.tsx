import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  Printer,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Trophy,
  AlertCircle,
  Phone,
  User,
  Zap,
  Download,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";

export const PrintMatchPassPage: React.FC = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [passData, setPassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const autoPrint = searchParams.get("autoprint") === "true";

  useEffect(() => {
    if (!bookingId) return;
    setLoading(true);
    api
      .get(`/qr/pass/${bookingId}/`)
      .then((res) => {
        setPassData(res.data);
        if (autoPrint) {
          setTimeout(() => {
            window.print();
          }, 500);
        }
      })
      .catch((err) => {
        console.error("Failed to load pass for printing:", err);
        setError("Could not load official match pass details.");
      })
      .finally(() => setLoading(false));
  }, [bookingId, autoPrint]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-3 text-white">
          <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold tracking-wide">Rendering Official Match Pass Ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !passData) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md space-y-4 shadow-xl">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-slate-900">Pass Not Available</h2>
          <p className="text-xs text-slate-500">{error || "Match pass record not found."}</p>
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

  const isCheckedIn = passData.is_used || passData.booking_status === "CHECKED_IN";
  const balanceDue = Number(passData.balance_due || 0);

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

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-black shadow-emerald-glow transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF (1 Page)</span>
          </button>
        </div>
      </div>

      {/* ── Breathtaking Stadium Ticket Document (1-Page Strict A4 Fit) ── */}
      <div className="w-full max-w-3xl bg-white border-2 border-slate-300 print:border-2 print:border-slate-900 rounded-3xl print:rounded-2xl shadow-2xl print:shadow-none overflow-hidden print:w-full print:max-w-none printable-match-pass">
        
        {/* 1. Header Hero Banner with Official Logo */}
        <div className="bg-gradient-to-r from-[#047857] via-[#059669] to-[#10B981] text-white p-5 sm:p-6 relative overflow-hidden print:bg-[#059669]">
          {/* Subtle diagonal background mesh pattern */}
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3.5">
              <img
                src="/logo.png"
                alt="Friends Turf Logo"
                className="w-14 h-14 object-contain rounded-2xl bg-white p-1 shadow-md shrink-0"
              />
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-white">
                    FRIENDS TURF
                  </h1>
                  <span className="bg-amber-400 text-slate-950 font-black text-[9px] uppercase px-2 py-0.5 rounded-md shadow-xs">
                    FIFA PRO
                  </span>
                </div>
                <span className="text-[11px] font-bold text-emerald-100 uppercase tracking-widest block mt-1">
                  Official Match Pass • Arena Admission
                </span>
              </div>
            </div>

            <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-1">
              <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full text-white backdrop-blur-xs">
                {isCheckedIn ? "Admitted & Active" : "Valid For Gate Admission"}
              </span>
              <p className="text-xs font-mono font-bold text-emerald-100">
                #{passData.booking_id}
              </p>
            </div>
          </div>
        </div>

        {/* 2. Main Ticket Body */}
        <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          
          {/* Left Column: Match Details & Pitch Specs */}
          <div className="md:col-span-7 space-y-3.5">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-[#059669] block">
                Arena & Pitch
              </span>
              <h2 className="text-xl font-black text-slate-900 leading-snug">
                {passData.turf_name}
              </h2>
              <p className="text-xs text-slate-600 flex items-center space-x-1 mt-0.5 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                <span>{passData.turf_location || "Tiruppur Sports Corridor, Tamil Nadu"}</span>
              </p>
            </div>

            {/* Date & Time Blocks */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center space-x-1">
                  <Calendar className="w-3 h-3 text-[#059669]" />
                  <span>Match Date</span>
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">
                  {new Date(passData.date).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-[#059669]" />
                  <span>Kickoff Timing</span>
                </span>
                <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 font-mono">
                  {passData.start_time} - {passData.end_time}
                </p>
              </div>
            </div>

            {/* Technical Venue Specs */}
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 bg-[#ECFDF5] border border-emerald-200 text-[#059669] text-[10px] font-extrabold rounded-lg flex items-center space-x-1">
                <Zap className="w-3 h-3 text-[#059669]" />
                <span>500 Lux Anti-Glare Lighting</span>
              </span>
              <span className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-extrabold rounded-lg flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-[#059669]" />
                <span>50mm Mono-Filament Grass</span>
              </span>
            </div>

            {/* Captain / Settlement Row */}
            <div className="border-t border-slate-200 pt-2.5 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Captain / Lead</span>
                <p className="font-black text-slate-900 flex items-center space-x-1 mt-0.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{passData.customer_name || "Squad Lead"}</span>
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Payment Status</span>
                <p className={`font-black mt-0.5 ${balanceDue > 0 ? "text-amber-600" : "text-[#059669]"}`}>
                  {balanceDue > 0 ? `Advance Paid (₹${balanceDue} Due)` : "✓ 100% Fully Settled"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Turnstile High-Density QR Code Card */}
          <div className="md:col-span-5 flex flex-col items-center justify-center p-4 bg-[#F8FAFC] border-2 border-dashed border-emerald-300 rounded-2xl text-center space-y-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#059669] bg-[#ECFDF5] px-3 py-0.5 rounded-full border border-emerald-200">
              {isCheckedIn ? "Turnstile Admitted" : "Turnstile Optical QR Pass"}
            </span>

            {passData.qr_base64 ? (
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-200">
                <img
                  src={passData.qr_base64}
                  alt={`Pass QR ${passData.booking_id}`}
                  className="w-40 h-40 object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="w-40 h-40 bg-slate-200 rounded-xl flex items-center justify-center text-xs font-bold text-slate-500">
                QR Ready Upon Full Payment
              </div>
            )}

            <div className="space-y-0.5">
              <span className="font-mono text-xs font-black text-slate-900 tracking-wider">
                {passData.booking_id}
              </span>
              <p className="text-[10px] text-slate-400">Hold 4-6 inches from optical reader</p>
            </div>
          </div>
        </div>

        {/* 3. Ticket Perforated Divider */}
        <div className="relative flex items-center justify-between px-2">
          <div className="w-5 h-5 rounded-full bg-slate-900 print:bg-white -ml-2.5 border border-slate-300 print:border-slate-800" />
          <div className="flex-1 border-t-2 border-dashed border-slate-300 mx-2" />
          <div className="w-5 h-5 rounded-full bg-slate-900 print:bg-white -mr-2.5 border border-slate-300 print:border-slate-800" />
        </div>

        {/* 4. Ticket Security Stub & Arena Entry Rules */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 sm:p-5 text-xs text-slate-600 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
            <span className="font-black text-slate-900 flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
              <span>Arena Entry Code of Conduct:</span>
            </span>
            <span className="text-[10px] text-slate-500">
              Rubber stud turf shoes mandatory • Zero metal spikes • Check-in 10 mins early
            </span>
          </div>

          <div className="flex items-center justify-between pt-0.5 text-[10px]">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-800">
                Friends Turf Sports Complex Arena LLP
              </p>
              <p className="text-slate-400">
                Emergency Hotline: +91 93619 89494 | support@friendsturf.com | www.friendsturf.com
              </p>
            </div>

            <div className="text-right font-mono tracking-widest text-slate-400 uppercase text-[9px]">
              *FT-PASS-{passData.booking_id}*
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
