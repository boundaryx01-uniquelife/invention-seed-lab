"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Sparkles, 
  Newspaper,
  PlusCircle, 
  FolderHeart, 
  AlertTriangle, 
  MessageSquare, 
  Settings, 
  LogOut,
  Atom
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  // 로그인 페이지에서는 사이드바를 노출하지 않습니다.
  if (pathname === "/login") return null;

  const menuItems = [
    { name: "대시보드", path: "/", icon: LayoutDashboard },
    { name: "오늘의 아이디어", path: "/today", icon: Sparkles },
    { name: "불편한 세상", path: "/news", icon: Newspaper },
    { name: "아이디어 생성", path: "/generate", icon: PlusCircle },
    { name: "아이디어 저장소", path: "/ideas", icon: FolderHeart },
    { name: "실패 목록", path: "/failures", icon: AlertTriangle },
    { name: "불편함 입력실", path: "/painpoints", icon: MessageSquare },
    { name: "설정", path: "/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    // 로그아웃을 위해 서버에 빈 쿠키 설정을 요청하거나 클라이언트 브라우저에서 쿠키 만료 처리를 위해 
    // 간편하게 로그인 쿠키를 지우는 API 호출(또는 직접 쿠키 제거)을 처리합니다.
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-card-border flex flex-col justify-between z-30">
      {/* Upper Brand Section */}
      <div>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-card-border bg-slate-900/20">
          <div className="p-2 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-lg shadow-lg animate-pulse">
            <Atom className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              발명씨앗 Lab
            </h1>
            <span className="text-xs text-slate-400 font-mono">Invention Seed Lab</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path || (item.path !== "/" && pathname?.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-indigo-600/30 to-sky-600/20 text-sky-400 border border-sky-500/20 shadow-[0_0_15px_rgba(56,189,248,0.1)]"
                    : "text-slate-400 hover:bg-slate-800/40 hover:text-slate-200 border border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-200 ${isActive ? "text-sky-400 scale-110" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer / Logout */}
      <div className="p-4 border-t border-card-border bg-slate-900/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/20 transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}
