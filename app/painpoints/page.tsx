"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PainpointsRedirect() {
  const router = useRouter();

  useEffect(() => {
    // 💡 불편함 입력실이 '아이디어 생성' 탭 내부로 흡수 통합되어 자동 이동
    router.replace("/generate?tab=painpoint");
  }, [router]);

  return (
    <div className="flex h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-slate-400">아이디어 생성실의 [불편함 해부 모드]로 이동 중...</span>
      </div>
    </div>
  );
}
