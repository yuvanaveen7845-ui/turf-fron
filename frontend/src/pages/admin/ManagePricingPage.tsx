import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import api from "../../services/api";
import { PricingRule, Turf, TimeSlot } from "../../types";
import { Button, Input, Select, Modal, ConfirmDialog, EmptyState } from "../../components/ui";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const ManagePricingPage: React.FC = () => {
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
  const [slotAdjustMode, setSlotAdjustMode] = useState<"HIKE" | "DISCOUNT" | "FIXED">("HIKE");
  const [slotAdjustUnit, setSlotAdjustUnit] = useState<"PERCENT" | "FLAT">("FLAT");
  const [slotAdjustAmount, setSlotAdjustAmount] = useState("200");
  const [slotScope, setSlotScope] = useState<"DATE_ONLY" | "RECURRING_WEEKDAY" | "ALL_DAYS">("DATE_ONLY");
  const [slotAdjustSubmitting, setSlotAdjustSubmitting] = useState(false);

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
      .get(`/turfs/${selectedTurfId}/availability/?date=${selectedDate}`)
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
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  // Slot Quick Price Adjuster
  const openSlotAdjuster = (slot: any) => {
    setSelectedSlot(slot);
    const baseP = slotData?.base_price || 1400;
    const currentP = slot.price || baseP;

    if (currentP > baseP) {
      setSlotAdjustMode("HIKE");
      setSlotAdjustAmount(String(Math.round(currentP - baseP)));
      setSlotAdjustUnit("FLAT");
    } else if (currentP < baseP) {
      setSlotAdjustMode("DISCOUNT");
      setSlotAdjustAmount(String(Math.round(baseP - currentP)));
      setSlotAdjustUnit("FLAT");
    } else {
      setSlotAdjustMode("HIKE");
      setSlotAdjustAmount("200");
      setSlotAdjustUnit("FLAT");
    }
    setSlotScope("DATE_ONLY");
    setSlotAdjustModalOpen(true);
  };

  const handleApplySlotAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot || !selectedTurfId) return;
    setSlotAdjustSubmitting(true);

    try {
      const baseP = slotData?.base_price || 1400;
      const numVal = parseFloat(slotAdjustAmount) || 0;
      const slotStartTime = selectedSlot.start_time.slice(0, 8);
      const slotEndTime = selectedSlot.end_time.slice(0, 8);
      const dayIndex = new Date(selectedDate).getDay(); // 0=Sun, 1=Mon
      const pythonDayIndex = (dayIndex + 6) % 7; // 0=Mon, 6=Sun

      let adjType: "PERCENTAGE" | "FIXED" = slotAdjustUnit === "PERCENT" ? "PERCENTAGE" : "FIXED";
      let signedVal = numVal;

      if (slotAdjustMode === "DISCOUNT") {
        signedVal = -Math.abs(numVal);
      } else if (slotAdjustMode === "FIXED") {
        adjType = "FIXED";
        signedVal = numVal - baseP;
      } else {
        signedVal = Math.abs(numVal);
      }

      const ruleName =
        slotAdjustMode === "HIKE"
          ? `Surge: ${selectedSlot.start_time.slice(0, 5)} Slot (+${numVal}${slotAdjustUnit === "PERCENT" ? "%" : "₹"})`
          : slotAdjustMode === "DISCOUNT"
          ? `Discount: ${selectedSlot.start_time.slice(0, 5)} Slot (-${numVal}${slotAdjustUnit === "PERCENT" ? "%" : "₹"})`
          : `Custom Rate: ${selectedSlot.start_time.slice(0, 5)} Slot (₹${numVal})`;

      const payload: any = {
        name: ruleName,
        rule_type: slotAdjustMode === "HIKE" ? "PEAK_HOUR" : "OFF_PEAK",
        turf: parseInt(selectedTurfId),
        adjustment_type: adjType,
        adjustment_value: signedVal,
        start_time: slotStartTime,
        end_time: slotEndTime,
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

      await api.post("/pricing/rules/", payload);
      setSlotAdjustModalOpen(false);
      fetchRules();
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to adjust slot price.");
    } finally {
      setSlotAdjustSubmitting(false);
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
    } catch (err: any) {
      alert(err.response?.data?.error || "Pricing simulation failed.");
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
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 text-[11px] font-bold uppercase tracking-wider bg-[#ECFDF5] text-[#059669] px-2.5 py-1 rounded-full border border-emerald-200">
              <Zap className="w-3 h-3" />
              <span>DIRECT SLOT RATE OVERRIDE</span>
            </div>
            <h2 className="text-lg font-bold text-[#0F172A] tracking-tight mt-1.5">
              Hike or Decrease Specific Time Slots
            </h2>
            <p className="text-xs text-slate-500">
              Select an arena and date to inspect live rates per hour. Tap any slot to instantly apply a surge, discount, or custom target price.
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

        {/* Live Slot Price Matrix */}
        {slotsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-28 bg-slate-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : !slotData || slotData.slots.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 text-center text-slate-500 text-xs font-medium border border-slate-100">
            No operating slots available for this date.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#0F172A]">
                Hourly Timeline & Calculated Rates ({slotData.slots.length} slots)
              </span>
              <span className="text-slate-500 font-mono text-xs">
                Base Rate: <strong className="text-[#0F172A]">₹{Math.round(slotData.base_price)}/hr</strong>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {slotData.slots.map((slot: any) => {
                const baseP = slotData.base_price;
                const currentP = Math.round(Number(slot.price || baseP));
                const diff = currentP - Math.round(baseP);
                const isSurged = diff > 0;
                const isDiscounted = diff < 0;

                return (
                  <div
                    key={slot.id}
                    onClick={() => openSlotAdjuster(slot)}
                    className={`group relative p-3.5 rounded-2xl border bg-white transition-all cursor-pointer flex flex-col justify-between space-y-3 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
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
          </div>
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

      {/* MODAL 2: Quick Slot Price Hike & Discount Modal */}
      <Modal
        isOpen={slotAdjustModalOpen}
        onClose={() => setSlotAdjustModalOpen(false)}
        title={`Adjust Rate for Slot: ${selectedSlot?.start_time?.slice(0, 5)} - ${selectedSlot?.end_time?.slice(0, 5)}`}
        description={`Pitch: ${currentTurfObj?.name || "Turf"} • Date: ${selectedDate}`}
        maxWidth="sm"
      >
        <form onSubmit={handleApplySlotAdjustment} className="space-y-4 text-xs">
          {/* Action Mode */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#0F172A]">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setSlotAdjustMode("HIKE");
                  if (slotAdjustUnit === "FLAT" && !slotAdjustAmount) setSlotAdjustAmount("200");
                }}
                className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  slotAdjustMode === "HIKE"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                + Hike
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlotAdjustMode("DISCOUNT");
                  if (slotAdjustUnit === "FLAT" && !slotAdjustAmount) setSlotAdjustAmount("150");
                }}
                className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  slotAdjustMode === "DISCOUNT"
                    ? "bg-[#059669] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                - Discount
              </button>
              <button
                type="button"
                onClick={() => {
                  setSlotAdjustMode("FIXED");
                  setSlotAdjustAmount("1600");
                }}
                className={`py-1.5 rounded-lg font-bold text-xs transition-all cursor-pointer ${
                  slotAdjustMode === "FIXED"
                    ? "bg-[#0F172A] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🎯 Target Rate
              </button>
            </div>
          </div>

          {/* Amount input */}
          {slotAdjustMode !== "FIXED" ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0F172A]">Unit</label>
                <select
                  value={slotAdjustUnit}
                  onChange={(e) => setSlotAdjustUnit(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:ring-1 focus:ring-[#059669] cursor-pointer"
                >
                  <option value="FLAT">Flat ₹ Amount</option>
                  <option value="PERCENT">Percentage (%)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0F172A]">
                  {slotAdjustMode === "HIKE" ? "Hike Value" : "Discount Value"}
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  value={slotAdjustAmount}
                  onChange={(e) => setSlotAdjustAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:ring-1 focus:ring-[#059669]"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-[#0F172A]">Target Slot Rate (₹)</label>
              <input
                type="number"
                required
                min="0"
                step="any"
                value={slotAdjustAmount}
                onChange={(e) => setSlotAdjustAmount(e.target.value)}
                placeholder="e.g. 1399"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:ring-1 focus:ring-[#059669]"
              />
            </div>
          )}

          {/* Scope Selector */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-[#0F172A]">Apply Scope</label>
            <select
              value={slotScope}
              onChange={(e) => setSlotScope(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] focus:bg-white focus:ring-1 focus:ring-[#059669] cursor-pointer"
            >
              <option value="DATE_ONLY">Only this specific date ({selectedDate})</option>
              <option value="RECURRING_WEEKDAY">
                Every {new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long" })} at this hour
              </option>
              <option value="ALL_DAYS">Every day at this hour (Recurring)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setSlotAdjustModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={slotAdjustSubmitting}>
              Apply Rate Change
            </Button>
          </div>
        </form>
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
