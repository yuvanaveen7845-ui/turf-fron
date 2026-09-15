import React, { useState, useEffect } from "react";
import {
  Layers,
  PlusCircle,
  Edit3,
  Trash2,
  ShieldCheck,
  MapPin,
  Check,
} from "lucide-react";
import api from "../../services/api";
import { Turf, Facility } from "../../types";

export const ManageTurfsPage: React.FC = () => {
  const [turfs, setTurfs] = useState<Turf[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTurf, setEditingTurf] = useState<Turf | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sport_type: "FOOTBALL",
    description: "",
    location: "",
    address: "",
    base_price: "1400",
    capacity: 14,
    operating_hours_start: "06:00:00",
    operating_hours_end: "23:00:00",
    slot_duration_minutes: 60,
    images: [
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
    ],
    facility_ids: [] as string[],
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([api.get("/turfs/"), api.get("/turfs/facilities/")])
      .then(([tRes, fRes]) => {
        setTurfs(tRes.data);
        setFacilities(fRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingTurf(null);
    setFormData({
      name: "",
      slug: "",
      sport_type: "FOOTBALL",
      description: "",
      location: "",
      address: "",
      base_price: "1400",
      capacity: 14,
      operating_hours_start: "06:00:00",
      operating_hours_end: "23:00:00",
      slot_duration_minutes: 60,
      images: [
        "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=1200&q=80",
      ],
      facility_ids: [],
    });
    setShowModal(true);
  };

  const openEditModal = (t: Turf) => {
    setEditingTurf(t);
    setFormData({
      name: t.name,
      slug: t.slug,
      sport_type: t.sport_type,
      description: t.description,
      location: t.location,
      address: t.address,
      base_price: String(t.base_price),
      capacity: t.capacity,
      operating_hours_start: t.operating_hours_start,
      operating_hours_end: t.operating_hours_end,
      slot_duration_minutes: t.slot_duration_minutes,
      images: t.images,
      facility_ids: t.facilities_data?.map((f) => f.id) || [],
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        slug:
          formData.slug ||
          formData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      };
      if (editingTurf) {
        await api.put(`/turfs/${editingTurf.id}/`, payload);
      } else {
        await api.post("/turfs/", payload);
      }
      setShowModal(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to save turf.");
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm("Deactivate this turf?")) return;
    try {
      await api.delete(`/turfs/${id}/`);
      fetchData();
    } catch (err) {
      alert("Action failed.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
            Ground Inventory
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Turf Arenas Management
          </h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center space-x-2 transition-colors shadow-lg shadow-purple-600/20"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Turf Arena</span>
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-900 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {turfs.map((turf) => (
            <div
              key={turf.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4 w-full md:w-auto">
                <img
                  src={turf.images[0]}
                  alt={turf.name}
                  className="w-16 h-16 rounded-xl object-cover bg-slate-800 shrink-0"
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-white">
                      {turf.name}
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 font-bold">
                      {turf.sport_type}
                    </span>
                    {!turf.is_active && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-bold">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{turf.location}</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Base: <strong>₹{turf.base_price}/hr</strong> • Max:{" "}
                    <strong>{turf.capacity} Players</strong> • Rating:{" "}
                    <strong>{turf.rating}★</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 w-full md:w-auto justify-end">
                <button
                  onClick={() => openEditModal(turf)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDeactivate(turf.id)}
                  className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-400 text-xs font-bold transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Turf Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-3xl p-6 sm:p-8 space-y-5 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-white">
              {editingTurf ? "Edit Turf Arena" : "Add New Turf Arena"}
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Turf Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g. Apex Football Ground"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Sport Type
                  </label>
                  <select
                    value={formData.sport_type}
                    onChange={(e) =>
                      setFormData({ ...formData, sport_type: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                  >
                    <option value="FOOTBALL">Football 7v7</option>
                    <option value="CRICKET">Box Cricket</option>
                    <option value="MULTI_SPORT">Multi-Sport Dome</option>
                    <option value="BADMINTON">Badminton</option>
                    <option value="TENNIS">Tennis</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Area / City Location
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g. Whitefield, Bengaluru"
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Base Price (₹ / hr)
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.base_price}
                    onChange={(e) =>
                      setFormData({ ...formData, base_price: e.target.value })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Full Venue Address
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street, Landmark, Postal code"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Max Player Capacity
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.images[0] || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, images: [e.target.value] })
                    }
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none"
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
                  Save Turf Arena
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
