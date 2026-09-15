import React, { useState, useEffect } from "react";
import {
  Tag,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  Percent,
  IndianRupee,
} from "lucide-react";
import api from "../../services/api";
import { Coupon } from "../../types";

export const ManageCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    code: "",
    title: "",
    description: "",
    discount_type: "PERCENTAGE",
    discount_value: "",
    min_booking_amount: "500",
    max_discount_amount: "300",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    usage_limit: "100",
    per_user_limit: "1",
    is_active: true,
  });

  const fetchCoupons = () => {
    setLoading(true);
    api
      .get("/promotions/coupons/")
      .then((res) => setCoupons(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await api.patch(`/promotions/coupons/${coupon.id}/`, {
        is_active: !coupon.is_active,
      });
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;
    try {
      await api.delete(`/promotions/coupons/${id}/`);
      fetchCoupons();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post("/promotions/coupons/", {
        code: formData.code.toUpperCase().trim(),
        title: formData.title,
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_booking_amount: parseFloat(formData.min_booking_amount),
        max_discount_amount: formData.max_discount_amount
          ? parseFloat(formData.max_discount_amount)
          : null,
        start_date: formData.start_date,
        end_date: formData.end_date,
        usage_limit: parseInt(formData.usage_limit),
        per_user_limit: parseInt(formData.per_user_limit),
        is_active: formData.is_active,
      });
      setShowModal(false);
      setFormData({
        code: "",
        title: "",
        description: "",
        discount_type: "PERCENTAGE",
        discount_value: "",
        min_booking_amount: "500",
        max_discount_amount: "300",
        start_date: new Date().toISOString().split("T")[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        usage_limit: "100",
        per_user_limit: "1",
        is_active: true,
      });
      fetchCoupons();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.error ||
          err.response?.data?.detail ||
          "Failed to create coupon.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCoupons = coupons.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.title.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Marketing & Deals
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Promotional Coupons
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {/* Search & Stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search coupon code or title..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Total Offers: <strong className="text-white">{coupons.length}</strong>{" "}
          | Active:{" "}
          <strong className="text-emerald-400">
            {coupons.filter((c) => c.is_active).length}
          </strong>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Coupon Code</th>
                <th className="py-3.5 px-4">Offer Details</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4">Usage (Used / Limit)</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading promotional coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No coupons found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 text-sm">
                      {coupon.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{coupon.title}</div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {coupon.description}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg">
                        {coupon.discount_type === "PERCENTAGE" ? (
                          <>
                            <Percent className="w-3 h-3 text-amber-400" />
                            {coupon.discount_value}% OFF
                          </>
                        ) : (
                          <>
                            <IndianRupee className="w-3 h-3 text-emerald-400" />
                            ₹{coupon.discount_value} FLAT
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          {coupon.start_date} → {coupon.end_date}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Min Order: ₹{coupon.min_booking_amount}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">
                        {coupon.usage_count} / {coupon.usage_limit}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Max {coupon.per_user_limit}/user
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(coupon)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition ${
                          coupon.is_active
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        }`}
                      >
                        {coupon.is_active ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {coupon.is_active ? "ACTIVE" : "INACTIVE"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(coupon.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title="Delete Coupon"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Coupon Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Tag className="w-5 h-5 text-emerald-400" />
                Create New Coupon
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TURF50"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white uppercase font-mono font-bold outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Offer Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Weekend Rush Special"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Get instant flat discount on prime turf bookings"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Discount Type *
                  </label>
                  <select
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Flat Cash (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Discount Value *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 20 or 150"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_value: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Min Booking Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.min_booking_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_booking_amount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Max Cap Amount (₹)
                  </label>
                  <input
                    type="number"
                    placeholder="Leave empty if none"
                    value={formData.max_discount_amount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_discount_amount: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    value={formData.usage_limit}
                    onChange={(e) =>
                      setFormData({ ...formData, usage_limit: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Per-User Limit
                  </label>
                  <input
                    type="number"
                    value={formData.per_user_limit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        per_user_limit: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {submitting ? "Creating..." : "Create Coupon"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
