"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {!isLoginPage && <Sidebar />}
      <main className={`flex-1 min-h-screen w-full transition-all duration-300 ${isLoginPage ? "" : "md:pl-64"}`}>
        <div className={isLoginPage ? "w-full min-h-screen" : "w-full min-h-screen p-6 md:p-8"}>
          {children}
        </div>
      </main>
    </div>
  );
}
