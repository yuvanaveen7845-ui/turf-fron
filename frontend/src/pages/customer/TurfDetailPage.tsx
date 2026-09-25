import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
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
  Moon,
  Sunrise,
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";
import { useSlotRealtime } from "../../hooks/useRealtime";
import { resolveImageUrl, handleImageError } from "../../utils/imageUrl";
import { saveBookingIntent, getBookingIntent, clearBookingIntent } from "../../utils/bookingIntent";
import { triggerHaptic } from "../../utils/haptics";

export const TurfDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { booking: bookingRules } = useBusinessSettings();

  const queryDate = searchParams.get("date");
  const querySession = searchParams.get("session")?.toUpperCase();
  const [turf, setTurf] = useState<Turf | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return queryDate || new Date().toISOString().split("T")[0];
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [availableSlotsCount, setAvailableSlotsCount] = useState<number>(0);
  const [isFastFill, setIsFastFill] = useState<boolean>(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [selectedTimePeriod, setSelectedTimePeriod] = useState<"ALL" | "MORNING" | "AFTERNOON" | "NIGHT">(() => {
    if (querySession === "MORNING") return "MORNING";
    if (querySession === "AFTERNOON") return "AFTERNOON";
    if (querySession === "NIGHT" || querySession === "EVENING") return "NIGHT";
    return "ALL";
  });
  const [loadingTurf, setLoadingTurf] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");
  const [selectedImage, setSelectedImage] = useState<string>("");

  // Sync state if query param date changes
  useEffect(() => {
    if (queryDate && queryDate !== selectedDate) {
      setSelectedDate(queryDate);
    }
  }, [queryDate]);

  // Sync session filter if query param changes
  useEffect(() => {
    if (querySession) {
      if (querySession === "MORNING") setSelectedTimePeriod("MORNING");
      else if (querySession === "AFTERNOON") setSelectedTimePeriod("AFTERNOON");
      else if (querySession === "NIGHT" || querySession === "EVENING") setSelectedTimePeriod("NIGHT");
      else setSelectedTimePeriod("ALL");
    }
  }, [querySession]);

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

  const autoSelectSlotsFromQueryOrIntent = (loadedSlots: TimeSlot[], targetDate: string) => {
    const querySlot = searchParams.get("slot") || searchParams.get("slotId");
    const queryTime = searchParams.get("time");
    const queryDate = searchParams.get("date");
    const isTargetDate = queryDate ? queryDate === targetDate : true;
    const intent = getBookingIntent();

    let targetSlotIds: string[] = [];

    // 1. If explicit slot ID was passed in query params and date matches
    if (isTargetDate && querySlot) {
      const match = loadedSlots.find(
        (s) => String(s.id) === String(querySlot) && (s.is_available || s.status === "AVAILABLE")
      );
      if (match) {
        targetSlotIds = [match.id];
      }
    }

    // 2. If start time was passed in query params and date matches
    if (targetSlotIds.length === 0 && isTargetDate && queryTime) {
      const match = loadedSlots.find(
        (s) =>
          s.start_time.slice(0, 5) === queryTime &&
          (s.is_available || s.status === "AVAILABLE")
      );
      if (match) {
        targetSlotIds = [match.id];
      }
    }

    // 3. Fallback: check saved intent in sessionStorage
    if (
      targetSlotIds.length === 0 &&
      intent &&
      String(intent.turfId) === String(id) &&
      intent.date === targetDate &&
      intent.slotIds?.length > 0
    ) {
      const valid = intent.slotIds.filter((sId) =>
        loadedSlots.some((s) => String(s.id) === String(sId) && (s.is_available || s.status === "AVAILABLE"))
      );
      if (valid.length > 0) {
        targetSlotIds = valid;
      }
    }

    if (targetSlotIds.length > 0) {
      setSelectedSlotIds(targetSlotIds);

      // Auto-switch time period tab so the slot is visible
      const firstTargetSlot = loadedSlots.find((s) => s.id === targetSlotIds[0]);
      if (firstTargetSlot) {
        const startTime = firstTargetSlot.start_time;
        if (startTime >= "06:00:00" && startTime < "12:00:00") {
          setSelectedTimePeriod("MORNING");
        } else if (startTime >= "12:00:00" && startTime < "17:00:00") {
          setSelectedTimePeriod("AFTERNOON");
        } else if (startTime >= "17:00:00") {
          setSelectedTimePeriod("NIGHT");
        }
      }

      // Smoothly scroll to the target slot element
      setTimeout(() => {
        const slotEl = document.getElementById(`slot-${targetSlotIds[0]}`);
        if (slotEl) {
          slotEl.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const sectionEl = document.getElementById("slots-section");
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }
      }, 250);
    } else if (window.location.hash === "#slots-section" || queryDate || querySession) {
      setTimeout(() => {
        const sectionEl = document.getElementById("slots-section");
        if (sectionEl) {
          sectionEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  };

  const fetchSlots = () => {
    if (!id) return;
    api
      .get(`/turfs/${id}/availability/?date=${selectedDate}`)
      .then((res) => {
        const loadedSlots: TimeSlot[] = res.data.slots || [];
        setSlots(loadedSlots);
        setAvailableSlotsCount(res.data.available_slots_count || 0);
        setIsFastFill(res.data.is_fast_fill || false);
        autoSelectSlotsFromQueryOrIntent(loadedSlots, selectedDate);
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
        const loadedSlots: TimeSlot[] = res.data.slots || [];
        setSlots(loadedSlots);
        setAvailableSlotsCount(res.data.available_slots_count || 0);
        setIsFastFill(res.data.is_fast_fill || false);
        autoSelectSlotsFromQueryOrIntent(loadedSlots, selectedDate);
      })
      .catch((err) => {
        console.error(err);
        setLockError("Failed to load availability for this date.");
      })
      .finally(() => setLoadingSlots(false));
  }, [id, selectedDate]);

  // Real-time live synchronization for slot status changes
  useSlotRealtime(id, selectedDate, () => {
    fetchSlots();
  });

  // Dynamic date options based on business settings advanceBookingDays (default 14 days)
  const advanceDays = bookingRules?.advanceBookingDays || 14;
  const dateOptions = Array.from({ length: advanceDays }, (_, i) => {
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

  // Filter slots by selected time period
  const filteredSlots = React.useMemo(() => {
    if (selectedTimePeriod === "MORNING") {
      return slots.filter((s) => s.start_time >= "06:00:00" && s.start_time < "12:00:00");
    }
    if (selectedTimePeriod === "AFTERNOON") {
      return slots.filter((s) => s.start_time >= "12:00:00" && s.start_time < "17:00:00");
    }
    if (selectedTimePeriod === "NIGHT") {
      return slots.filter((s) => s.start_time >= "17:00:00");
    }
    return slots;
  }, [slots, selectedTimePeriod]);

  // Counts per period
  const periodCounts = React.useMemo(() => {
    return {
      all: slots.filter((s) => s.is_available).length,
      morning: slots.filter((s) => s.is_available && s.start_time >= "06:00:00" && s.start_time < "12:00:00").length,
      afternoon: slots.filter((s) => s.is_available && s.start_time >= "12:00:00" && s.start_time < "17:00:00").length,
      night: slots.filter((s) => s.is_available && s.start_time >= "17:00:00").length,
    };
  }, [slots]);

  const selectedSlotsData = slots.filter((s) => selectedSlotIds.includes(s.id));
  const totalAmount = selectedSlotsData.reduce(
    (sum, s) => sum + Number(s.price),
    0
  );

  // Keep booking intent synced in sessionStorage whenever slot selection changes
  useEffect(() => {
    if (!turf || !selectedDate) return;
    if (selectedSlotIds.length === 0) {
      const current = getBookingIntent();
      if (current && current.turfId === String(turf.id)) {
        clearBookingIntent();
      }
      return;
    }

    const currentSlots = slots.filter((s) => selectedSlotIds.includes(s.id));
    saveBookingIntent({
      turfId: String(turf.id),
      turfName: turf.name,
      date: selectedDate,
      slotIds: selectedSlotIds,
      turf,
      selectedSlots: currentSlots,
      totalAmount: currentSlots.reduce((sum, s) => sum + Number(s.price), 0),
      returnUrl: `/turfs/${turf.id}?date=${selectedDate}`,
    });
  }, [selectedSlotIds, turf, selectedDate, slots]);

  const toggleSlotSelection = (slot: TimeSlot) => {
    if (!slot.is_available || slot.status !== "AVAILABLE") return;
    triggerHaptic("light");
    setLockError("");

    if (selectedSlotIds.includes(slot.id)) {
      // Deselecting a slot
      const remaining = selectedSlotIds.filter((sId) => sId !== slot.id);
      setSelectedSlotIds(remaining);
      return;
    }

    if (selectedSlotIds.length === 0) {
      setSelectedSlotIds([slot.id]);
      return;
    }

    // Get current selected slot objects sorted by start_time
    const currentSelected = slots
      .filter((s) => selectedSlotIds.includes(s.id))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const earliest = currentSelected[0];
    const latest = currentSelected[currentSelected.length - 1];

    // Check if clicked slot is adjacent to existing selection
    if (slot.end_time === earliest.start_time || slot.start_time === latest.end_time) {
      // Consecutive hour -> add to selection
      setSelectedSlotIds([...selectedSlotIds, slot.id]);
    } else {
      // Non-adjacent slot clicked -> start fresh continuous match selection from this slot
      setSelectedSlotIds([slot.id]);
      setLockError(
        `Selected ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)}. Match reservations require consecutive match hours.`
      );
    }
  };

  const handleProceedToLock = async () => {
    if (!turf) return;
    if (selectedSlotIds.length === 0) {
      setLockError("Please select at least 1 open time slot.");
      return;
    }

    triggerHaptic("success");

    if (!user) {
      // Save intent before navigating to login
      saveBookingIntent({
        turfId: String(turf.id),
        turfName: turf.name,
        date: selectedDate,
        slotIds: selectedSlotIds,
        turf,
        selectedSlots: selectedSlotsData,
        totalAmount,
        returnUrl: `/turfs/${id}?date=${selectedDate}`,
      });
      navigate(`/login?redirect=/checkout`, {
        state: {
          from: { pathname: `/turfs/${id}`, search: `?date=${selectedDate}` },
          hasPendingBooking: true,
          turfName: turf.name,
          slotCount: selectedSlotIds.length,
          totalAmount,
        },
      });
      return;
    }

    setLockLoading(true);
    setLockError("");

    try {
      const res = await api.post("/bookings/lock/", {
        turf_id: turf.id,
        date: selectedDate,
        slot_ids: selectedSlotIds,
      });

      // Save preferred duration
      const durationMinutes = selectedSlotIds.length * 60;
      localStorage.setItem("ft_preferred_duration_minutes", String(durationMinutes));

      const lockPayload = res.data.data || res.data;
      const slotHoldSecs = (bookingRules?.slotHoldMinutes || 5) * 60;
      const lockedUntil =
        res.data.locked_until ||
        lockPayload.locked_until ||
        res.data.expires_at ||
        new Date(Date.now() + slotHoldSecs * 1000).toISOString();
      const lockDurationSeconds =
        res.data.lock_duration_seconds || lockPayload.lock_duration_seconds || slotHoldSecs;

      // Navigate to checkout with the active lock reservation
      navigate("/checkout", {
        state: {
          turf,
          date: selectedDate,
          selectedDate,
          slotIds: selectedSlotIds,
          selectedSlotIds,
          selectedSlots: selectedSlotsData,
          lockedSlots: res.data.locked_slots || lockPayload.locked_slots || selectedSlotsData,
          lockData: {
            locked_until: lockedUntil,
            slot_ids: selectedSlotIds,
          },
          lockDurationSeconds,
          expiresAt: lockedUntil,
          totalPrice: totalAmount,
        },
      });
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.error ||
        (typeof err.response?.data === "string" ? err.response?.data : null) ||
        err.response?.data?.non_field_errors?.[0] ||
        "Could not lock the selected slots. Someone may have just reserved them.";
      setLockError(errorMsg);
      triggerHaptic("error");
      // Refresh slots
      api.get(`/turfs/${id}/availability/?date=${selectedDate}`).then((res) => {
        setSlots(res.data.slots || []);
      });
    } finally {
      setLockLoading(false);
    }
  };

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 space-y-8 pb-28 md:pb-12">
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
        <span className="text-slate-900 font-bold truncate max-w-[180px]">{turf.name}</span>
      </nav>

      {/* 2. Top Banner & Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Photo Showcase & Pitch Specs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Photo with Overlay */}
          <div className="relative h-64 sm:h-96 rounded-3xl overflow-hidden bg-slate-100 border border-slate-200 shadow-pitch-card">
            <img
              src={resolveImageUrl(selectedImage || (turf.images && turf.images[0]), turf.sport_type)}
              alt={turf.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => handleImageError(e, turf.sport_type)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent" />

            {/* Badges on Hero */}
            <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex items-center space-x-2">
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
            <div className="absolute bottom-3.5 left-3.5 right-3.5 sm:bottom-4 sm:left-4 sm:right-4 text-white">
              <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
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
            <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-none">
              {turf.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-14 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    selectedImage === img
                      ? "border-[#059669] scale-105 shadow-sm"
                      : "border-slate-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={resolveImageUrl(img, turf.sport_type)}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => handleImageError(e, turf.sport_type)}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Detailed Pitch Specifications (DESIGN.md Spec) */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-pitch-card p-5 sm:p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 uppercase tracking-wider text-xs">
              Pitch & Field Specifications
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-1">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-[#059669]" />
                  <span>Turf Quality</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {turf.surface_spec ? turf.surface_spec.split(" ")[0] : "50mm"} Grass
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <Sun className="w-4 h-4 text-[#F59E0B]" />
                  <span>Lighting</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {turf.lighting_spec ? turf.lighting_spec.split(" ")[0] + " Lux" : "400 Lux LED"}
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-1">
                <div className="flex items-center space-x-1.5 text-slate-500 text-xs font-semibold">
                  <Users className="w-4 h-4 text-[#059669]" />
                  <span>Capacity</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {turf.capacity} Players Max
                </p>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-[#F8FAFC] border border-slate-100 space-y-1">
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

        {/* Right Col: Interactive Booking Hub with Mobile Optimization */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-pitch-card p-5 sm:p-6 space-y-5">
            <div>
              <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                Step 1: Choose Date
              </span>
              <h3 className="text-lg font-bold text-slate-900">
                Select Your Match Day
              </h3>
            </div>

            {/* Horizontal Swipeable Date Strip */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none select-none">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.dateStr;
                return (
                  <button
                    key={opt.dateStr}
                    onClick={() => {
                      triggerHaptic("light");
                      setSelectedDate(opt.dateStr);
                    }}
                    className={`px-4 py-2.5 rounded-2xl text-center shrink-0 border transition-all cursor-pointer active:scale-95 ${
                      isSelected
                        ? "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/20 scale-105"
                        : "bg-[#F8FAFC] border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                    }`}
                  >
                    <p className={`text-[10px] font-black uppercase ${isSelected ? "text-emerald-100" : "text-slate-500"}`}>
                      {opt.dayName}
                    </p>
                    <p className="text-sm font-black mt-0.5 whitespace-nowrap">
                      {opt.formattedDate}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Step 2: Slot Selection Header & Time-of-Day Segmented Filter Tabs */}
            <div id="slots-section" className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
                    Step 2: Choose Slots
                  </span>
                  <h4 className="text-base font-bold text-slate-900">
                    Live Pitch Availability
                  </h4>
                </div>
                <span className="text-xs font-bold text-[#059669] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200/80">
                  {availableSlotsCount} Open
                </span>
              </div>

              {/* Time of Day Segmented Control Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/70 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedTimePeriod("ALL");
                  }}
                  className={`py-1.5 px-2 rounded-xl text-center transition-all cursor-pointer ${
                    selectedTimePeriod === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="text-[11px]">All ({periodCounts.all})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedTimePeriod("MORNING");
                  }}
                  className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    selectedTimePeriod === "MORNING"
                      ? "bg-white text-[#059669] shadow-2xs font-extrabold scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="06:00 AM - 12:00 PM"
                >
                  <span className="text-[11px] flex items-center justify-center gap-1 font-bold">
                    <Sunrise className="w-3.5 h-3.5 text-[#059669]" />
                    <span className="hidden sm:inline">Morning</span>
                    <span className="sm:hidden">Morn</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedTimePeriod("AFTERNOON");
                  }}
                  className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    selectedTimePeriod === "AFTERNOON"
                      ? "bg-white text-amber-700 shadow-2xs font-extrabold scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="12:00 PM - 05:00 PM"
                >
                  <span className="text-[11px] flex items-center justify-center gap-1 font-bold">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span className="hidden sm:inline">Afternoon</span>
                    <span className="sm:hidden">Noon</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedTimePeriod("NIGHT");
                  }}
                  className={`py-1.5 px-1 rounded-xl text-center transition-all cursor-pointer ${
                    selectedTimePeriod === "NIGHT"
                      ? "bg-white text-indigo-700 shadow-2xs font-extrabold scale-[1.02]"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="05:00 PM - 11:59 PM (Floodlit Prime)"
                >
                  <span className="text-[11px] flex items-center justify-center gap-1 font-bold">
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Night</span>
                  </span>
                </button>
              </div>

              {/* Duration Preference Pill */}
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs">
                <div className="flex items-center space-x-1.5 text-[#059669] font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Match Duration: {preferredDuration}m</span>
                </div>
                <div className="flex items-center space-x-1">
                  {[60, 90, 120].map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
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
                <div className="flex items-center space-x-2 p-3 rounded-2xl bg-[#F0FDF4] border border-emerald-200 text-xs font-bold text-emerald-900 animate-pulse">
                  <Flame className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  <span>High Demand Date: Prime floodlit slots filling fast!</span>
                </div>
              )}
            </div>

            {/* Slot Matrix Grid */}
            {loadingSlots ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : filteredSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {filteredSlots.map((slot) => {
                  const isSelected = selectedSlotIds.includes(slot.id);
                  const isAvail = slot.is_available;
                  const isOngoing = slot.is_ongoing || slot.slot_state === "ONGOING";
                  const isPast = slot.is_past || slot.slot_state === "PAST" || slot.slot_state === "COMPLETED";
                  const isHeld = slot.status === "LOCKED";
                  const isNight = slot.start_time >= "18:00:00";

                  return (
                    <button
                      key={slot.id}
                      id={`slot-${slot.id}`}
                      disabled={!isAvail}
                      onClick={() => toggleSlotSelection(slot)}
                      title={
                        isAvail
                          ? `Select ${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)} (₹${Number(slot.price)})`
                          : isOngoing
                            ? `Match currently in session (${slot.start_time.slice(0, 5)} - ${slot.end_time.slice(0, 5)})`
                            : isPast
                              ? `Slot time ended (${slot.start_time.slice(0, 5)})`
                              : slot.status
                      }
                      className={`p-3 rounded-2xl border text-left transition-all duration-150 active:scale-95 select-none ${
                        isSelected
                          ? "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/20 scale-[1.02] cursor-pointer ring-2 ring-emerald-500/30"
                          : isAvail
                            ? "bg-white border-slate-200 hover:border-[#059669] hover:bg-[#ECFDF5] text-slate-900 cursor-pointer"
                            : isOngoing
                              ? "bg-amber-50/90 border-amber-300 text-amber-950 cursor-not-allowed shadow-2xs"
                              : isHeld
                                ? "bg-amber-50/70 border-amber-200 text-amber-900 cursor-not-allowed opacity-90"
                                : "bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed line-through"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black flex items-center">
                          {isOngoing && (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1 inline-block" />
                          )}
                          <span>
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </span>
                        </span>
                        {isNight && isAvail && (
                          <Sun className={`w-3 h-3 ${isSelected ? "text-amber-200" : "text-amber-500"}`} />
                        )}
                        {isHeld && (
                          <Lock className="w-3 h-3 text-amber-600" />
                        )}
                      </div>

                      <div className="mt-1 flex items-center justify-between">
                        <span className={`text-xs font-black ${isSelected ? "text-white" : isHeld ? "text-amber-950" : isPast ? "text-slate-400 line-through" : "text-slate-900"}`}>
                          ₹{Number(slot.price).toLocaleString("en-IN")}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-tight ${
                          isSelected
                            ? "text-emerald-100"
                            : isAvail
                              ? "text-[#059669]"
                              : isOngoing
                                ? "text-amber-700"
                                : isHeld
                                  ? "text-amber-700"
                                  : "text-slate-400"
                        }`}>
                          {isSelected
                            ? "Selected"
                            : isAvail
                              ? "Open"
                              : isOngoing
                                ? "Live"
                                : isHeld
                                  ? "Held (5m)"
                                  : isPast
                                    ? "Ended"
                                    : slot.status.toLowerCase()}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-6">
                No slots available for the selected time period.
              </p>
            )}

            {/* Error Message */}
            {lockError && (
              <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}

            {/* Desktop Selected Slots Summary & 5-Min Lock CTA */}
            <div className="p-4 rounded-3xl bg-[#F8FAFC] border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">
                  {selectedSlotIds.length} Slot(s) Selected
                </span>
                <span className="text-lg font-black text-slate-900 font-mono">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <Lock className="w-3.5 h-3.5 text-[#059669]" />
                <span>Holds your slots for 5 minutes during checkout</span>
              </div>

              <button
                disabled={selectedSlotIds.length === 0 || lockLoading}
                onClick={handleProceedToLock}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center space-x-2 shadow-emerald-glow transition-all active:scale-[0.98] cursor-pointer"
              >
                {lockLoading ? (
                  <span>Reserving Slot Lock...</span>
                ) : !user ? (
                  <>
                    <span>Sign In to Book ({selectedSlotIds.length} Slot{selectedSlotIds.length > 1 ? "s" : ""})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Proceed to Reserve & Book</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Booking Bottom Dock (Visible only on mobile when slot is picked) */}
      {selectedSlotIds.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-40 md:hidden px-4 pb-2 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-950/95 text-white backdrop-blur-2xl rounded-2xl p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.3)] border border-slate-800 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black font-mono text-emerald-400">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  • {selectedSlotIds.length} Slot{selectedSlotIds.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {selectedSlotsData[0]?.start_time.slice(0, 5)} - {selectedSlotsData[selectedSlotsData.length - 1]?.end_time.slice(0, 5)}
              </p>
            </div>

            <button
              disabled={lockLoading}
              onClick={handleProceedToLock}
              className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-black text-xs shrink-0 flex items-center space-x-1.5 shadow-md shadow-emerald-600/40 active:scale-95 transition-all cursor-pointer"
            >
              {lockLoading ? (
                <span>Locking...</span>
              ) : (
                <>
                  <span>Reserve & Pay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
