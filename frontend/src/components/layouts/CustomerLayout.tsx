import React, { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import { Footer } from "../common/Footer";
import { StickyBottomNav } from "../common/StickyBottomNav";

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#059669] selection:text-white print:bg-white print:p-0 print:m-0 print:min-h-0">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-20 md:pb-0 print:pt-0 print:p-0 print:m-0">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-pulse">
              <div className="h-44 sm:h-64 rounded-3xl bg-slate-200/60" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-36 rounded-2xl bg-slate-200/50" />
                <div className="h-36 rounded-2xl bg-slate-200/50" />
                <div className="h-36 rounded-2xl bg-slate-200/50" />
              </div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <div className="print:hidden">
        <Footer />
        <StickyBottomNav />
      </div>
    </div>
  );
};
