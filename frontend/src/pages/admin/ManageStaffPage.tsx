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
} from "lucide-react";
import api from "../../services/api";
import { User } from "../../types";

export const ManageStaffPage: React.FC = () => {
  const [staffList, setStaffList] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "STAFF",
    employee_id: "",
    department: "Turf Operations",
  });

  const fetchStaff = () => {
    setLoading(true);
    api
      .get("/auth/admin/staff/")
      .then((res) => setStaffList(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    try {
      await api.post("/auth/admin/staff/", formData);
      setShowModal(false);
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        role: "STAFF",
        employee_id: "",
        department: "Turf Operations",
      });
      fetchStaff();
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.email?.[0] ||
          err.response?.data?.error ||
          "Failed to add staff member. Please check fields.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.staff_profile?.employee_id
        ?.toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
            Team & Access Control
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Staff & Operators
          </h1>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl transition text-xs shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" />
          Add Staff Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search staff name, email, employee ID..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Total Staff:{" "}
          <strong className="text-white">{staffList.length}</strong>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Staff Member</th>
                <th className="py-3.5 px-4">Role & Privileges</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Duty Status</th>
                <th className="py-3.5 px-4">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading staff list...
                  </td>
                </tr>
              ) : filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No staff members found.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((member) => (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-800/40 transition"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs uppercase">
                          {member.first_name?.[0] || member.email[0]}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">
                            {member.full_name || member.email}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                          member.role === "ADMIN"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}
                      >
                        <Shield className="w-3 h-3" />
                        {member.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-white font-bold">
                      {member.staff_profile?.employee_id || "FT-STAFF"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      {member.staff_profile?.department || "Turf Operations"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        ACTIVE DUTY
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {member.phone || "N/A"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-400" />
                Add Staff Member
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
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Suresh"
                    value={formData.first_name}
                    onChange={(e) =>
                      setFormData({ ...formData, first_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Kumar"
                    value={formData.last_name}
                    onChange={(e) =>
                      setFormData({ ...formData, last_name: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="suresh@friendsturf.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Login Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    System Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  >
                    <option value="STAFF">Staff (QR Scanner & Desk Ops)</option>
                    <option value="ADMIN">Admin (Full System Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    placeholder="FT-EMP-104"
                    value={formData.employee_id}
                    onChange={(e) =>
                      setFormData({ ...formData, employee_id: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Operations, Front Desk"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500"
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
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-blue-500/20 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Staff Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
