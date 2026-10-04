import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Clock,
  MapPin,
  Navigation,
  AlertCircle,
  Lock,
  Sun,
  Moon,
  Sunrise,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Flame,
  Zap,
  Share2,
  Eye,
  EyeOff,
  Calendar,
  Compass,
  Download,
  Check,
} from "lucide-react";
import api from "../../services/api";
import { Turf, TimeSlot } from "../../types";
import { normalizeList } from "../../utils/helpers";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";
import { useSlotRealtime } from "../../hooks/useRealtime";
import { useAuth } from "../../context/AuthContext";
import { saveBookingIntent } from "../../utils/bookingIntent";
import { triggerHaptic } from "../../utils/haptics";
import { VerifiedReviewsSection } from "../../components/common/VerifiedReviewsSection";
import { MatchDayFAQ } from "../../components/common/MatchDayFAQ";
import { AmenityGrid } from "../../components/common/AmenityGrid";
import { resolveImageUrl, handleImageError } from "../../utils/imageUrl";
import { LocationModal } from "../../components/common/LocationModal";

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { company, booking: bookingRules } = useBusinessSettings();

  // Query parameter extraction
  const queryTurfId = searchParams.get("turf") || searchParams.get("id");
  const queryDate = searchParams.get("date");
  const querySession = searchParams.get("session")?.toUpperCase();
  const querySlot = searchParams.get("slot") || searchParams.get("slotId");

  // State
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loadingTurfs, setLoadingTurfs] = useState(true);
  const [selectedTurfId, setSelectedTurfId] = useState<string | number>("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  const tomorrowStr = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().split("T")[0];
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => queryDate || todayStr);

  const [selectedSession, setSelectedSession] = useState<"ALL" | "MORNING" | "AFTERNOON" | "NIGHT">(() => {
    if (querySession === "MORNING") return "MORNING";
    if (querySession === "AFTERNOON") return "AFTERNOON";
    if (querySession === "NIGHT" || querySession === "EVENING") return "NIGHT";
    return "ALL";
  });

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(true);
  const [availableSlotsCount, setAvailableSlotsCount] = useState<number>(0);
  const [isFastFill, setIsFastFill] = useState<boolean>(false);
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockError, setLockError] = useState("");
  const [showPitchSpecs, setShowPitchSpecs] = useState(false);
  const [pitchOpenCounts, setPitchOpenCounts] = useState<Record<string, number>>({});
  const [showPastSlots, setShowPastSlots] = useState(false);

  // Preferred duration
  const [preferredDuration, setPreferredDuration] = useState<number>(() => {
    const saved = localStorage.getItem("ft_preferred_duration_minutes");
    return saved ? Number(saved) : 60;
  });

  // Location Modal & PWA Trigger
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const triggerPwaInstall = () => {
    window.dispatchEvent(new CustomEvent("ft-trigger-pwa-install"));
  };

  // Active turf object
  const activeTurf = useMemo(() => {
    if (!selectedTurfId || turfs.length === 0) return turfs[0] || null;
    return turfs.find((t) => String(t.id) === String(selectedTurfId)) || turfs[0] || null;
  }, [turfs, selectedTurfId]);

  // Load Turfs
  useEffect(() => {
    api
      .get("/turfs/")
      .then((res) => {
        const list = normalizeList<Turf>(res.data);
        setTurfs(list);
        if (list.length > 0) {
          if (queryTurfId && list.some((t) => String(t.id) === String(queryTurfId))) {
            setSelectedTurfId(queryTurfId);
          } else {
            setSelectedTurfId(list[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load turfs:", err);
        setTurfs([]);
      })
      .finally(() => setLoadingTurfs(false));
  }, [queryTurfId]);

  // Sync date if query param changes
  useEffect(() => {
    if (queryDate && queryDate !== selectedDate) {
      setSelectedDate(queryDate);
    }
  }, [queryDate]);

  // Dynamic date carousel options based on advanceBookingDays
  const advanceDays = bookingRules?.advanceBookingDays || 14;
  const dateOptions = useMemo(() => {
    return Array.from({ length: advanceDays }, (_, i) => {
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
  }, [advanceDays]);

  // Fetch slots for active turf
  const fetchSlots = (turfId: string | number, date: string) => {
    if (!turfId) return;
    setLoadingSlots(true);
    setLockError("");

    api
      .get(`/turfs/${turfId}/availability/?date=${date}`)
      .then((res) => {
        const loadedSlots: TimeSlot[] = res.data.slots || [];
        setSlots(loadedSlots);
        setAvailableSlotsCount(res.data.available_slots_count || 0);
        setIsFastFill(res.data.is_fast_fill || false);

        // Auto select slot from query if requested
        if (querySlot) {
          const match = loadedSlots.find(
            (s) => String(s.id) === String(querySlot) && (s.is_available || s.status === "AVAILABLE")
          );
          if (match) {
            setSelectedSlotIds([match.id]);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load slot availability:", err);
        setSlots([]);
        setLockError("Could not fetch slots for this date. Please try again.");
      })
      .finally(() => setLoadingSlots(false));
  };

  // Re-fetch slots when activeTurf or selectedDate changes
  useEffect(() => {
    if (activeTurf?.id) {
      setSelectedSlotIds([]);
      fetchSlots(activeTurf.id, selectedDate);
    }
  }, [activeTurf?.id, selectedDate]);

  // Real-time live sync for the active turf & date
  useSlotRealtime(activeTurf?.id ? String(activeTurf.id) : undefined, selectedDate, () => {
    if (activeTurf?.id) {
      fetchSlots(activeTurf.id, selectedDate);
    }
  });

  // Query schedule across all turfs for active date to populate pitch availability badges
  useEffect(() => {
    api
      .get(`/turfs/schedule/?date=${selectedDate}`)
      .then((res) => {
        const list = res.data.turfs || [];
        const countMap: Record<string, number> = {};
        list.forEach((item: any) => {
          countMap[String(item.id)] = item.available_slots_count ?? 0;
        });
        setPitchOpenCounts(countMap);
      })
      .catch(() => {});
  }, [selectedDate]);

  // Filter slots by session (Morning / Afternoon / Night)
  const filteredSlots = useMemo(() => {
    if (selectedSession === "MORNING") {
      return slots.filter((s) => s.start_time >= "06:00:00" && s.start_time < "12:00:00");
    }
    if (selectedSession === "AFTERNOON") {
      return slots.filter((s) => s.start_time >= "12:00:00" && s.start_time < "17:00:00");
    }
    if (selectedSession === "NIGHT") {
      return slots.filter((s) => s.start_time >= "17:00:00");
    }
    return slots;
  }, [slots, selectedSession]);

  // Separate past slots vs active/future slots to eliminate mobile clutter
  const isToday = selectedDate === todayStr;
  const { visibleSlots, pastSlotsCount } = useMemo(() => {
    const isSlotPast = (s: TimeSlot) =>
      Boolean(s.is_past || s.slot_state === "PAST" || s.slot_state === "COMPLETED");

    const pastCount = filteredSlots.filter(isSlotPast).length;

    // For today, if user has not toggled showPastSlots, show only upcoming/active slots
    if (isToday && !showPastSlots) {
      return {
        visibleSlots: filteredSlots.filter((s) => !isSlotPast(s)),
        pastSlotsCount: pastCount,
      };
    }
    return { visibleSlots: filteredSlots, pastSlotsCount: pastCount };
  }, [filteredSlots, isToday, showPastSlots]);

  // Slot availability counts
  const sessionCounts = useMemo(() => {
    return {
      all: slots.filter((s) => s.is_available).length,
      morning: slots.filter((s) => s.is_available && s.start_time >= "06:00:00" && s.start_time < "12:00:00").length,
      afternoon: slots.filter((s) => s.is_available && s.start_time >= "12:00:00" && s.start_time < "17:00:00").length,
      night: slots.filter((s) => s.is_available && s.start_time >= "17:00:00").length,
    };
  }, [slots]);

  // Selected slots data and calculated total
  const selectedSlotsData = useMemo(() => {
    return slots
      .filter((s) => selectedSlotIds.includes(s.id))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [slots, selectedSlotIds]);

  const totalAmount = useMemo(() => {
    return selectedSlotsData.reduce((sum, s) => sum + Number(s.price), 0);
  }, [selectedSlotsData]);

  // Format 24-hr time into clean 12-hr AM/PM
  const formatSlotTime = (timeStr: string) => {
    if (!timeStr) return "";
    const parts = timeStr.split(":");
    const hour = parseInt(parts[0], 10);
    const min = parts[1] || "00";
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${min} ${ampm}`;
  };

  // WhatsApp squad share link
  const squadShareUrl = useMemo(() => {
    if (!activeTurf || selectedSlotIds.length === 0 || selectedSlotsData.length === 0) return "";
    const firstSlot = selectedSlotsData[0];
    const lastSlot = selectedSlotsData[selectedSlotsData.length - 1];
    const timeText = `${formatSlotTime(firstSlot.start_time)} - ${formatSlotTime(lastSlot.end_time)}`;
    const link = `${window.location.origin}/?turf=${activeTurf.id}&date=${selectedDate}&slot=${selectedSlotIds[0]}`;
    const text = `*Match Alert* | Friends Turf Tiruppur: ${activeTurf.name} is open on ${selectedDate} from ${timeText} (₹${totalAmount.toLocaleString("en-IN")}). Confirm quick so I can lock our slot:\n${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [activeTurf, selectedSlotIds, selectedSlotsData, selectedDate, totalAmount]);

  // Quick Preset Handlers
  const handleQuickPick = (preset: "TONIGHT" | "TOMORROW" | "WEEKEND") => {
    triggerHaptic("light");
    if (preset === "TONIGHT") {
      setSelectedDate(todayStr);
      setSelectedSession("NIGHT");
    } else if (preset === "TOMORROW") {
      setSelectedDate(tomorrowStr);
      setSelectedSession("NIGHT");
    } else if (preset === "WEEKEND") {
      const now = new Date();
      const daysUntilSat = (6 - now.getDay() + 7) % 7 || 7;
      const sat = new Date();
      sat.setDate(sat.getDate() + daysUntilSat);
      setSelectedDate(sat.toISOString().split("T")[0]);
      setSelectedSession("ALL");
    }
  };

  // Toggle slot selection (enforcing continuous hours)
  const toggleSlotSelection = (slot: TimeSlot) => {
    if (!slot.is_available || slot.status !== "AVAILABLE") return;
    triggerHaptic("light");
    setLockError("");

    if (selectedSlotIds.includes(slot.id)) {
      const remaining = selectedSlotIds.filter((sId) => sId !== slot.id);
      setSelectedSlotIds(remaining);
      return;
    }

    if (selectedSlotIds.length === 0) {
      setSelectedSlotIds([slot.id]);
      return;
    }

    const currentSelected = slots
      .filter((s) => selectedSlotIds.includes(s.id))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const earliest = currentSelected[0];
    const latest = currentSelected[currentSelected.length - 1];

    if (slot.end_time === earliest.start_time || slot.start_time === latest.end_time) {
      setSelectedSlotIds([...selectedSlotIds, slot.id]);
    } else {
      setSelectedSlotIds([slot.id]);
      setLockError(
        `Selected ${formatSlotTime(slot.start_time)}. Multi-slot reservations require consecutive match hours.`
      );
    }
  };

  // Handle proceed to lock & checkout
  const handleProceedToLock = async () => {
    if (!activeTurf) return;
    if (selectedSlotIds.length === 0) {
      setLockError("Please select at least 1 open time slot.");
      return;
    }

    triggerHaptic("success");

    // If unauthenticated, save booking intent in background for persistence
    if (!user) {
      saveBookingIntent({
        turfId: String(activeTurf.id),
        turfName: activeTurf.name,
        date: selectedDate,
        slotIds: selectedSlotIds,
        turf: activeTurf,
        selectedSlots: selectedSlotsData,
        totalAmount,
        returnUrl: `/?turf=${activeTurf.id}&date=${selectedDate}`,
      });
    }

    setLockLoading(true);
    setLockError("");

    try {
      const res = await api.post("/bookings/lock/", {
        turf_id: activeTurf.id,
        date: selectedDate,
        slot_ids: selectedSlotIds,
      });

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

      // Navigate to checkout directly with the locked reservation
      navigate("/checkout", {
        state: {
          turf: activeTurf,
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
      if (activeTurf?.id) {
        fetchSlots(activeTurf.id, selectedDate);
      }
    } finally {
      setLockLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Subtle Depth Glows */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-center">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1200px] h-[500px] bg-gradient-to-b from-emerald-500/[0.04] via-slate-200/[0.03] to-transparent blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-emerald-500/[0.02] blur-3xl rounded-full" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-6 space-y-4 sm:space-y-6 pb-28 md:pb-16">
        {/* Hero Photo Banner - Prominent Venue Showcase */}
        <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 text-white min-h-[220px] sm:min-h-[280px] flex flex-col justify-end p-4 sm:p-7 group">
          {/* Background Turf Venue Photo */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
            style={{
              backgroundImage: `url('${resolveImageUrl(
                company.banner_image_url || activeTurf?.images?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1600&q=80",
                activeTurf?.sport_type
              )}')`,
            }}
          />
          {/* Gradient Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-transparent" />

          {/* Banner Content */}
          <div className="relative z-10 space-y-2">
            <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
              {company.banner_title || company.name || "Friends Turf Sports Complex"}
            </h2>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="group inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 hover:bg-slate-900/80 active:scale-[0.98] border border-white/15 hover:border-emerald-400/40 text-xs text-slate-200 hover:text-white backdrop-blur-md shadow-sm transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-400/50"
                title="View venue directions & map"
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200 shrink-0">
                  <MapPin className="w-3 h-3" />
                </span>
                <span className="font-medium text-slate-200 group-hover:text-white">
                  {company.address?.split("(")[0]?.trim() || "Near Sirupooluvapatti, Kamatchepuram, Tiruppur"}
                </span>
                {(company.banner_landmark || company.address?.includes("RTO")) && (
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 tracking-wide uppercase">
                    {company.banner_landmark || "RTO Backside"}
                  </span>
                )}
                <Navigation className="w-3 h-3 text-slate-400 group-hover:text-emerald-300 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5" />
              </button>
            </div>
          </div>
        </section>

        {/* 1. Header Banner (Compact & Streamlined) */}
        <section className="text-center max-w-3xl mx-auto space-y-1.5 sm:space-y-2.5">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white border border-emerald-200 text-[#059669] text-[11px] sm:text-xs font-bold shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
            <span className="tracking-wide uppercase">
              LIVE SCHEDULE • {company.name}, TIRUPPUR
            </span>
          </div>

          <h1 className="text-xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
            SELECT A SLOT.{" "}
            <span className="text-[#059669] drop-shadow-2xs">LOCK & PLAY.</span>
          </h1>

          <p className="text-[11px] sm:text-xs text-slate-600 font-medium max-w-xl mx-auto">
            Direct pitch reservations in Tiruppur. Guaranteed {bookingRules.slotHoldMinutes}-minute slot lock with 0% broker fees.
          </p>
        </section>

        {/* 2. Unified Slot Checking Console */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-pitch-card overflow-hidden">
          {/* Pitch Selector Segmented Tabs with Live Availability Indicators */}
          <div className="border-b border-slate-200/80 bg-slate-50/60 p-2.5 sm:p-3.5">
            <div className="flex items-center justify-between gap-2 mb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 rounded-full bg-[#059669]" />
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-800">
                  {turfs.length > 1 ? "Select Arena Pitch" : "Arena Pitch"}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                {turfs.length} {turfs.length === 1 ? "Pitch Available" : "Pitches Available"}
              </span>
            </div>

            {loadingTurfs ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="h-16 rounded-xl bg-slate-200 animate-pulse" />
              </div>
            ) : (
              <div className={`grid gap-2.5 ${turfs.length > 1 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" : "grid-cols-1"}`}>
                {turfs.map((turf) => {
                  const isSelected = activeTurf?.id === turf.id;
                  const openCount = pitchOpenCounts[String(turf.id)];

                  return (
                    <button
                      key={turf.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setSelectedTurfId(turf.id);
                        setSearchParams({ turf: String(turf.id), date: selectedDate }, { preventScrollReset: true });
                      }}
                      className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 border ${
                        isSelected
                          ? "bg-white border-[#059669] ring-2 ring-emerald-500/20 shadow-sm"
                          : "bg-white border-slate-200/90 text-slate-700 hover:border-emerald-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Turf Preview Image with Sport Badge overlay */}
                        <div
                          className={`relative w-13 h-13 sm:w-15 sm:h-15 rounded-lg sm:rounded-xl overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 border ${
                            isSelected
                              ? "border-emerald-500/40 ring-1 ring-emerald-500/30"
                              : "border-slate-200/90 bg-slate-100"
                          }`}
                        >
                          <img
                            src={resolveImageUrl(turf.images && turf.images.length > 0 ? turf.images[0] : null, turf.sport_type)}
                            alt={turf.name}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                            onError={(e) => handleImageError(e, turf.sport_type)}
                          />
                          <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent pt-2 pb-0.5 text-center text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-wider">
                            {turf.sport_type}
                          </span>
                        </div>

                        {/* Pitch Details */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                            {turf.name}
                          </h3>
                          <p className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5 truncate">
                            <span>{turf.dimensions || "Tournament Pitch"}</span>
                            <span className="text-slate-300">•</span>
                            <span>{turf.surface_spec?.split(" ")[0] || "50mm"} Turf</span>
                          </p>
                        </div>
                      </div>

                      {/* Pricing & Availability Column */}
                      <div className="text-right shrink-0 pl-1">
                        <div className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                          ₹{Number(turf.base_price).toLocaleString("en-IN")}
                          <span className="text-[10px] font-medium text-slate-500 ml-0.5">/hr</span>
                        </div>

                        {openCount !== undefined ? (
                          <div className="mt-0.5 flex items-center justify-end">
                            {openCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-[#059669] border border-emerald-200/70">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                {openCount} Open
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400">
                                Sold Out
                              </span>
                            )}
                          </div>
                        ) : null}
                      </div>

                      {/* Selected Indicator Checkmark */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-xs ring-2 ring-white">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Main Slot Console Body */}
          <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
            {/* Quick Match Shortcuts Bar */}
            <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1 text-xs scrollbar-none">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500 shrink-0 flex items-center space-x-1">
                <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#059669]" />
                <span>Quick:</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuickPick("TONIGHT")}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0 border flex items-center space-x-1 ${
                  selectedDate === todayStr && selectedSession === "NIGHT"
                    ? "bg-[#059669] text-white border-[#059669] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Tonight (6-12 PM)</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPick("TOMORROW")}
                className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0 border flex items-center space-x-1 ${
                  selectedDate === tomorrowStr && selectedSession === "NIGHT"
                    ? "bg-[#059669] text-white border-[#059669] shadow-2xs"
                    : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                }`}
              >
                <Moon className="w-3 h-3 text-indigo-500 fill-indigo-500/20" />
                <span>Tomorrow Night</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickPick("WEEKEND")}
                className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition cursor-pointer shrink-0 border bg-white text-slate-700 border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center space-x-1"
              >
                <Calendar className="w-3 h-3 text-emerald-600" />
                <span>Weekend</span>
              </button>
            </div>

            {/* Step 2: Date Selector Carousel */}
            <div className="space-y-1.5 sm:space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  2. Select Match Date
                </span>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
                  {advanceDays} Days window
                </span>
              </div>

              {/* Horizontal Scrollable Date Carousel */}
              <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin scrollbar-thumb-slate-200">
                {dateOptions.map((opt) => {
                  const isSelected = selectedDate === opt.dateStr;
                  return (
                    <button
                      key={opt.dateStr}
                      type="button"
                      onClick={() => {
                        triggerHaptic("light");
                        setSelectedDate(opt.dateStr);
                        if (activeTurf?.id) {
                          setSearchParams({ turf: String(activeTurf.id), date: opt.dateStr }, { preventScrollReset: true });
                        }
                      }}
                      className={`px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl sm:rounded-2xl text-center shrink-0 border transition-all cursor-pointer active:scale-95 min-w-[62px] sm:min-w-[76px] ${
                        isSelected
                          ? "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/25 scale-105"
                          : "bg-[#F8FAFC] border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                      }`}
                    >
                      <p
                        className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider ${
                          isSelected ? "text-emerald-100" : "text-slate-500"
                        }`}
                      >
                        {opt.dayName}
                      </p>
                      <p className="text-xs sm:text-sm font-black mt-0.5 whitespace-nowrap">
                        {opt.formattedDate}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Session Filter & Match Duration */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1 border-t border-slate-100">
              {/* Session Filter Tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100/80 rounded-xl sm:rounded-2xl border border-slate-200/80 text-xs font-bold max-w-md">
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedSession("ALL");
                  }}
                  className={`py-1 px-1.5 sm:py-1.5 sm:px-2 rounded-lg sm:rounded-xl text-center transition-all cursor-pointer ${
                    selectedSession === "ALL"
                      ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span className="text-[11px] sm:text-xs">All ({sessionCounts.all})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedSession("MORNING");
                  }}
                  className={`py-1 px-1 sm:py-1.5 sm:px-1.5 rounded-lg sm:rounded-xl text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedSession === "MORNING"
                      ? "bg-white text-[#059669] shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="06:00 AM - 12:00 PM"
                >
                  <Sunrise className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#059669]" />
                  <span className="text-[11px] sm:text-xs">Morn ({sessionCounts.morning})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedSession("AFTERNOON");
                  }}
                  className={`py-1 px-1 sm:py-1.5 sm:px-1.5 rounded-lg sm:rounded-xl text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedSession === "AFTERNOON"
                      ? "bg-white text-amber-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="12:00 PM - 05:00 PM"
                >
                  <Sun className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                  <span className="text-[11px] sm:text-xs">Noon ({sessionCounts.afternoon})</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic("light");
                    setSelectedSession("NIGHT");
                  }}
                  className={`py-1 px-1 sm:py-1.5 sm:px-1.5 rounded-lg sm:rounded-xl text-center transition-all cursor-pointer flex items-center justify-center space-x-1 ${
                    selectedSession === "NIGHT"
                      ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                  title="05:00 PM - 12:00 AM (Floodlit Prime)"
                >
                  <Moon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-600" />
                  <span className="text-[11px] sm:text-xs">Night ({sessionCounts.night})</span>
                </button>
              </div>

              {/* Match Duration Selector */}
              <div className="flex items-center justify-between sm:justify-end space-x-2 text-xs">
                <span className="text-slate-500 font-semibold flex items-center space-x-1 text-[11px] sm:text-xs">
                  <Clock className="w-3 h-3 text-[#059669]" />
                  <span>Duration:</span>
                </span>
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
                      className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition cursor-pointer ${
                        preferredDuration === mins
                          ? "bg-[#059669] text-white shadow-2xs"
                          : "bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fast-Fill Demand Banner */}
            {isFastFill && (
              <div className="flex items-center space-x-1.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-bold text-amber-900 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Prime Match Slots Filling Fast for this date! Lock your time slot now.</span>
              </div>
            )}

            {/* Step 4: High-Density Interactive Time Slots Grid */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                {/* Step 3 Title & Live Available Counter */}
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-700 whitespace-nowrap">
                      3. Select Time Slot
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 whitespace-nowrap shrink-0">
                      {availableSlotsCount} Open
                    </span>
                  </div>

                  {/* Mobile Ended Slots Toggle */}
                  {isToday && pastSlotsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPastSlots(!showPastSlots)}
                      className="sm:hidden inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition cursor-pointer text-[10px] font-bold shrink-0"
                    >
                      {showPastSlots ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPastSlots ? "Hide" : `${pastSlotsCount} Ended`}</span>
                    </button>
                  )}
                </div>

                {/* Status Legend Bar & Desktop Ended Slots Toggle */}
                <div className="flex items-center justify-between sm:justify-end gap-2 text-[10px] sm:text-[11px] font-semibold text-slate-500 overflow-x-auto scrollbar-none py-0.5">
                  <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                    <span className="flex items-center space-x-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-[#059669]" />
                      <span>Available</span>
                    </span>
                    <span className="flex items-center space-x-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>Booked</span>
                    </span>
                    <span className="flex items-center space-x-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-slate-700" />
                      <span>Blocked</span>
                    </span>
                    <span className="flex items-center space-x-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Held (5m)</span>
                    </span>
                  </div>

                  {/* Desktop Ended Slots Toggle */}
                  {isToday && pastSlotsCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPastSlots(!showPastSlots)}
                      className="hidden sm:inline-flex items-center space-x-1 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 px-2 py-0.5 rounded-md transition cursor-pointer font-bold shrink-0 ml-2"
                    >
                      {showPastSlots ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPastSlots ? "Hide Ended" : `${pastSlotsCount} Ended`}</span>
                    </button>
                  )}
                </div>
              </div>

              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
                  ))}
                </div>
              ) : visibleSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
                  {visibleSlots.map((slot) => {
                    const isSelected = selectedSlotIds.includes(slot.id);
                    const isCustomerBooked = slot.status === "BOOKED" || slot.schedule_state === "BOOKED";
                    const isAdminBlocked =
                      slot.status === "MAINTENANCE" ||
                      slot.status === "BLOCKED" ||
                      slot.schedule_state === "BLOCKED" ||
                      slot.slot_state === "MAINTENANCE";
                    const isHeld = slot.status === "LOCKED" || slot.schedule_state === "LOCKED";
                    const isAvail = slot.is_available && !isCustomerBooked && !isAdminBlocked && !isHeld;
                    const isOngoing = slot.is_ongoing || slot.slot_state === "ONGOING";
                    const isPast = slot.is_past || slot.slot_state === "PAST" || slot.slot_state === "COMPLETED";
                    const isNight = slot.start_time >= "18:00:00";

                    return (
                      <button
                        key={slot.id}
                        id={`slot-${slot.id}`}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => toggleSlotSelection(slot)}
                        title={
                          isAvail
                            ? `Click to select ${formatSlotTime(slot.start_time)} - ${formatSlotTime(slot.end_time)} (₹${Number(slot.price)})`
                            : isCustomerBooked
                              ? `Booked by customer (${formatSlotTime(slot.start_time)} - ${formatSlotTime(slot.end_time)})`
                              : isAdminBlocked
                                ? `Slot reserved / blocked by business management`
                                : isOngoing
                                  ? `Match in session (${formatSlotTime(slot.start_time)} - ${formatSlotTime(slot.end_time)})`
                                  : isHeld
                                    ? `Temporarily held in checkout (${formatSlotTime(slot.start_time)})`
                                    : isPast
                                      ? `Slot time ended (${formatSlotTime(slot.start_time)})`
                                      : slot.status
                        }
                        className={`p-1.5 sm:p-2.5 rounded-xl border text-left transition-all duration-150 active:scale-95 select-none flex flex-col justify-between ${
                          isSelected
                            ? "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/25 scale-[1.02] ring-2 ring-emerald-500/30 cursor-pointer"
                            : isAvail
                              ? "bg-white border-slate-200 hover:border-[#059669] hover:bg-[#ECFDF5] text-slate-900 cursor-pointer shadow-2xs"
                              : isCustomerBooked
                                ? "bg-rose-50 border-rose-300 text-rose-900 cursor-not-allowed shadow-2xs"
                                : isAdminBlocked
                                  ? "bg-slate-700 border-slate-800 text-white cursor-not-allowed shadow-2xs"
                                  : isHeld
                                    ? "bg-amber-50/90 border-amber-300 text-amber-950 cursor-not-allowed opacity-95"
                                    : isOngoing
                                      ? "bg-amber-50/90 border-amber-300 text-amber-950 cursor-not-allowed shadow-2xs"
                                      : "bg-slate-100/70 border-slate-200 text-slate-400 opacity-60 cursor-not-allowed line-through"
                        }`}
                      >
                        {/* Top Line: Start Time & Sun/Lock/Indicator Icons */}
                        <div className="flex items-center justify-between gap-1 w-full">
                          <span className="text-[10.5px] sm:text-xs font-black flex items-center truncate">
                            {isOngoing && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse mr-1 inline-block shrink-0" />
                            )}
                            {isCustomerBooked && (
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1 inline-block shrink-0" />
                            )}
                            {isAdminBlocked && (
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mr-1 inline-block shrink-0" />
                            )}
                            <span className="truncate">{formatSlotTime(slot.start_time)}</span>
                          </span>
                          {isNight && isAvail && (
                            <Sun className={`w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 ${isSelected ? "text-amber-200" : "text-amber-500"}`} />
                          )}
                          {isHeld && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-amber-600" />}
                          {isAdminBlocked && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0 text-slate-300" />}
                        </div>

                        {/* Bottom Line: Price & 4-State Status Indicator */}
                        <div className="mt-1 flex items-center justify-between gap-1 w-full">
                          <span
                            className={`text-[9.5px] sm:text-xs font-black shrink-0 ${
                              isSelected
                                ? "text-white"
                                : isAdminBlocked
                                  ? "text-slate-200"
                                  : isCustomerBooked
                                    ? "text-rose-800"
                                    : isHeld
                                      ? "text-amber-950"
                                      : isPast
                                        ? "text-slate-400 line-through"
                                        : "text-slate-900"
                            }`}
                          >
                            ₹{Number(slot.price).toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`text-[8px] sm:text-[9.5px] font-extrabold uppercase tracking-tight truncate ${
                              isSelected
                                ? "text-emerald-100"
                                : isAvail
                                  ? "text-[#059669]"
                                  : isCustomerBooked
                                    ? "text-rose-600 font-extrabold"
                                    : isAdminBlocked
                                      ? "text-slate-300 font-bold"
                                      : isOngoing
                                        ? "text-amber-700"
                                        : isHeld
                                          ? "text-amber-700"
                                          : "text-slate-400"
                            }`}
                          >
                            {isSelected
                              ? "Selected"
                              : isAvail
                                ? "Available"
                                : isCustomerBooked
                                  ? "Booked"
                                  : isAdminBlocked
                                    ? "Blocked"
                                    : isHeld
                                      ? "Held"
                                      : isOngoing
                                        ? "Live"
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
                <div className="text-center py-8 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-200 space-y-2.5 p-3">
                  <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800">
                    No slots open for the {selectedSession.toLowerCase()} period on this date.
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                    Prime match hours on {selectedDate} may already be booked. Try viewing all sessions or jump to tomorrow.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    {selectedSession !== "ALL" && (
                      <button
                        type="button"
                        onClick={() => setSelectedSession("ALL")}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 hover:bg-slate-100 transition shadow-2xs cursor-pointer"
                      >
                        View All Hours on {selectedDate}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const d = new Date(selectedDate);
                        d.setDate(d.getDate() + 1);
                        setSelectedDate(d.toISOString().split("T")[0]);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#059669] text-white text-xs font-bold hover:bg-[#047857] transition shadow-2xs cursor-pointer flex items-center space-x-1"
                    >
                      <span>Check Tomorrow ({">"})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            {lockError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{lockError}</span>
              </div>
            )}

            {/* Step 5: Desktop Lock & Proceed Console */}
            <div className="p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
              <div className="space-y-0.5 sm:space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
                    Selected Match Reservation
                  </span>
                  {selectedSlotIds.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#059669] text-[10px] sm:text-xs font-black">
                      {selectedSlotIds.length} Slot(s) ({selectedSlotIds.length * 60} Mins)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                  {selectedSlotsData.length > 0 && (
                    <span className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
                      {activeTurf?.name} • {formatSlotTime(selectedSlotsData[0]?.start_time)} to{" "}
                      {formatSlotTime(selectedSlotsData[selectedSlotsData.length - 1]?.end_time)}
                    </span>
                  )}
                </div>

                <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center space-x-1">
                  <Lock className="w-3 h-3 text-[#059669]" />
                  <span>
                    Guaranteed {bookingRules.slotHoldMinutes}-minute lock on pitch reservation during checkout.
                  </span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {/* 1-Tap Squad WhatsApp Share Button */}
                {selectedSlotIds.length > 0 && (
                  <a
                    href={squadShareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full md:w-auto px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#128C7E] font-bold text-xs flex items-center justify-center space-x-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                    title="Share slot details with your squad on WhatsApp"
                  >
                    <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                    </svg>
                    <span>Share on WhatsApp</span>
                  </a>
                )}

                <button
                  type="button"
                  disabled={selectedSlotIds.length === 0 || lockLoading}
                  onClick={handleProceedToLock}
                  className="w-full md:w-auto px-5 py-3 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-emerald-glow transition-all active:scale-95 cursor-pointer"
                >
                  {lockLoading ? (
                    <span className="flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reserving Slot Lock...</span>
                    </span>
                  ) : !user ? (
                    <>
                      <span>Sign In & Book ({selectedSlotIds.length > 0 ? `₹${totalAmount}` : "Select Slot"})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  ) : (
                    <>
                      <span>Lock Slot & Proceed to Booking</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Compact Pitch Specs & Amenities Accordion */}
        <section className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-3.5 sm:p-6 space-y-3">
          <button
            type="button"
            onClick={() => setShowPitchSpecs(!showPitchSpecs)}
            className="w-full flex items-center justify-between text-left cursor-pointer group"
          >
            <div className="flex items-center space-x-2.5 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold">
                <Info className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h3 className="text-xs sm:text-base font-bold text-slate-900 group-hover:text-[#059669] transition">
                  Pitch Specifications & Match Amenities
                </h3>
                <p className="text-[10px] sm:text-xs text-slate-500">
                  Surface details, floodlights, dugouts & facilities at {company.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 text-xs font-bold text-[#059669]">
              <span>{showPitchSpecs ? "Hide" : "Specs"}</span>
              {showPitchSpecs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
          </button>

          {showPitchSpecs && (
            <div className="pt-3 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
              {/* Pitch Spec Pills */}
              {activeTurf && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Dimensions</span>
                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{activeTurf.dimensions || "Tournament Standard"}</p>
                  </div>
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Surface Spec</span>
                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{activeTurf.surface_spec || "50mm Monofilament"}</p>
                  </div>
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Lighting</span>
                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{activeTurf.lighting_spec || "400 Lux Anti-Glare"}</p>
                  </div>
                  <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200/70">
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">Format & Capacity</span>
                    <p className="text-xs sm:text-sm font-black text-slate-900 mt-0.5">{activeTurf.capacity ? `${activeTurf.capacity} Players` : "7v7 Standard"}</p>
                  </div>
                </div>
              )}

              {/* Match Amenities Grid */}
              <AmenityGrid />

              {/* Venue Location in Tiruppur */}
              <div className="p-3 rounded-xl sm:rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center space-x-2.5">
                  <MapPin className="w-4 h-4 text-[#059669] shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Venue Location</h4>
                    <p className="text-[11px] text-slate-600">{company.address || "Dharapuram Road, Tiruppur, Tamil Nadu"}</p>
                  </div>
                </div>
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(company.address || "Friends Turf Tiruppur")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-white border border-emerald-300 text-[#059669] text-xs font-bold flex items-center justify-center space-x-1 hover:bg-emerald-50 transition shadow-2xs self-start sm:self-auto"
                >
                  <Navigation className="w-3 h-3" />
                  <span>Get Directions</span>
                </a>
              </div>
            </div>
          )}
        </section>

        {/* 4. Verified Player Reviews Strip */}
        <section className="space-y-3">
          <VerifiedReviewsSection />
        </section>

        {/* 5. Match Day FAQs */}
        <section className="space-y-3">
          <MatchDayFAQ />
        </section>
      </div>

      {/* 6. Sticky Mobile Booking Bottom Dock (Visible only on mobile when slot is picked) */}
      {selectedSlotIds.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 z-40 md:hidden px-3 pb-2 animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-950/95 text-white backdrop-blur-2xl rounded-xl p-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] border border-slate-800 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-1.5">
                <span className="text-base font-black font-mono text-emerald-400">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  • {selectedSlotIds.length} Slot{selectedSlotIds.length > 1 ? "s" : ""}
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {selectedSlotsData[0] ? formatSlotTime(selectedSlotsData[0].start_time) : ""} -{" "}
                {selectedSlotsData[selectedSlotsData.length - 1]
                  ? formatSlotTime(selectedSlotsData[selectedSlotsData.length - 1].end_time)
                  : ""}
              </p>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Mobile WhatsApp Share Icon */}
              <a
                href={squadShareUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-lg bg-[#25D366]/20 border border-[#25D366]/40 text-[#25D366] flex items-center justify-center active:scale-95 transition"
                title="Share on WhatsApp"
              >
                <svg className="w-4 h-4 text-[#25D366] fill-current" viewBox="0 0 24 24">
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                </svg>
              </a>

              <button
                type="button"
                disabled={lockLoading}
                onClick={handleProceedToLock}
                className="px-3.5 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/40 active:scale-95 transition-all cursor-pointer"
              >
                {lockLoading ? (
                  <span>Locking...</span>
                ) : (
                  <>
                    <span>Reserve & Pay</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Location Directions & Helpdesk Modal */}
      <LocationModal
        isOpen={isLocationModalOpen}
        onClose={() => setIsLocationModalOpen(false)}
      />
    </div>
  );
};
