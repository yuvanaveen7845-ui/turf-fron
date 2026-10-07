import React, { useState, useEffect, useMemo } from "react";
import {
  Sliders,
  PlusCircle,
  Edit3,
  Trash2,
  Copy,
  ShieldCheck,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Calculator,
  CheckCircle2,
  ArrowRight,
  Zap,
  Tag,
  Filter,
  Layers,
  Percent,
  ChevronLeft,
  ChevronRight,
  Info,
  Flame,
  Check,
  Target,
  RotateCcw,
  Sun,
  Sunrise,
  Sunset,
  Moon,
  Grid,
  LayoutGrid,
  CheckCircle,
  BarChart3,
  SlidersHorizontal,
} from "lucide-react";
import api from "../../services/api";
import { PricingRule, Turf, TimeSlot } from "../../types";
import { Button, Input, Select, Modal, ConfirmDialog, EmptyState } from "../../components/ui";
import { useToast } from "../../context/ToastContext";
import { normalizeList } from "../../utils/helpers";
import { useSlotRealtime } from "../../hooks/useRealtime";

interface HourlyBlock {
  id: string;
  start_time: string;
  end_time: string;
  display_time: string;
  formatted_time_range: string;
  period: "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT";
  slots: any[];
  hourly_price: number;
  base_hourly_price: number;
  diff: number;
  status: "AVAILABLE" | "PARTIALLY_BOOKED" | "BOOKED" | "MAINTENANCE";
}

