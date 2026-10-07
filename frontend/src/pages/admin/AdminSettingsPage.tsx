import React, { useState, useEffect, useRef } from "react";
import {
  Building2,
  Calendar,
  CreditCard,
  Bell,
  Clock,
  Save,
  CheckCircle,
  AlertCircle,
  Shield,
  Smartphone,
  Mail,
  Sliders,
  Loader2,
  MapPin,
  Navigation,
  Image as ImageIcon,
  Upload,
} from "lucide-react";
import api from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { useBusinessSettings } from "../../hooks/useBusinessSettings";
import { usePermission } from "../../context/PermissionContext";
import { resolveImageUrl } from "../../utils/imageUrl";

export const AdminSettingsPage: React.FC = () => {
  const toast = useToast();
  const { refreshSettings } = useBusinessSettings();
  const { refreshFeatureFlags } = usePermission();
  const [activeTab, setActiveTab] = useState<
    "features" | "company" | "booking" | "hours" | "payments" | "notifications" | "auth"
  >("features");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Business Feature Flags
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({
    RECURRING_BOOKINGS: true,
    PARTIAL_PAYMENTS: true,
    WALK_IN_BOOKINGS: true,
    DYNAMIC_PRICING: true,
    QR_CHECKIN: true,
    ONLINE_PAYMENTS: true,
    OFFLINE_PAYMENTS: true,
    COUPONS: false,
    REVIEWS: true,
    ADVANCED_REPORTING: true,
  });

  // Settings State
  const [authSettings, setAuthSettings] = useState({
    google_client_id: "",
  });

  const [companySettings, setCompanySettings] = useState({
    name: "Friends Turf",
    tagline: "PLAY HARD. BOOK DIRECT. OWN THE PITCH.",
    address: "Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603 (RTO Office Backside)",
    phone: "+91 93619 89494",
    email: "contact@friendsturf.com",
    support_email: "support@friendsturf.com",
    website: "https://friendsturf.com",
    instagram: "@friendsturf_tiruppur",
    facebook: "@friendsturf_tiruppur",
    whatsapp: "+91 93639 89494",
    gstin: "33ABCDE1234F1Z5",
    banner_title: "Friends Turf Sports Complex",
    banner_landmark: "RTO Backside",
    banner_image_url: "",
  });

  const [availableTurfs, setAvailableTurfs] = useState<any[]>([]);
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const handleBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File Too Large", "Banner image cannot exceed 10MB");
      return;
    }

    setUploadingBanner(true);
    try {
      const formData = new FormData();
      formData.append("images", file);
      const res = await api.post("/turfs/upload-image/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const url = res.data?.urls?.[0] || res.data?.url;
      if (url) {
        setCompanySettings((prev) => ({ ...prev, banner_image_url: url }));
        toast.success("Banner Image Uploaded", "Hero banner background updated successfully");
      } else {
        throw new Error("No URL returned from server");
      }
    } catch (err: any) {
      console.error("Banner upload failed:", err);
      toast.error(
        "Upload Failed",
        err?.response?.data?.error || "Could not upload image. Please try again."
      );
    } finally {
      setUploadingBanner(false);
      if (e.target) e.target.value = "";
    }
  };

  const [bookingRules, setBookingRules] = useState({
    advanceBookingDays: 14,
    minDurationMinutes: 60,
    maxDurationMinutes: 180,
    slotHoldMinutes: 5,
    cancellationFullRefundHours: 24,
    cancellationPartialRefundHours: 12,
    partialRefundPercent: 50,
    allowRescheduling: true,
    rescheduleCutoffHours: 6,
  });

  const [operatingHours, setOperatingHours] = useState({
    openTime: "06:00",
    closeTime: "23:00",
    slotDurationMinutes: 60,
    bufferTimeMinutes: 0,
    allowMidnightBookings: false,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    gateway: "RAZORPAY",
    mode: "TEST",
    keyId: "rzp_test_FriendsTurf2026",
    keySecret: "••••••••••••••••••••",
    upiId: "friendsturf@okhdfcbank",
    enableSplitDeposit: true,
    hourlyAdvanceRate: 100,
    advanceDepositPercent: 50,
    taxPercentage: 18,
    isTaxIncluded: true,
    minSlotPrice: 100,
    minTopUpAmount: 10,
  });

  const [notificationSettings, setNotificationSettings] = useState({
    whatsappEnabled: true,
    smsEnabled: true,
    emailEnabled: true,
    sendConfirmationImmediately: true,
    reminder24h: true,
    reminder2h: true,
    postMatchFeedbackHours: 2,
  });

  // Load backend settings
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/auth/settings/"),
      api.get("/auth/features/"),
      api.get("/turfs/").catch(() => ({ data: [] })),
    ])
      .then(([settingsRes, featuresRes, turfsRes]) => {
        if (settingsRes.data.company) {
          setCompanySettings((prev) => ({ ...prev, ...settingsRes.data.company }));
        }
        if (settingsRes.data.booking) setBookingRules(settingsRes.data.booking);
        if (settingsRes.data.hours) setOperatingHours(settingsRes.data.hours);
        if (settingsRes.data.payments) setPaymentSettings(settingsRes.data.payments);
        if (settingsRes.data.notifications) setNotificationSettings(settingsRes.data.notifications);
        if (settingsRes.data.auth?.google_client_id) {
          setAuthSettings({ google_client_id: settingsRes.data.auth.google_client_id });
        }
        if (featuresRes.data) setFeatureFlags((prev) => ({ ...prev, ...featuresRes.data }));

        const tList = Array.isArray(turfsRes?.data) ? turfsRes.data : turfsRes?.data?.results || [];
        setAvailableTurfs(tList);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        api.post("/auth/settings/", {
          company: companySettings,
          booking: bookingRules,
          hours: operatingHours,
          payments: paymentSettings,
          notifications: notificationSettings,
          auth: authSettings,
        }),
        api.put("/auth/features/", featureFlags),
      ]);
      await refreshSettings();
      await refreshFeatureFlags?.();
      setSaveSuccess(true);
      toast.success("Settings successfully saved to server.");
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      toast.error("Failed to save settings to server.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
            System Configuration
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform & Business Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure company branding, booking engine rules, payment gateway keys, and automated reminder triggers
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#ECFDF5] border border-emerald-200 text-[#059669] rounded-xl text-xs font-bold animate-in fade-in">
            <CheckCircle className="w-4 h-4" />
            <span>Settings saved successfully!</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: "features", label: "Business Features", icon: Sliders },
          { id: "company", label: "Company & Branding", icon: Building2 },
          { id: "booking", label: "Booking & Policy Rules", icon: Calendar },
          { id: "hours", label: "Operating Hours", icon: Clock },
          { id: "payments", label: "Payments & Tax", icon: CreditCard },
          { id: "notifications", label: "Notifications & Reminders", icon: Bell },
          { id: "auth", label: "Authentication & OAuth", icon: Shield },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                active
                  ? "bg-[#059669] text-white shadow-sm"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Settings Forms */}
      <form onSubmit={handleSave} className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-6">
        {/* Tab 0: Business Feature Flags */}
        {activeTab === "features" && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Business Capability & Feature Toggles
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Turn key platform capabilities on or off for Friends Turf. Changes take effect across client views immediately upon save.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {[
                {
                  key: "DYNAMIC_PRICING",
                  title: "Dynamic Surge Pricing",
                  desc: "Automatically apply peak hour, weekend, and weather surge multipliers to turf hourly rates.",
                },
                {
                  key: "PARTIAL_PAYMENTS",
                  title: "Split Deposit / Partial Payments",
                  desc: "Allow customers to book with a 50% advance deposit and settle balance at ground check-in.",
                },
                {
                  key: "RECURRING_BOOKINGS",
                  title: "Recurring League & Squad Slots",
                  desc: "Enable recurring weekly slots for corporate teams and competitive squads.",
                },
                {
                  key: "WALK_IN_BOOKINGS",
                  title: "Ground Walk-In Registrations",
                  desc: "Enable on-the-spot physical customer booking directly from staff operations desk.",
                },
                {
                  key: "QR_CHECKIN",
                  title: "Live QR Turnstile Scanner",
                  desc: "Enable fast-pass QR camera scanning for automated contactless ground check-in.",
                },
                {
                  key: "ONLINE_PAYMENTS",
                  title: "Razorpay Gateway Online Checkout",
                  desc: "Accept UPI, credit/debit cards, and netbanking through secure Razorpay integration.",
                },
                {
                  key: "OFFLINE_PAYMENTS",
                  title: "Cash Drawer & Register Accounting",
                  desc: "Permit physical cash collection and manual daily drawer reconciliation by staff.",
                },
                {
                  key: "REVIEWS",
                  title: "Customer Reviews & Star Ratings",
                  desc: "Allow verified turf players to submit pitch quality ratings and feedback.",
                },
                {
                  key: "ADVANCED_REPORTING",
                  title: "Advanced Financial Analytics",
                  desc: "Enable occupancy telemetry, revenue breakdown, and exportable reconciliation reports.",
                },
              ].map((flag) => {
                const isEnabled = !!featureFlags[flag.key];
                return (
                  <label
                    key={flag.key}
                    className={`flex items-start justify-between p-4 rounded-2xl border transition cursor-pointer ${
                      isEnabled
                        ? "bg-[#ECFDF5]/50 border-emerald-200"
                        : "bg-[#F8FAFC] border-slate-200"
                    }`}
                  >
                    <div className="space-y-1 pr-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {flag.title}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full ${
                            isEnabled
                              ? "bg-[#059669] text-white"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {isEnabled ? "Active" : "Disabled"}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        {flag.desc}
                      </p>
                      <code className="text-[10px] font-mono text-slate-400 block pt-0.5">
                        {flag.key}
                      </code>
                    </div>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      onChange={(e) =>
                        setFeatureFlags({
                          ...featureFlags,
                          [flag.key]: e.target.checked,
                        })
                      }
                      className="w-4 h-4 mt-1 accent-[#059669] rounded cursor-pointer shrink-0"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 1: Company Info */}
        {activeTab === "company" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Company Identity &amp; Contact
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage official venue branding, public contact channels, physical address, and statutory registration numbers.
              </p>
            </div>

            {/* Core Brand Identity */}
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] block">
                1. Core Brand Identity
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Company / Venue Name
                  </label>
                  <input
                    type="text"
                    value={companySettings.name}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, name: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Displayed on navbar, tickets, receipts, and emails
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Brand Tagline
                  </label>
                  <input
                    type="text"
                    value={companySettings.tagline}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, tagline: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Official motto shown across landing banners and invoices
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Official Ground Address
                  </label>
                  <input
                    type="text"
                    value={companySettings.address}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, address: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Physical GPS address for player navigation and invoice compliance
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Communication Channels */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] block">
                2. Direct Player Contact &amp; Support Channels
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Contact Phone
                  </label>
                  <input
                    type="text"
                    value={companySettings.phone}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, phone: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Direct phone line for ground bookings and customer reception
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    WhatsApp Booking &amp; Alert Line
                  </label>
                  <input
                    type="text"
                    value={companySettings.whatsapp || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, whatsapp: e.target.value })
                    }
                    placeholder="+91 93639 89494"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Used for automated squad match pass invitations and WhatsApp alerts
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    value={companySettings.email}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, email: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Primary inbox for booking receipts, inquiries, and staff correspondence
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Dedicated Support Email
                  </label>
                  <input
                    type="email"
                    value={companySettings.support_email || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, support_email: e.target.value })
                    }
                    placeholder="support@friendsturf.com"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Printed on tax receipts for refunds and escalation inquiries
                  </span>
                </div>
              </div>
            </div>

            {/* Online Presence & Legal */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] block">
                3. Online Presence &amp; Statutory GSTIN
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="text"
                    value={companySettings.website || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, website: e.target.value })
                    }
                    placeholder="https://friendsturf.com"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={companySettings.instagram || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, instagram: e.target.value })
                    }
                    placeholder="@friendsturf_tiruppur"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Facebook Handle / Page URL
                  </label>
                  <input
                    type="text"
                    value={companySettings.facebook || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, facebook: e.target.value })
                    }
                    placeholder="@friendsturf_tiruppur or https://facebook.com/friendsturf"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GSTIN Tax Identification
                  </label>
                  <input
                    type="text"
                    value={companySettings.gstin || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, gstin: e.target.value })
                    }
                    placeholder="33ABCDE1234F1Z5"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-[#059669]"
                  />
                </div>
              </div>
            </div>

            {/* 4. Customer Hero Banner Studio & Live Preview */}
            <div className="space-y-4 pt-4 border-t border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669]">
                      4. Customer Hero Banner Studio &amp; Live Preview
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    Public Hero Landing Banner
                  </h4>
                  <p className="text-xs text-slate-500">
                    Customize the hero photo, headline, and landmark badge with instant real-time visual preview.
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-emerald-50 text-[#059669] border border-emerald-200/80 self-start sm:self-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  Live Preview
                </span>
              </div>

              {/* REAL-TIME LIVE BANNER PREVIEW CARD */}
              <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-800 bg-slate-950 text-white min-h-[200px] sm:min-h-[240px] flex flex-col justify-end p-4 sm:p-7 group">
                {/* Background Turf Venue Photo */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                  style={{
                    backgroundImage: `url('${resolveImageUrl(
                      companySettings.banner_image_url || availableTurfs?.[0]?.images?.[0] || "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=1600&q=80"
                    )}')`,
                  }}
                />
                {/* Dark Gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/40 via-transparent to-transparent" />

                {/* Live Preview Watermark Badge */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-[10px] font-bold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                  <span>Customer View Preview</span>
                </div>

                {/* Banner Content Preview */}
                <div className="relative z-10 space-y-2">
                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                    {companySettings.banner_title || companySettings.name || "Friends Turf Sports Complex"}
                  </h2>
                  <div className="flex items-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-white/15 text-xs text-slate-200 backdrop-blur-md shadow-sm">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 shrink-0">
                        <MapPin className="w-3 h-3" />
                      </span>
                      <span className="font-medium text-slate-200">
                        {companySettings.address?.split("(")[0]?.trim() || "Near Sirupooluvapatti, Kamatchepuram, Tiruppur"}
                      </span>
                      {companySettings.banner_landmark && (
                        <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-[10px] font-bold text-emerald-300 tracking-wide uppercase">
                          {companySettings.banner_landmark}
                        </span>
                      )}
                      <Navigation className="w-3 h-3 text-slate-400 shrink-0 ml-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Banner Input Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl border border-slate-200/90">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Banner Headline
                  </label>
                  <input
                    type="text"
                    value={companySettings.banner_title || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, banner_title: e.target.value })
                    }
                    placeholder="Friends Turf Sports Complex"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Large headline displayed directly on the hero banner
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Landmark Tag (Pill Badge)
                  </label>
                  <input
                    type="text"
                    value={companySettings.banner_landmark || ""}
                    onChange={(e) =>
                      setCompanySettings({ ...companySettings, banner_landmark: e.target.value })
                    }
                    placeholder="RTO Backside"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Highlighted landmark pill shown inside the location badge
                  </span>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 block">
                      Hero Banner Background Photo
                    </label>
                    {companySettings.banner_image_url && (
                      <span className="text-[10px] font-bold text-[#059669] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Custom Image Active
                      </span>
                    )}
                  </div>

                  {/* Hidden File Input for Native File Browser */}
                  <input
                    ref={bannerFileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="hidden"
                    onChange={handleBannerFileUpload}
                  />

                  {/* Interactive Upload Dropzone */}
                  <div
                    onClick={() => !uploadingBanner && bannerFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center transition-all cursor-pointer ${
                      uploadingBanner
                        ? "border-emerald-400 bg-emerald-50/50 pointer-events-none"
                        : "border-slate-300 hover:border-[#059669] bg-white hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-emerald-50 text-[#059669] flex items-center justify-center shadow-xs">
                        {uploadingBanner ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {uploadingBanner
                            ? "Uploading banner photo to server..."
                            : "Click to upload banner photo from your device"}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Supports PNG, JPG, or WebP up to 10MB (recommended 1600x900)
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={uploadingBanner}
                        onClick={(e) => {
                          e.stopPropagation();
                          bannerFileInputRef.current?.click();
                        }}
                        className="mt-1 px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
                      >
                        {uploadingBanner ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Select Image File</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Or Manual URL Input */}
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                      Or paste an image URL directly:
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={companySettings.banner_image_url || ""}
                        onChange={(e) =>
                          setCompanySettings({ ...companySettings, banner_image_url: e.target.value })
                        }
                        placeholder="https://... or leave blank to use primary pitch photo"
                        className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                      />
                      {companySettings.banner_image_url && (
                        <button
                          type="button"
                          onClick={() => setCompanySettings({ ...companySettings, banner_image_url: "" })}
                          className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer shrink-0 transition"
                        >
                          Reset to Pitch Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Pitch Photo Picker if Turfs have photos */}
                {availableTurfs.length > 0 && availableTurfs.some((t: any) => t.images && t.images.length > 0) && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-200/60">
                    <span className="text-[11px] font-bold text-slate-700 block mb-2">
                      Quick select from your uploaded arena photos:
                    </span>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                      {availableTurfs.flatMap((t: any) =>
                        (t.images || []).map((imgUrl: string, idx: number) => {
                          const isSelectedImg = companySettings.banner_image_url === imgUrl;
                          return (
                            <button
                              key={`${t.id}-${idx}`}
                              type="button"
                              onClick={() =>
                                setCompanySettings({ ...companySettings, banner_image_url: imgUrl })
                              }
                              className={`group relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                                isSelectedImg
                                  ? "border-[#059669] ring-2 ring-emerald-500/30 scale-105 shadow-sm"
                                  : "border-slate-300 hover:border-emerald-400 opacity-75 hover:opacity-100"
                              }`}
                              title={`Set ${t.name} photo as hero banner`}
                            >
                              <img
                                src={resolveImageUrl(imgUrl, t.sport_type)}
                                alt={t.name}
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] font-bold text-white text-center truncate px-1 py-0.5">
                                {t.name}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Booking Rules */}
        {activeTab === "booking" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Booking Engine & Refund Policy Rules
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Advance Booking Window (Days)
                </label>
                <input
                  type="number"
                  value={bookingRules.advanceBookingDays}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      advanceBookingDays: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  Customers can book up to {bookingRules.advanceBookingDays} days in advance
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Checkout Slot Hold Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={bookingRules.slotHoldMinutes}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      slotHoldMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  Temporary lock expires automatically after {bookingRules.slotHoldMinutes} mins
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Full Refund Threshold (Hours before match)
                </label>
                <input
                  type="number"
                  value={bookingRules.cancellationFullRefundHours}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      cancellationFullRefundHours: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  100% wallet credit if cancelled &gt; {bookingRules.cancellationFullRefundHours} hours before match
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Partial Refund Threshold (Hours before match)
                </label>
                <input
                  type="number"
                  value={bookingRules.cancellationPartialRefundHours}
                  onChange={(e) =>
                    setBookingRules({
                      ...bookingRules,
                      cancellationPartialRefundHours: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
                <span className="text-[10px] text-slate-500">
                  {bookingRules.partialRefundPercent}% refund between {bookingRules.cancellationPartialRefundHours} and {bookingRules.cancellationFullRefundHours} hours
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Operating Hours */}
        {activeTab === "hours" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Facility Operating Schedule
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daily Opening Time
                </label>
                <input
                  type="time"
                  value={operatingHours.openTime}
                  onChange={(e) =>
                    setOperatingHours({ ...operatingHours, openTime: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Daily Closing Time
                </label>
                <input
                  type="time"
                  value={operatingHours.closeTime}
                  onChange={(e) =>
                    setOperatingHours({ ...operatingHours, closeTime: e.target.value })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Default Match Slot Duration
                </label>
                <select
                  value={operatingHours.slotDurationMinutes}
                  onChange={(e) =>
                    setOperatingHours({
                      ...operatingHours,
                      slotDurationMinutes: Number(e.target.value),
                    })
                  }
                  className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                >
                  <option value={60}>60 Minutes (Standard 1 Hour)</option>
                  <option value={90}>90 Minutes (1.5 Hours)</option>
                  <option value={120}>120 Minutes (2 Hours)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Payments & Taxes */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Payment Gateway &amp; Tax Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage online gateway providers, credentials, on-spot venue UPI, partial advance deposits, and statutory GST taxation.
              </p>
            </div>

            {/* Gateway & Environment */}
            <div className="space-y-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] block">
                1. Gateway Provider &amp; Credentials
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Primary Payment Gateway
                  </label>
                  <select
                    value={paymentSettings.gateway}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, gateway: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  >
                    <option value="RAZORPAY">Razorpay (Cards, UPI, Netbanking)</option>
                    <option value="CASHFREE">Cashfree Payments</option>
                    <option value="STRIPE">Stripe</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gateway Environment
                  </label>
                  <select
                    value={paymentSettings.mode}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, mode: e.target.value })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  >
                    <option value="TEST">Test / Sandbox (Simulation)</option>
                    <option value="LIVE">Live Production Mode</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Razorpay Key ID
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.keyId || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, keyId: e.target.value.trim() })
                    }
                    placeholder="rzp_test_... or rzp_live_..."
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Public Key ID delivered to official checkout SDK
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Razorpay Key Secret
                  </label>
                  <input
                    type="password"
                    value={paymentSettings.keySecret || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, keySecret: e.target.value.trim() })
                    }
                    placeholder="••••••••••••••••"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-mono text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Used server-side for HMAC-SHA256 signature verification &amp; webhook authorization
                  </span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3.5 rounded-2xl border text-xs flex items-center space-x-2.5 ${
                  paymentSettings.mode === "LIVE"
                    ? "bg-amber-50 border-amber-200 text-amber-900"
                    : "bg-[#ECFDF5] border-emerald-200 text-emerald-900"
                }`}
              >
                <div
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    paymentSettings.mode === "LIVE" ? "bg-amber-500" : "bg-[#10B981] animate-pulse"
                  }`}
                />
                <div>
                  <span className="font-bold">
                    {paymentSettings.mode === "LIVE"
                      ? "Live Production Mode Active: "
                      : "Test Simulation Sandbox Active: "}
                  </span>
                  <span>
                    {paymentSettings.mode === "LIVE"
                      ? "Real payment transactions will be routed and charged via your configured live Razorpay account."
                      : "Transactions run in sandbox simulation mode. Safe for staging & feature testing."}
                  </span>
                </div>
              </div>
            </div>

            {/* Split Deposits & On-Spot UPI */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] block">
                2. On-Spot Venue UPI &amp; Partial Advance Deposits
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Venue UPI ID (For on-spot QR payments)
                  </label>
                  <input
                    type="text"
                    value={paymentSettings.upiId || ""}
                    onChange={(e) =>
                      setPaymentSettings({ ...paymentSettings, upiId: e.target.value.trim() })
                    }
                    placeholder="e.g. friendsturf@okhdfcbank"
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Used to generate live counter QR codes and digital UPI payment requests
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Advance Deposit Ratio (%)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={100}
                    value={paymentSettings.advanceDepositPercent ?? 50}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        advanceDepositPercent: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Allow customers to pay {paymentSettings.advanceDepositPercent ?? 50}% now and rest at ground
                  </span>
                </div>
              </div>

              <label className="flex items-center space-x-3 p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={paymentSettings.enableSplitDeposit ?? true}
                  onChange={(e) =>
                    setPaymentSettings({
                      ...paymentSettings,
                      enableSplitDeposit: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Enable Minimum Advance Booking (Hourly Rate)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    When enabled, customers can pay a duration-based advance (e.g. ₹{paymentSettings.hourlyAdvanceRate ?? 100}/hr) and settle the remaining balance at the venue reception
                  </div>
                </div>
              </label>

              {paymentSettings.enableSplitDeposit && (
                <div className="mt-3 pl-7 space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Minimum Advance Rate per Hour (₹/hour)
                  </label>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-slate-500">₹</span>
                    <input
                      type="number"
                      min={10}
                      step={10}
                      value={paymentSettings.hourlyAdvanceRate ?? 100}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          hourlyAdvanceRate: Number(e.target.value),
                        })
                      }
                      className="w-48 p-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-[#059669]"
                    />
                    <span className="text-xs font-semibold text-slate-500">/ booked hour</span>
                  </div>
                  <span className="text-[10px] text-slate-500 block">
                    Formula: Minimum Advance = Duration (hours) × ₹{paymentSettings.hourlyAdvanceRate ?? 100}/hr. (1h = ₹{paymentSettings.hourlyAdvanceRate ?? 100}, 2h = ₹{(paymentSettings.hourlyAdvanceRate ?? 100) * 2}, etc.)
                  </span>
                </div>
              )}
            </div>

            {/* GST Tax & Operational Limits */}
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#059669] block">
                3. Statutory GST Taxation &amp; Pricing Limits
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    GST / Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min={0}
                    max={30}
                    value={paymentSettings.taxPercentage ?? 18}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        taxPercentage: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Statutory GST rate included in slot rates (All slot prices on the website are 100% GST-inclusive; no additional tax is added at checkout)
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Minimum Slot Floor Price (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={paymentSettings.minSlotPrice ?? 1}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        minSlotPrice: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Guaranteed minimum floor rate enforced even after heavy coupon discounts
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Minimum Wallet Top-up (₹)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={paymentSettings.minTopUpAmount ?? 10}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        minTopUpAmount: Number(e.target.value),
                      })
                    }
                    className="w-full p-3 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-[#059669]"
                  />
                  <span className="text-[10px] text-slate-500">
                    Minimum amount customers can add to their Friends Turf digital cash wallet
                  </span>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.isTaxIncluded ?? true}
                      onChange={(e) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          isTaxIncluded: e.target.checked,
                        })
                      }
                      className="w-4 h-4 accent-[#059669] rounded"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Display Prices as Tax-Inclusive
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Show all pitch hourly rates inclusive of statutory taxes on catalog cards
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Automated Reminders */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
              Automated Reminders & Dispatch Channels
            </h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.sendConfirmationImmediately}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      sendConfirmationImmediately: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Instant Booking Confirmation Pass
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Send QR pass & digital receipt immediately upon payment capture
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.reminder24h}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      reminder24h: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    24-Hour Match Eve Reminder
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Alert team captain 24 hours prior to match kick-off
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 bg-[#F8FAFC] border border-slate-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings.reminder2h}
                  onChange={(e) =>
                    setNotificationSettings({
                      ...notificationSettings,
                      reminder2h: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-[#059669] rounded"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    2-Hour Match Day Readiness Alert
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Send directions, parking instructions, and QR quick-pass link
                  </div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Tab 6: Authentication & OAuth */}
        {activeTab === "auth" && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                Authentication &amp; OAuth Integrations
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure dynamic single sign-on providers and client IDs for customer and staff authentication.
              </p>
            </div>

            <div className="max-w-2xl space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Google OAuth 2.0 Client ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={authSettings.google_client_id}
                    onChange={(e) =>
                      setAuthSettings({ ...authSettings, google_client_id: e.target.value.trim() })
                    }
                    placeholder="e.g. 724983441526-...apps.googleusercontent.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-[#059669] focus:bg-white transition"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  When updated and saved here, this Client ID is delivered dynamically to customer login forms without requiring a rebuild or code commit.
                </p>
              </div>

              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-[#059669]">
                  <Shield className="w-4 h-4" />
                  <span>Google Cloud Console Origin Whitelist Reminder</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Make sure you have added your production domains under <strong>Authorized JavaScript origins</strong> in your Google Cloud Console project:
                </p>
                <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                  <span className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800">
                    https://friendsturf.in
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-emerald-300 rounded-lg text-emerald-800">
                    https://www.friendsturf.in
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Save Button */}
        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration Changes</span>
          </button>
        </div>
      </form>
    </div>
  );
};
