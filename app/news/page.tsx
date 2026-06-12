"use client";

import { useRouter } from "next/navigation";
import { SOIL_NEWS } from "@/constants/soilNews";
import { Newspaper, Lightbulb, ArrowRight, ExternalLink, Globe } from "lucide-react";

export default function SoilNewsPage() {
  const router = useRouter();

  const handleSeedIt = (prompt: string, category: string) => {
    // 생성실(/generate)로 파라미터를 담아 리다이렉트
    const url = `/generate?prompt=${encodeURIComponent(prompt)}&category=${encodeURIComponent(category)}`;
    router.push(url);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 id="news-title" className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-sky-400" />
            불편한 세상
          </h2>
          <p className="text-slate-400 text-sm mt-1 font-sans">
            사회 속 실제 결핍과 이슈를 탐색하고, 영감을 얻어 참신한 발명의 씨앗을 틔우는 비옥한 토양입니다.
          </p>
        </div>
      </div>

      {/* Grid of News Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {SOIL_NEWS.map((news) => (
          <div
            key={news.id}
            className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 border border-card-border/40"
          >
            {/* Ambient Background Light */}
            <div className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none -mr-8 -mt-8 bg-sky-400" />

            <div className="space-y-3.5">
              {/* Category & Source */}
              <div className="flex justify-between items-center gap-2">
                <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                  {news.category}
                </span>
                <span className="text-[10.5px] font-medium text-slate-500 flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {news.source}
                </span>
              </div>

              {/* News Title */}
              <h3 className="text-md font-bold text-white tracking-tight leading-snug">
                {news.title}
              </h3>

              {/* Social Painpoint */}
              <div className="text-xs space-y-1">
                <span className="text-slate-500 font-semibold block">기사 내용 및 사회적 불편</span>
                <p className="text-slate-300 leading-relaxed font-sans bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                  {news.problem}
                </p>
              </div>

              {/* AI Inspiration */}
              <div className="text-xs space-y-1.5 pt-1.5 border-t border-card-border/30">
                <span className="text-amber-400/90 font-semibold block flex items-center gap-1">
                  <Lightbulb className="w-3.5 h-3.5 fill-amber-400/20 text-amber-400" />
                  AI 발명 영감 방향
                </span>
                <p className="text-slate-400 leading-relaxed font-sans">
                  {news.aiInspiration}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-2 border-t border-card-border/20">
              <a
                href={news.url}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-4 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                <span>기사 원문</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                onClick={() => handleSeedIt(news.suggestedPrompt, news.category)}
                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all shadow-md shadow-sky-600/10 cursor-pointer"
              >
                <span>이 불편 해결하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
