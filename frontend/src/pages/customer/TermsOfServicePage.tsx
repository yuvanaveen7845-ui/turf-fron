import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  FileText,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Lock,
  RotateCcw,
  Scale,
  MapPin,
  Phone,
  Mail,
  Printer,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  HelpCircle,
} from "lucide-react";
import { Button } from "../../components/ui";

export const TermsOfServicePage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const lastUpdated = "September 15, 2026";

  const sections = [
    { id: "overview", label: "1. Acceptance & Overview" },
    { id: "reservations", label: "2. Slot Reservations & Locks" },
    { id: "gate-entry", label: "3. Gate Turnstile & QR Pass" },
    { id: "venue-rules", label: "4. Pitch Conduct & Equipment" },
    { id: "pricing-payments", label: "5. Pricing, Tax & Payments" },
    { id: "cancellations", label: "6. Cancellations & Refunds" },
    { id: "wallet-balances", label: "7. Turf Cash Wallet & Balances" },
    { id: "liability", label: "8. Liability & Injury Waiver" },
    { id: "governing-law", label: "9. Jurisdiction & Legal" },
  ];

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-8 sm:py-12 animate-in fade-in duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb / Back Link */}
        <div className="flex items-center justify-between print:hidden">
          <Link
            to="/"
            className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 hover:text-[#059669] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4 text-slate-600" />}
            >
              Print Document
            </Button>
            <Link
              to="/privacy"
              className="text-xs font-extrabold text-[#059669] hover:underline"
            >
              View Privacy Policy →
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-black text-emerald-400">
              <Scale className="w-3.5 h-3.5" />
              <span>Official Player Agreement</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Terms of Service & Arena Regulations
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              These terms govern all pitch reservations, turnstile admissions, financial transactions,
              and venue conduct at Friends Turf Sports Complex in Tiruppur.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-semibold">
              <span>📅 Effective Date: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span>🏢 Friends Turf Arena LLP</span>
              <span>•</span>
              <span>📍 Tiruppur, Tamil Nadu</span>
            </div>
          </div>
        </div>

        {/* Key Takeaways Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">5-Min Slot Lock</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Selected slots are locked exclusively for 5 minutes during checkout to prevent double-booking.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Gate Check-In</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Optical turnstiles open 30 minutes prior to kickoff. Single scan per booking pass.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Footwear Protocol</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Rubber studs & turf flats only. Metal cleats are strictly prohibited on all pitches.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Instant Refunds</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Cancellations &gt;6h prior receive 100% instant refund credited to Turf Cash wallet.
            </p>
          </div>
        </div>

        {/* Main Content Layout: Sidebar Table of Contents + Document Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-2">
                Table of Contents
              </h3>
              <nav className="space-y-0.5">
                {sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    onClick={() => setActiveSection(sec.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                      activeSection === sec.id
                        ? "bg-[#ECFDF5] text-[#059669]"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <span>{sec.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                  </a>
                ))}
              </nav>
            </div>

            {/* Quick Contact Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-3 shadow-sm border border-slate-800">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Questions or Disputes?
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Our campus managers are on-site daily from 05:00 AM to 12:00 AM.
              </p>
              <div className="space-y-1.5 pt-1 text-xs text-slate-300">
                <p className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>+91 93619 89494 / 93639 89494</span>
                </p>
                <p className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>support@friendsturf.com</span>
                </p>
              </div>
            </div>
          </div>

          {/* Document Content Body */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-10 text-slate-700 text-sm leading-relaxed">
            {/* Section 1: Acceptance */}
            <section id="overview" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <FileText className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  1. Acceptance & Overview
                </h2>
              </div>
              <p>
                Welcome to <strong>Friends Turf</strong> ("we", "us", "our", or "the Arena"), operated by
                Friends Turf Sports Complex Arena LLP, located near Sirupooluvapatti, Kamatchepuram, Tiruppur,
                Tamil Nadu 641603.
              </p>
              <p>
                By creating a Player Account, initiating a time-slot reservation, completing an online or cash payment,
                or presenting a Match Pass at the facility turnstiles, you ("User", "Player", or "Team Captain") agree
                to be bound by these Terms of Service. If you do not agree to these terms, do not access our digital
                platform or athletic facilities.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: Slot Reservations & Locks */}
            <section id="reservations" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Lock className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  2. Pitch Slot Reservations & 5-Minute Locks
                </h2>
              </div>
              <p>
                To provide fair, latency-free booking across all teams, our platform operates an automated atomic
                slot-locking engine:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>
                  <strong>Temporary Slot Lock:</strong> When you select one or more continuous time slots, they are locked
                  in your session for exactly <strong>5 minutes (300 seconds)</strong>. During this window, no other player
                  can reserve the same slot.
                </li>
                <li>
                  <strong>Lock Expiration:</strong> If payment verification is not completed within 5 minutes, the slot is
                  automatically released back to the live public pool.
                </li>
                <li>
                  <strong>Contiguous Slots:</strong> Multi-hour bookings must consist of continuous time slots without gaps.
                  Fragmented slot selection on a single pitch is disallowed.
                </li>
                <li>
                  <strong>Server-Authoritative Pricing:</strong> All final prices, floodlight surcharges, and peak-hour
                  adjustments are calculated securely on the server. Tampering with client payload values will invalidate the transaction.
                </li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3: Gate Entry & QR Pass */}
            <section id="gate-entry" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Clock className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  3. Gate Turnstile & Cryptographic Match Pass
                </h2>
              </div>
              <p>
                Every confirmed reservation issues a high-resolution, cryptographically signed <strong>Match Pass QR Code</strong>:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>
                  <strong>Gate Admission Window:</strong> Turnstile scanners allow optical gate check-in starting
                  <strong> 30 minutes prior</strong> to your scheduled slot start time and remain active for 30 minutes after start.
                </li>
                <li>
                  <strong>Single-Admission Rule:</strong> Each digital pass is valid for <strong>one team admission event</strong>.
                  Once successfully verified at the turnstile, the pass status transitions to <span className="font-mono font-bold text-slate-900">USED</span>.
                  Duplicate scans or forwarded screenshots will be rejected by the gate controller.
                </li>
                <li>
                  <strong>Partial Payment Passes:</strong> If a booking was confirmed with an advance deposit, the QR gate code
                  remains locked until the remaining balance is settled online or at the reception desk.
                </li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4: Pitch Conduct & Safety */}
            <section id="venue-rules" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <ShieldCheck className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  4. Pitch Rules, Footwear & Venue Conduct
                </h2>
              </div>
              <p>
                To maintain FIFA-grade playing quality and player safety, all visitors must strictly adhere to the
                following arena regulations:
              </p>
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-black uppercase">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Strict Footwear Policy</span>
                </div>
                <p>
                  <strong>ALLOWED:</strong> Artificial grass turf shoes (TF), rubber molded studs (FG/AG with short rubber cleats), and flat-sole athletic sneakers.
                  <br />
                  <strong>PROHIBITED:</strong> Metal studs, aluminum blades, spikes, work boots, or bare feet. Players wearing unauthorized footwear will be denied pitch access without refund.
                </p>
              </div>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li><strong>No Chewing Gum / Food on Turf:</strong> Only bottled water and isotonic sports drinks are permitted inside the playing arena.</li>
                <li><strong>Zero Tolerance for Violence:</strong> Physical altercations, verbal abuse of referees/staff, or intentional property damage will result in immediate campus expulsion and permanent account banning.</li>
                <li><strong>Punctuality:</strong> Matches must conclude precisely when the booked slot ends. Prolonged play that interferes with following squads is subject to overtime penalties.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5: Pricing & Payments */}
            <section id="pricing-payments" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <CheckCircle2 className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  5. Pricing, Tax & Payment Gateways
                </h2>
              </div>
              <p>
                All rates displayed on Friends Turf are in Indian Rupees (₹ INR) and include all applicable taxes (GST @ 18% under SAC Code 999651).
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>
                  <strong>Payment Modes:</strong> We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking
                  via Razorpay (PCI-DSS compliant), Turf Cash Wallet balance, and cash at the venue counter.
                </li>
                <li>
                  <strong>Advance Deposits:</strong> Certain peak slots may allow a 50% partial advance deposit. The remaining
                  balance must be cleared before pitch entry.
                </li>
                <li>
                  <strong>Official GST Invoices:</strong> Cryptographically generated GST Tax Invoices are issued immediately
                  upon full payment and accessible via the portal or downloadable PDF.
                </li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6: Cancellations & Refunds */}
            <section id="cancellations" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <RotateCcw className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  6. Cancellation & Refund Policy
                </h2>
              </div>
              <p>
                We understand match schedules can change. Our cancellation policy is tiered based on the time remaining
                until match kickoff:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-900 font-bold uppercase">
                    <tr>
                      <th className="p-3">Cancellation Notice</th>
                      <th className="p-3">Refund to Turf Cash Wallet</th>
                      <th className="p-3">Refund to Original Bank/UPI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700">
                    <tr>
                      <td className="p-3 font-bold">&gt; 6 Hours Prior</td>
                      <td className="p-3 font-bold text-[#059669]">100% Instant Refund (Zero fee)</td>
                      <td className="p-3">95% (5% gateway processing fee)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">2 to 6 Hours Prior</td>
                      <td className="p-3 font-bold text-amber-600">50% Credit Refund</td>
                      <td className="p-3 text-slate-400">Not Eligible</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold">&lt; 2 Hours / No-Show</td>
                      <td className="p-3 text-slate-400">0% (Slot was held exclusively)</td>
                      <td className="p-3 text-slate-400">0%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500">
                * Inclement Weather / Acts of Nature: If heavy rain or extreme weather renders the pitch unplayable,
                our managers will offer a 100% wallet refund or free slot reschedule.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7: Turf Cash Wallet */}
            <section id="wallet-balances" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  7. Turf Cash Wallet & Balances
                </h2>
              </div>
              <p>
                The Turf Cash Wallet provides instant 1-click slot checkout with zero gateway processing fees:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>Turf Cash Wallet funds never expire and can be used for instant slot reservations.</li>
                <li>Eligible slot cancellations credit 100% refund immediately back to your Turf Cash balance.</li>
                <li>Wallet balances are non-transferable between player accounts and cannot be withdrawn to physical bank cash.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 8: Liability */}
            <section id="liability" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <AlertTriangle className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  8. Physical Injury Disclaimer & Limitation of Liability
                </h2>
              </div>
              <p>
                Sports activities, including football, box cricket, and athletic tournaments, carry inherent risks of
                physical injury. By entering the premises:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>
                  <strong>Assumption of Risk:</strong> Players voluntarily assume all risks associated with participation,
                  including sprains, fractures, or collisions.
                </li>
                <li>
                  <strong>Personal Belongings:</strong> Friends Turf is not responsible for lost, stolen, or damaged personal
                  belongings, mobile phones, or vehicles parked in the campus lot.
                </li>
                <li>
                  <strong>First Aid:</strong> Standard first-aid kits and emergency assistance are available on site.
                </li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 9: Governing Law */}
            <section id="governing-law" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Scale className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  9. Governing Law & Dispute Jurisdiction
                </h2>
              </div>
              <p>
                These Terms of Service are governed by the laws of India. Any legal dispute, claim, or controversy arising
                out of or relating to these terms shall be subject to the exclusive jurisdiction of the competent courts in
                <strong> Tiruppur, Tamil Nadu, India</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
