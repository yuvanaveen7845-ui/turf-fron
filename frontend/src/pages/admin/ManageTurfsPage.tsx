import React, { useState, useEffect } from "react";
import {
  Layers,
  PlusCircle,
  Edit3,
  Trash2,
  ShieldCheck,
  MapPin,
  Users,
  Sun,
  Star,
  CheckCircle2,
  Sparkles,
  Lock,
  Sliders,
  Calendar,
  Clock,
  ArrowRight,
  ImageIcon,
  Maximize2,
} from "lucide-react";
import api from "../../services/api";
import { Turf, Facility } from "../../types";
import { Button, ConfirmDialog, EmptyState } from "../../components/ui";
import { QuickBlockSlotModal } from "../../components/admin/QuickBlockSlotModal";
import { QuickPriceChangeModal } from "../../components/admin/QuickPriceChangeModal";
import { TurfCustomEditorModal } from "../../components/admin/TurfCustomEditorModal";
import { useNavigate } from "react-router-dom";

export const ManageTurfsPage: React.FC = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);
  const [deactivatingTurfId, setDeactivatingTurfId] = useState<string | null>(null);
  const navigate = useNavigate();

  // Quick Action modal states
  const [quickBlockTurfId, setQuickBlockTurfId] = useState<string | number | undefined>();
  const [isQuickBlockOpen, setIsQuickBlockOpen] = useState(false);

  const [quickPriceTurfId, setQuickPriceTurfId] = useState<string | number | undefined>();
  const [isQuickPriceOpen, setIsQuickPriceOpen] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/turfs/"), api.get("/turfs/facilities/")])
      .then(([tRes, fRes]) => {
        const tList = Array.isArray(tRes.data) ? tRes.data : tRes.data?.results || [];
        const fList = Array.isArray(fRes.data) ? fRes.data : fRes.data?.results || [];
        setTurfs(tList);
        setFacilities(fList);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTurf(null);
    setShowEditorModal(true);
  };

  const openEditModal = (t: Turf) => {
    setEditingTurf(t);
    setShowEditorModal(true);
  };

  const confirmDeactivate = async () => {
    if (!deactivatingTurfId) return;
    try {
      await api.delete(`/turfs/${deactivatingTurfId}/`);
      setDeactivatingTurfId(null);
      fetchData();
    } catch (err) {
      console.error("Deactivate failed:", err);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Complete Arena Customization</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Turf Pitches & Arenas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Full control over turf photos (device upload & URL), surface specs, floodlights, dugouts, pricing, and operating rules.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={openCreateModal}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          + Add New Turf
        </Button>
      </div>

      {/* Visual Venue Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-80 bg-white rounded-3xl border border-slate-200 animate-pulse"
            />
          ))}
        </div>
      ) : turfs.length === 0 ? (
        <EmptyState
          title="No turf grounds registered yet"
          description="Create your first synthetic turf pitch or indoor arena with custom photos to start accepting bookings."
          actionText="Add New Turf Ground"
          onAction={openCreateModal}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {turfs.map((turf) => (
            <div
              key={turf.id}
              className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Banner with gallery indicator */}
                <div className="h-44 relative bg-slate-100 overflow-hidden">
                  <img
                    src={turf.images?.[0] || "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80"}
                    alt={turf.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-900/80 text-white backdrop-blur-xs">
                      {turf.sport_type}
                    </span>
                    {turf.is_fifa_certified && (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-[#059669] text-white flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        Pro Grade
                      </span>
                    )}
                  </div>

                  {/* Photo Count badge */}
                  {turf.images && turf.images.length > 1 && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/60 text-white text-[10px] font-bold backdrop-blur-xs flex items-center space-x-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>{turf.images.length} photos</span>
                    </div>
                  )}

                  {/* Bottom pricing tag */}
                  <div className="absolute bottom-3 right-3 z-10">
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-white/95 text-slate-900 shadow-sm font-mono">
                      ₹{turf.base_price}/hr
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 z-10 text-white text-[11px] font-medium flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span className="line-clamp-1">{turf.location || "Friends Turf, Tiruppur"}</span>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-5 space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-extrabold text-slate-900 line-clamp-1">
                        {turf.name}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          turf.is_active
                            ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                            : "text-amber-700 bg-amber-50 border-amber-200"
                        }`}
                      >
                        {turf.is_active ? "● Open" : "○ Closed"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                      {turf.description || `${turf.surface_spec} • Capacity: ${turf.capacity} athletes`}
                    </p>
                  </div>

                  {/* Specs Matrix */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Surface:</span>
                      <span className="font-bold text-slate-800 line-clamp-1">{turf.surface_spec}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dimensions:</span>
                      <span className="font-bold text-slate-800">{turf.dimensions || "Standard"}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Lighting:</span>
                      <span className="font-bold text-slate-800 line-clamp-1">{turf.lighting_spec}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Hours:</span>
                      <span className="font-bold text-[#059669]">
                        {turf.operating_hours_start?.slice(0, 5)} - {turf.operating_hours_end?.slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin/schedule")}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-[#059669]" />}
                >
                  Schedule
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuickBlockTurfId(turf.id);
                    setIsQuickBlockOpen(true);
                  }}
                  leftIcon={<Lock className="w-3.5 h-3.5 text-amber-600" />}
                >
                  Block Slot
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQuickPriceTurfId(turf.id);
                    setIsQuickPriceOpen(true);
                  }}
                  leftIcon={<Sliders className="w-3.5 h-3.5 text-purple-600" />}
                >
                  Pricing
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => openEditModal(turf)}
                  leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                >
                  Edit Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comprehensive Turf Customization Modal */}
      <TurfCustomEditorModal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        turf={editingTurf}
        onSaved={fetchData}
        facilities={facilities}
        onRefreshFacilities={fetchData}
      />

      {/* Quick Action Modals */}
      <QuickBlockSlotModal
        isOpen={isQuickBlockOpen}
        onClose={() => {
          setIsQuickBlockOpen(false);
          setQuickBlockTurfId(undefined);
        }}
        defaultTurfId={quickBlockTurfId}
        onSlotBlocked={fetchData}
      />

      <QuickPriceChangeModal
        isOpen={isQuickPriceOpen}
        onClose={() => {
          setIsQuickPriceOpen(false);
          setQuickPriceTurfId(undefined);
        }}
        defaultTurfId={quickPriceTurfId}
        onPriceUpdated={fetchData}
      />
    </div>
  );
};
