import React, { useState, useEffect } from "react";
import {
  Sliders,
  PlusCircle,
  Trash2,
  ShieldCheck,
  Clock,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import api from "../../services/api";
import { PricingRule, Turf } from "../../types";

export const ManagePricingPage: React.FC = () => {
  const [rules, setRules] = useState<PricingRule[]>([]);
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    rule_type: "WEEKEND",
    turf: "",
    adjustment_type: "PERCENTAGE",
    adjustment_value: "20.00",
    applicable_days: [5, 6],
    start_time: "18:00:00",
    end_time: "23:00:00",
    priority: 10,
    is_active: true,
  });

  const fetchRules = () => {
    setLoading(true);
    Promise.all([api.get("/pricing/rules/"), api.get("/turfs/")])
      .then(([rRes, tRes]) => {
        setRules(rRes.data);
        setTurfs(tRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchRules();
  }, []);

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

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pricing/rules/", {
        ...formData,
        turf: formData.turf || null,
      });
      setShowModal(false);
      fetchRules();
    } catch (err: any) {
      alert("Failed to save pricing rule.");
    }
  };

  const handleDeleteRule = async (id: string) => {
    if (!window.confirm("Delete this rule?")) return;
    try {
      await api.delete(`/pricing/rules/${id}/`);
      fetchRules();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Yield Management
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Dynamic Pricing Rules Engine
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configure weekend premiums, happy hours, peak time surcharges, and
            off-peak deals
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-lg shadow-purple-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Pricing Rule</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {rules.map((rule) => {
            const isSurge = Number(rule.adjustment_value) > 0;
            return (
              <div
                key={rule.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4"
              >
                <div className="space-y-1.5 w-full md:w-auto">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">
                      {rule.name}
                    </h3>
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {rule.rule_type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isSurge
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                      }`}
                    >
                      {isSurge ? "+" : ""}
                      {rule.adjustment_value}
                      {rule.adjustment_type === "PERCENTAGE" ? "%" : "₹"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400">
                    Applies to:{" "}
                    <strong>{rule.turf_name || "All Turf Venues"}</strong> •
                    Priority: <strong>{rule.priority}</strong>
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {rule.applicable_days?.length > 0 && (
                      <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                        Days:{" "}
                        {rule.applicable_days
                          .map((d) => dayLabels[d])
                          .join(", ")}
                      </span>
                    )}
                    {rule.start_time && (
                      <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                        Time: {rule.start_time.slice(0, 5)} -{" "}
                        {rule.end_time?.slice(0, 5)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 transition-colors"
                    title="Delete Rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Rule Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-lg w-full rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">
              Create Dynamic Pricing Rule
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. Weekend Night Prime Time"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Rule Type
                  </label>
                  <select
                    value={formData.rule_type}
                    onChange={(e) =>
                      setFormData({ ...formData, rule_type: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option value="WEEKEND">Weekend Surge</option>
                    <option value="PEAK_HOUR">Peak Hour Surge</option>
                    <option value="OFF_PEAK">Off-Peak Discount</option>
                    <option value="WEEKDAY">Weekday Rule</option>
                    <option value="HOLIDAY">Holiday Rule</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Applies to Turf
                  </label>
                  <select
                    value={formData.turf}
                    onChange={(e) =>
                      setFormData({ ...formData, turf: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option value="">All Venues</option>
                    {turfs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Adjustment Type
                  </label>
                  <select
                    value={formData.adjustment_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjustment_type: e.target.value as any,
                      })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Adjustment Value (+/-)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.adjustment_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjustment_value: e.target.value,
                      })
                    }
                    placeholder="e.g. 20 for +20% or -15 for 15% off"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              {/* Days of week */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">
                  Applicable Days
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dayLabels.map((lbl, idx) => {
                    const isSelected = formData.applicable_days.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleToggleDay(idx)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs ${
                          isSelected
                            ? "bg-purple-600 text-white"
                            : "bg-slate-950 text-slate-500 border border-slate-800"
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) =>
                      setFormData({ ...formData, start_time: e.target.value })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) =>
                      setFormData({ ...formData, end_time: e.target.value })
                    }
                    className="w-full p-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                >
                  Save Pricing Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
