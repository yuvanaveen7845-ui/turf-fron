import React, { useState, useEffect, useMemo, useRef } from "react";
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
  ExternalLink,
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

const InstagramIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.13-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const getInstagramUrl = (handle?: string): string => {
  if (!handle) return "https://www.instagram.com/friendsturf_tiruppur";
  const trimmed = handle.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const username = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return `https://www.instagram.com/${username}`;
};

const getFacebookUrl = (handle?: string): string => {
  if (!handle) return "https://www.facebook.com/friendsturf_tiruppur";
  const trimmed = handle.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  const page = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  return `https://www.facebook.com/${page}`;
};

const getHandleDisplay = (handle?: string, fallback: string = ""): string => {
  if (!handle) return fallback;
  const trimmed = handle.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const urlObj = new URL(trimmed);
      const pathname = urlObj.pathname.replace(/^\/|\/$/g, "");
      return pathname ? `@${pathname}` : urlObj.hostname;
    } catch {
      return trimmed;
    }
  }
  return trimmed.startsWith("@") ? trimmed : `@${trimmed}`;
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { company, booking: bookingRules } = useBusinessSettings();

  // Social Media URLs and Display Handles from Admin Configuration
  const instagramUrl = useMemo(() => getInstagramUrl(company.instagram), [company.instagram]);
  const facebookUrl = useMemo(() => getFacebookUrl(company.facebook), [company.facebook]);
  const instagramDisplay = useMemo(
    () => getHandleDisplay(company.instagram, "@friendsturf_tiruppur"),
    [company.instagram]
  );
  const facebookDisplay = useMemo(
    () => getHandleDisplay(company.facebook, "@friendsturf_tiruppur"),
    [company.facebook]
  );

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

  // In-memory SWR client-side cache for instant 0ms date switching
  const slotsCacheRef = useRef<
    Map<string, { slots: TimeSlot[]; count: number; isFastFill: boolean; timestamp: number }>
  >(new Map());
  const scheduleCacheRef = useRef<Map<string, { countMap: Record<string, number>; timestamp: number }>>(
    new Map()
  );

  // Fetch slots for active turf (with SWR client cache)
  const fetchSlots = (turfId: string | number, date: string, options?: { force?: boolean }) => {
    if (!turfId) return;
    const cacheKey = `${turfId}:${date}`;
    const cached = slotsCacheRef.current.get(cacheKey);
    const now = Date.now();

    // Instant SWR rendering if cached
    if (cached && !options?.force) {
      setSlots(cached.slots);
      setAvailableSlotsCount(cached.count);
      setIsFastFill(cached.isFastFill);

      // Auto select slot from query if requested
      if (querySlot) {
        const match = cached.slots.find(
          (s: TimeSlot) => String(s.id) === String(querySlot) && (s.is_available || s.status === "AVAILABLE")
        );
        if (match) {
          setSelectedSlotIds([match.id]);
        }
      }

      // If cached data is fresh (< 25s), avoid background re-fetch and skip loading spinner
      if (now - cached.timestamp < 25000) {
        setLoadingSlots(false);
        return;
      }
    } else {
      setLoadingSlots(true);
    }

    setLockError("");

    const url = options?.force
      ? `/turfs/${turfId}/availability/?date=${date}&_t=${Date.now()}`
      : `/turfs/${turfId}/availability/?date=${date}`;

    api
      .get(url)
      .then((res) => {
        const loadedSlots: TimeSlot[] = res.data.slots || [];
        const count = res.data.available_slots_count || 0;
        const fastFill = res.data.is_fast_fill || false;

        slotsCacheRef.current.set(cacheKey, {
          slots: loadedSlots,
          count,
          isFastFill: fastFill,
          timestamp: Date.now(),
        });

        setSlots(loadedSlots);
        setAvailableSlotsCount(count);
        setIsFastFill(fastFill);

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
        if (!cached) {
          setSlots([]);
          setLockError("Could not fetch slots for this date. Please try again.");
        }
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
  useSlotRealtime(activeTurf?.id ? String(activeTurf.id) : undefined, selectedDate, (event) => {
    if (activeTurf?.id) {
      if (event?.type === "PRICE_CHANGED") {
        slotsCacheRef.current.clear();
        scheduleCacheRef.current.clear();
      } else {
        const cacheKey = `${activeTurf.id}:${selectedDate}`;
        slotsCacheRef.current.delete(cacheKey);
      }
      fetchSlots(activeTurf.id, selectedDate, { force: true });
    }
  });

  // Query schedule across all turfs for active date to populate pitch availability badges
  useEffect(() => {
    const cachedSchedule = scheduleCacheRef.current.get(selectedDate);
    const now = Date.now();
    if (cachedSchedule && now - cachedSchedule.timestamp < 30000) {
      setPitchOpenCounts(cachedSchedule.countMap);
      return;
    }

    api
      .get(`/turfs/schedule/?date=${selectedDate}`)
      .then((res) => {
        const list = res.data.turfs || [];
        const countMap: Record<string, number> = {};
        list.forEach((item: any) => {
          countMap[String(item.id)] = item.available_slots_count ?? 0;
        });
        scheduleCacheRef.current.set(selectedDate, {
          countMap,
          timestamp: Date.now(),
        });
        setPitchOpenCounts(countMap);
      })
      .catch(() => {});
  }, [selectedDate]);

  // Filter slots by session (Morning / Afternoon / Night)
  const filteredSlots = useMemo(() => {
    if (selectedSession === "MORNING") {
      return slots.filter((s) => s.start_time < "12:00:00");
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

  // Slot availability counts (matching exact session boundaries)
  const sessionCounts = useMemo(() => {
    return {
      all: slots.filter((s) => s.is_available).length,
      morning: slots.filter((s) => s.is_available && s.start_time < "12:00:00").length,
      afternoon: slots.filter((s) => s.is_available && s.start_time >= "12:00:00" && s.start_time < "17:00:00").length,
      night: slots.filter((s) => s.is_available && s.start_time >= "17:00:00").length,
    };
  }, [slots]);

  // Compute slot granularity (30m vs 60m)
  const slotStepMinutes = useMemo(() => {
    if (activeTurf?.slot_duration_minutes) return Number(activeTurf.slot_duration_minutes);
    if (slots.length > 0) {
      let minDiff = 60;
      for (const s of slots) {
        if (!s.start_time || !s.end_time) continue;
        const [sh, sm] = s.start_time.split(":").map(Number);
        const [eh, em] = s.end_time.split(":").map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        if (diff > 0 && diff < minDiff) minDiff = diff;
      }
      return minDiff;
    }
    return 60;
  }, [slots, activeTurf]);

  // Dynamic duration options matching arena granularity
  const durationOptions = useMemo(() => {
    if (slotStepMinutes === 30) {
      return [
        { mins: 60, label: "1h", sublabel: "60m", isHalf: false },
        { mins: 90, label: "1.5h", sublabel: "90m", isHalf: true },
        { mins: 120, label: "2h", sublabel: "120m", isHalf: false },
        { mins: 150, label: "2.5h", sublabel: "150m", isHalf: true },
        { mins: 180, label: "3h", sublabel: "180m", isHalf: false },
      ];
    }
    return [
      { mins: 60, label: "1h", sublabel: "60m", isHalf: false },
      { mins: 120, label: "2h", sublabel: "120m", isHalf: false },
      { mins: 180, label: "3h", sublabel: "180m", isHalf: false },
      { mins: 240, label: "4h", sublabel: "240m", isHalf: false },
    ];
  }, [slotStepMinutes]);

  // Fast type-safe lookup set for selected slot IDs
  const selectedSlotIdsSet = useMemo(
    () => new Set(selectedSlotIds.map(String)),
    [selectedSlotIds]
  );

  // Selected slots data and calculated total
  const selectedSlotsData = useMemo(() => {
    return slots
      .filter((s) => selectedSlotIdsSet.has(String(s.id)))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [slots, selectedSlotIdsSet]);

  const totalAmount = useMemo(() => {
    return selectedSlotsData.reduce((sum, s) => sum + Number(s.price), 0);
  }, [selectedSlotsData]);

  // Reusable: calculate minutes from a start_time/end_time pair
  const calcSlotMinutes = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 60;
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff < 0) diff += 24 * 60;
    return diff > 0 ? diff : 60;
  };

  // Dynamic booking duration in minutes calculated from exact slot start/end times
  const durationMinutes = useMemo(() => {
    if (selectedSlotsData.length === 0) return 0;
    return selectedSlotsData.reduce((acc, s) => acc + calcSlotMinutes(s.start_time, s.end_time), 0);
  }, [selectedSlotsData]);

  // Determine active duration in minutes (actual selected duration takes precedence over preferred)
  const activeDurationMins = durationMinutes > 0 ? durationMinutes : preferredDuration;

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
    const text = `*Match Alert* | Friends Turf Tiruppur: ${activeTurf.name} is open on ${selectedDate} from ${timeText} (${durationMinutes} Mins, ₹${totalAmount.toLocaleString("en-IN")}). Confirm quick so I can lock our slot:\n${link}`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  }, [activeTurf, selectedSlotIds, selectedSlotsData, selectedDate, totalAmount, durationMinutes]);

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

  // Helper: check if a slot is genuinely selectable (open, not booked, not blocked, not held, not past)
  const isSlotSelectable = (s: TimeSlot): boolean => {
    const isCustomerBooked = s.status === "BOOKED" || s.schedule_state === "BOOKED";
    const isAdminBlocked =
      s.status === "MAINTENANCE" ||
      s.status === "BLOCKED" ||
      s.schedule_state === "BLOCKED" ||
      s.slot_state === "MAINTENANCE";
    const isHeld = s.status === "LOCKED" || s.schedule_state === "LOCKED";
    const isPast = Boolean(s.is_past || s.slot_state === "PAST" || s.slot_state === "COMPLETED");
    return Boolean(s.is_available && !isCustomerBooked && !isAdminBlocked && !isHeld && !isPast);
  };

  // Helper: collect consecutive available slots starting from kickoff up to targetMins, with backward fallback if forward is bounded
  const collectConsecutiveSlots = (kickoffSlot: TimeSlot, targetMins: number): { ids: string[]; totalMins: number } => {
    const ids = [kickoffSlot.id];
    let totalMins = calcSlotMinutes(kickoffSlot.start_time, kickoffSlot.end_time);
    let nextEndTime = kickoffSlot.end_time;

    // First collect forward
    while (totalMins < targetMins) {
      const nextSlot = slots.find(
        (s) => isSlotSelectable(s) && s.start_time === nextEndTime
      );
      if (!nextSlot) break;
      ids.push(nextSlot.id);
      totalMins += calcSlotMinutes(nextSlot.start_time, nextSlot.end_time);
      nextEndTime = nextSlot.end_time;
    }

    // If forward didn't reach minimum booking requirement (e.g. 60m min), check if backward adjacent slots are available
    const minMins = bookingRules?.minDurationMinutes || 60;
    if (totalMins < minMins) {
      let prevStartTime = kickoffSlot.start_time;
      while (totalMins < minMins) {
        const prevSlot = slots.find(
          (s) => isSlotSelectable(s) && s.end_time === prevStartTime
        );
        if (!prevSlot) break;
        ids.unshift(prevSlot.id);
        totalMins += calcSlotMinutes(prevSlot.start_time, prevSlot.end_time);
        prevStartTime = prevSlot.start_time;
      }
    }

    return { ids, totalMins };
  };

  // Helper: compute total duration of remaining slots after a deselection
  const computeRemainingDuration = (remainingSlots: TimeSlot[]): number => {
    return remainingSlots.reduce((acc, s) => acc + calcSlotMinutes(s.start_time, s.end_time), 0);
  };

  // Toggle slot selection (enforcing continuous slots & 60m min rule with intuitive range selection)
  const toggleSlotSelection = (slot: TimeSlot) => {
    if (!isSlotSelectable(slot)) return;
    triggerHaptic("light");
    setLockError("");

    const minBookingMins = bookingRules?.minDurationMinutes || 60;

    // === CASE A: DESELECTION (User clicked an already-selected slot) ===
    if (selectedSlotIds.includes(slot.id)) {
      const currentSelected = slots
        .filter((s) => selectedSlotIds.includes(s.id))
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      // If only 1 slot (or minimum) selected, clear selection cleanly
      if (currentSelected.length <= 1) {
        setSelectedSlotIds([]);
        return;
      }

      const isFirst = currentSelected[0].id === slot.id;
      const isLast = currentSelected[currentSelected.length - 1].id === slot.id;

      if (isFirst) {
        // Remove kickoff slot: shift match start forward
        const remaining = currentSelected.slice(1);
        const remDuration = computeRemainingDuration(remaining);
        if (remDuration < minBookingMins) {
          setSelectedSlotIds([]);
          setLockError("Match selection cleared. Minimum match duration is 60 minutes.");
          return;
        }
        setSelectedSlotIds(remaining.map((s) => s.id));
        return;
      }

      if (isLast) {
        // Remove finish slot: shift match end backward
        const remaining = currentSelected.slice(0, -1);
        const remDuration = computeRemainingDuration(remaining);
        if (remDuration < minBookingMins) {
          setSelectedSlotIds([]);
          setLockError("Match selection cleared. Minimum match duration is 60 minutes.");
          return;
        }
        setSelectedSlotIds(remaining.map((s) => s.id));
        return;
      }

      // Clicked intermediate slot: user intends to finish their match at this slot
      const clickedIdx = currentSelected.findIndex((s) => s.id === slot.id);
      const remaining = currentSelected.slice(0, clickedIdx + 1);
      const remDuration = computeRemainingDuration(remaining);
      if (remDuration < minBookingMins) {
        setSelectedSlotIds([]);
        setLockError("Match selection cleared. Minimum match duration is 60 minutes.");
        return;
      }
      setSelectedSlotIds(remaining.map((s) => s.id));
      return;
    }

    // === CASE B: FRESH SELECTION (No slots currently selected) ===
    if (selectedSlotIds.length === 0) {
      const targetDuration = Math.max(preferredDuration || 60, minBookingMins);
      const { ids, totalMins } = collectConsecutiveSlots(slot, targetDuration);

      if (totalMins < minBookingMins) {
        setSelectedSlotIds([]);
        setLockError("Minimum match duration is 60 minutes. Adjacent time slots are unavailable for this slot.");
        triggerHaptic("error");
        return;
      }

      setSelectedSlotIds(ids);
      return;
    }

    // === CASE C: EXTENDING / RANGE SELECTION ===
    const currentSelected = slots
      .filter((s) => selectedSlotIds.includes(s.id))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));

    const earliest = currentSelected[0];
    const latest = currentSelected[currentSelected.length - 1];

    // Subcase C1: Adjacent after finish
    if (slot.start_time === latest.end_time) {
      setSelectedSlotIds([...selectedSlotIds, slot.id]);
      return;
    }

    // Subcase C2: Adjacent before kickoff
    if (slot.end_time === earliest.start_time) {
      setSelectedSlotIds([slot.id, ...selectedSlotIds]);
      return;
    }

    // Subcase C3: Range click forward into future (Bridge all available slots in between)
    if (slot.start_time > latest.end_time) {
      const bridgeSlots: TimeSlot[] = [];
      let checkTime = latest.end_time;
      let bridgeValid = true;

      while (checkTime < slot.end_time) {
        const nextBridge = slots.find((s) => s.start_time === checkTime);
        if (!nextBridge || !isSlotSelectable(nextBridge)) {
          bridgeValid = false;
          break;
        }
        bridgeSlots.push(nextBridge);
        checkTime = nextBridge.end_time;
      }

      if (bridgeValid && bridgeSlots.length > 0) {
        const newIds = [...selectedSlotIds, ...bridgeSlots.map((s) => s.id)];
        setSelectedSlotIds(newIds);
        return;
      }
    }

    // Subcase C4: Range click backward into earlier time (Prepend all available slots in between)
    if (slot.end_time < earliest.start_time) {
      const bridgeSlots: TimeSlot[] = [];
      let checkTime = slot.start_time;
      let bridgeValid = true;

      while (checkTime < earliest.start_time) {
        const nextBridge = slots.find((s) => s.start_time === checkTime);
        if (!nextBridge || !isSlotSelectable(nextBridge)) {
          bridgeValid = false;
          break;
        }
        bridgeSlots.push(nextBridge);
        checkTime = nextBridge.end_time;
      }

      if (bridgeValid && bridgeSlots.length > 0) {
        const newIds = [...bridgeSlots.map((s) => s.id), ...selectedSlotIds];
        setSelectedSlotIds(newIds);
        return;
      }
    }

    // Subcase C5: Disjoint click across booked intervals: start fresh contiguous selection from this slot
    const targetDuration = Math.max(preferredDuration || 60, minBookingMins);
    const { ids, totalMins } = collectConsecutiveSlots(slot, targetDuration);
    if (totalMins < minBookingMins) {
      setSelectedSlotIds([]);
      setLockError("Minimum match duration is 60 minutes. Adjacent time slots are unavailable for this slot.");
      triggerHaptic("error");
      return;
    }
    setSelectedSlotIds(ids);
  };

  // Adjust duration on active selection when clicking duration chips
  const handleDurationChange = (newDurationMins: number) => {
    triggerHaptic("light");
    setPreferredDuration(newDurationMins);
    localStorage.setItem("ft_preferred_duration_minutes", String(newDurationMins));

    if (selectedSlotsData.length > 0) {
      const kickoffSlot = selectedSlotsData[0];
      const { ids, totalMins } = collectConsecutiveSlots(kickoffSlot, newDurationMins);

      setSelectedSlotIds(ids);
      if (totalMins < newDurationMins) {
        setLockError(`Only ${totalMins} mins contiguous available starting from ${formatSlotTime(kickoffSlot.start_time)}.`);
      } else {
        setLockError("");
      }
    }
  };

  // Handle proceed to lock & checkout
  const handleProceedToLock = async () => {
    if (!activeTurf) return;
    if (selectedSlotIds.length === 0) {
      setLockError("Please select at least 1 open time slot.");
      return;
    }

    const minAllowedMins = bookingRules?.minDurationMinutes || 60;
    if (durationMinutes < minAllowedMins) {
      setLockError(
        `Minimum match duration is ${minAllowedMins} minutes (1 hour). Please select at least two consecutive 30-minute slots.`
      );
      triggerHaptic("error");
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
      const sortedSlotIds = selectedSlotsData.map((s) => s.id);
      let currentLockToken = sessionStorage.getItem("slot_guest_lock_token") || "";
      if (!currentLockToken) {
        currentLockToken = "guest_" + Math.random().toString(36).substring(2, 12) + "_" + Date.now();
        sessionStorage.setItem("slot_guest_lock_token", currentLockToken);
      }
      const res = await api.post("/bookings/lock/", {
        turf_id: activeTurf.id,
        date: selectedDate,
        slot_ids: sortedSlotIds,
        lock_token: currentLockToken,
      });

      localStorage.setItem("ft_preferred_duration_minutes", String(durationMinutes));

      const lockPayload = res.data.data || res.data;
      const returnedLockToken = res.data.lock_token || lockPayload.lock_token || currentLockToken;
      sessionStorage.setItem("slot_guest_lock_token", returnedLockToken);

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
            lock_token: returnedLockToken,
          },
          lockToken: returnedLockToken,
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
        fetchSlots(activeTurf.id, selectedDate, { force: true });
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
        <section className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 text-white min-h-[260px] sm:min-h-[290px] flex flex-col justify-between p-3.5 sm:p-7 group">
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
          {/* Multi-Layer Gradient Overlays for High Contrast & Visual Depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/65 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/50 via-slate-950/30 to-black/40" />

          {/* 1. Top Bar: Live Status Badge & Quick Social Pills */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/75 border border-emerald-500/40 text-emerald-300 text-[10px] sm:text-xs font-bold backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
              <span className="tracking-wide uppercase">FIFA Certified • Open Today</span>
            </div>
          </div>

          {/* 2. Bottom Content: Venue Header, Rating & Responsive Action Matrix */}
          <div className="relative z-10 space-y-2.5">
            <div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 drop-shadow-sm mb-0.5">
                <span>★ 4.9 Rating</span>
                <span className="text-white/40">•</span>
                <span className="text-slate-300 font-medium">Turf & Box Cricket Arena</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md leading-tight">
                {company.banner_title || company.name || "Friends Turf Sports Complex"}
              </h2>
            </div>

            {/* Action Matrix: Location Pill + Symmetrical Social Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* Venue Location Pill */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="group inline-flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-xl sm:rounded-full bg-slate-900/85 hover:bg-slate-900 active:scale-[0.98] border border-white/20 hover:border-emerald-400/60 text-xs text-slate-100 hover:text-white backdrop-blur-md shadow-md transition-all duration-200 cursor-pointer w-full sm:w-auto"
                title="View venue directions & map"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/25 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-200 shrink-0">
                    <MapPin className="w-3 h-3" />
                  </span>
                  <span className="font-semibold text-slate-200 group-hover:text-white truncate">
                    {company.banner_landmark
                      ? `${company.banner_landmark}, Tiruppur`
                      : (company.address?.split(",")[1]?.trim() || company.address?.split("(")[0]?.trim() || "Kamatchepuram") + ", Tiruppur"}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 uppercase tracking-wider shrink-0">
                  <span>Map</span>
                  <Navigation className="w-2.5 h-2.5" />
                </span>
              </button>

              {/* Social Redirect Twin Buttons */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                {/* Instagram Direct Redirect Button */}
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-gradient-to-r from-purple-900/60 via-pink-900/60 to-amber-900/60 hover:from-purple-600 hover:via-pink-600 hover:to-amber-500 border border-pink-500/50 hover:border-pink-300 text-xs font-bold text-white backdrop-blur-md shadow-md shadow-pink-950/30 transition-all duration-200 active:scale-95 cursor-pointer group/insta"
                  title={`Follow on Instagram (${instagramDisplay})`}
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 text-white shrink-0 shadow-2xs group-hover/insta:scale-110 transition-transform">
                    <InstagramIcon className="w-2.5 h-2.5 fill-current" />
                  </span>
                  <span className="tracking-tight">Instagram</span>
                  <ExternalLink className="w-3 h-3 text-pink-300 group-hover/insta:translate-x-0.5 transition-all shrink-0" />
                </a>

                {/* Facebook Direct Redirect Button */}
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-blue-950/70 hover:bg-[#1877F2] border border-blue-500/50 hover:border-blue-300 text-xs font-bold text-white backdrop-blur-md shadow-md shadow-blue-950/30 transition-all duration-200 active:scale-95 cursor-pointer group/fb"
                  title={`Visit Facebook Page (${facebookDisplay})`}
                >
                  <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#1877F2] text-white shrink-0 shadow-2xs group-hover/fb:scale-110 transition-transform">
                    <FacebookIcon className="w-2.5 h-2.5 fill-current" />
                  </span>
                  <span className="tracking-tight">Facebook</span>
                  <ExternalLink className="w-3 h-3 text-blue-300 group-hover/fb:translate-x-0.5 transition-all shrink-0" />
                </a>
              </div>
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
                      className={`group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl text-left transition-all duration-200 cursor-pointer flex items-center gap-3 border ${
                        isSelected
                          ? "bg-white border-[#059669] ring-2 ring-emerald-500/20 shadow-md"
                          : "bg-white border-slate-200/90 text-slate-700 hover:border-emerald-300 hover:shadow-xs"
                      }`}
                    >
                      {/* Turf Preview Image - Wide Landscape Aspect Ratio for High Legibility */}
                      <div
                        className={`relative w-24 sm:w-28 md:w-32 h-18 sm:h-20 md:h-22 rounded-lg sm:rounded-xl overflow-hidden shrink-0 transition-transform duration-300 group-hover:scale-105 border ${
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
                          className="w-full h-full object-cover object-center"
                          onError={(e) => handleImageError(e, turf.sport_type)}
                        />
                        {/* Sport Indicator Micro-Chip */}
                        <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-slate-950/75 backdrop-blur-xs text-[8px] sm:text-[9px] font-black text-emerald-300 uppercase tracking-wider shadow-xs border border-white/10">
                          {turf.sport_type === "CRICKET" ? "🏏 Cricket" : turf.sport_type === "FOOTBALL" ? "⚽ Football" : turf.sport_type}
                        </span>
                      </div>

                      {/* Pitch Details & Pricing */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate leading-snug">
                              {turf.name}
                            </h3>
                            <div className="text-right shrink-0 pl-1">
                              <span className="text-xs sm:text-sm font-black text-slate-900 tracking-tight">
                                ₹{Number(turf.base_price).toLocaleString("en-IN")}
                              </span>
                              <span className="text-[10px] font-medium text-slate-500">/hr</span>
                            </div>
                          </div>
                          <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5 font-medium">
                            <span>{turf.dimensions || "Tournament Pitch"}</span>
                            {turf.surface_spec && (
                              <>
                                <span className="text-slate-300 mx-1">•</span>
                                <span>{turf.surface_spec.split("(")[0]?.trim()}</span>
                              </>
                            )}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1.5 pt-1 border-t border-slate-100">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {turf.capacity ? `${turf.capacity} Players` : "Standard Arena"}
                          </span>

                          {openCount !== undefined ? (
                            openCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-[#059669] border border-emerald-200/80">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                                <span>{openCount} Open</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-400">
                                Sold Out
                              </span>
                            )
                          ) : null}
                        </div>
                      </div>

                      {/* Selected Indicator Checkmark */}
                      {isSelected && (
                        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-xs ring-2 ring-white">
                          <Check className="w-3 h-3 stroke-[3]" />
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

              {/* Match Duration Selector — Dedicated Row */}
              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#059669]" />
                    <span>Match Duration</span>
                  </span>
                  {activeDurationMins > 0 && (
                    <span className="text-[11px] sm:text-xs font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80">
                      {activeDurationMins >= 60 ? `${activeDurationMins / 60}h` : `${activeDurationMins}m`} selected
                    </span>
                  )}
                </div>

                <div className={`grid gap-2 ${durationOptions.length <= 4 ? 'grid-cols-4' : 'grid-cols-5'}`}>
                  {durationOptions.map((opt) => {
                    const isActive = durationMinutes > 0 ? activeDurationMins === opt.mins : preferredDuration === opt.mins;
                    return (
                      <button
                        key={opt.mins}
                        type="button"
                        onClick={() => handleDurationChange(opt.mins)}
                        className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3 rounded-xl sm:rounded-2xl transition-all duration-200 cursor-pointer active:scale-95 border-2 min-h-[52px] sm:min-h-[60px] ${
                          isActive
                            ? "bg-[#059669] border-[#059669] text-white shadow-lg shadow-emerald-500/25 scale-[1.03] ring-2 ring-emerald-400/30"
                            : opt.isHalf
                              ? "bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400 hover:shadow-sm"
                              : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-400 hover:shadow-sm"
                        }`}
                        title={`${opt.mins} Minutes Match (${opt.label})`}
                      >
                        {/* Primary Label */}
                        <span className={`text-base sm:text-lg font-black leading-none tracking-tight ${
                          isActive ? "text-white" : "text-slate-900"
                        }`}>
                          {opt.label}
                        </span>

                        {/* Sublabel */}
                        <span className={`text-[10px] sm:text-[11px] font-semibold mt-0.5 leading-none ${
                          isActive ? "text-emerald-100" : "text-slate-500"
                        }`}>
                          {opt.sublabel}
                        </span>

                        {/* Half-hour badge */}
                        {opt.isHalf && (
                          <span className={`absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5 rounded-full font-black ${
                            isActive
                              ? "bg-emerald-800 text-emerald-100 ring-2 ring-white"
                              : "bg-emerald-200 text-emerald-900 ring-1 ring-emerald-300"
                          }`}>
                            +½h
                          </span>
                        )}

                        {/* Active checkmark */}
                        {isActive && (
                          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-white text-[#059669] flex items-center justify-center shadow-sm ring-2 ring-[#059669]">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Dynamic Custom duration indicator if durationMinutes is outside standard options */}
                {!durationOptions.some((o) => o.mins === activeDurationMins) && activeDurationMins > 0 && (
                  <div className="flex items-center justify-center">
                    <span className="px-4 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-[#059669] text-white shadow-md inline-flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {activeDurationMins >= 60 ? `${(activeDurationMins / 60).toFixed(1)}h` : `${activeDurationMins}m`} Custom Duration
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Fast-Fill Demand Banner */}
            {isFastFill && (
              <div className="flex items-center space-x-1.5 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] sm:text-xs font-bold text-amber-900 animate-pulse">
                <Flame className="w-3.5 h-3.5 text-[#F59E0B] fill-[#F59E0B]" />
                <span>Prime Match Slots Filling Fast for this date! Lock your time slot now.</span>
              </div>
            )}

            {/* Connected Range Visual Indicator (if slots are selected) */}
            {selectedSlotsData.length > 0 && (
              <div className="p-3 sm:p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#059669] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    ⚽
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                      Match Session Range
                    </span>
                    <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                      <span className="text-[#059669] font-mono font-black">{formatSlotTime(selectedSlotsData[0].start_time)}</span>
                      <span className="text-slate-400">⟶</span>
                      <span className="text-[#059669] font-mono font-black">{formatSlotTime(selectedSlotsData[selectedSlotsData.length - 1].end_time)}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-700 font-bold">{durationMinutes} Mins ({durationMinutes >= 60 ? `${durationMinutes / 60}h` : `${durationMinutes}m`})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {durationMinutes < (bookingRules?.minDurationMinutes || 60) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Select +30m to reach 60m min</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                      <Check className="w-3 h-3 text-[#059669] stroke-[3]" />
                      <span>Valid Match Duration ({durationMinutes}m)</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSlotIds([]);
                      setLockError("");
                    }}
                    className="px-2 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-[10px] font-bold transition cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: High-Density Interactive Time Slots Grid with Connected Ribbon */}
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
                    const isSelected = selectedSlotIdsSet.has(String(slot.id));
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

                    // Slot duration in minutes (uses shared helper)
                    const slotMins = calcSlotMinutes(slot.start_time, slot.end_time);

                    // Determine relative index in contiguous selection ribbon
                    const isFirstInSelection = selectedSlotsData.length > 1 && selectedSlotsData[0]?.id === slot.id;
                    const isLastInSelection =
                      selectedSlotsData.length > 1 && selectedSlotsData[selectedSlotsData.length - 1]?.id === slot.id;
                    const isMiddleInSelection =
                      selectedSlotsData.length > 2 && isSelected && !isFirstInSelection && !isLastInSelection;
                    const isSingleSelection = selectedSlotsData.length === 1 && isSelected;

                    return (
                      <button
                        key={slot.id}
                        id={`slot-${slot.id}`}
                        type="button"
                        disabled={!isAvail}
                        onClick={() => toggleSlotSelection(slot)}
                        title={
                          isAvail
                            ? `Click to select ${formatSlotTime(slot.start_time)} - ${formatSlotTime(slot.end_time)} (${slotMins}m, ₹${Number(slot.price)})`
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
                        className={`relative p-1.5 sm:p-2.5 rounded-xl border text-left transition-all duration-150 active:scale-95 select-none flex flex-col justify-between ${
                          isSelected
                            ? isSingleSelection && slotMins < 60
                              ? "bg-[#059669] border-amber-400 text-white shadow-md shadow-emerald-500/25 ring-2 ring-amber-400/50 cursor-pointer"
                              : "bg-[#059669] border-[#059669] text-white shadow-md shadow-emerald-500/25 scale-[1.02] ring-2 ring-emerald-500/30 cursor-pointer"
                            : isAvail
                              ? isNight
                                ? "bg-white border-slate-200 hover:border-[#059669] hover:bg-[#ECFDF5] text-slate-900 cursor-pointer shadow-2xs"
                                : "bg-white border-slate-200 hover:border-[#059669] hover:bg-[#ECFDF5] text-slate-900 cursor-pointer shadow-2xs"
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
                        {/* Top Line: Start Time & Ribbon Tag */}
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

                          {/* Top Status & Floodlight Badges */}
                          {isSingleSelection && slotMins < 60 && (
                            <span className="px-1 py-0.2 rounded text-[7.5px] font-black bg-amber-400 text-amber-950 uppercase tracking-tighter shrink-0 animate-pulse">
                              +30m req
                            </span>
                          )}
                          {isFirstInSelection && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-black bg-emerald-800 text-emerald-100 uppercase tracking-tighter shrink-0">
                              Kickoff
                            </span>
                          )}
                          {isMiddleInSelection && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-emerald-700/80 text-emerald-200 uppercase tracking-tighter shrink-0">
                              +{slotMins}m
                            </span>
                          )}
                          {isLastInSelection && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-black bg-emerald-900 text-white uppercase tracking-tighter shrink-0">
                              → {formatSlotTime(slot.end_time)}
                            </span>
                          )}
                          {!isSelected && isNight && isAvail && (
                            <span className="flex items-center text-amber-500" title="Prime Floodlight Hours">
                              <Sun className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" />
                            </span>
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
                                ? isSingleSelection && slotMins < 60
                                  ? "text-amber-200 font-black"
                                  : isFirstInSelection
                                    ? "text-emerald-100"
                                    : isLastInSelection
                                      ? "text-emerald-200 font-black"
                                      : "text-emerald-100"
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
                              ? isSingleSelection && slotMins < 60
                                ? "Need 60m"
                                : isFirstInSelection
                                  ? "Start"
                                  : isLastInSelection
                                    ? "Finish"
                                    : "Selected"
                              : isAvail
                                ? isNight
                                  ? "Prime"
                                  : "Available"
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
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-black ${
                        durationMinutes < (bookingRules?.minDurationMinutes || 60)
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-[#059669]"
                      }`}
                    >
                      {selectedSlotIds.length} Slot(s) ({durationMinutes} Mins)
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2.5">
                  <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                  {durationMinutes >= 60 && (
                    <span className="text-[11px] sm:text-xs font-bold text-slate-400 font-mono">
                      (₹{Math.round(totalAmount / (durationMinutes / 60))}/hr)
                    </span>
                  )}
                  {selectedSlotsData.length > 0 && (
                    <span className="text-[11px] sm:text-xs text-slate-600 font-medium truncate">
                      {activeTurf?.name} • {formatSlotTime(selectedSlotsData[0]?.start_time)} to{" "}
                      {formatSlotTime(selectedSlotsData[selectedSlotsData.length - 1]?.end_time)}
                    </span>
                  )}
                </div>

                {durationMinutes > 0 && durationMinutes < (bookingRules?.minDurationMinutes || 60) ? (
                  <p className="text-[10px] sm:text-[11px] text-amber-700 font-bold flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Minimum booking is {bookingRules?.minDurationMinutes || 60} mins (1 hr). Please select at least two consecutive 30-min slots.
                    </span>
                  </p>
                ) : (
                  <p className="text-[10px] sm:text-[11px] text-slate-500 flex items-center space-x-1">
                    <Lock className="w-3 h-3 text-[#059669]" />
                    <span>
                      Guaranteed {bookingRules.slotHoldMinutes}-minute lock on pitch reservation during checkout.
                    </span>
                  </p>
                )}
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
                  disabled={selectedSlotIds.length === 0 || lockLoading || durationMinutes < (bookingRules?.minDurationMinutes || 60)}
                  onClick={handleProceedToLock}
                  className="w-full md:w-auto px-5 py-3 sm:px-7 sm:py-3.5 rounded-xl sm:rounded-2xl bg-[#059669] hover:bg-[#047857] disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-emerald-glow transition-all active:scale-95 cursor-pointer"
                >
                  {lockLoading ? (
                    <span className="flex items-center space-x-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reserving Slot Lock...</span>
                    </span>
                  ) : durationMinutes > 0 && durationMinutes < (bookingRules?.minDurationMinutes || 60) ? (
                    <span>Min 1 Hr Required</span>
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
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(company.address || "Friends Turf Tiruppur")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-[#059669] text-xs font-bold flex items-center justify-center space-x-1 hover:bg-emerald-50 transition shadow-2xs"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Get Directions</span>
                  </a>
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-pink-200 text-pink-700 hover:text-pink-800 hover:bg-pink-50 text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-2xs"
                    title={`Instagram: ${instagramDisplay}`}
                  >
                    <InstagramIcon className="w-3 h-3 fill-current text-pink-600" />
                    <span>Instagram</span>
                  </a>
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1.5 rounded-lg bg-white border border-blue-200 text-blue-700 hover:text-blue-800 hover:bg-blue-50 text-xs font-bold flex items-center justify-center space-x-1.5 transition shadow-2xs"
                    title={`Facebook: ${facebookDisplay}`}
                  >
                    <FacebookIcon className="w-3 h-3 fill-current text-blue-600" />
                    <span>Facebook</span>
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Compact & Flawless Social Community Strip */}
        <section className="relative rounded-2xl sm:rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-3 sm:p-4 shadow-pitch-card overflow-hidden backdrop-blur-xl ring-1 ring-white/10">
          {/* Subtle Ambient Glows */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Compact Header Row */}
          <div className="relative z-10 flex items-center justify-between gap-2 mb-2 sm:mb-2.5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981] animate-pulse" />
              <h3 className="text-xs sm:text-sm font-black text-white tracking-tight">
                Official Channels • {company.name || "Friends Turf"}
              </h3>
            </div>
            <span className="text-[10px] sm:text-[11px] font-semibold text-slate-400">
              Reels & Match Highlights
            </span>
          </div>

          {/* Symmetrical 2-Column Flawless Glass Tiles */}
          <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-3">
            {/* Instagram Compact Tile */}
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:from-white/[0.14] hover:to-white/[0.04] border border-white/10 hover:border-pink-500/50 shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center gap-2 sm:gap-2.5 overflow-hidden cursor-pointer"
              title={`Visit ${instagramDisplay} on Instagram`}
            >
              {/* Ambient Corner Glow on Hover */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-pink-500/20 rounded-full blur-lg pointer-events-none group-hover:scale-125 transition-transform" />

              {/* 3D Icon Badge */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF] p-1.5 sm:p-2 flex items-center justify-center text-white shrink-0 shadow-md shadow-pink-500/20 group-hover:scale-105 transition-transform">
                <InstagramIcon className="w-full h-full fill-current" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-pink-400 truncate">
                    Instagram
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-pink-300 transition-colors shrink-0" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-pink-100 truncate leading-snug">
                  {instagramDisplay}
                </h4>
              </div>
            </a>

            {/* Facebook Compact Tile */}
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:from-white/[0.14] hover:to-white/[0.04] border border-white/10 hover:border-blue-500/50 shadow-sm transition-all duration-200 active:scale-[0.98] flex items-center gap-2 sm:gap-2.5 overflow-hidden cursor-pointer"
              title={`Visit ${facebookDisplay} on Facebook`}
            >
              {/* Ambient Corner Glow on Hover */}
              <div className="absolute -top-6 -right-6 w-16 h-16 bg-blue-500/20 rounded-full blur-lg pointer-events-none group-hover:scale-125 transition-transform" />

              {/* 3D Icon Badge */}
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-[#1877F2] p-1.5 sm:p-2 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <FacebookIcon className="w-full h-full fill-current" />
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-blue-400 truncate">
                    Facebook
                  </span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-blue-300 transition-colors shrink-0" />
                </div>
                <h4 className="text-[11px] sm:text-xs font-bold text-white group-hover:text-blue-100 truncate leading-snug">
                  {facebookDisplay}
                </h4>
              </div>
            </a>
          </div>
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
                {durationMinutes >= 60 && (
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    (₹{Math.round(totalAmount / (durationMinutes / 60))}/hr)
                  </span>
                )}
                <span className={`text-[10px] font-bold ${durationMinutes < (bookingRules?.minDurationMinutes || 60) ? "text-amber-400" : "text-slate-400"}`}>
                  • {selectedSlotIds.length} Slot{selectedSlotIds.length > 1 ? "s" : ""} ({durationMinutes}m)
                </span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {durationMinutes < (bookingRules?.minDurationMinutes || 60) ? (
                  <span className="text-amber-300 font-bold">Min 60m required</span>
                ) : (
                  <>
                    {selectedSlotsData[0] ? formatSlotTime(selectedSlotsData[0].start_time) : ""} -{" "}
                    {selectedSlotsData[selectedSlotsData.length - 1]
                      ? formatSlotTime(selectedSlotsData[selectedSlotsData.length - 1].end_time)
                      : ""}
                  </>
                )}
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
                disabled={lockLoading || durationMinutes < (bookingRules?.minDurationMinutes || 60)}
                onClick={handleProceedToLock}
                className="px-3.5 py-2 rounded-lg bg-[#059669] hover:bg-[#047857] disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/40 active:scale-95 transition-all cursor-pointer"
              >
                {lockLoading ? (
                  <span>Locking...</span>
                ) : durationMinutes > 0 && durationMinutes < (bookingRules?.minDurationMinutes || 60) ? (
                  <span>Min 1 Hr</span>
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
