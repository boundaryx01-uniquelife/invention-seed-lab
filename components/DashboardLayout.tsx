"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { Atom, Menu } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Mobile Topbar */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-5 py-3.5 border-b border-card-border bg-slate-950/90 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-lg shadow-md">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">
            발명씨앗 Lab
          </span>
        </div>

        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 text-slate-300 hover:text-white bg-slate-900/60 border border-slate-800 rounded-xl transition-all active:scale-95 cursor-pointer"
          aria-label="메뉴 열기"
        >
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Sidebar Component (Handles both Desktop fixed & Mobile overlay) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content View */}
      <main className="flex-1 min-h-screen w-full transition-all duration-300 md:pl-64">
        <div className="w-full min-h-screen p-4 sm:p-6 md:p-8">{children}</div>
      </main>
    </div>
  );
}
