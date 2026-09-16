import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  QrCode,
  ShieldCheck,
  User,
  Sparkles,
  Phone,
  RefreshCw,
  PlusCircle,
  DollarSign,
} from "lucide-react";
import api from "../../services/api";
import { Booking } from "../../types";
import { Button, StatusBadge, DataTable, EmptyState } from "../../components/ui";
import { ContextualBookingDrawer } from "../../components/admin/ContextualBookingDrawer";
import { NewBookingWizardModal } from "../../components/admin/NewBookingWizardModal";
import { RecordOfflinePaymentModal } from "../../components/admin/RecordOfflinePaymentModal";

export const ManageBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Drawer & Modals State
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isOfflinePaymentOpen, setIsOfflinePaymentOpen] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState<string | number | undefined>();

  const fetchBookings = () => {
    setLoading(true);
    api
      .get("/bookings/")
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
        setBookings(list);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const openDrawer = (b: Booking) => {
    setSelectedBooking(b);
    setIsDrawerOpen(true);
  };

  const handleOpenPayment = (bookingId: string | number) => {
    setPaymentBookingId(bookingId);
    setIsOfflinePaymentOpen(true);
  };

  const filteredBookings = bookings.filter((b) => {
    return statusFilter === "ALL" || b.status === statusFilter;
  });

  const columns = [
    {
      key: "booking_id",
      header: "Booking ID",
      sortable: true,
      render: (b: Booking) => (
        <span
          onClick={() => openDrawer(b)}
          className="font-mono font-bold text-slate-900 text-xs sm:text-sm hover:text-[#059669] cursor-pointer"
        >
          #{b.booking_id || b.id}
        </span>
      ),
    },
    {
      key: "turf",
      header: "Pitch / Turf",
      render: (b: Booking) => (
        <div>
          <div className="font-bold text-slate-900">
            {b.turf_details?.name || "Friends Turf Arena"}
          </div>
          <div className="text-[11px] text-slate-400">
            {b.turf_details?.sport_type || "Pitch"}
          </div>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (b: Booking) => (
        <div>
          <p className="font-bold text-slate-900">
            {b.customer_details?.full_name || "Customer"}
          </p>
          <p className="text-[11px] text-slate-400">
            {b.customer_details?.phone || b.customer_details?.email}
          </p>
        </div>
      ),
    },
    {
      key: "datetime",
      header: "Date & Match Time",
      render: (b: Booking) => (
        <div>
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-[#059669]" />
            <span>{b.date}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{b.start_time?.slice(0, 5)} - {b.end_time?.slice(0, 5)}</span>
          </p>
        </div>
      ),
    },
    {
      key: "financials",
      header: "Amount & Balance",
      render: (b: Booking) => {
        const balance = Number(b.balance_due || 0);
        return (
          <div>
            <span className="font-black text-slate-900 font-mono">
              ₹{Number(b.final_amount).toLocaleString("en-IN")}
            </span>
            {balance > 0 ? (
              <p className="text-[10px] text-amber-600 font-bold">
                Due: ₹{balance.toLocaleString("en-IN")}
              </p>
            ) : (
              <p className="text-[10px] text-[#059669] font-semibold">Fully Settled</p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      render: (b: Booking) => <StatusBadge status={b.status} size="sm" />,
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (b: Booking) => {
        const balance = Number(b.balance_due || 0);
        return (
          <div className="flex items-center justify-end space-x-2">
            {balance > 0 && b.status !== "CANCELLED" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenPayment(b.id)}
                className="text-[#059669] hover:bg-emerald-50 border-emerald-200"
              >
                Pay ₹{balance}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => openDrawer(b)}
            >
              Manage
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Operational Booking Ledger</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Match Bookings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time ledger of player reservations, offline payments, slot adjustments, and pass status
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setPaymentBookingId(undefined);
              setIsOfflinePaymentOpen(true);
            }}
            leftIcon={<DollarSign className="w-4 h-4 text-[#059669]" />}
          >
            Record Payment
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewBookingOpen(true)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            + New Booking
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {["ALL", "CONFIRMED", "CHECKED_IN", "PENDING", "CANCELLED"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              statusFilter === st
                ? "bg-[#059669] text-white shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Bookings DataTable */}
      <DataTable
        columns={columns}
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search booking ID, customer, turf..."
        searchableKey={(b) =>
          `${b.booking_id} ${b.customer_details?.full_name} ${b.customer_details?.phone} ${b.turf_details?.name}`
        }
        emptyTitle="No match bookings found"
        emptyDescription="Player reservations and walk-in counter bookings will appear in this ledger."
        emptyActionText="+ Create Booking"
        onEmptyAction={() => setIsNewBookingOpen(true)}
      />

      {/* Contextual Booking Drawer */}
      <ContextualBookingDrawer
        booking={selectedBooking}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedBooking(null);
        }}
        onBookingUpdated={fetchBookings}
        onRecordPaymentClick={(id) => {
          setIsDrawerOpen(false);
          handleOpenPayment(id);
        }}
      />

      {/* New Booking Wizard */}
      <NewBookingWizardModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        onBookingCreated={fetchBookings}
      />

      {/* Record Offline Payment Modal */}
      <RecordOfflinePaymentModal
        isOpen={isOfflinePaymentOpen}
        onClose={() => {
          setIsOfflinePaymentOpen(false);
          setPaymentBookingId(undefined);
        }}
        preselectedBookingId={paymentBookingId}
        onPaymentSuccess={fetchBookings}
      />
    </div>
  );
};
