import React, { useState, useEffect } from "react";
import { useLocation, useParams, useNavigate, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, ArrowLeft, Receipt, Ticket, Calendar } from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";
import { FriendsTurfMatchPass } from "../../components/booking/FriendsTurfMatchPass";
import { ReceiptModal } from "../../components/payment/ReceiptModal";
import { Button } from "../../components/ui";

export const BookingConfirmationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId } = useParams<{ bookingId: string }>();

  const state = location.state as { booking: Booking; payment?: any } | null;
  const [passData, setPassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  useEffect(() => {
    const targetId = bookingId || state?.booking?.booking_id;
    if (targetId) {
      api
        .get(`/qr/pass/${targetId}/`)
        .then((res) => {
          setPassData(res.data);
        })
        .catch((err) => {
          console.error("Failed to load pass:", err);
          if (state?.booking) {
            setPassData({
              booking_id: state.booking.booking_id,
              turf_name: state.booking.turf_details?.name || "Friends Turf Arena",
              turf_location: state.booking.turf_details?.location || "Tiruppur",
              surface_spec: state.booking.turf_details?.surface_spec || "50mm Pro Turf",
              lighting_spec: state.booking.turf_details?.lighting_spec || "500 Lux Anti-Glare LED",
              date: state.booking.date,
              start_time: state.booking.start_time,
              end_time: state.booking.end_time,
              customer_name: "Player",
              amount_paid: Number(state.booking.amount_paid || 0),
              balance_due: Number(state.booking.balance_due || 0),
              status: state.booking.status,
              booking_status: state.booking.status,
              qr_base64: state.booking.qr_ticket_data?.qr_base64 || "",
            });
          }
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [bookingId, state]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse shadow-sm" />
      </div>
    );
  }

  if (!passData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-slate-600 font-semibold">No active match pass session found.</p>
        <Link
          to="/turfs"
          className="px-5 py-2.5 rounded-xl bg-[#059669] text-white font-bold text-xs inline-flex items-center space-x-1.5 shadow-sm"
        >
          <span>Browse Turf Grounds</span>
        </Link>
      </div>
    );
  }

  const bookingRef = passData.booking_id || bookingId || state?.booking?.booking_id;
  const paidAmount = Number(passData.amount_paid || state?.booking?.amount_paid || state?.payment?.amount || 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-200">
      {/* Success Hero Header (Requirement #16) */}
      <div className="text-center space-y-3 print:hidden">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#ECFDF5] text-[#059669] border border-emerald-200 shadow-sm animate-bounce">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Payment Successful
          </h1>
          <p className="text-2xl font-black text-[#059669] mt-1 font-mono">
            ₹{paidAmount.toLocaleString("en-IN")}
          </p>
          <div className="inline-flex items-center space-x-2 mt-2 px-3 py-1 bg-slate-100 rounded-full text-xs font-mono font-bold text-slate-700">
            <span>Booking confirmed:</span>
            <span className="text-[#059669] font-black">{bookingRef}</span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
          Your pitch reservation is locked and cryptographically verified. Present this digital match pass at the gate optical scanner for admission.
        </p>

        {/* Action Buttons: [ Print Match Pass ] [ Print Receipt ] [ My Bookings ] */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/print/pass/${bookingRef}?autoprint=true`)}
            leftIcon={<Ticket className="w-4 h-4" />}
          >
            Print / Save Match Pass
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/print/receipt/${bookingRef}?autoprint=true`)}
            leftIcon={<Receipt className="w-4 h-4 text-[#059669]" />}
          >
            Official Tax Invoice
          </Button>

          <Link
            to="/my-bookings"
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 inline-flex items-center space-x-1.5 shadow-sm transition"
          >
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>My Bookings</span>
          </Link>
        </div>
      </div>

      {/* Render Official Match Pass Component */}
      <div id="match-pass-section">
        <FriendsTurfMatchPass passData={passData} showActions={true} />
      </div>

      {/* Post-Booking Navigation Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 max-w-2xl mx-auto print:hidden">
        <Link
          to="/turfs"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-600 hover:text-[#059669] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Book Another Session</span>
        </Link>

        <Link
          to="/my-bookings"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-[#059669] hover:text-[#047857] transition-colors"
        >
          <span>View All My Bookings</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Receipt Modal */}
      {isReceiptOpen && (
        <ReceiptModal
          isOpen={isReceiptOpen}
          onClose={() => setIsReceiptOpen(false)}
          identifier={bookingRef}
        />
      )}
    </div>
  );
};
