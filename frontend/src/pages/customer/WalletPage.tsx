import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Check,
  ArrowRight,
  RefreshCw,
  Zap,
  Lock,
  Copy,
  Search,
  Receipt,
  Award,
  CreditCard,
  Flame,
  CheckCircle,
  SlidersHorizontal,
  X,
  Printer,
} from "lucide-react";
import api from "../../services/api";
import { WalletTransaction } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { initiateRazorpayCheckout } from "../../services/razorpay";

export const WalletPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();
  const toast = useToast();

  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Top-Up states
  const [topUpAmount, setTopUpAmount] = useState<string>("1000");
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpStatus, setTopUpStatus] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [topUpSuccessPayload, setTopUpSuccessPayload] = useState<{
    amount: number;
    newBalance: number;
    paymentId: string;
  } | null>(null);

  // Transaction filtering & search
  const [filterType, setFilterType] = useState<"ALL" | "CREDIT" | "DEBIT" | "REFUND">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<WalletTransaction | null>(null);

  const fetchWallet = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setIsRefreshing(true);
      else setLoading(true);

      const walletRes = await api.get("/wallet/balance/");
      setBalance(Number(walletRes.data.wallet_balance || 0));
      setTransactions(walletRes.data.transactions || []);

      if (showRefreshToast) {
        toast.success("Wallet balance & history synced!");
      }
    } catch (err) {
      console.error("Error fetching wallet:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  // Handle Razorpay Wallet Top-Up
  const handleTopUp = async (e?: React.FormEvent, customAmount?: number) => {
    if (e) e.preventDefault();
    const amountVal = customAmount ?? Number(topUpAmount);

    if (!amountVal || amountVal < 10) {
      toast.warning("Please enter a valid top-up amount of at least ₹10.");
      return;
    }

    setTopUpLoading(true);
    setTopUpStatus("Creating secure payment order...");
    setSuccessMsg("");

    try {
      // 1. Create Razorpay order for wallet top-up
      const orderRes = await api.post("/wallet/razorpay/create-order/", {
        amount: amountVal,
      });
      const orderData = orderRes.data;

      // 2. Open universal Razorpay checkout
      await initiateRazorpayCheckout({
        orderData: {
          order_id: orderData.order_id,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          key_id: orderData.key_id,
          title: "Friends Turf Wallet Top-Up",
          description: `Add ₹${amountVal} to Turf Cash Wallet`,
        },
        user: {
          full_name: user?.full_name || user?.first_name || "Player",
          email: user?.email || "customer@friendsturf.com",
          phone: user?.phone || "9999999999",
        },
        onStatusChange: (statusText) => setTopUpStatus(statusText),
        onSuccess: async (verifyPayload) => {
          setTopUpStatus("Crediting your wallet balance...");
          try {
            const verifyRes = await api.post("/wallet/razorpay/verify/", {
              razorpay_order_id: verifyPayload.razorpay_order_id,
              razorpay_payment_id: verifyPayload.razorpay_payment_id,
              razorpay_signature: verifyPayload.razorpay_signature,
            });

            const newBal = Number(verifyRes.data.wallet_balance ?? balance + amountVal);
            setBalance(newBal);
            setShowTopUpModal(false);
            setTopUpSuccessPayload({
              amount: amountVal,
              newBalance: newBal,
              paymentId: verifyPayload.razorpay_payment_id,
            });
            const msg = `Successfully added ₹${amountVal.toLocaleString("en-IN")} to your Turf Cash Wallet!`;
            setSuccessMsg(msg);
            toast.success(msg);
            await refreshProfile();
            fetchWallet();
          } catch (verr: any) {
            toast.error(verr.response?.data?.error || "Payment verification failed.");
          }
        },
        onError: (errMsg) => {
          toast.error(errMsg || "Payment was not completed.");
        },
        onDismiss: () => {
          setTopUpLoading(false);
          setTopUpStatus("");
        },
      });
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to initialize wallet payment.");
    } finally {
      setTopUpLoading(false);
      setTopUpStatus("");
    }
  };

  // Copy Transaction Reference
  const handleCopyRef = (refId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(refId);
    setCopiedTxId(refId);
    toast.success("Transaction Ref ID copied to clipboard!");
    setTimeout(() => setCopiedTxId(null), 2000);
  };

  // Filtered & Searched Transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Filter by type
      if (filterType === "CREDIT" && tx.transaction_type !== "CREDIT") return false;
      if (filterType === "DEBIT" && tx.transaction_type !== "DEBIT") return false;
      if (
        filterType === "REFUND" &&
        !(
          tx.transaction_type === "REFUND" ||
          tx.source?.toLowerCase().includes("refund") ||
          tx.description?.toLowerCase().includes("refund")
        )
      ) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const descMatch = (tx.description || "").toLowerCase().includes(query);
        const refMatch = (tx.reference_id || "").toLowerCase().includes(query);
        const idMatch = (tx.id || "").toLowerCase().includes(query);
        const amountMatch = tx.amount.toString().includes(query);
        return descMatch || refMatch || idMatch || amountMatch;
      }

      return true;
    });
  }, [transactions, filterType, searchQuery]);

  const totalCredited = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === "CREDIT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalSpent = useMemo(() => {
    return transactions
      .filter((t) => t.transaction_type === "DEBIT")
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalRefunded = useMemo(() => {
    return transactions
      .filter(
        (t) =>
          t.transaction_type === "REFUND" ||
          t.source?.toLowerCase().includes("refund") ||
          t.description?.toLowerCase().includes("refund")
      )
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* ─── 1. Page Header & Live Status ─── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#ECFDF5] text-[#059669] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping mr-1.5" />
              Instant 1-Click Pass & Refunds
            </span>
            <span className="text-xs font-semibold text-slate-400 hidden sm:inline">•</span>
            <span className="text-xs font-semibold text-slate-500 hidden sm:inline">
              Tiruppur Premier Arenas
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-3">
            Turf Cash Wallet
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono">
              v2.4
            </span>
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Zero gateway timeouts, 1-click slot checkout, zero convenience surcharges, and 100% automated cancellation credits.
          </p>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <button
            onClick={() => fetchWallet(true)}
            disabled={isRefreshing || loading}
            title="Refresh balance and sync transactions"
            className="p-2.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 font-semibold text-xs flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-500 ${isRefreshing ? "animate-spin text-[#059669]" : ""}`}
            />
            <span className="hidden sm:inline">Sync Balance</span>
          </button>
          <button
            onClick={() => setShowTopUpModal(true)}
            className="px-4 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs flex items-center space-x-2 shadow-emerald-glow transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Top Up Cash</span>
          </button>
        </div>
      </div>

      {/* Success banner if any */}
      {successMsg && (
        <div className="p-4 bg-[#ECFDF5] border border-emerald-200/90 rounded-2xl flex items-center justify-between text-xs font-bold text-[#059669] shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-[#059669] shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg("")}
            className="text-emerald-700 hover:text-emerald-900 font-bold px-2 py-1 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ─── 2. Main Hero Section (Fintech Athletic Pass Card + Perks Card) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Hero Card: Ultra-Premium Digital Match Pass Card */}
        <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#022c22] via-[#065f46] to-[#047857] text-white p-6 sm:p-8 shadow-2xl border border-emerald-500/30 flex flex-col justify-between group">
          {/* Subtle Futuristic Pitch Graphic Overlay */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"
          />
          <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-700" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-900/40 rounded-full blur-3xl pointer-events-none" />

          {/* Card Top Row: Branding, Chip & Pass Type */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <Wallet className="w-5 h-5 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs font-black tracking-widest text-emerald-200 uppercase">
                      FRIENDS TURF
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                      Pass
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-100/70 font-mono tracking-wide">
                    Digital Match Wallet
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Contactless / NFC waves */}
                <div className="flex items-center space-x-0.5 opacity-80" title="1-Click Instant NFC / QR Ready">
                  <span className="w-1 h-3 bg-white/70 rounded-full" />
                  <span className="w-1 h-4 bg-white/80 rounded-full" />
                  <span className="w-1 h-5 bg-white rounded-full" />
                </div>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-100 border border-emerald-300/30 px-3 py-1 rounded-full font-bold uppercase tracking-wider backdrop-blur-md flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse mr-1" />
                  Instant Spend
                </span>
              </div>
            </div>

            {/* Smart EMV Chip Element Graphic */}
            <div className="flex items-center justify-between">
              <div className="w-12 h-9 rounded-lg bg-gradient-to-tr from-amber-300 via-yellow-200 to-amber-400 border border-amber-500/40 shadow-sm relative overflow-hidden flex items-center justify-center opacity-95">
                <div className="absolute inset-0 border-t border-b border-amber-600/30 my-auto h-3" />
                <div className="absolute inset-0 border-l border-r border-amber-600/30 mx-auto w-4" />
                <div className="w-4 h-3 rounded-sm border border-amber-700/40 bg-amber-200/50" />
              </div>
              <span className="text-[11px] font-mono text-emerald-200/80 tracking-widest uppercase">
                Zero Gateway Fees
              </span>
            </div>

            {/* Balance Presentation */}
            <div className="pt-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200/80 block">
                Available Wallet Balance
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight drop-shadow-sm font-sans">
                  ₹{Number(balance).toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-extrabold text-emerald-300 bg-white/10 px-2 py-0.5 rounded-md border border-white/10 uppercase tracking-wide">
                  INR
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-2 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>Valid across all Friends Turf arenas in Tiruppur with zero expiry.</span>
              </p>
            </div>
          </div>

          {/* Card Bottom: Quick Actions & Details */}
          <div className="relative z-10 pt-6 mt-6 border-t border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-emerald-200/70 tracking-wider">
                Passholder Name
              </p>
              <p className="text-sm font-extrabold text-white tracking-wide uppercase">
                {user?.full_name || user?.first_name || "Club Player"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowTopUpModal(true)}
                className="px-5 py-3 rounded-xl bg-white hover:bg-emerald-50 text-[#059669] font-extrabold text-sm flex items-center space-x-2 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                <span>Add Cash to Wallet</span>
              </button>
              <button
                onClick={() => navigate("/turfs")}
                className="px-4 py-3 rounded-xl bg-emerald-800/60 hover:bg-emerald-800 text-emerald-100 border border-emerald-400/30 font-bold text-xs flex items-center space-x-1.5 backdrop-blur-md transition-all cursor-pointer"
              >
                <span>Book Pitch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: High-Value Features & Perks Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-pitch-card flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-[#059669]" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Why Play with Turf Cash?
                </h3>
              </div>
              <span className="text-[10px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-emerald-200">
                Player Perks
              </span>
            </div>

            {/* Feature 1 */}
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">1-Click Instant Checkout</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Never lose a 5-min locked slot to bank OTP delays. Bookings confirm in under 1 second.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">0.0s Auto-Refund Guarantee</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Eligible cancellations credit 100% refund immediately back to your Turf Cash balance.
                </p>
              </div>
            </div>

            {/* Feature 3 / Zero Surcharge Guarantee */}
            <div className="flex items-start space-x-3 p-3 rounded-2xl bg-[#F8FAFC] border border-slate-100 hover:border-emerald-200 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center shrink-0 mt-0.5">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-900">0% Gateway Surcharges</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Pay pure venue rates with zero hidden credit card processing fees or convenience taxes.
                </p>
              </div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center space-x-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">256-Bit Encrypted Payments</span>
            </div>
            <span className="text-slate-400 font-mono">Razorpay Verified</span>
          </div>
        </div>
      </div>

      {/* ─── 3. Quick Top-Up Presets Bar ─── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-pitch-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-[#059669]" />
              <span>Quick Top-Up Options</span>
            </h3>
            <p className="text-xs text-slate-500">
              Select a popular amount for fast 1-click Razorpay payment processing.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/80 self-start sm:self-auto">
            0% Gateway Surcharge
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { amount: "500", label: "Starter Session", tag: "Quick Play" },
            { amount: "1000", label: "Match Pass", tag: "Most Popular", highlight: true },
            { amount: "2000", label: "Squad Double", tag: "Weekend Match" },
            { amount: "5000", label: "Tournament Pro", tag: "VIP Pass" },
          ].map((item) => (
            <button
              key={item.amount}
              type="button"
              onClick={() => {
                setTopUpAmount(item.amount);
                setShowTopUpModal(true);
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                item.highlight
                  ? "border-[#059669] bg-[#ECFDF5]/60 hover:bg-[#ECFDF5] shadow-sm"
                  : "border-slate-200 bg-[#F8FAFC] hover:border-emerald-300 hover:bg-white"
              }`}
            >
              {item.highlight && (
                <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-[#059669] text-white px-2 py-0.5 rounded-md">
                  {item.tag}
                </span>
              )}
              {!item.highlight && (
                <span className="text-[10px] font-bold text-slate-400 block mb-0.5">
                  {item.tag}
                </span>
              )}
              <div className="text-lg font-black text-slate-900 group-hover:text-[#059669] transition-colors">
                ₹{Number(item.amount).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                {item.label}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ─── 4. Quick Metrics Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Top-Ups
          </p>
          <p className="text-xl font-black text-[#059669]">
            ₹{totalCredited.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Pitch Spend
          </p>
          <p className="text-xl font-black text-slate-900">
            ₹{totalSpent.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Refunds
          </p>
          <p className="text-xl font-black text-amber-600">
            ₹{totalRefunded.toLocaleString("en-IN")}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Checkout Latency
          </p>
          <p className="text-xl font-black text-emerald-600 flex items-center space-x-1">
            <span>&lt; 1.0s</span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Instant
            </span>
          </p>
        </div>
      </div>

      {/* ─── 5. Transaction History & Filtering ─── */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-pitch-card space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-[#059669]" />
              <span>Wallet Activity & History</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed ledger of top-ups, slot bookings, cancellation refunds, and pass redemptions.
            </p>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
            {[
              { key: "ALL", label: "All Activity" },
              { key: "CREDIT", label: "Top-Ups (+)" },
              { key: "DEBIT", label: "Bookings (-)" },
              { key: "REFUND", label: "Refunds" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterType(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  filterType === tab.key
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar inside transactions */}
        {transactions.length > 0 && (
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by reference ID, description, amount..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 outline-none focus:border-[#059669] focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Transaction Ledger List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-16 bg-slate-100 rounded-2xl" />
            ))}
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {filteredTransactions.map((tx) => {
              const isCredit = tx.transaction_type === "CREDIT";
              const isRefund =
                isCredit &&
                (tx.description?.toLowerCase().includes("refund") ||
                  tx.source?.toLowerCase().includes("refund"));

              return (
                <div
                  key={tx.id}
                  onClick={() => setSelectedTxForReceipt(tx)}
                  className="py-4 px-3 sm:px-4 rounded-2xl hover:bg-slate-50/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    {/* Status / Category Icon */}
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        isRefund
                          ? "bg-blue-50 text-blue-600 border border-blue-100"
                          : isCredit
                          ? "bg-[#ECFDF5] text-[#059669] border border-emerald-100"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isRefund ? (
                        <ShieldCheck className="w-5 h-5" />
                      ) : isCredit ? (
                        <ArrowDownLeft className="w-5 h-5" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-[#059669] transition-colors">
                          {tx.description ||
                            (isRefund
                              ? "Cancellation Refund Credited"
                              : isCredit
                              ? "Wallet Cash Top-Up"
                              : "Turf Slot Booking Payment")}
                        </p>
                        {isRefund && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                            Refund
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        <span>{new Date(tx.created_at).toLocaleString()}</span>
                        {tx.reference_id && (
                          <>
                            <span>•</span>
                            <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200 flex items-center space-x-1">
                              <span>Ref: {tx.reference_id.slice(0, 14)}...</span>
                              <button
                                type="button"
                                onClick={(e) => handleCopyRef(tx.reference_id, e)}
                                title="Copy Reference ID"
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                {copiedTxId === tx.reference_id ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end sm:text-right gap-4 pl-13 sm:pl-0">
                    <div>
                      <p
                        className={`text-base font-black tracking-tight ${
                          isRefund
                            ? "text-blue-600"
                            : isCredit
                            ? "text-[#059669]"
                            : "text-slate-900"
                        }`}
                      >
                        {isCredit ? "+" : "-"}₹{Number(tx.amount).toLocaleString("en-IN")}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400">
                        Bal: ₹{Number(tx.balance_after).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTxForReceipt(tx);
                      }}
                      title="View Receipt Details"
                      className="p-2 rounded-xl bg-slate-100 group-hover:bg-[#ECFDF5] text-slate-500 group-hover:text-[#059669] transition-all cursor-pointer"
                    >
                      <Receipt className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-4 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-[#ECFDF5] border border-emerald-200 text-[#059669] flex items-center justify-center mx-auto shadow-sm">
              <Wallet className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-slate-900">
                {searchQuery || filterType !== "ALL"
                  ? "No matching transactions found"
                  : "No wallet activity yet"}
              </h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery || filterType !== "ALL"
                  ? "Try resetting your search query or category filter to view all history."
                  : "Top up your wallet with Turf Cash to enjoy 1-click lightning checkout, zero bank delays, and instant refunds!"}
              </p>
            </div>
            {searchQuery || filterType !== "ALL" ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setFilterType("ALL");
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Clear Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowTopUpModal(true)}
                className="px-5 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow transition-all cursor-pointer inline-flex items-center space-x-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add ₹500 to Start Playing</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── Top-Up Modal ─── */}
      {showTopUpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={(e) => handleTopUp(e)}
            className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#ECFDF5] border border-emerald-200 text-[#059669] flex items-center justify-center">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Add Cash to Wallet
                  </h3>
                  <p className="text-xs text-slate-500">
                    Instant 1-Click checkout ready
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowTopUpModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Amount input & presets */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Select or Enter Top-Up Amount (₹):
              </label>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-400 font-sans">
                  ₹
                </span>
                <input
                  type="number"
                  min="10"
                  step="1"
                  required
                  autoFocus
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="w-full pl-10 pr-4 py-3.5 bg-[#F8FAFC] border-2 border-slate-200 focus:border-[#059669] rounded-2xl text-2xl font-black text-slate-900 outline-none transition-all"
                />
              </div>

              {/* Quick preset selector buttons */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                {["500", "1000", "2000", "5000"].map((amt) => {
                  const isSelected = topUpAmount === amt;
                  return (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setTopUpAmount(amt)}
                      className={`py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-[#ECFDF5] border-[#059669] text-[#059669] shadow-sm"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      ₹{amt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fee summary breakdown */}
            <div className="p-3.5 bg-[#F8FAFC] border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Top-Up Amount</span>
                <span className="font-bold text-slate-900">
                  ₹{Number(topUpAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600 font-medium">
                <span>Payment Gateway Surcharge</span>
                <span className="font-bold text-[#059669]">₹0 (Free)</span>
              </div>
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between font-extrabold text-slate-900">
                <span>Net Spendable Credit</span>
                <span className="text-sm text-[#059669]">
                  +₹{Number(topUpAmount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {topUpStatus && (
              <p className="text-xs font-bold text-[#059669] animate-pulse text-center bg-[#ECFDF5] p-2.5 rounded-xl border border-emerald-200">
                {topUpStatus}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                disabled={topUpLoading}
                onClick={() => setShowTopUpModal(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={topUpLoading || !topUpAmount || Number(topUpAmount) < 10}
                className="flex-2 py-3 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs shadow-emerald-glow transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>
                  {topUpLoading
                    ? "Processing..."
                    : `Pay ₹${Number(topUpAmount || 0).toLocaleString("en-IN")} via Razorpay`}
                </span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Top-Up Confirmed Celebration Modal ─── */}
      {topUpSuccessPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 text-center relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />
            <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-100 rounded-full blur-2xl opacity-60 pointer-events-none" />

            {/* Glowing Success Badge */}
            <div className="relative mx-auto w-16 h-16 rounded-2xl bg-[#ECFDF5] border border-emerald-200 flex items-center justify-center shadow-emerald-glow">
              <Sparkles className="w-8 h-8 text-[#059669] animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="inline-block text-[11px] font-extrabold uppercase tracking-widest text-[#059669] bg-[#ECFDF5] px-3 py-1 rounded-full border border-emerald-200">
                Payment Authorized & Verified
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Wallet Top-Up Confirmed!
              </h3>
              <p className="text-xs text-slate-500">
                Your payment was received and instantly credited to your Turf Cash account.
              </p>
            </div>

            {/* Summary Box */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-4 space-y-3 text-left">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
                <span className="text-xs font-semibold text-slate-500">Credited Amount</span>
                <span className="text-lg font-black text-[#059669]">
                  +₹{Number(topUpSuccessPayload.amount).toLocaleString("en-IN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Updated Wallet Balance</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{Number(topUpSuccessPayload.newBalance).toLocaleString("en-IN")}
                </span>
              </div>
              {topUpSuccessPayload.paymentId && (
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Payment Ref ID:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    {topUpSuccessPayload.paymentId}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setTopUpSuccessPayload(null);
                  navigate("/turfs");
                }}
                className="w-full py-3.5 px-4 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm shadow-emerald-glow transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>⚽ Book a Pitch Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setTopUpSuccessPayload(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
              >
                View Wallet & Transactions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Receipt Modal for Individual Transaction ─── */}
      {selectedTxForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-md w-full rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5 text-[#059669]" />
                <h3 className="text-base font-extrabold text-slate-900">
                  Transaction Receipt
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxForReceipt(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Receipt Card */}
            <div className="bg-[#F8FAFC] border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="text-center pb-3 border-b border-slate-200/80">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#059669] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {selectedTxForReceipt.transaction_type === "CREDIT" ? "Credit / Top-Up" : "Debit / Booking"}
                </span>
                <h4 className="text-2xl font-black text-slate-900 mt-2 font-sans">
                  {selectedTxForReceipt.transaction_type === "CREDIT" ? "+" : "-"}₹
                  {Number(selectedTxForReceipt.amount).toLocaleString("en-IN")}
                </h4>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {selectedTxForReceipt.description || "Wallet Transaction"}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Date & Time</span>
                  <span className="font-bold text-slate-800">
                    {new Date(selectedTxForReceipt.created_at).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Balance After Tx</span>
                  <span className="font-bold text-slate-800">
                    ₹{Number(selectedTxForReceipt.balance_after).toLocaleString("en-IN")}
                  </span>
                </div>
                {selectedTxForReceipt.reference_id && (
                  <div className="flex justify-between text-slate-500 items-center">
                    <span>Reference ID</span>
                    <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-200/60 px-2 py-0.5 rounded">
                      {selectedTxForReceipt.reference_id}
                    </span>
                  </div>
                )}
                {selectedTxForReceipt.source && (
                  <div className="flex justify-between text-slate-500">
                    <span>Source</span>
                    <span className="font-bold text-slate-800 uppercase">
                      {selectedTxForReceipt.source}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (selectedTxForReceipt.reference_id) {
                    handleCopyRef(selectedTxForReceipt.reference_id);
                  }
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Ref ID</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedTxForReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs shadow-emerald-glow transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
