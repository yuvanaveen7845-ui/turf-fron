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
  Sparkles,
  UserPlus,
  PlusCircle,
} from "lucide-react";
import api from "../../services/api";
import { User } from "../../types";
import { Button, Input, Modal, DataTable, EmptyState } from "../../components/ui";
import { QuickCustomerModal } from "../../components/admin/QuickCustomerModal";
import { NewBookingWizardModal } from "../../components/admin/NewBookingWizardModal";
import { useToast } from "../../context/ToastContext";
import { normalizeList } from "../../utils/helpers";

export const ManageCustomersPage: React.FC = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Action Modals
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [bookingCustomerId, setBookingCustomerId] = useState<string | number | undefined>();

  // Wallet Adjust Modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustModal, setAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<"CREDIT" | "DEBIT">("CREDIT");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState(
    "Admin compensation / bonus"
  );
  const [adjusting, setAdjusting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Customer 360 Profile CRM Modal
  const [crmCustomer, setCrmCustomer] = useState<any | null>(null);
  const [crmLoading, setCrmLoading] = useState(false);
  const [newNoteText, setNewNoteText] = useState("");
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [crmModal, setCrmModal] = useState(false);

  const fetchCustomers = () => {
    setLoading(true);
    api
      .get("/auth/customers/")
      .then((res) => {
        setCustomers(normalizeList<User>(res.data));
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCrmProfile = async (user: User) => {
    setCrmLoading(true);
    setCrmCustomer(null);
    try {
      const res = await api.get(`/auth/customers/${user.id}/crm/`);
      setCrmCustomer(res.data);
    } catch (err) {
      console.error("Failed to load customer CRM profile:", err);
      toast.error("Failed to load CRM profile.");
    } finally {
      setCrmLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmCustomer || !newNoteText.trim()) return;

    setNoteSubmitting(true);
    try {
      const res = await api.post(`/auth/customers/${crmCustomer.customer.id}/notes/`, {
        note: newNoteText.trim(),
      });
      setCrmCustomer((prev: any) => ({
        ...prev,
        notes: [res.data, ...(prev?.notes || [])],
      }));
      setNewNoteText("");
      toast.success("Customer note saved.");
    } catch (err) {
      toast.error("Failed to save customer note.");
    } finally {
      setNoteSubmitting(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    if (!crmCustomer) return;
    try {
      await api.delete(`/auth/customers/${crmCustomer.customer.id}/notes/${noteId}/`);
      setCrmCustomer((prev: any) => ({
        ...prev,
        notes: prev.notes.filter((n: any) => n.id !== noteId),
      }));
      toast.success("Note removed.");
    } catch (err) {
      toast.error("Failed to delete note.");
    }
  };

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
        `Successfully ${adjustType === "CREDIT" ? "credited" : "debited"} ₹${adjustAmount}!`
      );
      setTimeout(() => {
        setAdjustModal(false);
        fetchCustomers();
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg(
        err.response?.data?.error || "Failed to adjust customer wallet."
      );
    } finally {
      setAdjusting(false);
    }
  };

  const columns = [
    {
      key: "customer",
      header: "Customer",
      render: (user: User) => (
        <div
          onClick={() => openCrmProfile(user)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center font-bold text-xs uppercase shadow-sm group-hover:scale-105 transition-transform">
            {user.first_name?.[0] || user.email[0]}
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm group-hover:text-[#059669] transition-colors">
              {user.full_name || user.email}
            </div>
            <div className="text-[11px] text-slate-400">
              {user.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Contact Info",
      render: (user: User) => (
        <div className="text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium text-slate-900">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            <span>{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "tier",
      header: "Membership Tier",
      render: (user: User) => {
        const prof = user.customer_profile;
        return (
          <div className="text-[12px] text-emerald-700 font-extrabold flex items-center gap-1">
            <Award className="w-4 h-4 text-emerald-600" />
            <span className="uppercase">{prof?.membership_tier || "STANDARD"}</span>
          </div>
        );
      },
    },
    {
      key: "wallet",
      header: "Wallet Balance",
      render: (user: User) => {
        const prof = user.customer_profile;
        return (
          <div className="font-mono font-black text-[#059669] text-sm">
            ₹{parseFloat(String(prof?.wallet_balance || "0")).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </div>
        );
      },
    },
    {
      key: "spend",
      header: "Bookings / Spend",
      render: (user: User) => {
        const prof = user.customer_profile;
        return (
          <div>
            <div className="font-bold text-slate-900">
              {prof?.total_bookings || 0} matches
            </div>
            <div className="text-[11px] text-slate-500">
              ₹{parseFloat(String(prof?.total_spending || "0")).toLocaleString("en-IN")} total
            </div>
          </div>
        );
      },
    },
    {
      key: "joined",
      header: "Joined Date",
      render: (user: User) => (
        <div className="text-slate-500 text-xs flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{new Date(user.date_joined).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (user: User) => (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setBookingCustomerId(user.id);
              setIsNewBookingOpen(true);
            }}
            className="text-[#059669] hover:bg-emerald-50 border-emerald-200"
            leftIcon={<PlusCircle className="w-3.5 h-3.5" />}
          >
            Book Match
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCrmProfile(user)}
          >
            CRM Profile
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleOpenAdjust(user)}
            leftIcon={<Wallet className="w-3.5 h-3.5 text-[#059669]" />}
          >
            Adjust
          </Button>
        </div>
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
            <span>Customer Relationship Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Customer Directory & CRM
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Registered players, booking frequency, match volume, and customer wallet credits
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsAddCustomerOpen(true)}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          + Add Customer
        </Button>
      </div>

      {/* Customers DataTable */}
      <DataTable
        columns={columns}
        data={customers}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search customer name, email, phone..."
        searchableKey={(u) => `${u.full_name} ${u.email} ${u.phone}`}
        emptyTitle="No registered customers yet"
        emptyDescription="Customer records will automatically populate when players register or book pitch slots."
      />

      {/* Adjust Wallet Modal */}
      {adjustModal && selectedUser && (
        <Modal
          isOpen={adjustModal}
          onClose={() => setAdjustModal(false)}
          title="Adjust Player Wallet Balance"
          description={`Customer: ${selectedUser.full_name || selectedUser.email}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            {feedbackMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[#059669] text-xs font-bold text-center">
                {feedbackMsg}
              </div>
            )}

            <div className="bg-[#F8FAFC] p-3 rounded-xl border border-slate-200 text-xs">
              <div className="text-slate-500">
                Current Balance:{" "}
                <strong className="text-[#059669] font-mono text-sm">
                  ₹{parseFloat(String(selectedUser.customer_profile?.wallet_balance || "0")).toFixed(2)}
                </strong>
              </div>
            </div>

            <form onSubmit={handleAdjustWallet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Adjustment Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType("CREDIT")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                      adjustType === "CREDIT"
                        ? "bg-emerald-50 text-[#059669] border-[#059669] ring-2 ring-emerald-500/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-[#059669]" />
                    <span>Credit (+ Cash)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType("DEBIT")}
                    className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold border transition cursor-pointer ${
                      adjustType === "DEBIT"
                        ? "bg-rose-50 text-rose-600 border-rose-500 ring-2 ring-rose-500/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-rose-500" />
                    <span>Debit (- Cash)</span>
                  </button>
                </div>
              </div>

              <Input
                label="Amount (₹)"
                isRequired
                type="number"
                step="0.01"
                placeholder="e.g. 500"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
              />

              <Input
                label="Adjustment Note / Reason"
                isRequired
                placeholder="e.g. Compensation for rainout, tournament prize"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAdjustModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={adjusting}
                >
                  Apply Balance
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* 360 Customer CRM Profile Modal */}
      {crmCustomer && (
        <Modal
          isOpen={!!crmCustomer}
          onClose={() => setCrmCustomer(null)}
          title={`Player 360 Profile: ${crmCustomer.customer.full_name || crmCustomer.customer.email}`}
          description={`Customer UID: ${crmCustomer.customer.id} • Registered ${new Date(crmCustomer.customer.date_joined).toLocaleDateString()}`}
          maxWidth="lg"
        >
          <div className="space-y-6 text-xs max-h-[75vh] overflow-y-auto pr-1">
            {/* Lifetime KPI Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500">Account Status</span>
                <div className="text-sm font-black text-[#059669] mt-1 uppercase flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-[#059669]" />
                  ACTIVE
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500">Total Spent</span>
                <div className="text-sm font-black text-slate-900 mt-1 font-mono">
                  ₹{parseFloat(String(crmCustomer.metrics?.total_spent || 0)).toLocaleString("en-IN")}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-slate-500">Bookings Count</span>
                <div className="text-sm font-black text-slate-900 mt-1">
                  {crmCustomer.metrics?.total_bookings || 0} matches
                </div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-[#059669]">Wallet Balance</span>
                <div className="text-sm font-black text-[#059669] mt-1 font-mono">
                  ₹{parseFloat(String(crmCustomer.metrics?.wallet_balance || 0)).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Contact & Membership Meta */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Account & Contact</span>
                <span className="font-mono text-[11px] text-slate-500">
                  Player ID: <strong className="text-slate-800">#{crmCustomer.customer.id.slice(0, 8)}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{crmCustomer.customer.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{crmCustomer.customer.phone || "No phone listed"}</span>
                </div>
              </div>
            </div>

            {/* Internal Staff Notes Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                  Internal Staff & Admin Notes ({crmCustomer.notes?.length || 0})
                </h4>
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add confidential customer note (e.g. VIP player, prefer pitch 1 evening)..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#059669]"
                />
                <Button type="submit" variant="primary" size="sm" isLoading={noteSubmitting}>
                  Add Note
                </Button>
              </form>

              {/* Notes List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {crmCustomer.notes && crmCustomer.notes.length > 0 ? (
                  crmCustomer.notes.map((n: any) => (
                    <div
                      key={n.id}
                      className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start justify-between gap-2"
                    >
                      <div>
                        <p className="text-xs text-slate-800 font-medium">{n.note}</p>
                        <div className="text-[10px] text-slate-400 mt-1">
                          By <strong className="text-slate-600">{n.created_by_name || "Staff"}</strong> •{" "}
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteNote(n.id)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                        title="Delete note"
                      >
                        ✕
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400 italic text-center py-2 bg-slate-50 rounded-xl">
                    No confidential notes recorded for this customer yet.
                  </div>
                )}
              </div>
            </div>

            {/* Recent Match Bookings */}
            <div className="space-y-2">
              <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider">
                Recent Bookings History ({crmCustomer.recent_bookings?.length || 0})
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Booking Ref</th>
                      <th className="p-2.5">Pitch</th>
                      <th className="p-2.5">Slot Date</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {crmCustomer.recent_bookings && crmCustomer.recent_bookings.length > 0 ? (
                      crmCustomer.recent_bookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-50/50">
                          <td className="p-2.5 font-mono font-bold text-slate-800">
                            #{b.booking_number || b.id}
                          </td>
                          <td className="p-2.5 font-medium text-slate-700">
                            {b.facility_name || "Turf Arena"}
                          </td>
                          <td className="p-2.5 text-slate-500">
                            {b.date} • {b.start_time?.slice(0, 5)}
                          </td>
                          <td className="p-2.5 font-mono font-bold text-slate-900">
                            ₹{parseFloat(b.total_amount || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-2.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === "CONFIRMED"
                                  ? "bg-emerald-50 text-[#059669]"
                                  : b.status === "CANCELLED"
                                  ? "bg-rose-50 text-rose-600"
                                  : "bg-amber-50 text-amber-600"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-slate-400">
                          No booking history found for this account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Quick Customer Registration Modal */}
      <QuickCustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        onCustomerCreated={fetchCustomers}
      />

      {/* Quick Match Booking Wizard */}
      <NewBookingWizardModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setBookingCustomerId(undefined);
        }}
        preselectedCustomerId={bookingCustomerId}
        onBookingCreated={fetchCustomers}
      />
    </div>
  );
};
