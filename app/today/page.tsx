"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Sparkles, Calendar, ArrowRight, BrainCircuit, RefreshCw } from "lucide-react";

export default function TodayIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  
  // 필터 상태
  const [category, setCategory] = useState("전체");
  const [schoolLevel, setSchoolLevel] = useState("전체");

  // 1. 컴포넌트 마운트 시 로컬 캐시 즉시 복구 (SWR 패턴)
  useEffect(() => {
    const cached = localStorage.getItem("today_ideas_cache_v2");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const restoreDates = (item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        });
        setIdeas(parsed.map(restoreDates));
        setLoading(false);
      } catch (e) {
        console.error("Failed to parse today's ideas cache:", e);
      }
    }
  }, []);

  const fetchTodayIdeas = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const ideasRef = collection(db, "ideas");
      const q = query(
        ideasRef,
        where("createdAt", ">=", startOfToday),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const snap = await getDocs(q);
      const loaded: Idea[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Idea);
      });

      if (loaded.length === 0) {
        const { FALLBACK_SEEDS } = await import("@/constants/fallbackSeeds");
        const todayIndex = new Date().getDate() % FALLBACK_SEEDS.length;
        const seedData = FALLBACK_SEEDS[todayIndex];

        const tempId = "fallback-temp";
        const tempIdea: Idea = {
          ...seedData,
          id: tempId,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: "draft",
          averageScore: 0,
        } as Idea;

        setIdeas([tempIdea]);
        setLoading(false);

        try {
          const { addDoc } = await import("firebase/firestore");
          const docRef = await addDoc(ideasRef, {
            ...seedData,
            status: "draft",
            averageScore: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: "system-fallback",
          });

          const nextIdeas = [
            {
              ...tempIdea,
              id: docRef.id,
            },
          ];
          setIdeas(nextIdeas);
          localStorage.setItem("today_ideas_cache_v2", JSON.stringify(nextIdeas));
        } catch (dbErr) {
          console.error("Failed to silently upload fallback seed to Firestore:", dbErr);
        }
        return;
      }

      setIdeas(loaded);
      localStorage.setItem("today_ideas_cache_v2", JSON.stringify(loaded));
    } catch (err) {
      console.error("Failed to load today's ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayIdeas(true);
  }, []);

  // ⚡ 수동 오늘의 아이디어 즉시 자동 생성 실행
  const handleGenerateToday = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count: 3,
          category: category !== "전체" ? category : "생활안전",
          schoolLevel: schoolLevel !== "전체" ? schoolLevel : "초등 고학년",
          topicPrompt: "오늘의 불편한 사회 현상을 해결하는 참신한 발명품 아이디어",
        }),
      });

      if (!res.ok) throw new Error("자동 생성 실패");
      await fetchTodayIdeas(false);
    } catch (err) {
      console.error("Auto generation failed:", err);
      alert("아이디어 생성 중 오류가 발생했습니다.");
    } finally {
      setGenerating(false);
    }
  };

  const handleRated = (updatedIdea: Idea) => {
    setIdeas((prev) =>
      prev.map((item) => (item.id === updatedIdea.id ? updatedIdea : item))
    );
  };

  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchCat = category === "전체" || idea.category === category;
      const matchLevel = schoolLevel === "전체" || idea.targetSchoolLevel === schoolLevel;
      return matchCat && matchLevel;
    });
  }, [ideas, category, schoolLevel]);

  const todayDateString = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-card-border">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono font-semibold tracking-wider uppercase mb-1">
            <Calendar className="w-4 h-4" />
            <span>{todayDateString}</span>
          </div>
          <h2 id="today-title" className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-amber-400" />
            오늘의 발명 아이디어
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            매일 새롭게 생성되는 AI 추천 씨앗 아이디어 카드입니다. 평가를 완료해 주세요.
          </p>
        </div>

        <button
          onClick={handleGenerateToday}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          <span>{generating ? "AI 아이디어 착상 중..." : "⚡ AI 오늘의 아이디어 즉시 생성"}</span>
        </button>
      </div>

      {/* Filter Options */}
      <div className="glass-panel p-5 rounded-2xl border border-card-border">
        <CategoryFilter
          selectedCategory={category}
          onSelectCategory={setCategory}
          selectedSchoolLevel={schoolLevel}
          onSelectSchoolLevel={setSchoolLevel}
        />
      </div>

      {/* Ideas Card Grid */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">오늘의 발명 아이디어를 가져오는 중...</span>
          </div>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-dashed border-slate-800/80 max-w-md mx-auto space-y-5">
          <div className="p-4 bg-slate-900/40 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-slate-800">
            <BrainCircuit className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-md font-bold text-slate-200">오늘 생성된 아이디어가 없습니다</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
              {category !== "전체" || schoolLevel !== "전체"
                ? "선택한 필터 조건에 부합하는 아이디어가 없습니다. 필터를 해제해 보세요."
                : "상단의 [⚡ AI 오늘의 아이디어 즉시 생성] 버튼을 누르면 AI가 즉시 새로운 아이디어를 착상합니다!"}
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={handleGenerateToday}
              disabled={generating}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-xs font-bold rounded-xl shadow-md transition-all hover:opacity-95"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
              아이디어 즉시 생성
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onRated={handleRated} />
          ))}
        </div>
      )}
    </div>
  );
}
