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
  Sparkles,
} from "lucide-react";
import api from "../../services/api";
import { Coupon } from "../../types";
import { Button, Input, Select, Modal, ConfirmDialog, DataTable, EmptyState } from "../../components/ui";

export const ManageCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingCouponId, setDeletingCouponId] = useState<string | null>(null);
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
      .then((res) => {
        const raw = res.data;
        const list = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.results)
          ? raw.results
          : [];
        setCoupons(list);
      })
      .catch((err) => {
        console.error("Failed to load coupons:", err);
        setCoupons([]);
      })
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

  const confirmDelete = async () => {
    if (!deletingCouponId) return;
    try {
      await api.delete(`/promotions/coupons/${deletingCouponId}/`);
      setDeletingCouponId(null);
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
          "Failed to create coupon."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "code",
      header: "Coupon Code",
      sortable: true,
      render: (coupon: Coupon) => (
        <span className="font-mono font-extrabold text-[#059669] text-sm">
          {coupon.code}
        </span>
      ),
    },
    {
      key: "title",
      header: "Offer Details",
      render: (coupon: Coupon) => (
        <div>
          <div className="font-bold text-slate-900">{coupon.title}</div>
          <div className="text-[11px] text-slate-500 line-clamp-1">
            {coupon.description}
          </div>
        </div>
      ),
    },
    {
      key: "discount",
      header: "Discount",
      render: (coupon: Coupon) => (
        <span className="inline-flex items-center gap-1 font-bold text-slate-900 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
          {coupon.discount_type === "PERCENTAGE" ? (
            <>
              <Percent className="w-3.5 h-3.5 text-amber-500" />
              <span>{coupon.discount_value}% OFF</span>
            </>
          ) : (
            <>
              <IndianRupee className="w-3.5 h-3.5 text-[#059669]" />
              <span>₹{coupon.discount_value} FLAT</span>
            </>
          )}
        </span>
      ),
    },
    {
      key: "validity",
      header: "Validity Period",
      render: (coupon: Coupon) => (
        <div className="text-slate-600 text-xs">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <span>
              {coupon.start_date} → {coupon.end_date}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Min Order: ₹{coupon.min_booking_amount}
          </div>
        </div>
      ),
    },
    {
      key: "usage",
      header: "Usage (Used / Limit)",
      render: (coupon: Coupon) => (
        <div>
          <div className="font-bold text-slate-900">
            {coupon.usage_count} / {coupon.usage_limit}
          </div>
          <div className="text-[10px] text-slate-400">
            Max {coupon.per_user_limit}/user
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (coupon: Coupon) => (
        <button
          onClick={() => handleToggleActive(coupon)}
          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition cursor-pointer ${
            coupon.is_active
              ? "bg-emerald-50 text-[#059669] border-emerald-200 hover:bg-emerald-100"
              : "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
          }`}
        >
          {coupon.is_active ? (
            <CheckCircle className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          <span>{coupon.is_active ? "ACTIVE" : "INACTIVE"}</span>
        </button>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (coupon: Coupon) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeletingCouponId(coupon.id)}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 p-1.5"
          title="Delete Coupon"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-[#059669]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Promotions & Player Acquisition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Promotional Coupons Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Create percentage discounts, fixed cash vouchers, and customer acquisition deals
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setErrorMsg("");
            setShowModal(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Create New Coupon
        </Button>
      </div>

      {/* Coupons DataTable */}
      <DataTable
        columns={columns}
        data={coupons}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search coupon code or title..."
        searchableKey={(c) => `${c.code} ${c.title}`}
        emptyTitle="No coupons found"
        emptyDescription="Create your first promotional discount coupon to boost player match bookings."
        emptyActionText="Create Coupon"
        onEmptyAction={() => setShowModal(true)}
      />

      {/* Create Coupon Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create Promotional Coupon"
        description="Configure discount rules, date limits, and user limits"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Coupon Code"
              isRequired
              placeholder="e.g. TURF50"
              value={formData.code}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  code: e.target.value.toUpperCase(),
                })
              }
            />
            <Input
              label="Offer Title"
              isRequired
              placeholder="e.g. Weekend Rush Special"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              placeholder="Get instant flat discount on prime turf bookings"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 outline-none focus:bg-white focus:border-[#059669] focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Discount Type"
              isRequired
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_type: e.target.value,
                })
              }
              options={[
                { value: "PERCENTAGE", label: "Percentage (%)" },
                { value: "FIXED", label: "Flat Cash (₹)" },
              ]}
            />
            <Input
              label="Discount Value"
              isRequired
              type="number"
              step="0.01"
              placeholder="e.g. 20 or 150"
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discount_value: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Min Booking Amount (₹)"
              type="number"
              value={formData.min_booking_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  min_booking_amount: e.target.value,
                })
              }
            />
            <Input
              label="Max Cap Amount (₹)"
              type="number"
              placeholder="Leave empty if none"
              value={formData.max_discount_amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  max_discount_amount: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
            />
            <Input
              label="End Date"
              type="date"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Total Usage Limit"
              type="number"
              value={formData.usage_limit}
              onChange={(e) =>
                setFormData({ ...formData, usage_limit: e.target.value })
              }
            />
            <Input
              label="Per-User Limit"
              type="number"
              value={formData.per_user_limit}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  per_user_limit: e.target.value,
                })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
            >
              Create Coupon
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingCouponId)}
        onClose={() => setDeletingCouponId(null)}
        onConfirm={confirmDelete}
        title="Delete Coupon Offer?"
        message="This will deactivate and remove the coupon code from the platform. Existing bookings that redeemed this code will retain their discounts."
        confirmText="Delete Coupon"
        isDestructive
      />
    </div>
  );
};
