import React from "react";
import { Outlet } from "react-router-dom";
import { Navbar } from "../common/Navbar";
import { Footer } from "../common/Footer";
import { StickyBottomNav } from "../common/StickyBottomNav";

export const CustomerLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] selection:bg-[#059669] selection:text-white pb-safe-nav md:pb-0">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <StickyBottomNav />
    </div>
  );
};
