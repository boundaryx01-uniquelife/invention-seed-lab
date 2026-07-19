"use client";

import { useEffect } from "react";

export default function LoginPageBypass() {
  useEffect(() => {
    // 접속하는 즉시 브라우저 캐시 및 히스토리를 덮어쓰고 메인 대시보드(/)로 강제 직통 이동
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#070a13] text-slate-300">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">대시보드로 이동 중입니다...</p>
      </div>
    </div>
  );
}
