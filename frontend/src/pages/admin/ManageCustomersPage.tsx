import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Wallet,
  Award,
  CreditCard,
  Shield,
  Phone,
  Mail,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react";
import api from "../../services/api";
import { User } from "../../types";

export const ManageCustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Wallet Adjust Modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState(
    "Admin compensation / bonus",
  );
  const [adjusting, setAdjusting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const fetchCustomers = () => {
    setLoading(true);
    api
      .get(
        `/auth/admin/customers/${search ? `?search=${encodeURIComponent(search)}` : ""}`,
      )
      .then((res) => setCustomers(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleOpenAdjust = (customer: User) => {
    setSelectedUser(customer);
    setAdjustAmount("");
    setFeedbackMsg("");
    setAdjustModal(true);
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !adjustAmount || parseFloat(adjustAmount) <= 0) return;

    setAdjusting(true);
    setFeedbackMsg("");

    try {
      await api.post("/wallet/admin/adjust/", {
        user_id: selectedUser.id,
        amount: parseFloat(adjustAmount),
        type: adjustType,
        reason: adjustReason,
      });

      setFeedbackMsg(
        `Successfully ${adjustType === "CREDIT" ? "credited" : "debited"} ₹${adjustAmount}!`,
      );
      setTimeout(() => {
        setAdjustModal(false);
        fetchCustomers();
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg(
        err.response?.data?.error || "Failed to adjust customer wallet.",
      );
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            Customer CRM
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Manage Customers
          </h1>
        </div>

        <button
          onClick={fetchCustomers}
          className="text-xs font-bold text-emerald-400 hover:underline"
        >
          ↻ Refresh List
        </button>
      </div>

      {/* Search Bar & Summary */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, phone..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Registered Players:{" "}
          <strong className="text-white">{customers.length}</strong>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Tier & Points</th>
                <th className="py-3.5 px-4">Wallet Balance</th>
                <th className="py-3.5 px-4">Bookings / Spend</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading customer database...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((user) => {
                  const prof = user.customer_profile;
                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-slate-800/40 transition"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                            {user.first_name?.[0] || user.email[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">
                              {user.full_name || user.email}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Ref: {user.referral_code}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs text-white">
                          <Mail className="w-3 h-3 text-slate-500" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/30 uppercase">
                          <Shield className="w-2.5 h-2.5" />
                          {prof?.membership_tier || "BRONZE"}
                        </span>
                        <div className="text-[11px] text-amber-400 font-bold mt-1 flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          {prof?.loyalty_points || 0} pts
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-emerald-400 text-sm">
                          ₹
                          {parseFloat(
                            String(prof?.wallet_balance || "0"),
                          ).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">
                          {prof?.total_bookings || 0} matches
                        </div>
                        <div className="text-[10px] text-slate-500">
                          ₹
                          {parseFloat(
                            String(prof?.total_spending || "0"),
                          ).toFixed(0)}{" "}
                          total
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAdjust(user)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 font-bold rounded-lg border border-slate-700 hover:border-emerald-500/30 transition text-xs"
                          title="Adjust Customer Wallet"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          Adjust Wallet
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Wallet Modal */}
      {adjustModal && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-base font-black text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                Adjust Wallet Balance
              </h2>
              <button
                onClick={() => setAdjustModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {feedbackMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-bold text-center">
                {feedbackMsg}
              </div>
            )}

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
              <div className="text-slate-400">
                Customer:{" "}
                <strong className="text-white">
                  {selectedUser.full_name || selectedUser.email}
                </strong>
              </div>
              <div className="text-slate-400 mt-1">
                Current Balance:{" "}
                <strong className="text-emerald-400 font-mono">
                  ₹
                  {parseFloat(
                    String(
                      selectedUser.customer_profile?.wallet_balance || "0",
                    ),
                  ).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleAdjustWallet} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-2">
                  Adjustment Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("CREDIT")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold border transition ${
                      adjustType === "CREDIT"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    Credit (+ Cash)
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEBIT")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold border transition ${
                      adjustType === "DEBIT"
                        ? "bg-rose-500/20 text-rose-400 border-rose-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    Debit (- Cash)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Amount (₹) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold outline-none focus:border-emerald-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Reason / Note *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Match cancellation compensation, tournament reward"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAdjustModal(false)}
                  className="px-4 py-2 text-slate-400 hover:text-white font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adjusting}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  {adjusting ? "Processing..." : "Apply Wallet Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
