import React, { useState } from "react";
import { ChevronDown, HelpCircle, Shield, CheckCircle2 } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQS: FAQItem[] = [
  {
    category: "MATCH ACCESS",
    question: "What footwear is allowed on the artificial turf pitches?",
    answer:
      "Rubber studs (TF turf shoes), artificial grass studs (AG), and standard flat-soled athletic sneakers are allowed. Metal cleats, steel spikes, or bare feet are strictly prohibited to maintain FIFA-grade pitch safety.",
  },
  {
    category: "BOOKING & PAYMENT",
    question: "Can we pay a 50% advance deposit to hold our slot?",
    answer:
      "Yes! You can choose to pay the full fee online via UPI/Card/Wallet, or pay a 50% advance deposit during checkout and settle the remaining balance at our reception counter before kickoff.",
  },
  {
    category: "WEATHER POLICY",
    question: "What happens if it rains heavily during our booking time?",
    answer:
      "Our pitches feature multi-layer all-weather drainage systems designed for high-traction play during light rain. In cases of severe torrential weather, you receive an instant 100% credit refund to your Turf Wallet or a free 1-click reschedule to any date.",
  },
  {
    category: "SAFETY & LOCK",
    question: "How does the 5-minute slot lock protection work?",
    answer:
      "When you tap on any available slot, our real-time system locks it exclusively for your squad for 300 seconds. No other customer or counter operator can claim it while you review your squad and complete payment.",
  },
  {
    category: "AMENITIES",
    question: "Are balls, bibs, and dugouts included with the pitch rental?",
    answer:
      "Yes. Every pitch reservation includes complimentary team bibs, tournament-grade match balls (football) or heavy tennis balls/wickets (cricket), shaded dugouts, purified drinking water, and on-site vehicle parking.",
  },
];

export const MatchDayFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-2">
        <span className="text-[11px] font-bold text-[#059669] uppercase tracking-wider">
          Player Guidelines & Rules
        </span>
        <h2 className="text-[22px] sm:text-[28px] font-extrabold text-slate-900 tracking-tight">
          Match-Day & Booking FAQs
        </h2>
        <p className="text-sm text-slate-600">
          Everything you and your squad need to know before stepping onto the pitch.
        </p>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`rounded-2xl border transition-all overflow-hidden ${
                isOpen
                  ? "bg-white border-emerald-300 shadow-md ring-1 ring-emerald-400/20"
                  : "bg-white border-slate-200/80 hover:border-slate-300"
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full px-6 py-4.5 flex items-center justify-between text-left gap-4 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                      isOpen
                        ? "bg-[#059669] text-white"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {faq.question}
                  </h4>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 transition-transform duration-200 shrink-0 ${
                    isOpen ? "rotate-180 text-[#059669]" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-6 pb-5 pt-1 text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-100 bg-slate-50/40">
                  <p className="pl-9">{faq.answer}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
