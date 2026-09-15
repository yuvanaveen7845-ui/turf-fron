import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Users,
  Clock,
  ShieldCheck,
  Calendar as CalendarIcon,
  Star,
  ChevronRight,
  AlertCircle,
  Lock,
  Zap,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";
import { useAuth } from "../../context/AuthContext";

export const TurfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [loadingTurf, setLoadingTurf] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Fetch Turf details
  useEffect(() => {
    api
      .get(`/turfs/${id}/`)
      .then((res) => {
        setTurf(res.data);
        if (res.data.images?.length > 0) {
          setSelectedImage(res.data.images[0]);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingTurf(false));
  }, [id]);

  // Fetch Slots whenever selectedDate changes
  useEffect(() => {
    if (!id) return;
    setLoadingSlots(true);
    setLockError("");
    setSelectedSlotIds([]);

    api
      .get(`/turfs/${id}/availability/?date=${selectedDate}`)
      .then((res) => {
        setSlots(res.data.slots || []);
      })
      .catch((err) => {
        console.error(err);
        setLockError("Failed to load availability for this date.");
      })
      .finally(() => setLoadingSlots(false));
  }, [id, selectedDate]);

  // Generate date options for the next 10 days
  const dateOptions = Array.from({ length: 10 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayName =
      i === 0
        ? "Today"
        : i === 1
          ? "Tomorrow"
          : d.toLocaleDateString("en-US", { weekday: "short" });
    const formattedDate = d.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
    return { dateStr, dayName, formattedDate };
  });

  const toggleSlotSelection = (slot: TimeSlot) => {
    if (slot.status !== "AVAILABLE") return;

    if (selectedSlotIds.includes(slot.id)) {
      setSelectedSlotIds(selectedSlotIds.filter((sId) => sId !== slot.id));
    } else {
      setSelectedSlotIds([...selectedSlotIds, slot.id]);
    }
  };

  const handleProceedToLock = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (selectedSlotIds.length === 0) {
      setLockError("Please select at least one available slot.");
      return;
    }

    setLockLoading(true);
    setLockError("");

    try {
      // 1. Lock slot on server for 5 minutes
      const res = await api.post("/bookings/lock-slots/", {
        turf_id: id,
        date: selectedDate,
        slot_ids: selectedSlotIds,
      });

      // 2. Navigate to Checkout with state
      navigate("/checkout", {
        state: {
          turf,
          date: selectedDate,
          slotIds: selectedSlotIds,
          selectedSlots: slots.filter((s) => selectedSlotIds.includes(s.id)),
          lockData: res.data.data,
        },
      });
    } catch (err: any) {
      setLockError(
        err.response?.data?.error ||
          "Unable to lock slots. They may have just been booked.",
      );
      // Refresh slots
      api
        .get(`/turfs/${id}/availability/?date=${selectedDate}`)
        .then((r) => setSlots(r.data.slots));
    } finally {
      setLockLoading(false);
    }
  };

  if (loadingTurf || !turf) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center animate-pulse">
        <div className="h-96 bg-slate-900 rounded-3xl mb-8" />
        <div className="h-8 bg-slate-900 w-1/3 mx-auto rounded-xl" />
      </div>
    );
  }

  const selectedSlotsObjects = slots.filter((s) =>
    selectedSlotIds.includes(s.id),
  );
  const estimatedTotal = selectedSlotsObjects.reduce(
    (acc, s) => acc + Number(s.price || turf.base_price),
    0,
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center space-x-2 text-xs text-slate-400">
        <Link to="/" className="hover:text-emerald-400">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/turfs" className="hover:text-emerald-400">
          Turfs
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-white font-medium">{turf.name}</span>
      </div>

      {/* Top Banner: Gallery + Key Info */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Images */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative h-72 sm:h-96 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800">
            <img
              src={selectedImage || turf.images[0]}
              alt={turf.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 left-4">
              <span className="px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                {turf.sport_type}
              </span>
            </div>
            <div className="absolute top-4 right-4 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 text-xs font-bold border border-amber-500/30">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{turf.rating}</span>
              <span className="text-slate-400 font-normal">
                ({turf.total_reviews} reviews)
              </span>
            </div>
          </div>

          {/* Thumbnails */}
          {turf.images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-1">
              {turf.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                    selectedImage === img
                      ? "border-emerald-500 scale-105"
                      : "border-slate-800 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img
                    src={img}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Venue Highlights */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {turf.name}
            </h1>
            <p className="flex items-center space-x-1.5 text-xs text-slate-400 mt-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{turf.address}</span>
            </p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {turf.description}
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-3">
              <Users className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Capacity
                </p>
                <p className="text-xs font-bold text-white">
                  Up to {turf.capacity} Players
                </p>
              </div>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex items-center space-x-3">
              <Clock className="w-5 h-5 text-teal-400 shrink-0" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">
                  Hours
                </p>
                <p className="text-xs font-bold text-white">
                  06:00 AM – 11:00 PM
                </p>
              </div>
            </div>
          </div>

          {/* Amenities Badges */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Venue Amenities
            </p>
            <div className="flex flex-wrap gap-2">
              {turf.facilities_data?.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-medium text-slate-300"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{f.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Highlight */}
          <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300">
                Base Rate
              </span>
              <p className="text-2xl font-black text-white">
                ₹{turf.base_price}{" "}
                <span className="text-xs font-normal text-slate-400">
                  / 1-hr slot
                </span>
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold">
                ⚡ Dynamic Pricing Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Booking & Slot Selection Section */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Step 1: Choose Date & Match Time</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
              Select Time Slots
            </h2>
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-3 text-xs">
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-emerald-500" />
              <span className="text-slate-300">Available</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-emerald-600 ring-2 ring-emerald-300" />
              <span className="text-slate-300">Selected</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-slate-800 border border-slate-700" />
              <span className="text-slate-500">Booked</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-3 h-3 rounded-md bg-amber-900/60" />
              <span className="text-slate-500">Locked</span>
            </span>
          </div>
        </div>

        {/* 14-Day Date Carousel */}
        <div className="flex items-center space-x-2.5 overflow-x-auto pb-2">
          {dateOptions.map((item) => {
            const isSelected = selectedDate === item.dateStr;
            return (
              <button
                key={item.dateStr}
                onClick={() => setSelectedDate(item.dateStr)}
                className={`p-3 rounded-2xl flex flex-col items-center justify-center min-w-[90px] border transition-all ${
                  isSelected
                    ? "bg-gradient-to-b from-emerald-500 to-emerald-600 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25 scale-105"
                    : "bg-slate-950/70 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
                }`}
              >
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-slate-950" : "text-slate-500"}`}
                >
                  {item.dayName}
                </span>
                <span className="text-sm font-black mt-0.5">
                  {item.formattedDate}
                </span>
              </button>
            );
          })}
        </div>

        {/* Slots Matrix */}
        {loadingSlots ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 animate-pulse py-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-16 bg-slate-950 rounded-xl border border-slate-800"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {slots.map((slot) => {
                const isSelected = selectedSlotIds.includes(slot.id);
                const isBooked = slot.status === "BOOKED";
                const isLocked = slot.status === "LOCKED" && !slot.is_available;
                const isMaintenance = slot.status === "MAINTENANCE";
                const isAvailable =
                  slot.status === "AVAILABLE" || slot.is_available;

                let badge = null;
                if (slot.applied_rules && slot.applied_rules.length > 0) {
                  const r = slot.applied_rules[0];
                  badge = (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                        r.amount > 0
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {r.amount > 0
                        ? `+₹${r.amount} Surge`
                        : `-₹${Math.abs(r.amount)} Deal`}
                    </span>
                  );
                }

                return (
                  <button
                    key={slot.id}
                    disabled={!isAvailable}
                    onClick={() => toggleSlotSelection(slot)}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition-all duration-200 relative ${
                      isSelected
                        ? "bg-emerald-600/90 border-emerald-400 text-white ring-2 ring-emerald-400/80 shadow-lg shadow-emerald-600/30"
                        : isAvailable
                          ? "bg-slate-950/80 border-slate-800 hover:border-emerald-500 text-slate-200 hover:bg-slate-900"
                          : isBooked
                            ? "bg-slate-950/40 border-slate-800/40 text-slate-600 cursor-not-allowed"
                            : isLocked
                              ? "bg-amber-950/20 border-amber-900/40 text-amber-600/60 cursor-not-allowed"
                              : "bg-red-950/20 border-red-900/40 text-red-600/60 cursor-not-allowed"
                    }`}
                  >
                    <div>
                      <span className="text-xs font-black block tracking-tight">
                        {slot.start_time.slice(0, 5)} -{" "}
                        {slot.end_time.slice(0, 5)}
                      </span>
                      <div className="mt-1">{badge}</div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`text-xs font-bold ${isSelected ? "text-white" : "text-emerald-400"}`}
                      >
                        ₹{slot.price}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-slate-400">
                        {isBooked
                          ? "Booked"
                          : isLocked
                            ? "Locked"
                            : isMaintenance
                              ? "Repair"
                              : isSelected
                                ? "✓ Picked"
                                : "Open"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {lockError && (
              <div className="flex items-center space-x-2 p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}

            {/* Selection Summary Bar */}
            {selectedSlotIds.length > 0 && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-slate-900 border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 animate-in fade-in slide-in-from-bottom-2">
                <div className="space-y-0.5 text-center sm:text-left">
                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                    {selectedSlotIds.length} Slot
                    {selectedSlotIds.length > 1 ? "s" : ""} Selected
                  </p>
                  <p className="text-xl font-black text-white">
                    Estimated Subtotal: ₹{estimatedTotal.toLocaleString()}{" "}
                    <span className="text-xs font-normal text-slate-400">
                      (+18% GST at checkout)
                    </span>
                  </p>
                </div>

                <button
                  onClick={handleProceedToLock}
                  disabled={lockLoading}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {lockLoading ? (
                    <span>Reserving Slot...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Reserve Slot (5-Min Lock)</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
