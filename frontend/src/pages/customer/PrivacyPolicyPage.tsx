import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Lock,
  Eye,
  Database,
  UserCheck,
  Server,
  KeyRound,
  FileCheck,
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

export const PrivacyPolicyPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<string>("collection");

  const lastUpdated = "September 15, 2026";

  const sections = [
    { id: "collection", label: "1. Information We Collect" },
    { id: "usage", label: "2. How We Use Your Data" },
    { id: "gate-telemetry", label: "3. Gate Scans & Telemetry" },
    { id: "payment-security", label: "4. Payment Data & Encryption" },
    { id: "sharing", label: "5. Third-Party Service Providers" },
    { id: "retention", label: "6. Data Retention & Storage" },
    { id: "user-rights", label: "7. Your Rights & Data Portability" },
    { id: "cookies", label: "8. Cookies & Realtime Tokens" },
    { id: "contact-dpo", label: "9. Data Protection Officer" },
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
              to="/terms"
              className="text-xs font-extrabold text-[#059669] hover:underline"
            >
              View Terms of Service →
            </Link>
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-8 sm:p-12 border border-slate-800 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-xs font-black text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DPDPA 2023 Compliant Privacy Framework</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Privacy Policy & Data Protection
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              We value your trust. This Privacy Policy details how Friends Turf collects, encrypts, and protects
              your personal details, match pass telemetry, and payment transactions.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-semibold">
              <span>📅 Last Revised: <strong>{lastUpdated}</strong></span>
              <span>•</span>
              <span>🔒 256-Bit SSL Encrypted</span>
              <span>•</span>
              <span>🛡️ Zero Third-Party Ad Tracking</span>
            </div>
          </div>
        </div>

        {/* Privacy at a Glance Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#059669] flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Zero Card Data Storage</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Credit card numbers, CVVs, and UPI PINs are processed directly by RBI-authorized Razorpay.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <KeyRound className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Encrypted Gate Tokens</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Match Pass QR codes are opaque SHA-256 tokens that cannot be forged or reverse-engineered.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Eye className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">No Data Selling</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              We never sell, rent, or lease your phone number or match records to advertisers or third-parties.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-black text-slate-900">Full Data Control</h4>
            <p className="text-[11px] text-slate-500 leading-snug">
              Request full export or permanent erasure of your account history anytime via our portal.
            </p>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sticky Sidebar Navigation */}
          <div className="hidden lg:block lg:col-span-4 sticky top-24 space-y-4 print:hidden">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 px-3 py-2">
                Privacy Sections
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

            {/* Data Protection Help Card */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white space-y-3 shadow-sm border border-slate-800">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  Privacy Compliance Desk
                </h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                For data access, GDPR/DPDPA requests, or to update account details:
              </p>
              <div className="space-y-1.5 pt-1 text-xs text-slate-300">
                <p className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>privacy@friendsturf.com</span>
                </p>
                <p className="flex items-center space-x-2">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Friends Turf Campus, Tiruppur, TN</span>
                </p>
              </div>
            </div>
          </div>

          {/* Document Content Body */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-sm space-y-10 text-slate-700 text-sm leading-relaxed">
            {/* Section 1: Information Collected */}
            <section id="collection" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Database className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  1. Information We Collect
                </h2>
              </div>
              <p>
                To provide pitch reservation services, digital turnstile access, and automated receipt invoicing,
                Friends Turf collects the following categories of personal data:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>
                  <strong>Player Identity Information:</strong> Full Name, Email Address, and Mobile Phone Number
                  collected during registration, Google OAuth sign-in, or walk-in desk booking.
                </li>
                <li>
                  <strong>Reservation & Match Data:</strong> Selected pitch arena, booking date, time slots, squad name,
                  and coupon code usage.
                </li>
                <li>
                  <strong>Transaction Metadata:</strong> Razorpay payment order IDs, payment methods (UPI, Card, Wallet),
                  amounts paid, balance dues, and GST tax invoice numbers.
                </li>
                <li>
                  <strong>Technical & Device Data:</strong> IP address, browser type, operating system, and session tokens
                  used to securely maintain your authenticated state.
                </li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 2: How Data is Used */}
            <section id="usage" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Server className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  2. How We Use Your Information
                </h2>
              </div>
              <p>We process your personal information strictly for legitimate operational purposes:</p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>Issuing cryptographic QR match passes for stadium gate check-in.</li>
                <li>Dispatching booking confirmation emails, GST invoices, and slot reminder notifications.</li>
                <li>Managing Turf Cash Wallet balances and automated cancellation credits.</li>
                <li>Preventing fraud, duplicate turnstile admissions, and automated slot hoarding.</li>
                <li>Complying with statutory tax reporting requirements under the Indian Goods and Services Tax (GST) Act.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 3: Gate Scans & Telemetry */}
            <section id="gate-telemetry" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <KeyRound className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  3. Gate Telemetry & Optical Check-In Logs
                </h2>
              </div>
              <p>
                When your Match Pass is presented at the arena turnstiles, our optical scanners record an immutable
                admission audit event containing:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>Exact timestamp of turnstile scan.</li>
                <li>Scanner device identifier and gate officer ID.</li>
                <li>Verification decision (<span className="font-mono text-xs font-bold text-emerald-600">ALLOW</span> or <span className="font-mono text-xs font-bold text-red-600">DENY</span> with diagnostic reason code).</li>
              </ul>
              <p className="text-xs text-slate-500">
                These logs are maintained to ensure stadium security, audit capacity limits, and resolve admission disputes.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 4: Payment Security */}
            <section id="payment-security" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Lock className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  4. Payment Security & PCI-DSS Compliance
                </h2>
              </div>
              <p>
                All electronic transactions on Friends Turf are processed via <strong>Razorpay Software Private Limited</strong>,
                which is certified under the <strong>Payment Card Industry Data Security Standard (PCI-DSS Level 1)</strong>.
              </p>
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 font-black uppercase text-[#059669]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Direct Encrypted Tokenization</span>
                </div>
                <p>
                  Friends Turf servers never receive, process, or store raw credit/debit card numbers, CVVs, or UPI banking passwords.
                  All communication with Razorpay occurs over TLS 1.3 cryptographic channels with HMAC-SHA256 signature verification.
                </p>
              </div>
            </section>

            <hr className="border-slate-100" />

            {/* Section 5: Third-Party Service Providers */}
            <section id="sharing" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Eye className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  5. Third-Party Service Providers
                </h2>
              </div>
              <p>We work only with vetted infrastructure partners who adhere to rigorous data privacy standards:</p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li><strong>Razorpay:</strong> Payment gateway authorization and settlement.</li>
                <li><strong>Google Identity Services:</strong> Secure OAuth 2.0 single sign-on authentication.</li>
                <li><strong>Supabase / PostgreSQL:</strong> Secure, encrypted cloud database hosting with row-level security.</li>
                <li><strong>SMTP Mail Relays:</strong> Transactional delivery of match passes and GST invoices.</li>
              </ul>
              <p className="text-xs text-slate-500">
                We never sell, monetise, or distribute player contact lists to external advertisers or telemarketers.
              </p>
            </section>

            <hr className="border-slate-100" />

            {/* Section 6: Data Retention */}
            <section id="retention" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Database className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  6. Data Retention & Erasure
                </h2>
              </div>
              <p>
                We retain personal information for as long as your account remains active or as required by law:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li><strong>Account Profile Data:</strong> Maintained until account closure is requested by the user.</li>
                <li><strong>Financial & Invoice Records:</strong> Retained for 7 years in compliance with Indian Income Tax and GST regulations.</li>
                <li><strong>Gate Scan Audit Logs:</strong> Kept for 12 months for operational reconciliation before automated archival.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 7: User Rights */}
            <section id="user-rights" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <UserCheck className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  7. Your Rights Under DPDPA 2023
                </h2>
              </div>
              <p>As a player on Friends Turf, you possess the following statutory rights:</p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li><strong>Right to Access:</strong> View and review all active bookings, passes, and wallet transactions in your portal.</li>
                <li><strong>Right to Correction:</strong> Update your profile name, phone number, and preferences anytime in settings.</li>
                <li><strong>Right to Data Portability:</strong> Export past match receipts and booking histories as standardized PDFs.</li>
                <li><strong>Right to Erasure:</strong> Request permanent deletion of your player profile and non-statutory data.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 8: Cookies */}
            <section id="cookies" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Sparkles className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  8. Cookies & Realtime Telemetry
                </h2>
              </div>
              <p>
                Our web app uses lightweight local storage and secure session cookies solely for:
              </p>
              <ul className="space-y-2 list-disc pl-5 text-slate-600">
                <li>Maintaining authenticated JWT login sessions.</li>
                <li>Powering real-time pitch availability updates and 5-minute slot lock synchronization.</li>
                <li>Preserving theme and checkout filter preferences.</li>
              </ul>
            </section>

            <hr className="border-slate-100" />

            {/* Section 9: DPO Contact */}
            <section id="contact-dpo" className="space-y-3.5 scroll-mt-24">
              <div className="flex items-center space-x-2 text-[#059669]">
                <Scale className="w-5 h-5" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  9. Contact Our Data Protection Officer
                </h2>
              </div>
              <p>
                If you have any questions, concerns, or grievances regarding this Privacy Policy or how your personal data
                is handled, please contact our designated Grievance Officer:
              </p>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-1.5 text-slate-700">
                <p><strong>Grievance & Privacy Officer:</strong> Friends Turf Legal & Compliance</p>
                <p><strong>Address:</strong> Near Sirupooluvapatti, Kamatchepuram, Tiruppur, Tamil Nadu 641603</p>
                <p><strong>Email:</strong> <a href="mailto:privacy@friendsturf.com" className="text-[#059669] font-bold underline">privacy@friendsturf.com</a></p>
                <p><strong>Direct Helpline:</strong> +91 93619 89494 / +91 93639 89494</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
