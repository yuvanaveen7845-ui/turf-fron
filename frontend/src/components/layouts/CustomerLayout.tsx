import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import { Footer } from "../common/Footer";
import { StickyBottomNav } from "../common/StickyBottomNav";

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#059669] selection:text-white pb-safe-nav md:pb-0 print:bg-white print:p-0 print:m-0 print:min-h-0">
      <div className="print:hidden">
        <Navbar />
      </div>
      <main className="flex-1 pt-16 sm:pt-20 print:pt-0 print:p-0 print:m-0">
        <Outlet />
      </main>
      <div className="print:hidden">
        <Footer />
        <StickyBottomNav />
      </div>
    </div>
  );
};
