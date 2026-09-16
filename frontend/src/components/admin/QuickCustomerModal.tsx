import React, { useState } from "react";
import { UserPlus, CheckCircle, AlertCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import api from "../../services/api";

interface QuickCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: (customer: any) => void;
}

export const QuickCustomerModal: React.FC<QuickCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) {
      setErrorMsg("Full name and contact phone are required.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");

    try {
      const generatedEmail = email.trim() || `${phone.replace(/[^0-9]/g, "")}@player.friendsturf.com`;
      const nameParts = fullName.trim().split(" ");
      const firstName = nameParts[0] || "Player";
      const lastName = nameParts.slice(1).join(" ") || "";

      // Register new customer account
      const res = await api.post("/auth/register/", {
        email: generatedEmail,
        first_name: firstName,
        last_name: lastName,
        phone: phone.trim(),
        password: "TempPlayerPass123!",
      });

      setSuccessMsg(`Player ${fullName} registered successfully!`);
      if (onCustomerCreated) {
        onCustomerCreated(res.data.user || res.data);
      }
      setTimeout(() => {
        setSuccessMsg("");
        setFullName("");
        setPhone("");
        setEmail("");
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.email?.[0] ||
          err.response?.data?.phone?.[0] ||
          err.response?.data?.error ||
          "Failed to register player."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Customer / Player"
      description="Quickly register a new player profile for instant match bookings and loyalty points"
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center space-x-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#059669] rounded-xl flex items-center space-x-2 font-bold">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            isRequired
            autoFocus
            placeholder="e.g. Vikramaditya Singh"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Phone Number"
            isRequired
            placeholder="e.g. 9876543210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <Input
            label="Email Address (Optional)"
            placeholder="e.g. vikram@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={submitting}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Add Player
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
