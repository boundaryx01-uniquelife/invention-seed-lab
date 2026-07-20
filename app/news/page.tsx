"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SOIL_NEWS } from "@/constants/soilNews";
import CategoryFilter from "@/components/CategoryFilter";
import { Newspaper, Lightbulb, ArrowRight, ExternalLink, Globe, Search, RefreshCw, CheckCircle2 } from "lucide-react";

interface SoilNews {
  id: string;
  title: string;
  source: string;
  url: string;
  problem: string;
  category: string;
  aiInspiration: string;
  suggestedPrompt: string;
  createdAt?: any;
}

export default function SoilNewsPage() {
  const router = useRouter();
  const [newsList, setNewsList] = useState<SoilNews[]>(SOIL_NEWS);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("전체");

  // 🛡️ Firestore 데이터 로드 및 중복 제목 정리 (Deduplication)
  const fetchNews = async () => {
    try {
      const newsRef = collection(db, "news");
      const q = query(newsRef, orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);

      const loadedMap = new Map<string, SoilNews>();

      // 1. 고정 리얼 뉴스 10종 우선 배치
      SOIL_NEWS.forEach((item) => {
        loadedMap.set(item.title, item);
      });

      // 2. DB 뉴스 수집 및 동일 제목 중복 거르기
      snap.forEach((doc) => {
        const data = doc.data();
        const title = data.title;
        // 더미 무한 반복 문구는 거르고 참신한 기사만 수집
        if (title && !title.includes("[AI 실시간 사회이슈 탐색]") && !loadedMap.has(title)) {
          loadedMap.set(title, {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          } as SoilNews);
        }
      });

      setNewsList(Array.from(loadedMap.values()));
    } catch (err) {
      console.warn("Firestore fetch bypassed, using high quality seed news:", err);
      setNewsList(SOIL_NEWS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // ⚡ 실시간 AI 불편 기사 탐색 및 추가 (100% 다채로운 기사 착상)
  const handleGenerateNews = async () => {
    setGenerating(true);
    setToastMessage("");
    try {
      const targetCat = category !== "전체" ? category : "생활안전";

      const res = await fetch("/api/generate-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: targetCat }),
      });

      const data = await res.json();
      if (data.success && data.news) {
        const newNewsItem: SoilNews = {
          ...data.news,
          createdAt: new Date(),
        };

        // 제목 중복 검사 후 탑재
        setNewsList((prev) => {
          const exists = prev.some((n) => n.title === newNewsItem.title);
          if (exists) return prev;
          return [newNewsItem, ...prev];
        });

        setToastMessage(`✨ AI가 새로운 사회 불편 뉴스를 탐색하여 목록에 추가했습니다!`);
        setTimeout(() => setToastMessage(""), 5000);
      }
    } catch (err) {
      console.error("News generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleSeedIt = (prompt: string, category: string) => {
    const url = `/generate?prompt=${encodeURIComponent(prompt)}&category=${encodeURIComponent(category)}`;
    router.push(url);
  };

  // 클라이언트 카테고리 & 검색어 필터링
  const filteredNews = useMemo(() => {
    return newsList.filter((news) => {
      const matchCat = category === "전체" || news.category === category;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        news.title.toLowerCase().includes(term) ||
        news.problem.toLowerCase().includes(term);

      return matchCat && matchSearch;
    });
  }, [newsList, category, searchTerm]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-sky-900 border border-sky-500 text-sky-200 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-sky-400" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

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

        <button
          onClick={handleGenerateNews}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          <span>{generating ? "AI가 새 불편 기사 탐색 중..." : "⚡ AI 불편 기사 즉시 탐색"}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
        <div className="relative max-w-xl">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="불편 기사 제목, 고충 키워드 검색..."
            className="block w-full rounded-xl border border-slate-700 bg-slate-900/40 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-sky-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all"
          />
        </div>

        <hr className="border-card-border/50" />

        <CategoryFilter
          selectedCategory={category}
          onSelectCategory={setCategory}
          selectedSchoolLevel="전체"
          onSelectSchoolLevel={() => {}}
        />
      </div>

      {/* Grid of News Cards */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">사회 기사를 불러오는 중...</span>
          </div>
        </div>
      ) : filteredNews.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-slate-800/80 max-w-md mx-auto space-y-4">
          <h3 className="text-md font-bold text-slate-400">검색 조건에 맞는 기사가 없습니다.</h3>
          <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
            다른 키워드를 입력하거나 카테고리 필터를 변경해 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredNews.map((news) => (
            <div
              key={news.id || news.title}
              className="glass-panel glass-panel-hover rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden transition-all duration-300 border border-card-border/40"
            >
              <div className="absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-10 pointer-events-none -mr-8 -mt-8 bg-sky-400" />

              <div className="space-y-3.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[10px] font-mono text-sky-400 font-bold uppercase tracking-wider bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                    {news.category}
                  </span>
                  <span className="text-[10.5px] font-medium text-slate-500 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {news.source}
                  </span>
                </div>

                <h3 className="text-md font-bold text-white tracking-tight leading-snug">
                  {news.title}
                </h3>

                <div className="text-xs space-y-1">
                  <span className="text-slate-500 font-semibold block">기사 내용 및 사회적 불편</span>
                  <p className="text-slate-300 leading-relaxed font-sans bg-slate-900/30 p-3 rounded-xl border border-slate-800/40">
                    {news.problem}
                  </p>
                </div>

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
      )}
    </div>
  );
}
