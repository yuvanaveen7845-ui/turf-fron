import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Sliders,
  Clock,
  ShieldCheck,
  MapPin,
  Users,
  Sun,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import api from "../../services/api";
import { Turf, Facility } from "../../types";
import { TurfImageManager } from "./TurfImageManager";

interface TurfCustomEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  turf: Turf | null;
  onSaved: () => void;
  onDelete?: (turf: Turf) => void;
  facilities: Facility[];
  onRefreshFacilities?: () => void;
}

export const TurfCustomEditorModal: React.FC<TurfCustomEditorModalProps> = ({
  isOpen,
  onClose,
  turf,
  onSaved,
  onDelete,
  facilities,
  onRefreshFacilities,
}) => {
  const [activeTab, setActiveTab] = useState<
    "general" | "media" | "specs" | "timings" | "amenities" | "location"
  >("general");

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sport_type: "FOOTBALL",
    description: "",
    location: "Friends Turf, Tiruppur",
    address: "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)",
    base_price: "1400",
    capacity: 14,
    surface_spec: "50mm Monofilament Synthetic Turf",
    lighting_spec: "400 Lux Anti-Glare Stadium LED Floodlights",
    dugout_spec: "14-Player Shaded Dugout with Tactical Boards",
    dimensions: "110ft x 70ft (7v7 Standard)",
    is_fifa_certified: true,
    operating_hours_start: "05:00:00",
    operating_hours_end: "23:59:00",
    slot_duration_minutes: 60,
    fast_fill_threshold: 4,
    is_active: true,
    images: [] as string[],
    facility_ids: [] as string[],
  });

  const [newFacilityName, setNewFacilityName] = useState("");
  const [isAddingFacility, setIsAddingFacility] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (turf) {
      setFormData({
        name: turf.name,
        slug: turf.slug,
        sport_type: turf.sport_type,
        description: turf.description || "",
        location: turf.location || "Friends Turf, Tiruppur",
        address: turf.address || "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)",
        base_price: String(turf.base_price),
        capacity: turf.capacity || 14,
        surface_spec: turf.surface_spec || "50mm Monofilament Synthetic Turf",
        lighting_spec: turf.lighting_spec || "400 Lux Anti-Glare Stadium LED Floodlights",
        dugout_spec: turf.dugout_spec || "14-Player Shaded Dugout",
        dimensions: turf.dimensions || "110ft x 70ft",
        is_fifa_certified: turf.is_fifa_certified ?? true,
        operating_hours_start: turf.operating_hours_start || "05:00:00",
        operating_hours_end: turf.operating_hours_end || "23:59:00",
        slot_duration_minutes: turf.slot_duration_minutes || 60,
        fast_fill_threshold: turf.fast_fill_threshold || 4,
        is_active: turf.is_active ?? true,
        images:
          turf.images && turf.images.length > 0
            ? turf.images
            : [
                "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
              ],
        facility_ids: turf.facilities_data?.map((f) => f.id) || [],
      });
    } else {
      // Default new turf setup
      setFormData({
        name: "",
        slug: "",
        sport_type: "FOOTBALL",
        description: "",
        location: "Friends Turf, Tiruppur",
        address: "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)",
        base_price: "1400",
        capacity: 14,
        surface_spec: "50mm Monofilament Synthetic Turf",
        lighting_spec: "400 Lux Anti-Glare Stadium LED Floodlights",
        dugout_spec: "14-Player Shaded Dugout",
        dimensions: "110ft x 70ft",
        is_fifa_certified: true,
        operating_hours_start: "05:00:00",
        operating_hours_end: "23:59:00",
        slot_duration_minutes: 60,
        fast_fill_threshold: 4,
        is_active: true,
        images: [
          "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
        ],
        facility_ids: facilities.slice(0, 4).map((f) => f.id),
      });
    }
    setErrorMsg("");
    setSuccessMsg("");
    setActiveTab("general");
  }, [turf, isOpen]);

  if (!isOpen) return null;

  const handleCreateFacility = async () => {
    if (!newFacilityName.trim()) return;
    setIsAddingFacility(true);
    try {
      const res = await api.post("/turfs/facilities/", {
        name: newFacilityName.trim(),
        icon: "shield-check",
      });
      if (res.data) {
        setFormData((prev) => ({
          ...prev,
          facility_ids: [...prev.facility_ids, res.data.id],
        }));
        setNewFacilityName("");
        if (onRefreshFacilities) onRefreshFacilities();
      }
    } catch (err: any) {
      console.error("Failed to create facility:", err);
    } finally {
      setIsAddingFacility(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const generatedSlug =
        formData.slug.trim() ||
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");

      const payload = {
        ...formData,
        slug: generatedSlug,
        base_price: parseFloat(formData.base_price) || 0,
        capacity: parseInt(String(formData.capacity)) || 14,
        fast_fill_threshold: parseInt(String(formData.fast_fill_threshold)) || 4,
        slot_duration_minutes: parseInt(String(formData.slot_duration_minutes)) || 60,
      };

      if (turf) {
        await api.put(`/turfs/${turf.id}/`, payload);
      } else {
        await api.post("/turfs/", payload);
      }

      setSuccessMsg("Turf pitch specifications saved successfully!");
      setTimeout(() => {
        onSaved();
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.detail ||
          err.response?.data?.error ||
          JSON.stringify(err.response?.data) ||
          "Failed to save turf ground details."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-900 to-[#047857] text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 block">
                {turf ? "TURF VENUE CUSTOMIZER" : "NEW ARENA CREATOR"}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight">
                {turf ? turf.name : "Register New Turf Arena"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 overflow-x-auto no-scrollbar">
          {[
            { id: "general", label: "General & Branding", icon: Layers },
            { id: "media", label: `Photos & Media (${formData.images.length})`, icon: ImageIcon },
            { id: "specs", label: "Technical Specs", icon: ShieldCheck },
            { id: "timings", label: "Timings & Slots", icon: Clock },
            { id: "amenities", label: "Amenities & Perks", icon: Sun },
            { id: "location", label: "Venue Location", icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-3.5 px-4 text-xs font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "border-[#059669] text-[#059669] bg-white shadow-xs"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/50"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#059669]" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[68vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#059669] text-xs font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#059669]" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: General & Branding */}
          {activeTab === "general" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Pitch / Arena Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pitch 1 — Champions Arena"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Slug / URL Identifier
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. champions-arena (auto-generated if blank)"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Sport Discipline</label>
                  <select
                    value={formData.sport_type}
                    onChange={(e) => setFormData({ ...formData, sport_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden cursor-pointer"
                  >
                    <option value="FOOTBALL">Football (7v7 / 9v9 / 5v5)</option>
                    <option value="CRICKET">Box Cricket</option>
                    <option value="MULTI_SPORT">Multi-Sport Arena</option>
                    <option value="BADMINTON">Badminton Court</option>
                    <option value="TENNIS">Tennis Court</option>
                    <option value="PICKLEBALL">Pickleball</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">
                    Standard Hourly Rate (₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="any"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                      className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Operational Status</label>
                  <div className="flex items-center space-x-2 pt-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#059669]"></div>
                    </label>
                    <span className="text-xs font-bold text-slate-700">
                      {formData.is_active ? "● Open for Booking" : "○ Temporarily Closed"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Pitch Description & Highlights</label>
                <textarea
                  rows={3}
                  placeholder="Describe turf shockpad grading, grass fiber quality, recommended play styles, tournament lighting..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Custom Photos & Media */}
          {activeTab === "media" && (
            <div>
              <TurfImageManager
                images={formData.images}
                onChange={(newImgs) => setFormData({ ...formData, images: newImgs })}
              />
            </div>
          )}

          {/* TAB 3: Technical Specifications */}
          {activeTab === "specs" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#F0FDF4] border border-emerald-200 space-y-1">
                <div className="flex items-center space-x-2 text-[#059669] font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Quality Assurance Badges</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Provide detailed pitch surface specifications to inspire customer confidence and justify premium match pricing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Turf Surface Specification</label>
                  <input
                    type="text"
                    placeholder="e.g. 50mm Monofilament Synthetic Turf"
                    value={formData.surface_spec}
                    onChange={(e) => setFormData({ ...formData, surface_spec: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Lighting & Floodlight Array</label>
                  <input
                    type="text"
                    placeholder="e.g. 400 Lux Anti-Glare Stadium LED Floodlights"
                    value={formData.lighting_spec}
                    onChange={(e) => setFormData({ ...formData, lighting_spec: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Pitch Playing Dimensions</label>
                  <input
                    type="text"
                    placeholder="e.g. 110ft x 70ft (7v7 Standard Pitch)"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Dugout & Tactical Amenities</label>
                  <input
                    type="text"
                    placeholder="e.g. 14-Player Shaded Dugout with Tactical Boards"
                    value={formData.dugout_spec}
                    onChange={(e) => setFormData({ ...formData, dugout_spec: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Max Athlete Capacity</label>
                  <input
                    type="number"
                    min="2"
                    max="50"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 14 })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Quality / Pro Certified Badge</label>
                  <label className="flex items-center space-x-2 p-2.5 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100">
                    <input
                      type="checkbox"
                      checked={formData.is_fifa_certified}
                      onChange={(e) => setFormData({ ...formData, is_fifa_certified: e.target.checked })}
                      className="rounded text-[#059669] focus:ring-[#059669]"
                    />
                    <span className="text-xs font-bold text-slate-800">Display "Pro Quality Certified" Badge</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Timings & Slots */}
          {activeTab === "timings" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Daily Opening Time</label>
                  <input
                    type="time"
                    value={formData.operating_hours_start}
                    onChange={(e) => setFormData({ ...formData, operating_hours_start: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Daily Closing Time</label>
                  <input
                    type="time"
                    value={formData.operating_hours_end}
                    onChange={(e) => setFormData({ ...formData, operating_hours_end: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-800">Base Slot Duration</label>
                  <select
                    value={formData.slot_duration_minutes}
                    onChange={(e) => setFormData({ ...formData, slot_duration_minutes: parseInt(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden cursor-pointer"
                  >
                    <option value={30}>30 Minutes</option>
                    <option value={60}>60 Minutes (Standard)</option>
                    <option value={90}>90 Minutes (Match & Half)</option>
                    <option value={120}>120 Minutes (Full Tournament)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1 pt-2">
                <label className="block text-xs font-bold text-slate-800">
                  Fast-Fill Threshold (Slots Remaining)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.fast_fill_threshold}
                  onChange={(e) => setFormData({ ...formData, fast_fill_threshold: parseInt(e.target.value) || 4 })}
                  className="w-full max-w-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                />
                <span className="text-[11px] text-slate-500 block">
                  When remaining slots for a day reach this number or lower, the "Fast Fill" badge is automatically displayed to create urgency.
                </span>
              </div>
            </div>
          )}

          {/* TAB 5: Amenities & Facility Checklist */}
          {activeTab === "amenities" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Included Match Amenities ({formData.facility_ids.length} selected)
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Select perks available for squads playing on this pitch.
                  </span>
                </div>

                {/* Quick Add Custom Facility */}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="New amenity name..."
                    value={newFacilityName}
                    onChange={(e) => setNewFacilityName(e.target.value)}
                    className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-[#059669]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateFacility}
                    disabled={isAddingFacility || !newFacilityName.trim()}
                    className="px-2.5 py-1 rounded-lg bg-[#059669] text-white text-xs font-bold hover:bg-[#047857] disabled:opacity-50 cursor-pointer flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {facilities.map((f) => {
                  const isChecked = formData.facility_ids.includes(f.id);
                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        if (isChecked) {
                          setFormData({
                            ...formData,
                            facility_ids: formData.facility_ids.filter((id) => id !== f.id),
                          });
                        } else {
                          setFormData({
                            ...formData,
                            facility_ids: [...formData.facility_ids, f.id],
                          });
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center space-x-2.5 cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#ECFDF5] border-[#059669] text-[#059669]"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center text-xs transition-all ${
                          isChecked
                            ? "bg-[#059669] text-white"
                            : "border border-slate-300 bg-white"
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold select-none">{f.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 6: Venue Location */}
          {activeTab === "location" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Campus Location Name</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-800">Detailed Facility Address</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-[#059669] focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Modal Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              {turf && onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(turf)}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Arena</span>
                </button>
              )}
              <span className="text-[11px] text-slate-400">
                Changes update real-time booking slots and customer views instantly upon saving.
              </span>
            </div>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center space-x-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Saving Arena...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{turf ? "Save Changes" : "Create Pitch"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