const SESSION_TABS = [
  { key: "ALL", label: "All Hours", icon: Clock },
  { key: "MORNING", label: "Early Morning (5-12)", icon: Sunrise },
  { key: "AFTERNOON", label: "Afternoon (12-17)", icon: Sun },
  { key: "EVENING", label: "Prime Evening (17-22)", icon: Sunset },
  { key: "NIGHT", label: "Late Night (22+)", icon: Moon },
] as const;

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const ManagePricingPage: React.FC = () => {
  const toast = useToast();
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);

  // Policy Modal state (Create & Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Hike vs Discount mode for the modal form
  const [policyMode, setPolicyMode] = useState<"HIKE" | "DISCOUNT">("HIKE");

  // Policy Form Data
  const [formData, setFormData] = useState({
    name: "",
    rule_type: "PEAK_HOUR",
    turf: "",
    adjustment_type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
    adjustment_value: "20",
    applicable_days: [0, 1, 2, 3, 4, 5, 6],
    start_time: "18:00:00",
    end_time: "23:00:00",
    start_date: "",
    end_date: "",
    priority: 10,
    is_active: true,
  });

  // Slot-Specific Pricing Manager State
  const [selectedTurfId, setSelectedTurfId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    () => new Date().toISOString().split("T")[0]
  );
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotData, setSlotData] = useState<{
    base_price: number;
    slots: any[];
  } | null>(null);

  // Quick Slot Price Adjuster Modal
  const [slotAdjustModalOpen, setSlotAdjustModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<any | null>(null);
  const [selectedBlock, setSelectedBlock] = useState<HourlyBlock | null>(null);
  const [slotAdjustMode, setSlotAdjustMode] = useState<"HIKE" | "DISCOUNT" | "FIXED">("HIKE");
  const [slotAdjustUnit, setSlotAdjustUnit] = useState<"PERCENT" | "FLAT">("FLAT");
  const [slotAdjustAmount, setSlotAdjustAmount] = useState("200");
  const [slotScope, setSlotScope] = useState<"DATE_ONLY" | "RECURRING_WEEKDAY" | "ALL_DAYS">("DATE_ONLY");
  const [slotAdjustSubmitting, setSlotAdjustSubmitting] = useState(false);

  // Granularity View (1-Hour Blocks vs 30-Min Micro Intervals)
  const [timelineGranularity, setTimelineGranularity] = useState<"1HOUR" | "30MIN">("1HOUR");

  // Session Time Filter (All, Early Morning, Afternoon, Prime Evening, Late Night)
  const [sessionFilter, setSessionFilter] = useState<"ALL" | "MORNING" | "AFTERNOON" | "EVENING" | "NIGHT">("ALL");

  // Batch Range Surge / Discount Modal
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchStartTime, setBatchStartTime] = useState("18:00");
  const [batchEndTime, setBatchEndTime] = useState("23:00");
  const [batchMode, setBatchMode] = useState<"HIKE" | "DISCOUNT">("HIKE");
  const [batchUnit, setBatchUnit] = useState<"PERCENT" | "FLAT">("FLAT");
  const [batchAmount, setBatchAmount] = useState("200");
  const [batchScope, setBatchScope] = useState<"DATE_ONLY" | "RECURRING_WEEKDAY" | "ALL_DAYS">("DATE_ONLY");
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Conflict Detection
  const [conflicts, setConflicts] = useState<any[]>([]);

  // Price Simulation State
  const [simTurf, setSimTurf] = useState("");
  const [simDate, setSimDate] = useState(new Date().toISOString().split("T")[0]);
  const [simTime, setSimTime] = useState("19:00");
  const [simDuration, setSimDuration] = useState("60");
  const [simResult, setSimResult] = useState<any | null>(null);
  const [simulating, setSimulating] = useState(false);

  // Fetch Rules, Turfs & Conflicts
  const fetchRules = () => {
    setLoading(true);
    Promise.all([
      api.get("/pricing/rules/"),
      api.get("/turfs/"),
      api.get("/pricing/rules/conflicts/").catch(() => ({ data: { conflicts: [] } })),
    ])
      .then(([rRes, tRes, cRes]) => {
        const rawRules = rRes.data;
        const ruleList = Array.isArray(rawRules)
          ? rawRules
          : Array.isArray(rawRules?.results)
          ? rawRules.results
          : [];
        setRules(ruleList);

        const rawTurfs = tRes.data;
        const turfList = Array.isArray(rawTurfs)
          ? rawTurfs
          : Array.isArray(rawTurfs?.results)
          ? rawTurfs.results
          : [];
        setTurfs(turfList);

        if (turfList.length > 0 && !selectedTurfId) {
          setSelectedTurfId(String(turfList[0].id));
          setSimTurf(String(turfList[0].id));
        }

        setConflicts(cRes.data?.conflicts || []);
      })
      .catch((err) => {
        console.error("Failed to load rules or turfs:", err);
        setRules([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Fetch live slot prices for the selected pitch & date
  const fetchSlotAvailability = () => {
    if (!selectedTurfId || !selectedDate) return;
    setSlotsLoading(true);
    api
      .get(`/turfs/${selectedTurfId}/availability/?date=${selectedDate}&_t=${Date.now()}`)
      .then((res) => {
        setSlotData(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch turf slots:", err);
      })
      .finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    fetchSlotAvailability();
  }, [selectedTurfId, selectedDate, rules]);

  // Real-time live sync for pricing updates across staff and admin sessions
  useSlotRealtime(selectedTurfId, selectedDate, () => {
    fetchRules();
    fetchSlotAvailability();
  });

  // Open Create Policy Modal
  const openCreateModal = () => {
    setEditingRule(null);
    setErrorMsg("");
    setPolicyMode("HIKE");
    setFormData({
      name: "",
      rule_type: "PEAK_HOUR",
      turf: selectedTurfId || "",
      adjustment_type: "PERCENTAGE",
      adjustment_value: "20",
      applicable_days: [0, 1, 2, 3, 4, 5, 6],
      start_time: "18:00:00",
      end_time: "23:00:00",
      start_date: "",
      end_date: "",
      priority: 10,
      is_active: true,
    });
    setShowModal(true);
  };

  // Open Edit Policy Modal
  const openEditModal = (rule: PricingRule) => {
    setEditingRule(rule);
    setErrorMsg("");
    const numericVal = parseFloat(String(rule.adjustment_value)) || 0;
    const isDiscount = numericVal < 0;
    setPolicyMode(isDiscount ? "DISCOUNT" : "HIKE");

    setFormData({
      name: rule.name,
      rule_type: rule.rule_type,
      turf: rule.turf ? String(rule.turf) : "",
      adjustment_type: rule.adjustment_type,
      adjustment_value: String(Math.abs(numericVal)),
      applicable_days: rule.applicable_days || [0, 1, 2, 3, 4, 5, 6],
      start_time: rule.start_time || "00:00:00",
      end_time: rule.end_time || "23:59:00",
      start_date: rule.start_date || "",
      end_date: rule.end_date || "",
      priority: rule.priority ?? 10,
      is_active: rule.is_active ?? true,
    });
    setShowModal(true);
  };

  // Duplicate Rule
  const handleDuplicateRule = (rule: PricingRule) => {
    const numericVal = parseFloat(String(rule.adjustment_value)) || 0;
    setEditingRule(null);
    setPolicyMode(numericVal < 0 ? "DISCOUNT" : "HIKE");
    setFormData({
      name: `${rule.name} (Copy)`,
      rule_type: rule.rule_type,
      turf: rule.turf ? String(rule.turf) : "",
      adjustment_type: rule.adjustment_type,
      adjustment_value: String(Math.abs(numericVal)),
      applicable_days: rule.applicable_days || [0, 1, 2, 3, 4, 5, 6],
      start_time: rule.start_time || "00:00:00",
      end_time: rule.end_time || "23:59:00",
      start_date: rule.start_date || "",
      end_date: rule.end_date || "",
      priority: (rule.priority || 10) + 1,
      is_active: true,
    });
    setShowModal(true);
  };

  // 1-Click Toggle Active/Inactive
  const handleToggleRuleActive = async (rule: PricingRule) => {
    try {
      await api.put(`/pricing/rules/${rule.id}/`, {
        ...rule,
        is_active: !rule.is_active,
      });
      fetchRules();
      fetchSlotAvailability();
    } catch (err) {
      console.error("Failed to toggle rule active state:", err);
    }
  };

  // Day of week toggler
  const handleToggleDay = (dayInt: number) => {
    const current = formData.applicable_days;
    if (current.includes(dayInt)) {
      setFormData({
        ...formData,
        applicable_days: current.filter((d) => d !== dayInt),
      });
    } else {
      setFormData({ ...formData, applicable_days: [...current, dayInt] });
    }
  };

  // Save Policy (Create or Update)
  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      const rawVal = parseFloat(formData.adjustment_value) || 0;
      const signedVal = policyMode === "DISCOUNT" ? -Math.abs(rawVal) : Math.abs(rawVal);

      const payload: any = {
        name: formData.name.trim(),
        rule_type: formData.rule_type,
        turf: formData.turf ? parseInt(formData.turf) : null,
        adjustment_type: formData.adjustment_type,
        adjustment_value: signedVal,
        applicable_days: formData.applicable_days,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        priority: parseInt(String(formData.priority)) || 10,
        is_active: formData.is_active,
      };

      if (formData.start_date) payload.start_date = formData.start_date;
      if (formData.end_date) payload.end_date = formData.end_date;

      if (editingRule) {
        await api.put(`/pricing/rules/${editingRule.id}/`, payload);
      } else {
        await api.post("/pricing/rules/", payload);
      }

      setShowModal(false);
      fetchRules();
      fetchSlotAvailability();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          JSON.stringify(err.response?.data) ||
          "Failed to save pricing policy."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Policy
  const confirmDeleteRule = async () => {
    if (!deletingRuleId) return;
    try {
      await api.delete(`/pricing/rules/${deletingRuleId}/`);
      setDeletingRuleId(null);
      fetchRules();
      fetchSlotAvailability();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // 1-Hour Block Aggregation Engine
  const hourlyBlocks = useMemo<HourlyBlock[]>(() => {
    if (!slotData?.slots || slotData.slots.length === 0) return [];

    const sortedSlots = [...slotData.slots].sort((a, b) =>
      a.start_time.localeCompare(b.start_time)
    );

    const blocks: HourlyBlock[] = [];
    let i = 0;

    const format12 = (t: string) => {
      const [hStr, mStr] = t.split(":");
      const h = parseInt(hStr, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 === 0 ? 12 : h % 12;
      return `${h12}:${mStr} ${ampm}`;
    };

    while (i < sortedSlots.length) {
      const slotA = sortedSlots[i];
      const nextSlot = sortedSlots[i + 1];

      // Form 1-Hour block if nextSlot directly follows slotA
      if (nextSlot && slotA.end_time.slice(0, 5) === nextSlot.start_time.slice(0, 5)) {
        const baseA = slotA.base_price !== undefined ? Number(slotA.base_price) : (slotData.base_price ? Number(slotData.base_price) / 2 : 500);
        const baseB = nextSlot.base_price !== undefined ? Number(nextSlot.base_price) : (slotData.base_price ? Number(slotData.base_price) / 2 : 500);
        const priceA = slotA.price !== undefined ? Number(slotA.price) : baseA;
        const priceB = nextSlot.price !== undefined ? Number(nextSlot.price) : baseB;

        const baseHourly = Math.round(baseA + baseB);
        const currentHourly = Math.round(priceA + priceB);
        const diff = currentHourly - baseHourly;

        let status: HourlyBlock["status"] = "AVAILABLE";
        if (slotA.status === "BOOKED" && nextSlot.status === "BOOKED") {
          status = "BOOKED";
        } else if (slotA.status === "MAINTENANCE" && nextSlot.status === "MAINTENANCE") {
          status = "MAINTENANCE";
        } else if (slotA.status === "BOOKED" || nextSlot.status === "BOOKED") {
          status = "PARTIALLY_BOOKED";
        } else if (slotA.status === "MAINTENANCE" || nextSlot.status === "MAINTENANCE") {
          status = "MAINTENANCE";
        }

        const startH = parseInt(slotA.start_time.slice(0, 2), 10);
        let period: HourlyBlock["period"] = "MORNING";
        if (startH >= 5 && startH < 12) period = "MORNING";
        else if (startH >= 12 && startH < 17) period = "AFTERNOON";
        else if (startH >= 17 && startH < 22) period = "EVENING";
        else period = "NIGHT";

        blocks.push({
          id: `${slotA.start_time.slice(0, 5)}-${nextSlot.end_time.slice(0, 5)}`,
          start_time: slotA.start_time,
          end_time: nextSlot.end_time,
          display_time: `${slotA.start_time.slice(0, 5)} - ${nextSlot.end_time.slice(0, 5)}`,
          formatted_time_range: `${format12(slotA.start_time.slice(0, 5))} - ${format12(nextSlot.end_time.slice(0, 5))}`,
          period,
          slots: [slotA, nextSlot],
          hourly_price: currentHourly,
          base_hourly_price: baseHourly,
          diff,
          status,
        });

        i += 2;
      } else {
        // Boundary or unpaired 30-min slot (normalize rate to hourly equivalent)
        const baseA = slotA.base_price !== undefined ? Number(slotA.base_price) : (slotData.base_price ? Number(slotData.base_price) / 2 : 500);
        const priceA = slotA.price !== undefined ? Number(slotA.price) : baseA;
        const baseHourly = Math.round(baseA * 2);
        const currentHourly = Math.round(priceA * 2);
        const diff = currentHourly - baseHourly;

        const startH = parseInt(slotA.start_time.slice(0, 2), 10);
        let period: HourlyBlock["period"] = "MORNING";
        if (startH >= 5 && startH < 12) period = "MORNING";
        else if (startH >= 12 && startH < 17) period = "AFTERNOON";
        else if (startH >= 17 && startH < 22) period = "EVENING";
        else period = "NIGHT";

        blocks.push({
          id: `${slotA.start_time.slice(0, 5)}-${slotA.end_time.slice(0, 5)}`,
          start_time: slotA.start_time,
          end_time: slotA.end_time,
          display_time: `${slotA.start_time.slice(0, 5)} - ${slotA.end_time.slice(0, 5)} (30m)`,
          formatted_time_range: `${format12(slotA.start_time.slice(0, 5))} - ${format12(slotA.end_time.slice(0, 5))}`,
          period,
          slots: [slotA],
          hourly_price: currentHourly,
          base_hourly_price: baseHourly,
          diff,
          status: slotA.status || "AVAILABLE",
        });

        i += 1;
      }
    }

    return blocks;
  }, [slotData]);

  // Session-filtered Views
  const filteredHourlyBlocks = useMemo(() => {
    if (sessionFilter === "ALL") return hourlyBlocks;
    return hourlyBlocks.filter((b) => b.period === sessionFilter);
  }, [hourlyBlocks, sessionFilter]);

  const filteredSlots = useMemo(() => {
    if (!slotData?.slots) return [];
    if (sessionFilter === "ALL") return slotData.slots;
    return slotData.slots.filter((s: any) => {
      const h = parseInt(s.start_time.slice(0, 2), 10);
      if (sessionFilter === "MORNING") return h >= 5 && h < 12;
      if (sessionFilter === "AFTERNOON") return h >= 12 && h < 17;
      if (sessionFilter === "EVENING") return h >= 17 && h < 22;
      return h >= 22 || h < 5;
    });
  }, [slotData, sessionFilter]);

  // Timeline Revenue Intelligence Metrics
  const timelineStats = useMemo(() => {
    const baseHourly = slotData?.base_price ? Math.round(Number(slotData.base_price)) : 1000;
    if (hourlyBlocks.length === 0) {
      return {
        totalHours: 0,
        baseHourly,
        avgHourly: baseHourly,
        surgedCount: 0,
        discountedCount: 0,
        standardCount: 0,
        pctDiff: 0,
      };
    }

    const totalHours = hourlyBlocks.length;
    const totalHourlyVal = hourlyBlocks.reduce((acc, b) => acc + b.hourly_price, 0);
    const avgHourly = Math.round(totalHourlyVal / totalHours);
    const surgedCount = hourlyBlocks.filter((b) => b.diff > 0).length;
    const discountedCount = hourlyBlocks.filter((b) => b.diff < 0).length;
    const standardCount = hourlyBlocks.filter((b) => b.diff === 0).length;
    const pctDiff = baseHourly > 0 ? Math.round(((avgHourly - baseHourly) / baseHourly) * 100) : 0;

    return {
      totalHours,
      baseHourly,
      avgHourly,
      surgedCount,
      discountedCount,
      standardCount,
      pctDiff,
    };
  }, [hourlyBlocks, slotData]);

  // Open Adjuster for 1-Hour Block
  const openHourlyBlockAdjuster = (block: HourlyBlock) => {
    setSelectedBlock(block);
    setSelectedSlot(null);
    const baseP = block.base_hourly_price;
    const currentP = block.hourly_price;

    if (currentP > baseP) {
      setSlotAdjustMode("HIKE");
      setSlotAdjustAmount(String(currentP - baseP));
      setSlotAdjustUnit("FLAT");
    } else if (currentP < baseP) {
      setSlotAdjustMode("DISCOUNT");
      setSlotAdjustAmount(String(baseP - currentP));
      setSlotAdjustUnit("FLAT");
    } else {
      setSlotAdjustMode("HIKE");
      setSlotAdjustAmount("200");
      setSlotAdjustUnit("FLAT");
    }
    setSlotScope("DATE_ONLY");
    setSlotAdjustModalOpen(true);
  };

  // Open Adjuster for 30-Min Micro Slot
  const openSlotAdjuster = (slot: any) => {
    setSelectedBlock(null);
    setSelectedSlot(slot);
    const baseP = slot.base_price !== undefined
      ? Number(slot.base_price)
      : (slotData?.base_price ? Number(slotData.base_price) / 2 : 500);
    const currentP = slot.price !== undefined ? Math.round(Number(slot.price)) : Math.round(baseP);

    if (currentP > Math.round(baseP)) {
      setSlotAdjustMode("HIKE");
      setSlotAdjustAmount(String(Math.round(currentP - baseP)));
      setSlotAdjustUnit("FLAT");
    } else if (currentP < Math.round(baseP)) {
      setSlotAdjustMode("DISCOUNT");
      setSlotAdjustAmount(String(Math.round(baseP - currentP)));
      setSlotAdjustUnit("FLAT");
    } else {
      setSlotAdjustMode("FIXED");
      setSlotAdjustAmount(String(currentP));
      setSlotAdjustUnit("FLAT");
    }
    setSlotScope("DATE_ONLY");
    setSlotAdjustModalOpen(true);
  };

  const handleApplySlotAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!selectedSlot && !selectedBlock) || !selectedTurfId) return;
    setSlotAdjustSubmitting(true);

    try {
      const isBlock = !!selectedBlock;
      const startTime = isBlock ? selectedBlock.start_time.slice(0, 8) : selectedSlot.start_time.slice(0, 8);
      const endTime = isBlock ? selectedBlock.end_time.slice(0, 8) : selectedSlot.end_time.slice(0, 8);
      const dateParts = selectedDate.split("-").map(Number);
      const dayIndex = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getDay(); // 0=Sun, 1=Mon
      const pythonDayIndex = (dayIndex + 6) % 7; // 0=Mon, 6=Sun

      let adjType: "PERCENTAGE" | "FIXED" = slotAdjustUnit === "PERCENT" ? "PERCENTAGE" : "FIXED";
      let signedVal = 0;

      if (slotAdjustUnit === "PERCENT") {
        signedVal = slotAdjustMode === "DISCOUNT" ? -Math.abs(numVal) : Math.abs(numVal);
      } else {
        // FLAT adjustment
        if (isBlock) {
          // Hourly delta split equally across the block's slots (e.g. +200/hr = +100/slot)
          const slotCount = selectedBlock.slots.length || 2;
          const totalDelta = slotAdjustMode === "DISCOUNT"
            ? -Math.abs(numVal)
            : slotAdjustMode === "FIXED"
            ? (numVal - baseRate)
            : Math.abs(numVal);
          signedVal = Math.round(totalDelta / slotCount);
        } else {
          if (slotAdjustMode === "DISCOUNT") {
            signedVal = -Math.abs(numVal);
          } else if (slotAdjustMode === "FIXED") {
            signedVal = numVal - baseRate;
          } else {
            signedVal = Math.abs(numVal);
          }
        }
      }

      const displayLabel = isBlock
        ? `${selectedBlock.start_time.slice(0, 5)}-${selectedBlock.end_time.slice(0, 5)} (1 Hr)`
        : `${selectedSlot.start_time.slice(0, 5)} Slot`;

      const ruleName =
        slotAdjustMode === "HIKE"
          ? `Surge: ${displayLabel} (+${numVal}${slotAdjustUnit === "PERCENT" ? "%" : "/hr"})`
          : slotAdjustMode === "DISCOUNT"
          ? `Discount: ${displayLabel} (-${numVal}${slotAdjustUnit === "PERCENT" ? "%" : "/hr"})`
          : `Custom Rate: ${displayLabel} (₹${numVal}/hr)`;

      const payload: any = {
        name: ruleName,
        rule_type: slotAdjustMode === "HIKE" ? "PEAK_HOUR" : "OFF_PEAK",
        turf: parseInt(selectedTurfId),
        adjustment_type: adjType,
        adjustment_value: signedVal,
        start_time: startTime,
        end_time: endTime,
        priority: 25, // Higher priority to override general rules
        is_active: true,
      };

      if (slotScope === "DATE_ONLY") {
        payload.start_date = selectedDate;
        payload.end_date = selectedDate;
        payload.applicable_days = [pythonDayIndex];
      } else if (slotScope === "RECURRING_WEEKDAY") {
        payload.applicable_days = [pythonDayIndex];
      } else {
        payload.applicable_days = [0, 1, 2, 3, 4, 5, 6];
      }

      // Check for existing slot/block rule to update rather than creating duplicates
      const existingSlotRule = rules.find((r) => {
        const matchesTurf = !r.turf || String(r.turf) === String(selectedTurfId);
        const matchesTime = r.start_time?.slice(0, 5) === startTime.slice(0, 5);
        const matchesDate = slotScope === "DATE_ONLY" ? r.start_date === selectedDate : true;
        return matchesTurf && matchesTime && matchesDate && r.priority >= 20;
      });

      if (existingSlotRule) {
        await api.patch(`/pricing/rules/${existingSlotRule.id}/`, payload);
      } else {
        await api.post("/pricing/rules/", payload);
      }

      setSlotAdjustModalOpen(false);
      toast.success(isBlock ? "1-Hour pricing updated successfully." : "Slot pricing updated successfully.");
      fetchRules();
      fetchSlotAvailability();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to adjust slot price.");
    } finally {
      setSlotAdjustSubmitting(false);
    }
  };

  const handleResetSlotToBase = async () => {
    if ((!selectedSlot && !selectedBlock) || !selectedTurfId) return;
    setSlotAdjustSubmitting(true);

    try {
      const isBlock = !!selectedBlock;
      const startTime = isBlock ? selectedBlock.start_time.slice(0, 5) : selectedSlot.start_time.slice(0, 5);
      const endTime = isBlock ? selectedBlock.end_time.slice(0, 5) : selectedSlot.end_time.slice(0, 5);

      const matchingRules = rules.filter((r) => {
        const matchesTurf = !r.turf || String(r.turf) === String(selectedTurfId);
        const ruleStart = r.start_time?.slice(0, 5);
        const inWindow = ruleStart && ruleStart >= startTime && ruleStart < endTime;
        const matchesExact = ruleStart === startTime;
        const matchesDate = !r.start_date || r.start_date === selectedDate;
        return matchesTurf && (inWindow || matchesExact) && matchesDate && r.priority >= 20;
      });

      if (matchingRules.length > 0) {
        for (const r of matchingRules) {
          await api.delete(`/pricing/rules/${r.id}/`);
        }
      }

      setSlotAdjustModalOpen(false);
      toast.success(isBlock ? "1-Hour rate reverted to base price." : "Slot rate reverted to base price.");
      fetchRules();
      fetchSlotAvailability();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to revert slot price.");
    } finally {
      setSlotAdjustSubmitting(false);
    }
  };

  const handleApplyBatchAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTurfId) return;
    setBatchSubmitting(true);

    try {
      const numVal = parseFloat(batchAmount) || 0;
      const startT = `${batchStartTime}:00`;
      const endT = `${batchEndTime}:00`;
      const dateParts = selectedDate.split("-").map(Number);
      const dayIndex = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]).getDay();
      const pythonDayIndex = (dayIndex + 6) % 7;

      let adjType: "PERCENTAGE" | "FIXED" = batchUnit === "PERCENT" ? "PERCENTAGE" : "FIXED";
      let signedVal = numVal;

      if (batchUnit === "PERCENT") {
        signedVal = batchMode === "DISCOUNT" ? -Math.abs(numVal) : Math.abs(numVal);
      } else {
        // Flat per-hour entered by admin -> each 30-min slot gets half
        const perSlotVal = Math.round(numVal / 2);
        signedVal = batchMode === "DISCOUNT" ? -Math.abs(perSlotVal) : Math.abs(perSlotVal);
      }

      const ruleName = `Range ${batchMode === "HIKE" ? "Surge" : "Discount"}: ${batchStartTime}-${batchEndTime} (${batchMode === "HIKE" ? "+" : "-"}${numVal}${batchUnit === "PERCENT" ? "%" : "/hr"})`;

      const payload: any = {
        name: ruleName,
        rule_type: batchMode === "HIKE" ? "PEAK_HOUR" : "OFF_PEAK",
        turf: parseInt(selectedTurfId),
        adjustment_type: adjType,
        adjustment_value: signedVal,
        start_time: startT,
        end_time: endT,
        priority: 22,
        is_active: true,
      };

      if (batchScope === "DATE_ONLY") {
        payload.start_date = selectedDate;
        payload.end_date = selectedDate;
        payload.applicable_days = [pythonDayIndex];
      } else if (batchScope === "RECURRING_WEEKDAY") {
        payload.applicable_days = [pythonDayIndex];
      } else {
        payload.applicable_days = [0, 1, 2, 3, 4, 5, 6];
      }

      await api.post("/pricing/rules/", payload);

      setBatchModalOpen(false);
      toast.success(`Batch ${batchMode === "HIKE" ? "surge" : "discount"} applied for ${batchStartTime} - ${batchEndTime}.`);
      fetchRules();
      fetchSlotAvailability();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to apply batch adjustment.");
    } finally {
      setBatchSubmitting(false);
    }
  };

  // Simulate pricing calculation
  const handleSimulate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!simTurf || !simDate || !simTime) return;

    setSimulating(true);
    try {
      const res = await api.post("/pricing/rules/simulate/", {
        turf_id: parseInt(simTurf),
        date: simDate,
        start_time: simTime,
        duration_minutes: parseInt(simDuration) || 60,
      });
      setSimResult(res.data);
      toast.success("Pricing simulation completed.");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Pricing simulation failed.");
    } finally {
      setSimulating(false);
    }
  };

  const currentTurfObj = turfs.find((t) => String(t.id) === String(selectedTurfId));

  const changeDateBy = (days: number) => {
    const cur = new Date(selectedDate);
    cur.setDate(cur.getDate() + days);
    setSelectedDate(cur.toISOString().split("T")[0]);
  };

  const handleCloseSlotAdjustModal = () => {
    setSlotAdjustModalOpen(false);
  };

  const isBlockMode = !!selectedBlock;

  const baseRate = isBlockMode
    ? selectedBlock.base_hourly_price
    : selectedSlot?.base_price !== undefined
    ? Math.round(Number(selectedSlot.base_price))
    : (slotData?.base_price ? Math.round(slotData.base_price / 2) : 500);

  const currentRate = isBlockMode
    ? selectedBlock.hourly_price
    : selectedSlot?.price !== undefined
    ? Math.round(Number(selectedSlot.price))
    : baseRate;

  const numVal = parseFloat(slotAdjustAmount) || 0;

  let projectedRate = currentRate;
  let deltaFromBase = 0;

  if (slotAdjustMode === "HIKE") {
    const hikeVal = slotAdjustUnit === "PERCENT" ? Math.round((baseRate * numVal) / 100) : numVal;
    projectedRate = baseRate + hikeVal;
    deltaFromBase = hikeVal;
  } else if (slotAdjustMode === "DISCOUNT") {
    const discountVal = slotAdjustUnit === "PERCENT" ? Math.round((baseRate * numVal) / 100) : numVal;
    projectedRate = Math.max(1, baseRate - discountVal);
    deltaFromBase = -discountVal;
  } else {
    // FIXED / Target Rate
    projectedRate = Math.max(1, Math.round(numVal));
    deltaFromBase = projectedRate - baseRate;
  }

  const percentChange = baseRate > 0 ? Math.round((deltaFromBase / baseRate) * 100) : 0;
  const hasCustomRate = currentRate !== baseRate;

  const hikePresets = isBlockMode
    ? (slotAdjustUnit === "PERCENT" ? [10, 15, 20, 25] : [100, 200, 300, 500])
    : (slotAdjustUnit === "PERCENT" ? [10, 15, 20, 25] : [50, 100, 150, 250]);

  const discountPresets = isBlockMode
    ? (slotAdjustUnit === "PERCENT" ? [10, 15, 20, 25] : [100, 150, 200, 300])
    : (slotAdjustUnit === "PERCENT" ? [10, 15, 20, 25] : [50, 100, 150]);

  const targetPresets = isBlockMode
    ? Array.from(new Set([baseRate, baseRate - 100, baseRate + 200, baseRate + 400, 999, 1199, 1499].filter((p) => p > 0))).sort((a, b) => a - b)
    : Array.from(new Set([baseRate, 499, 699, 799, 899, 999].filter((p) => p > 0))).sort((a, b) => a - b);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DYNAMIC REVENUE & RATE ENGINE</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
            Dynamic Pricing & Slot Rates
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Hike or discount individual slots, configure weekend premiums, late-night surges, and manage all pricing policies.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          + Create Pricing Policy
        </Button>
      </div>

      {/* SECTION 1: Targeted Slot Price Hike & Discount Workspace */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
        {/* Section 1 Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#ECFDF5] text-[#059669] px-2.5 py-1 rounded-full border border-emerald-200">
              <Zap className="w-3 h-3" />
              <span>DIRECT TIMELINE & SLOT RATE ENGINE</span>
            </div>
            <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight mt-1.5">
              Arena Hourly Timeline & Direct Pricing
            </h2>
            <p className="text-xs text-slate-500 max-w-2xl mt-0.5">
              Inspect and adjust real-time pricing per 1-hour match slot or micro 30-minute intervals. Tap any block to surge, discount, or set custom rates.
            </p>
          </div>

          {/* Controls: Pitch & Date Picker */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedTurfId}
              onChange={(e) => setSelectedTurfId(e.target.value)}
              className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-xs focus:ring-2 focus:ring-[#059669] focus:outline-hidden cursor-pointer"
            >
              {turfs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Base ₹{Math.round(Number(t.base_price))}/hr)
                </option>
              ))}
            </select>

            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-xs">
              <button
                type="button"
                onClick={() => changeDateBy(-1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Previous Day"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2 py-1 bg-transparent border-none text-xs font-bold text-[#0F172A] focus:outline-hidden"
              />

              <button
                type="button"
                onClick={() => changeDateBy(1)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
                title="Next Day"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSelectedDate(new Date().toISOString().split("T")[0])}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>

        {/* View Granularity Switcher & Quick Batch Tool */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 w-fit">
            <button
              type="button"
              onClick={() => setTimelineGranularity("1HOUR")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timelineGranularity === "1HOUR"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-[#059669]" />
              <span>1-Hour Blocks (Recommended)</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-[#059669] text-[10px] font-black">
                {hourlyBlocks.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTimelineGranularity("30MIN")}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                timelineGranularity === "30MIN"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>30-Min Micro Intervals</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200 text-slate-700 text-[10px] font-bold">
                {slotData?.slots?.length || 0}
              </span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                setBatchStartTime("18:00");
                setBatchEndTime("23:00");
                setBatchMode("HIKE");
                setBatchUnit("FLAT");
                setBatchAmount("200");
                setBatchScope("DATE_ONLY");
                setBatchModalOpen(true);
              }}
              className="inline-flex items-center space-x-1.5 px-3 py-2 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-200/80 shadow-2xs transition-all cursor-pointer"
            >
              <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
              <span>Quick Range Surge (e.g. 6 PM - 11 PM)</span>
            </button>
          </div>
        </div>

        {/* Revenue Intelligence Metrics Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-slate-50 via-slate-50/50 to-emerald-50/30 border border-slate-200/80 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Standard Base Rate
            </span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-base font-extrabold text-slate-900 font-mono">
                ₹{timelineStats.baseHourly.toLocaleString("en-IN")}
              </span>
              <span className="text-[10px] font-medium text-slate-500">/hr</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Average Hourly Rate
            </span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-base font-extrabold text-[#0F172A] font-mono">
                ₹{timelineStats.avgHourly.toLocaleString("en-IN")}
              </span>
              {timelineStats.pctDiff !== 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                    timelineStats.pctDiff > 0
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-[#059669]"
                  }`}
                >
                  {timelineStats.pctDiff > 0 ? "+" : ""}
                  {timelineStats.pctDiff}%
                </span>
              )}
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-500" /> Surged Hours
            </span>
            <div className="text-base font-extrabold text-amber-900 font-mono mt-0.5">
              {timelineStats.surgedCount} <span className="text-xs font-medium text-slate-500">of {timelineStats.totalHours} hrs</span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#059669] block flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-[#059669]" /> Discounted Hours
            </span>
            <div className="text-base font-extrabold text-[#059669] font-mono mt-0.5">
              {timelineStats.discountedCount} <span className="text-xs font-medium text-slate-500">of {timelineStats.totalHours} hrs</span>
            </div>
          </div>

          <div className="hidden lg:block">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Operating Schedule
            </span>
            <div className="text-xs font-bold text-slate-700 mt-1">
              {hourlyBlocks.length > 0
                ? `${hourlyBlocks[0]?.start_time.slice(0, 5)} → ${hourlyBlocks[hourlyBlocks.length - 1]?.end_time.slice(0, 5)}`
                : "No schedule"}
            </div>
          </div>
        </div>

        {/* Session Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {SESSION_TABS.map((tab) => {
            const Icon = tab.icon;
            const count =
              timelineGranularity === "1HOUR"
                ? tab.key === "ALL"
                  ? hourlyBlocks.length
                  : hourlyBlocks.filter((b) => b.period === tab.key).length
                : tab.key === "ALL"
                ? slotData?.slots?.length || 0
                : (slotData?.slots || []).filter((s: any) => {
                    const h = parseInt(s.start_time.slice(0, 2), 10);
                    if (tab.key === "MORNING") return h >= 5 && h < 12;
                    if (tab.key === "AFTERNOON") return h >= 12 && h < 17;
                    if (tab.key === "EVENING") return h >= 17 && h < 22;
                    return h >= 22 || h < 5;
                  }).length;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setSessionFilter(tab.key)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  sessionFilter === tab.key
                    ? "bg-[#059669] text-white shadow-xs"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${sessionFilter === tab.key ? "text-white" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    sessionFilter === tab.key
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Slot Price Matrix Content */}
        {slotsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <div key={n} className="h-36 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !slotData || slotData.slots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs font-medium border border-slate-100">
            No operating slots available for this date.
          </div>
        ) : timelineGranularity === "1HOUR" ? (
          /* 1-HOUR MODE GRID */
          filteredHourlyBlocks.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs font-medium border border-slate-100">
              No 1-hour slots found matching the selected session filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
              {filteredHourlyBlocks.map((block) => {
                const isSurged = block.diff > 0;
                const isDiscounted = block.diff < 0;

                return (
                  <div
                    key={block.id}
                    onClick={() => openHourlyBlockAdjuster(block)}
                    className={`group relative p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3.5 shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                      isSurged
                        ? "border-amber-300 bg-amber-50/20 hover:border-amber-500 hover:bg-amber-50/30"
                        : isDiscounted
                        ? "border-emerald-300 bg-emerald-50/20 hover:border-emerald-500 hover:bg-emerald-50/30"
                        : "border-slate-200/90 bg-white hover:border-[#059669] hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      {/* Top Time and Badge Row */}
                      <div className="flex items-start justify-between gap-1 pb-1">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-black text-sm text-[#0F172A]">
                              {block.display_time}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
                            {block.formatted_time_range}
                          </span>
                        </div>

                        {isSurged && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                            <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                            +₹{block.diff}/hr
                          </span>
                        )}
                        {isDiscounted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#059669] border border-emerald-200 flex items-center gap-1">
                            <TrendingDown className="w-2.5 h-2.5 text-[#059669]" />
                            -₹{Math.abs(block.diff)}/hr
                          </span>
                        )}
                        {!isSurged && !isDiscounted && (
                          <span className="text-[10px] text-slate-500 font-bold px-2 py-0.5 bg-slate-100 rounded-md">
                            Base Rate
                          </span>
                        )}
                      </div>

                      {/* Main Calculated 1-Hour Price */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <div className="flex items-baseline space-x-1">
                          <span className="text-2xl font-black text-[#0F172A] font-mono tracking-tight">
                            ₹{block.hourly_price.toLocaleString("en-IN")}
                          </span>
                          <span className="text-xs font-bold text-slate-500">/hr</span>
                        </div>

                        {/* Breakdown of 30-min sub-slots */}
                        <div className="text-[11px] font-medium text-slate-500 mt-1">
                          {block.slots.length > 1 ? (
                            <span>
                              2 × 30m slots (₹{Math.round(Number(block.slots[0]?.price || block.base_hourly_price / 2))} + ₹{Math.round(Number(block.slots[1]?.price || block.base_hourly_price / 2))})
                            </span>
                          ) : (
                            <span>1 × 30m slot normalized</span>
                          )}
                        </div>

                        {/* Availability Status */}
                        <div className="mt-2">
                          {block.status === "BOOKED" ? (
                            <span className="inline-flex items-center text-[11px] font-bold text-slate-500">
                              <span className="w-2 h-2 rounded-full bg-slate-400 mr-1.5" />
                              Fully Booked
                            </span>
                          ) : block.status === "PARTIALLY_BOOKED" ? (
                            <span className="inline-flex items-center text-[11px] font-bold text-amber-600">
                              <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
                              1 Slot Booked / 1 Open
                            </span>
                          ) : block.status === "MAINTENANCE" ? (
                            <span className="inline-flex items-center text-[11px] font-bold text-rose-600">
                              <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5" />
                              Blackout / Maintenance
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-[11px] font-bold text-[#059669]">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                              Open for 1-Hr Booking
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Hint */}
                    <div className="pt-2.5 border-t border-slate-100/90 flex items-center justify-between text-[11px] font-bold text-[#059669] group-hover:text-[#047857]">
                      <span>Adjust 1-Hour Rate</span>
                      <Edit3 className="w-3.5 h-3.5" />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* 30-MIN MICRO INTERVALS GRID */
          filteredSlots.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs font-medium border border-slate-100">
              No 30-min intervals found matching the selected session filter.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredSlots.map((slot: any) => {
                const baseP = slot.base_price !== undefined
                  ? Number(slot.base_price)
                  : (slotData.base_price ? Number(slotData.base_price) / 2 : 500);
                const currentP = Math.round(Number(slot.price ?? baseP));
                const diff = currentP - Math.round(baseP);
                const isSurged = diff > 0;
                const isDiscounted = diff < 0;

                return (
                  <div
                    key={slot.id}
                    onClick={() => openSlotAdjuster(slot)}
                    className={`group relative p-3.5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md hover:-translate-y-0.5 ${
                      isSurged
                        ? "border-amber-300 hover:border-amber-500 hover:bg-amber-50/20"
                        : isDiscounted
                        ? "border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50/20"
                        : "border-slate-200/90 hover:border-[#059669] hover:bg-slate-50/50"
                    }`}
                  >
                    <div>
                      {/* Top Time and Badge Row */}
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono font-bold text-xs text-[#0F172A]">
                          {slot.start_time.slice(0, 5)}
                        </span>

                        {isSurged && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                            <Flame className="w-2.5 h-2.5 text-amber-600 fill-amber-500" />
                            +₹{diff}
                          </span>
                        )}
                        {isDiscounted && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-[#059669] border border-emerald-200 flex items-center gap-0.5">
                            <TrendingDown className="w-2.5 h-2.5 text-[#059669]" />
                            -₹{Math.abs(diff)}
                          </span>
                        )}
                        {!isSurged && !isDiscounted && (
                          <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 bg-slate-100 rounded-md">
                            Base
                          </span>
                        )}
                      </div>

                      {/* Main Calculated Price */}
                      <div className="mt-2">
                        <span className="text-xl font-extrabold text-[#0F172A] font-mono tracking-tight block">
                          ₹{currentP.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500 block mt-0.5">
                          {slot.status === "BOOKED" ? (
                            <span className="text-slate-500 font-bold">● Booked</span>
                          ) : slot.status === "MAINTENANCE" ? (
                            <span className="text-amber-600 font-bold">● Blackout</span>
                          ) : (
                            <span className="text-[#059669] font-bold">○ Available</span>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Action Hint */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-[#059669] group-hover:text-[#047857]">
                      <span>Adjust Rate</span>
                      <Edit3 className="w-3 h-3" />
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* SECTION 2: Active Pricing Policies & Rules List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
              Active Pricing Policies ({rules.length})
            </h2>
            <p className="text-xs text-slate-500">
              Global and pitch-specific surcharge and discount rules evaluated automatically by the booking engine.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            Ordered by priority (Highest priority executes first)
          </span>
        </div>

        {rules.length === 0 ? (
          <EmptyState
            title="No custom pricing policies configured"
            description="Create your first weekend surge, peak hour surcharge, or early morning discount policy."
            actionText="Create Pricing Policy"
            onAction={openCreateModal}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rules.map((rule) => {
              const numVal = parseFloat(String(rule.adjustment_value)) || 0;
              const isHike = numVal > 0;
              const isDiscount = numVal < 0;
              const targetTurf = turfs.find((t) => String(t.id) === String(rule.turf));

              return (
                <div
                  key={rule.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 flex flex-col justify-between transition-all hover:shadow-md ${
                    !rule.is_active
                      ? "border-slate-200 opacity-60 bg-slate-50/50"
                      : isHike
                      ? "border-slate-200/90 hover:border-amber-400"
                      : "border-slate-200/90 hover:border-emerald-400"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Type Badge & Active Switch */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          isHike
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-[#ECFDF5] text-[#059669] border border-emerald-200"
                        }`}
                      >
                        {isHike ? (
                          <>
                            <TrendingUp className="w-3 h-3 text-amber-600" />
                            <span>PRICE HIKE / SURGE</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-3 h-3 text-[#059669]" />
                            <span>DISCOUNT / OFF-PEAK</span>
                          </>
                        )}
                      </span>

                      <div className="flex items-center space-x-1.5">
                        <span className="text-[11px] font-bold text-slate-500">
                          {rule.is_active ? "Active" : "Paused"}
                        </span>
                        <input
                          type="checkbox"
                          checked={rule.is_active}
                          onChange={() => handleToggleRuleActive(rule)}
                          className="rounded text-[#059669] focus:ring-[#059669] cursor-pointer"
                          title="Toggle Policy On/Off"
                        />
                      </div>
                    </div>

                    {/* Rule Title & Adjustment Amount */}
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A] leading-tight">
                        {rule.name}
                      </h3>
                      <div className="flex items-baseline space-x-1.5 mt-1">
                        <span
                          className={`text-xl font-extrabold font-mono tracking-tight ${
                            isHike ? "text-amber-600" : "text-[#059669]"
                          }`}
                        >
                          {isHike ? "+" : ""}
                          {numVal}
                          {rule.adjustment_type === "PERCENTAGE" ? "%" : "₹"}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          ({rule.adjustment_type === "PERCENTAGE" ? "Percentage Adj." : "Fixed Amount"})
                        </span>
                      </div>
                    </div>

                    {/* Scope metadata */}
                    <div className="space-y-2 text-xs text-slate-600 bg-[#F8FAFC] p-3 rounded-xl border border-slate-100">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Target Arena:</span>
                        <strong className="text-[#0F172A]">
                          {targetTurf ? targetTurf.name : "All Pitches (Global)"}
                        </strong>
                      </div>

                      {rule.start_time && rule.end_time && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-medium">Hours Window:</span>
                          <span className="font-mono font-bold text-[#0F172A]">
                            {rule.start_time.slice(0, 5)} - {rule.end_time.slice(0, 5)}
                          </span>
                        </div>
                      )}

                      {/* Days row */}
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-slate-400 font-medium">Applicable Days:</span>
                        <div className="flex gap-1">
                          {DAY_LABELS.map((label, idx) => {
                            const isApplicable =
                              !rule.applicable_days ||
                              rule.applicable_days.length === 0 ||
                              rule.applicable_days.includes(idx);
                            return (
                              <span
                                key={label}
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isApplicable
                                    ? "bg-[#059669] text-white"
                                    : "bg-slate-200 text-slate-400"
                                }`}
                              >
                                {label}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      {rule.start_date && (
                        <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                          <span>Date Scope:</span>
                          <span>
                            {rule.start_date} to {rule.end_date || "Ongoing"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 font-mono">
                      Priority: {rule.priority}
                    </span>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateRule(rule)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                        title="Duplicate Policy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => openEditModal(rule)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-bold text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-all cursor-pointer"
                        title="Edit Policy"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeletingRuleId(rule.id)}
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Delete Policy"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: Live Price Simulator & Conflict Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Simulator Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-[#0F172A]">
            <Calculator className="w-5 h-5 text-[#059669]" />
            <h3 className="text-base font-bold">Instant Price Simulator</h3>
          </div>
          <p className="text-xs text-slate-500">
            Test how combined policies, surges, and discounts resolve for any booking combination.
          </p>

          <form onSubmit={handleSimulate} className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Pitch</label>
                <select
                  value={simTurf}
                  onChange={(e) => setSimTurf(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-xs focus:ring-1 focus:ring-[#059669]"
                >
                  {turfs.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Test Date</label>
                <input
                  type="date"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-xs focus:ring-1 focus:ring-[#059669]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-xs focus:ring-1 focus:ring-[#059669]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                <select
                  value={simDuration}
                  onChange={(e) => setSimDuration(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-xs focus:ring-1 focus:ring-[#059669]"
                >
                  <option value="60">60 Minutes (1 hr)</option>
                  <option value="90">90 Minutes (1.5 hr)</option>
                  <option value="120">120 Minutes (2 hrs)</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={simulating}
              className="w-full py-3 bg-[#059669] hover:bg-[#047857] text-white font-bold rounded-xl text-xs shadow-sm transition-all cursor-pointer"
            >
              {simulating ? "Calculating..." : "Calculate Price Breakdown"}
            </button>
          </form>

          {simResult && (
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-slate-200/80 space-y-2 text-xs">
              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-500">Standard Base Rate:</span>
                <span className="font-mono font-bold text-[#0F172A]">₹{Math.round(simResult.base_hourly_price)}</span>
              </div>

              <div className="flex items-center justify-between font-medium">
                <span className="text-slate-500">Net Policy Adjustment:</span>
                <span
                  className={`font-mono font-bold ${
                    simResult.adjustment_applied > 0
                      ? "text-amber-600"
                      : simResult.adjustment_applied < 0
                      ? "text-[#059669]"
                      : "text-slate-600"
                  }`}
                >
                  {simResult.adjustment_applied >= 0 ? "+" : ""}
                  ₹{Math.round(simResult.adjustment_applied)}
                </span>
              </div>

              <div className="flex items-center justify-between font-extrabold text-sm pt-2 border-t border-slate-200 text-[#0F172A]">
                <span>Final Customer Price:</span>
                <span className="font-mono text-[#059669] text-base">₹{Math.round(simResult.final_price).toLocaleString("en-IN")}</span>
              </div>
            </div>
          )}
        </div>

        {/* Conflicts Card */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 text-[#0F172A]">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold">Policy Conflict Telemetry</h3>
          </div>
          <p className="text-xs text-slate-500">
            Identifies overlapping policies on the same day and hours, verifying priority resolution.
          </p>

          {conflicts.length === 0 ? (
            <div className="p-6 rounded-xl bg-[#ECFDF5] border border-emerald-200 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-[#059669] mx-auto" />
              <p className="text-xs font-bold text-[#059669]">No Policy Conflicts Detected</p>
              <p className="text-[11px] text-slate-600">All pricing rules have unique or resolved priority hierarchies.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {conflicts.map((c, i) => (
                <div key={i} className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-amber-900 flex items-center justify-between">
                    <span>{c.rule_1?.name} vs {c.rule_2?.name}</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-full font-extrabold">Overlap</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{c.resolution}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Create & Edit Pricing Policy Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingRule ? `Edit Pricing Policy: ${editingRule.name}` : "Create Pricing Policy"}
        description="Configure dynamic surge pricing or promotional discounts with day and time rules."
        maxWidth="md"
      >
        <form onSubmit={handleSaveRule} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          {/* Hike vs Discount Segmented Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#0F172A]">Policy Action</label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPolicyMode("HIKE")}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  policyMode === "HIKE"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Price Hike / Surge (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setPolicyMode("DISCOUNT")}
                className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  policyMode === "DISCOUNT"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Price Discount (-)</span>
              </button>
            </div>
          </div>

          <Input
            label="Policy Name"
            isRequired
            placeholder={policyMode === "HIKE" ? "e.g. Weekend Evening Surge" : "e.g. Early Morning Discount"}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Policy Category"
              value={formData.rule_type}
              onChange={(e) => setFormData({ ...formData, rule_type: e.target.value })}
              options={[
                { value: "PEAK_HOUR", label: "Peak Hour Window" },
                { value: "WEEKEND", label: "Weekend Premium" },
                { value: "OFF_PEAK", label: "Off-Peak Discount" },
                { value: "HOLIDAY", label: "Holiday Pricing" },
                { value: "SPECIAL_EVENT", label: "Special Event / Tournament" },
                { value: "LAST_MINUTE", label: "Last-Minute Flash Rate" },
                { value: "EARLY_BOOKING", label: "Early-Bird Promo" },
              ]}
            />

            <Select
              label="Applicable Turf / Arena"
              value={formData.turf}
              onChange={(e) => setFormData({ ...formData, turf: e.target.value })}
              options={[
                { value: "", label: "All Pitches (Global)" },
                ...turfs.map((t) => ({ value: String(t.id), label: t.name })),
              ]}
            />
          </div>

          {/* Adjustment Rate & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">
                Adjustment Unit
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, adjustment_type: "PERCENTAGE" })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    formData.adjustment_type === "PERCENTAGE"
                      ? "border-[#059669] bg-[#ECFDF5] text-[#059669]"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, adjustment_type: "FIXED" })}
                  className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    formData.adjustment_type === "FIXED"
                      ? "border-[#059669] bg-[#ECFDF5] text-[#059669]"
                      : "border-slate-200 bg-slate-50 text-slate-600"
                  }`}
                >
                  Fixed Amount (₹)
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#0F172A]">
                {policyMode === "HIKE" ? "Hike Value" : "Discount Value"} ({formData.adjustment_type === "PERCENTAGE" ? "%" : "₹"}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="any"
                placeholder={formData.adjustment_type === "PERCENTAGE" ? "20" : "200"}
                value={formData.adjustment_value}
                onChange={(e) => setFormData({ ...formData, adjustment_value: e.target.value })}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
              />
            </div>
          </div>

          {/* Applicable Weekdays */}
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
              Applicable Weekdays
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DAY_LABELS.map((day, idx) => {
                const isSelected = formData.applicable_days.includes(idx);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(idx)}
                    className={`flex-1 min-w-[40px] py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#059669] text-white border-[#059669] shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Hours Window */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time Window"
              type="time"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
            <Input
              label="End Time Window"
              type="time"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
            />
          </div>

          {/* Date Scope (Optional) */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date (Optional)"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
            <Input
              label="End Date (Optional)"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            />
          </div>

          {/* Priority and Active */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Input
              label="Priority Rank (1-100)"
              type="number"
              step="1"
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 10 })}
            />

            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#0F172A]">Policy Status</label>
              <label className="flex items-center space-x-2 p-2 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded text-[#059669] focus:ring-[#059669]"
                />
                <span className="text-xs font-bold text-[#0F172A]">Active & Enforced</span>
              </label>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={submitting}>
              {editingRule ? "Update Policy" : "Create Policy"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Quick Slot & 1-Hour Price Surge, Discount & Target Rate Modal */}
      <Modal
        isOpen={slotAdjustModalOpen}
        onClose={handleCloseSlotAdjustModal}
        maxWidth="md"
      >
        <div className="space-y-5">
          {/* Header with Slot Details */}
          <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-[#059669] border border-emerald-200/60 font-mono font-black text-xs">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {isBlockMode
                    ? `${selectedBlock?.display_time} (${selectedBlock?.formatted_time_range})`
                    : `${selectedSlot?.start_time?.slice(0, 5)} – ${selectedSlot?.end_time?.slice(0, 5)}`}
                </span>
                <span className="text-xs font-bold text-slate-500">•</span>
                <span className="text-xs font-bold text-slate-700">
                  {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {isBlockMode ? "Adjust 1-Hour Match Rate" : "Adjust 30-Min Slot Rate"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {currentTurfObj?.name || "Turf Pitch"} • Standard {isBlockMode ? "Hourly Base" : "Slot Base"}: <strong className="text-slate-800">₹{baseRate}{isBlockMode ? "/hr" : ""}</strong>
              </p>
            </div>
          </div>

          <form onSubmit={handleApplySlotAdjustment} className="space-y-4 text-xs">
            {/* 1. Mode Selector (Hike vs Discount vs Target Rate) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Adjustment Strategy
              </label>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => {
                    setSlotAdjustMode("HIKE");
                    if (!slotAdjustAmount || slotAdjustMode === "FIXED") setSlotAdjustAmount("200");
                  }}
                  className={`py-2 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    slotAdjustMode === "HIKE"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+ Hike</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSlotAdjustMode("DISCOUNT");
                    if (!slotAdjustAmount || slotAdjustMode === "FIXED") setSlotAdjustAmount("150");
                  }}
                  className={`py-2 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    slotAdjustMode === "DISCOUNT"
                      ? "bg-[#059669] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>- Discount</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSlotAdjustMode("FIXED");
                    setSlotAdjustUnit("FLAT");
                    setSlotAdjustAmount(String(currentRate));
                  }}
                  className={`py-2 px-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    slotAdjustMode === "FIXED"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Target Rate</span>
                </button>
              </div>
            </div>

            {/* 2. Live Simulation & Comparison Hero Card */}
            <div
              className={`p-4 rounded-2xl border transition-all duration-300 ${
                deltaFromBase > 0
                  ? "bg-gradient-to-br from-amber-50/70 to-orange-50/40 border-amber-200/80 shadow-[0_4px_16px_rgba(245,158,11,0.08)]"
                  : deltaFromBase < 0
                  ? "bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border-emerald-200/80 shadow-[0_4px_16px_rgba(5,150,105,0.08)]"
                  : "bg-gradient-to-br from-slate-50 to-slate-100/60 border-slate-200/80"
              }`}
            >
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200/60">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    {isBlockMode ? "Current 1-Hr Rate" : "Current Slot Rate"}
                  </span>
                  <div className="flex items-baseline space-x-1 mt-0.5">
                    <span className="text-base font-bold text-slate-700 font-mono">
                      ₹{currentRate.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">{isBlockMode ? "/hr" : "/slot"}</span>
                  </div>
                </div>

                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-xs border border-slate-200/80 text-slate-400">
                  <ArrowRight className="w-4 h-4 text-slate-600" />
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#059669] block">
                    {isBlockMode ? "New 1-Hr Rate" : "New Calculated Rate"}
                  </span>
                  <div className="flex items-baseline space-x-1 mt-0.5 justify-end">
                    <span
                      className={`text-2xl font-black font-mono tracking-tight ${
                        deltaFromBase > 0
                          ? "text-amber-600"
                          : deltaFromBase < 0
                          ? "text-[#059669]"
                          : "text-slate-900"
                      }`}
                    >
                      ₹{projectedRate.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-slate-400 font-normal">{isBlockMode ? "/hr" : "/slot"}</span>
                  </div>
                </div>
              </div>

              {/* Impact Summary Line */}
              <div className="flex items-center justify-between pt-2.5 text-xs">
                <span className="text-slate-500 font-medium">
                  Base: <strong className="text-slate-700">₹{baseRate}{isBlockMode ? "/hr" : ""}</strong>
                </span>

                <div className="flex items-center space-x-1.5">
                  {deltaFromBase > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200/80">
                      <TrendingUp className="w-3 h-3 mr-1 text-amber-600" />
                      +₹{deltaFromBase}{isBlockMode ? "/hr" : ""} (+{Math.abs(percentChange)}% surge)
                    </span>
                  )}
                  {deltaFromBase < 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200/80">
                      <TrendingDown className="w-3 h-3 mr-1 text-[#059669]" />
                      -₹{Math.abs(deltaFromBase)}{isBlockMode ? "/hr" : ""} (-{Math.abs(percentChange)}% discount)
                    </span>
                  )}
                  {deltaFromBase === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-200/80 text-slate-700">
                      Standard Base Price
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Value Input & Unit Switcher */}
            {slotAdjustMode !== "FIXED" ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                    {slotAdjustMode === "HIKE"
                      ? (isBlockMode ? "Hourly Surge Amount" : "Hike Amount")
                      : (isBlockMode ? "Hourly Discount Amount" : "Discount Amount")}
                  </label>

                  {/* Unit Segmented Control */}
                  <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setSlotAdjustUnit("FLAT")}
                      className={`py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        slotAdjustUnit === "FLAT"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      ₹ Flat {isBlockMode ? "/ Hr" : "Amount"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSlotAdjustUnit("PERCENT")}
                      className={`py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        slotAdjustUnit === "PERCENT"
                          ? "bg-white text-slate-900 shadow-2xs"
                          : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      % Percentage
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold">
                    {slotAdjustUnit === "FLAT" ? "₹" : "%"}
                  </div>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    value={slotAdjustAmount}
                    onChange={(e) => setSlotAdjustAmount(e.target.value)}
                    placeholder={slotAdjustUnit === "FLAT" ? "e.g. 200" : "e.g. 15"}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>

                {/* Quick Presets */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Quick Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(slotAdjustMode === "HIKE" ? hikePresets : discountPresets).map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSlotAdjustAmount(String(val))}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          slotAdjustAmount === String(val)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {slotAdjustMode === "HIKE" ? "+" : "-"}
                        {slotAdjustUnit === "FLAT" ? `₹${val}${isBlockMode ? "/hr" : ""}` : `${val}%`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  {isBlockMode ? "Target Hourly Match Rate (₹/hr)" : "Target Slot Rate (₹)"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-black text-sm">
                    ₹
                  </div>
                  <input
                    type="number"
                    required
                    min="1"
                    step="any"
                    value={slotAdjustAmount}
                    onChange={(e) => setSlotAdjustAmount(e.target.value)}
                    placeholder={isBlockMode ? "e.g. 1200" : "e.g. 600"}
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                </div>

                {/* Target Rate Quick Presets */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {targetPresets.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSlotAdjustAmount(String(val))}
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                          slotAdjustAmount === String(val)
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {val === baseRate ? `Base (₹${val})` : `₹${val}`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Scope Selector */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Application Scope
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setSlotScope("DATE_ONLY")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    slotScope === "DATE_ONLY"
                      ? "bg-emerald-50/70 border-[#059669] ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      slotScope === "DATE_ONLY"
                        ? "border-[#059669] bg-[#059669] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {slotScope === "DATE_ONLY" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">
                      Only this date ({selectedDate})
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      One-time override for {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSlotScope("RECURRING_WEEKDAY")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    slotScope === "RECURRING_WEEKDAY"
                      ? "bg-emerald-50/70 border-[#059669] ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      slotScope === "RECURRING_WEEKDAY"
                        ? "border-[#059669] bg-[#059669] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {slotScope === "RECURRING_WEEKDAY" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">
                      Every {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })} at this hour
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      {isBlockMode
                        ? `Recurring weekly policy for ${selectedBlock?.display_time}`
                        : `Recurring weekly policy for ${selectedSlot?.start_time?.slice(0, 5)} - ${selectedSlot?.end_time?.slice(0, 5)}`}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSlotScope("ALL_DAYS")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    slotScope === "ALL_DAYS"
                      ? "bg-emerald-50/70 border-[#059669] ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      slotScope === "ALL_DAYS"
                        ? "border-[#059669] bg-[#059669] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {slotScope === "ALL_DAYS" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">
                      Every day at this hour (Permanent)
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      Applies 7 days a week for all future bookings at this hour
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* 5. Footer Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <div>
                {hasCustomRate && (
                  <button
                    type="button"
                    onClick={handleResetSlotToBase}
                    disabled={slotAdjustSubmitting}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-all cursor-pointer disabled:opacity-50"
                    title="Remove overrides and revert to base rate"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Revert to Base</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlotAdjustModalOpen(false)}
                  disabled={slotAdjustSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={slotAdjustSubmitting}
                >
                  Apply Rate Change
                </Button>
              </div>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL 3: Quick Batch Time Range Surge / Discount Modal */}
      <Modal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        maxWidth="md"
      >
        <div className="space-y-5">
          <div className="pb-3 border-b border-slate-100 flex items-start justify-between">
            <div className="space-y-1">
              <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/80 font-mono font-bold text-xs">
                <Flame className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                <span>BATCH TIME WINDOW SURGE / DISCOUNT</span>
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1">
                Quick Range Pricing Surge
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Apply dynamic rate changes across multiple consecutive hours at once (e.g. evening prime hours).
              </p>
            </div>
          </div>

          <form onSubmit={handleApplyBatchAdjustment} className="space-y-4 text-xs">
            {/* Time Window Selector */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Start Hour
                </label>
                <select
                  value={batchStartTime}
                  onChange={(e) => setBatchStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-2xs focus:ring-2 focus:ring-[#059669] focus:outline-hidden cursor-pointer"
                >
                  {["05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  End Hour
                </label>
                <select
                  value={batchEndTime}
                  onChange={(e) => setBatchEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] shadow-2xs focus:ring-2 focus:ring-[#059669] focus:outline-hidden cursor-pointer"
                >
                  {["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "23:59"].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode: Hike vs Discount */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Adjustment Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setBatchMode("HIKE")}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    batchMode === "HIKE"
                      ? "bg-amber-500 text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>+ Surge Hike</span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchMode("DISCOUNT")}
                  className={`py-2 px-3 rounded-lg font-bold text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                    batchMode === "DISCOUNT"
                      ? "bg-[#059669] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>- Happy Hour Discount</span>
                </button>
              </div>
            </div>

            {/* Amount & Unit */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Adjustment Value (per hour)
                </label>
                <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/60">
                  <button
                    type="button"
                    onClick={() => setBatchUnit("FLAT")}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      batchUnit === "FLAT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    ₹ Flat / Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setBatchUnit("PERCENT")}
                    className={`py-1 px-2.5 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      batchUnit === "PERCENT" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    % Percentage
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-black text-sm">
                  {batchUnit === "FLAT" ? "₹" : "%"}
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={batchAmount}
                  onChange={(e) => setBatchAmount(e.target.value)}
                  placeholder={batchUnit === "FLAT" ? "e.g. 200" : "e.g. 20"}
                  className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              {/* Presets */}
              <div className="flex items-center space-x-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(batchUnit === "FLAT" ? [100, 200, 300, 500] : [10, 15, 20, 25]).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBatchAmount(String(val))}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all cursor-pointer ${
                        batchAmount === String(val)
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {batchMode === "HIKE" ? "+" : "-"}
                      {batchUnit === "FLAT" ? `₹${val}/hr` : `${val}%`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scope */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                Application Scope
              </label>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => setBatchScope("DATE_ONLY")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    batchScope === "DATE_ONLY"
                      ? "bg-emerald-50/70 border-[#059669] ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      batchScope === "DATE_ONLY" ? "border-[#059669] bg-[#059669] text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {batchScope === "DATE_ONLY" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">
                      Only this date ({selectedDate})
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      One-time batch override between {batchStartTime} and {batchEndTime}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchScope("RECURRING_WEEKDAY")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    batchScope === "RECURRING_WEEKDAY"
                      ? "bg-emerald-50/70 border-[#059669] ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      batchScope === "RECURRING_WEEKDAY" ? "border-[#059669] bg-[#059669] text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {batchScope === "RECURRING_WEEKDAY" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">
                      Every {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })} in this time range
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      Recurring weekly rule across {batchStartTime} - {batchEndTime}
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchScope("ALL_DAYS")}
                  className={`w-full p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                    batchScope === "ALL_DAYS"
                      ? "bg-emerald-50/70 border-[#059669] ring-2 ring-emerald-500/20 shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/80"
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                      batchScope === "ALL_DAYS" ? "border-[#059669] bg-[#059669] text-white" : "border-slate-300 bg-white"
                    }`}
                  >
                    {batchScope === "ALL_DAYS" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </div>
                  <div className="flex-1">
                    <span className="block text-xs font-bold text-slate-900">
                      Every day in this time range (Permanent)
                    </span>
                    <span className="block text-[11px] text-slate-500 font-medium">
                      Permanent surcharge / discount policy covering all 7 days
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBatchModalOpen(false)}
                disabled={batchSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                isLoading={batchSubmitting}
              >
                Apply Range {batchMode === "HIKE" ? "Surge" : "Discount"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Delete Rule Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingRuleId}
        title="Delete Pricing Policy?"
        message="Are you sure you want to remove this pricing rule? Future booking price calculations will immediately revert to the base rate."
        confirmText="Delete Policy"
        isDestructive={true}
        onConfirm={confirmDeleteRule}
        onClose={() => setDeletingRuleId(null)}
      />
    </div>
  );
};
