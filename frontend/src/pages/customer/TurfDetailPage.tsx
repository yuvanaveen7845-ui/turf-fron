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
  Sun,
  Flame,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useSlotRealtime } from "../../hooks/useRealtime";

export const TurfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [turf, setTurf] = useState<Turf | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [availableSlotsCount, setAvailableSlotsCount] = useState<number>(0);
  const [isFastFill, setIsFastFill] = useState<boolean>(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [loadingTurf, setLoadingTurf] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Premium Polish: Remember customer's last-used booking duration
  const [preferredDuration, setPreferredDuration] = useState<number>(() => {
    const saved = localStorage.getItem("ft_preferred_duration_minutes");
    return saved ? Number(saved) : 60;
  });

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

  const fetchSlots = () => {
    if (!id) return;
    api
      .get(`/turfs/${id}/availability/?date=${selectedDate}`)
      .then((res) => {
        setSlots(res.data.slots || []);
        setAvailableSlotsCount(res.data.available_slots_count || 0);
        setIsFastFill(res.data.is_fast_fill || false);
      })
      .catch((err) => {
        console.error(err);
      });
  };

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
        setAvailableSlotsCount(res.data.available_slots_count || 0);
        setIsFastFill(res.data.is_fast_fill || false);
      })
      .catch((err) => {
        console.error(err);
        setLockError("Failed to load availability for this date.");
      })
      .finally(() => setLoadingSlots(false));
  }, [id, selectedDate]);

  // Real-time live synchronization for slot status changes
  useSlotRealtime(id, selectedDate, (event) => {
    fetchSlots();
  });

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
      navigate(`/login?redirect=/turfs/${id}`);
      return;
    }
    if (selectedSlotIds.length === 0) {
      setLockError("Please select at least 1 open time slot.");
      return;
    }

    setLockLoading(true);
    setLockError("");

    try {
      const res = await api.post("/bookings/lock/", {
        slot_ids: selectedSlotIds,
      });

      // Save preferred duration
      const durationMinutes = selectedSlotIds.length * 60;
      localStorage.setItem("ft_preferred_duration_minutes", String(durationMinutes));

      // Navigate to checkout with the active lock reservation
      navigate("/checkout", {
        state: {
          turf,
          date: selectedDate,
          selectedDate,
          slotIds: selectedSlotIds,
          selectedSlotIds,
          selectedSlots: selectedSlotsData,
          lockedSlots: res.data.locked_slots,
          lockData: {
            locked_until: res.data.expires_at || new Date(Date.now() + 300000).toISOString(),
            slot_ids: selectedSlotIds,
          },
          lockDurationSeconds: res.data.lock_duration_seconds || 300,
          expiresAt: res.data.expires_at,
          totalPrice: totalAmount,
        },
      });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        "Could not lock the selected slots. Someone may have just reserved them.";
      setLockError(errorMsg);
      // Refresh slots
      api.get(`/turfs/${id}/availability/?date=${selectedDate}`).then((res) => {
        setSlots(res.data.slots || []);
      });
    } finally {
      setLockLoading(false);
    }
  };

  const selectedSlotsData = slots.filter((s) => selectedSlotIds.includes(s.id));
  const totalAmount = selectedSlotsData.reduce(
    (sum, s) => sum + Number(s.price),
    0
  );

  if (loadingTurf) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-96 rounded-2xl bg-white border border-slate-200 animate-pulse" />
      </div>
    );
  }

  if (!turf) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-900">Pitch not found</h2>
        <Link to="/turfs" className="text-[#059669] font-bold hover:underline">
          Return to all pitches
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">
      {/* 1. Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-slate-500">
        <Link to="/" className="hover:text-slate-900">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <Link to="/turfs" className="hover:text-slate-900">
          Our Pitches
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-slate-900 font-bold">{turf.name}</span>
      </nav>

      {/* 2. Top Banner & Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Photo Showcase & Pitch Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo with Overlay */}
          <div className="relative h-72 sm:h-96 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-pitch-card">
            <img
              src={selectedImage || turf.images[0]}
              alt={turf.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

            {/* Badges on Hero */}
            <div className="absolute top-4 left-4 flex items-center space-x-2">
              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm text-xs font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-[#059669]" />
                <span>{turf.is_fifa_certified !== false ? "FIFA Certified Pro" : "Pro Arena"}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full bg-slate-900/90 text-xs font-bold text-white shadow-sm">
                <Star className="w-3.5 h-3.5 text-[#FBBF24] fill-[#FBBF24]" />
                <span>{Number(turf.rating || 5.0).toFixed(1)}</span>
                <span className="text-slate-400 font-normal">({turf.total_reviews} reviews)</span>
              </span>
            </div>

            {/* Bottom Title on Image for Mobile */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {turf.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-200 flex items-center space-x-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-[#059669]" />
                <span>{turf.location}</span>
              </p>
            </div>
          </div>

          {/* Thumbnails if multiple images */}
          {turf.images && turf.images.length > 1 && (
            <div className="flex items-center space-x-3 overflow-x-auto pb-2">
              {turf.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img
                      ? "border-[#059669] scale-105 shadow-sm"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Detailed Pitch Specifications (DESIGN.md Spec) */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
              Pitch & Field Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>Turf Quality</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {turf.surface_spec ? turf.surface_spec.split(" ")[0] : "50mm"} Grass
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <Sun className="w-4 h-4 text-[#F59E0B]" />
                  <span>Lighting</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {turf.lighting_spec ? turf.lighting_spec.split(" ")[0] + " Lux" : "400 Lux LED"}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <Users className="w-4 h-4 text-[#059669]" />
                  <span>Capacity</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {turf.capacity} Players Max
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <Clock className="w-4 h-4 text-[#059669]" />
                  <span>Dimensions</span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {turf.dimensions ? turf.dimensions.split(" ")[0] : "110x70 ft"}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed pt-2">
              {turf.description}
            </p>
          </div>
        </div>

        {/* Right Col: 10-Day Date Strip & Interactive Slot Matrix */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-pitch-card p-6 space-y-6">
            <div>
              <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                Step 1: Choose Date
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Select Your Match Day
              </h3>
            </div>

            {/* 10-Day Horizontal Scroll Strip */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.dateStr;
                return (
                  <button
                    key={opt.dateStr}
                    onClick={() => setSelectedDate(opt.dateStr)}
                    className={`px-4 py-2.5 rounded-2xl text-center shrink-0 border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/20 scale-105"
                        : "bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-[11px] font-extrabold uppercase ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                      {opt.dayName}
                    </p>
                    <p className="text-sm font-black mt-0.5 whitespace-nowrap">
                      {opt.formattedDate}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Slot Matrix Header & Fast-Fill Banner */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                    Step 2: Choose 1-Hr Slots
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Live Pitch Availability
                  </h4>
                </div>
                <span className="text-xs font-bold text-slate-500">
                  {availableSlotsCount} Open Slots
                </span>
              </div>

              {/* Duration Preference Pill */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs">
                <div className="flex items-center space-x-1.5 text-[#059669] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preferred Match Duration: {preferredDuration}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setPreferredDuration(mins);
                        localStorage.setItem("ft_preferred_duration_minutes", String(mins));
                      }}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
                        preferredDuration === mins
                          ? "bg-[#059669] text-white shadow-2xs"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>

              {isFastFill && (
                <div className="flex items-center space-x-2 p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200 text-xs font-bold text-emerald-900 animate-pulse">
                  <Flame className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>High Demand Date: Prime evening slots filling fast!</span>
                </div>
              )}
            </div>

            {/* Slot Matrix Grid */}
            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : slots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const isSelected = selectedSlotIds.includes(slot.id);
                  const isAvail = slot.status === "AVAILABLE";
                  const isMorning = slot.start_time < "12:00:00";
                  const isNight = slot.start_time >= "18:00:00";

                  return (
                    <button
                      key={slot.id}
                      disabled={!isAvail}
                      onClick={() => toggleSlotSelection(slot)}
                      className={`p-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/20 scale-[1.02]"
                          : isAvail
                            ? "bg-white border-slate-200 hover:border-[#059669] hover:bg-[#ECFDF5] text-slate-900"
                            : "bg-slate-100 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold">
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </span>
                        {isNight && isAvail && (
                          <Sun className={`w-3 h-3 ${isSelected ? "text-amber-200" : "text-amber-500"}`} />
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? "text-white" : "text-slate-900"}`}>
                          ₹{Number(slot.price).toLocaleString("en-IN")}
                        </span>
                        <span className={`text-[10px] font-semibold uppercase ${
                          isSelected
                            ? "text-emerald-100"
                            : isAvail
                              ? "text-[#059669]"
                              : "text-slate-400"
                        }`}>
                          {isSelected ? "Selected" : isAvail ? "Available" : slot.status.toLowerCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">
                No slots configured for this date.
              </p>
            )}

            {/* Error Message */}
            {lockError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}

            {/* Selected Slots Summary & 5-Min Lock CTA */}
            <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">
                  {selectedSlotIds.length} Slot(s) Selected
                </span>
                <span className="text-lg font-extrabold text-slate-900">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Clicking below holds selected slots for 5 minutes during checkout</span>
              </div>

              <button
                disabled={selectedSlotIds.length === 0 || lockLoading}
                onClick={handleProceedToLock}
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-emerald-glow transition-all active:scale-[0.99] cursor-pointer"
              >
                {lockLoading ? (
                  <span>Reserving 5-Min Slot Lock...</span>
                ) : (
                  <>
                    <span>Proceed to 5-Min Lock Reservation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
