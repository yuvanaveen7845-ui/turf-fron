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
      <main className="flex-1 min-h-[calc(100vh-5rem)] pt-24 sm:pt-28 md:pt-32 pb-20 md:pb-0 print:pt-0 print:p-0 print:m-0">
        <Suspense
          fallback={
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-pulse min-h-[80vh]">
              {/* Hero / Header Skeleton */}
              <div className="max-w-3xl mx-auto text-center space-y-4 pt-4">
                <div className="h-6 w-48 rounded-full bg-slate-200/70 mx-auto" />
                <div className="h-12 w-3/4 rounded-2xl bg-slate-200/80 mx-auto" />
                <div className="h-4 w-1/2 rounded bg-slate-200/60 mx-auto" />
              </div>
              {/* Filter / Deck Skeleton */}
              <div className="max-w-4xl mx-auto h-48 sm:h-56 rounded-3xl bg-slate-200/60" />
              {/* Pitch Cards Grid Skeleton */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <div className="h-[440px] rounded-2xl bg-slate-200/50" />
                <div className="h-[440px] rounded-2xl bg-slate-200/50" />
                <div className="h-[440px] rounded-2xl bg-slate-200/50" />
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
