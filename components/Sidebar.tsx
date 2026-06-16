"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  Atom,
  FolderHeart,
  LayoutDashboard,
  MessageSquare,
  Newspaper,
  PlusCircle,
  Settings,
  Sparkles,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "대시보드", path: "/", icon: LayoutDashboard },
    { name: "오늘의 아이디어", path: "/today", icon: Sparkles },
    { name: "불편한 세상", path: "/news", icon: Newspaper },
    { name: "아이디어 생성", path: "/generate", icon: PlusCircle },
    { name: "아이디어 저장소", path: "/ideas", icon: FolderHeart },
    { name: "실패 목록", path: "/failures", icon: AlertTriangle },
    { name: "불편함 입력", path: "/painpoints", icon: MessageSquare },
    { name: "설정", path: "/settings", icon: Settings },
  ];

  return (
    <aside className="w-64 h-screen fixed left-0 top-0 glass-panel border-r border-card-border flex flex-col justify-between z-30">
      <div>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-card-border bg-slate-900/20">
          <div className="p-2 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-lg shadow-lg animate-pulse">
            <Atom className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              발명 씨앗 Lab
            </h1>
            <span className="text-xs text-slate-400 font-mono">Invention Seed Lab</span>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== "/" && pathname?.startsWith(item.path));
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
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? "text-sky-400 scale-110" : "text-slate-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-card-border bg-slate-900/10" />
    </aside>
  );
}
