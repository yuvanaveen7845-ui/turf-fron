import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Shield,
  Phone,
  Mail,
  Building,
  CheckCircle,
  AlertCircle,
  Clock,
  Ban,
  UserX,
  UserPlus,
  Sparkles,
  ShieldAlert,
  Eye,
  Check,
  X,
} from "lucide-react";
import api from "../../services/api";
import { User, UserRole, UserStatus } from "../../types";
import { Button, Input, Select, Modal, DataTable, StatusBadge, EmptyState } from "../../components/ui";

export const ManageStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");

  // Role Change Confirmation Modal State
  const [roleChangeTarget, setRoleChangeTarget] = useState<{
    user: User;
    newRole: UserRole;
  } | null>(null);
  const [updatingRole, setUpdatingRole] = useState(false);

  // Access / Permissions Preview Modal State
  const [inspectUser, setInspectUser] = useState<User | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    role: "STAFF" as UserRole,
    status: "INVITED" as UserStatus,
    employee_id: "",
    department: "Turf Operations",
  });

  const fetchStaff = () => {
    setLoading(true);
    let url = "/auth/b2b-users/";
    const params = new URLSearchParams();
    if (roleFilter) params.append("role", roleFilter);
    if (statusFilter) params.append("status", statusFilter);
    if (params.toString()) url += `?${params.toString()}`;

    api
      .get(url)
      .then((res) => setStaffList(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter, statusFilter]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post("/auth/b2b-users/", formData);
      setShowModal(false);
      setActionSuccess(`Invited ${formData.email} successfully!`);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        role: "STAFF",
        status: "INVITED",
        employee_id: "",
        department: "Turf Operations",
      });
      fetchStaff();
      setTimeout(() => setActionSuccess(""), 4000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.email?.[0] ||
          err.response?.data?.error ||
          "Failed to invite B2B user. Please verify email and fields."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: UserStatus) => {
    try {
      await api.patch(`/auth/b2b-users/${userId}/`, { status: newStatus });
      setActionSuccess(`User status updated to ${newStatus}`);
      fetchStaff();
      setTimeout(() => setActionSuccess(""), 3000);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update status.");
    }
  };

  const executeRoleChange = async () => {
    if (!roleChangeTarget) return;
    setUpdatingRole(true);
    try {
      await api.patch(`/auth/b2b-users/${roleChangeTarget.user.id}/`, {
        role: roleChangeTarget.newRole,
      });
      setActionSuccess(
        `Role for ${roleChangeTarget.user.full_name} updated to ${roleChangeTarget.newRole}`
      );
      setRoleChangeTarget(null);
      fetchStaff();
      setTimeout(() => setActionSuccess(""), 3500);
    } catch (err: any) {
      alert(err.response?.data?.error || "Failed to update role.");
    } finally {
      setUpdatingRole(false);
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-emerald-50 text-[#059669] border-emerald-200";
    }
  };

  const columns = [
    {
      key: "user",
      header: "Authorized User",
      render: (member: User) => (
        <div className="flex items-center gap-3">
          {member.profile_image ? (
            <img
              src={member.profile_image}
              alt=""
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-[#059669] flex items-center justify-center font-bold text-xs uppercase shadow-sm">
              {member.first_name?.[0] || member.email[0]}
            </div>
          )}
          <div>
            <div className="font-bold text-slate-900 text-sm">
              {member.full_name || member.email}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              {member.email}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role Clearance",
      render: (member: User) => (
        <div className="flex items-center space-x-2">
          <select
            value={member.role}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              if (newRole !== member.role) {
                setRoleChangeTarget({ user: member, newRole });
              }
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border outline-none cursor-pointer ${getRoleBadgeClass(
              member.role
            )}`}
          >
            <option value="STAFF">STAFF</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <button
            onClick={() => setInspectUser(member)}
            title="Inspect permissions"
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (member: User) => (
        <StatusBadge status={member.status || "ACTIVE"} size="sm" />
      ),
    },
    {
      key: "department",
      header: "Department & ID",
      render: (member: User) => (
        <div>
          <div className="text-slate-900 font-bold text-xs">
            {member.staff_profile?.department || "Operations"}
          </div>
          <div className="text-[10px] text-slate-400 font-mono">
            {member.staff_profile?.employee_id || "FT-EMP"}
          </div>
        </div>
      ),
    },
    {
      key: "google",
      header: "Authentication",
      render: (member: User) => (
        <div>
          <div className="text-[11px] text-slate-700 flex items-center gap-1 font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                member.google_id ? "bg-[#10B981]" : "bg-amber-400"
              }`}
            />
            <span>{member.google_id ? "Google OAuth Linked" : "Pending First Sign-in"}</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {member.last_login_at
              ? new Date(member.last_login_at).toLocaleString([], {
                  dateStyle: "short",
                  timeStyle: "short",
                })
              : "Never"}
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right" as const,
      render: (member: User) => (
        <div className="flex items-center justify-end space-x-1.5">
          {member.status === "ACTIVE" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(member.id, "SUSPENDED")}
              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 border-rose-200 text-xs"
            >
              Suspend
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange(member.id, "ACTIVE")}
              className="text-[#059669] hover:bg-emerald-50 hover:text-[#047857] border-emerald-200 text-xs"
            >
              Activate
            </Button>
          )}
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
            <span>Corporate Access & Clearances</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            B2B Management & Operations Team
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) for ground staff and system administrators.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            setErrorMsg("");
            setShowModal(true);
          }}
          leftIcon={<UserPlus className="w-4 h-4" />}
        >
          Invite Team Member
        </Button>
      </div>

      {actionSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#059669]" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Staff DataTable */}
      <DataTable
        columns={columns}
        data={staffList}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        searchPlaceholder="Search name, email, employee ID..."
        searchableKey={(m) => `${m.full_name} ${m.email} ${m.staff_profile?.employee_id || ""}`}
        emptyTitle="No staff members found"
        emptyDescription="Invite your operations staff or administrator to manage ground operations."
        emptyActionText="Invite Staff"
        onEmptyAction={() => setShowModal(true)}
        headerActions={
          <div className="flex items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#059669]"
            >
              <option value="">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="STAFF">Staff</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:border-[#059669]"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INVITED">Invited</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        }
      />

      {/* Role Change Confirmation Modal (Requirement #43) */}
      <Modal
        isOpen={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        title="Confirm Clearance Change"
        description="Every role change is audited and immediately modifies backend access."
        maxWidth="md"
      >
        {roleChangeTarget && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">User Account:</span>
                <span className="font-black text-slate-900">
                  {roleChangeTarget.user.full_name} ({roleChangeTarget.user.email})
                </span>
              </div>
              <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                <span className="font-bold text-slate-600">Current Role:</span>
                <span className="font-extrabold px-2 py-0.5 rounded-lg bg-slate-200 text-slate-800">
                  {roleChangeTarget.user.role}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-600">New Role:</span>
                <span className="font-extrabold px-2 py-0.5 rounded-lg bg-[#059669] text-white">
                  {roleChangeTarget.newRole}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Security Notice:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {roleChangeTarget.newRole === "ADMIN"
                  ? "Elevating to ADMIN grants full business control, staff management, financial overrides, and audit log access."
                  : "STAFF role provides simplified operations access (schedule, check-in, walk-in, and offline payments)."}
              </p>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRoleChangeTarget(null)}
                disabled={updatingRole}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={executeRoleChange}
                isLoading={updatingRole}
              >
                Confirm Role Change
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Permissions Matrix Inspector Modal (Requirement #58) */}
      <Modal
        isOpen={!!inspectUser}
        onClose={() => setInspectUser(null)}
        title="Account Clearance Profile"
        description="Detailed breakdown of operational and management permissions."
        maxWidth="md"
      >
        {inspectUser && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div>
                <div className="font-extrabold text-sm text-slate-900">
                  {inspectUser.full_name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {inspectUser.email}
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2.5 py-1 rounded-xl text-xs font-black ${getRoleBadgeClass(inspectUser.role)}`}>
                  {inspectUser.role}
                </span>
                <span className="block text-[10px] font-bold text-slate-400 mt-1 uppercase">
                  {inspectUser.status}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 block px-1">
                Capability Matrix:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  {
                    name: "Today's Schedule & QR Check-in",
                    allowed: ["STAFF", "ADMIN"].includes(inspectUser.role),
                  },
                  {
                    name: "Walk-in & Offline Payments",
                    allowed: ["STAFF", "ADMIN"].includes(inspectUser.role),
                  },
                  {
                    name: "Booking Cancellations & Rescheduling",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "Process Customer Refunds",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "Turf Slot Blocking & Maintenance",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "Pricing & Coupon Management",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "Operational Reports & Analytics",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "Invite & Manage Staff Accounts",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "Audit Trail & Activity Logs",
                    allowed: inspectUser.role === "ADMIN",
                  },
                  {
                    name: "System Settings & Feature Flags",
                    allowed: inspectUser.role === "ADMIN",
                  },
                ].map((cap, i) => (
                  <div
                    key={i}
                    className={`p-2.5 rounded-xl border flex items-center justify-between ${
                      cap.allowed
                        ? "bg-[#ECFDF5]/60 border-emerald-200 text-slate-900"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <span className="font-semibold text-[11px]">{cap.name}</span>
                    {cap.allowed ? (
                      <span className="inline-flex items-center gap-0.5 text-[#059669] font-black text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="text-slate-300 font-bold">—</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setInspectUser(null)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Staff Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Invite Corporate Team Member"
        description="Pre-authorizes account access. User will sign in with their matching Google account."
        maxWidth="md"
      >
        <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-bold">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              isRequired
              placeholder="Suresh"
              value={formData.first_name}
              onChange={(e) =>
                setFormData({ ...formData, first_name: e.target.value })
              }
            />
            <Input
              label="Last Name"
              placeholder="Kumar"
              value={formData.last_name}
              onChange={(e) =>
                setFormData({ ...formData, last_name: e.target.value })
              }
            />
          </div>

          <Input
            label="Google Email Address"
            isRequired
            type="email"
            placeholder="suresh.ops@gmail.com"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Contact Phone"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
            <Input
              label="Employee ID (Optional)"
              placeholder="FT-OP-042"
              value={formData.employee_id}
              onChange={(e) =>
                setFormData({ ...formData, employee_id: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Role Clearance
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 outline-none focus:border-[#059669]"
              >
                <option value="STAFF">Staff (Ground Operations)</option>
                <option value="ADMIN">Admin (Full Business Control)</option>
              </select>
            </div>

            <Input
              label="Department"
              placeholder="Turf Operations"
              value={formData.department}
              onChange={(e) =>
                setFormData({ ...formData, department: e.target.value })
              }
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={submitting}
            >
              Authorize & Invite
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
