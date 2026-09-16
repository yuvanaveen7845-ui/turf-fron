import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  CalendarDays,
  Users,
  Layers,
  CreditCard,
  UserCog,
  QrCode,
  ArrowRight,
  Loader2,
  DollarSign,
  PlusCircle,
  Lock,
  Sliders,
  UserPlus,
  Ticket,
  Wrench,
  Sparkles,
} from "lucide-react";
import api from "../../services/api";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewBooking?: () => void;
  onOpenRecordPayment?: () => void;
  onOpenPriceChange?: () => void;
  onOpenBlockSlot?: () => void;
  onOpenAddCustomer?: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenNewBooking,
  onOpenRecordPayment,
  onOpenPriceChange,
  onOpenBlockSlot,
  onOpenAddCustomer,
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Quick Command Actions list
  const quickActions = [
    {
      id: "action_booking",
      title: "New Booking / Walk-In",
      desc: "Fast match booking desk & player reservation",
      icon: PlusCircle,
      badge: "Action",
      color: "text-[#059669] bg-emerald-50 border-emerald-200",
      execute: () => {
        onClose();
        if (onOpenNewBooking) onOpenNewBooking();
      },
    },
    {
      id: "action_payment",
      title: "Record Offline Payment",
      desc: "Collect counter cash, spot UPI, or card payment",
      icon: DollarSign,
      badge: "Finance",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      execute: () => {
        onClose();
        if (onOpenRecordPayment) onOpenRecordPayment();
      },
    },
    {
      id: "action_price",
      title: "Change Turf Price",
      desc: "Instantly update hourly rate for today or any date",
      icon: Sliders,
      badge: "Yield",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      execute: () => {
        onClose();
        if (onOpenPriceChange) onOpenPriceChange();
      },
    },
    {
      id: "action_block",
      title: "Block Turf Slot",
      desc: "Lock slot for private events or pitch grooming",
      icon: Lock,
      badge: "Ops",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      execute: () => {
        onClose();
        if (onOpenBlockSlot) onOpenBlockSlot();
      },
    },
    {
      id: "action_customer",
      title: "Add New Customer",
      desc: "Register player profile for instant booking & loyalty",
      icon: UserPlus,
      badge: "CRM",
      color: "text-teal-600 bg-teal-50 border-teal-200",
      execute: () => {
        onClose();
        if (onOpenAddCustomer) onOpenAddCustomer();
      },
    },
    {
      id: "action_maintenance",
      title: "Schedule Maintenance Block",
      desc: "Pitch repairs, brushing, floodlight maintenance",
      icon: Wrench,
      badge: "Facilities",
      color: "text-orange-600 bg-orange-50 border-orange-200",
      execute: () => {
        onClose();
        navigate("/admin/maintenance");
      },
    },
    {
      id: "action_coupon",
      title: "Create Coupon / Discount Code",
      desc: "New promotional code with percentage or flat discount",
      icon: Ticket,
      badge: "Marketing",
      color: "text-rose-600 bg-rose-50 border-rose-200",
      execute: () => {
        onClose();
        navigate("/admin/coupons");
      },
    },
  ];

  const filteredActions = query.trim()
    ? quickActions.filter(
        (a) =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.desc.toLowerCase().includes(query.toLowerCase()) ||
          a.badge.toLowerCase().includes(query.toLowerCase())
      )
    : quickActions;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/global-search/?q=${encodeURIComponent(query.trim())}`);
        setResults(res.data);
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSelect = (url: string) => {
    navigate(url);
    onClose();
  };

  const hasEntityResults =
    results &&
    (results.bookings?.length > 0 ||
      results.customers?.length > 0 ||
      results.facilities?.length > 0 ||
      results.payments?.length > 0 ||
      results.staff?.length > 0 ||
      results.passes?.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center space-x-3 bg-[#F8FAFC]">
          <Search className="w-5 h-5 text-[#059669] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search bookings, customers, turfs or actions..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-slate-900 placeholder:text-slate-400 text-sm font-semibold"
          />
          {loading ? (
            <Loader2 className="w-4 h-4 text-[#059669] animate-spin shrink-0" />
          ) : query ? (
            <button
              onClick={() => setQuery("")}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold text-slate-400 bg-white border border-slate-200 rounded-lg shadow-2xs">
              ESC
            </kbd>
          )}
        </div>

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          {/* Quick Actions Group */}
          {filteredActions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-[#059669]" />
                <span>Instant Operations & Actions</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={action.execute}
                      className="p-3 text-left bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 hover:border-emerald-300 rounded-2xl flex items-center space-x-3 transition cursor-pointer group"
                    >
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs ${action.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 group-hover:text-[#059669] transition truncate">
                          {action.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {action.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* If search query entered, show matching entities */}
          {query.trim().length >= 2 && (
            <>
              {/* Bookings */}
              {results?.bookings?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                    <span>Bookings ({results.bookings.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                    {results.bookings.map((b: any) => (
                      <div
                        key={b.id}
                        onClick={() => handleSelect(`/admin/bookings`)}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#059669] transition">
                            #{b.booking_number} • {b.customer_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {b.facility_name} • {b.date} ({b.start_time?.slice(0, 5)})
                          </div>
                        </div>
                        <div className="text-right flex items-center space-x-2">
                          <span className="font-mono font-bold text-slate-900">
                            ₹{b.total_amount}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            b.status === "CONFIRMED" ? "bg-emerald-100 text-[#059669]" : "bg-slate-200 text-slate-700"
                          }`}>
                            {b.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customers */}
              {results?.customers?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>Customers ({results.customers.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                    {results.customers.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => handleSelect(`/admin/customers`)}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#059669] transition">
                            {c.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {c.email} {c.phone && `• ${c.phone}`}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#059669] transition" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Facilities / Turfs */}
              {results?.facilities?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Turfs & Facilities ({results.facilities.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                    {results.facilities.map((f: any) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelect(`/admin/turfs`)}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#059669] transition">
                            {f.name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {f.sport} • Base: ₹{f.hourly_rate}/hr
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-100 text-[#059669] rounded-full text-[10px] font-bold">
                          {f.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payments */}
              {results?.payments?.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-1.5 px-2 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <CreditCard className="w-3.5 h-3.5 text-teal-600" />
                    <span>Payments ({results.payments.length})</span>
                  </div>
                  <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden">
                    {results.payments.map((p: any) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelect(`/admin/payments`)}
                        className="p-3 hover:bg-emerald-50/60 cursor-pointer flex items-center justify-between transition group"
                      >
                        <div>
                          <div className="font-bold text-slate-900 group-hover:text-[#059669] transition">
                            #{p.payment_id} • {p.customer_name}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Method: {p.method} • {p.provider}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900">
                            ₹{p.amount}
                          </span>
                          <div className="text-[10px] text-emerald-600 font-bold uppercase">
                            {p.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!hasEntityResults && query.trim().length >= 2 && filteredActions.length === 0 && (
            <div className="py-12 text-center text-slate-400 space-y-1">
              <p className="font-bold text-slate-700">No matching records or actions found</p>
              <p className="text-xs">Try searching by player phone, booking code, or turf name</p>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <div className="flex items-center space-x-3">
            <span>
              Tip: Press <kbd className="px-1.5 py-0.5 font-bold bg-white border border-slate-200 rounded">⌘/Ctrl+K</kbd> anywhere
            </span>
          </div>
          <span>Friends Turf Command Desk</span>
        </div>
      </div>
    </div>
  );
};
