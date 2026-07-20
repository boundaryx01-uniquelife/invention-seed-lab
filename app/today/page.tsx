"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Sparkles, RefreshCw, Zap } from "lucide-react";

export default function TodayIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [category, setCategory] = useState("전체");
  const [schoolLevel, setSchoolLevel] = useState("전체");

  // 🛡️ Firestore 예외 무시 Fail-Safe 로딩
  const fetchTodayIdeas = async () => {
    setLoading(true);
    try {
      const ideasRef = collection(db, "ideas");
      const q = query(ideasRef, orderBy("createdAt", "desc"), limit(30));
      const snap = await getDocs(q);

      const loaded: Idea[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
        } as Idea);
      });

      setIdeas(loaded);
    } catch (err) {
      console.warn("Firestore fetch today ideas bypassed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayIdeas();
  }, []);

  // ⚡ AI 오늘의 아이디어 즉시 생성
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
          topicPrompt: "오늘의 실생활 고충을 해결하는 참신한 발명품 아이디어",
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.ideas) && data.ideas.length > 0) {
        const formatted: Idea[] = data.ideas.map((item: any, idx: number) => ({
          ...item,
          id: item.id || `today-${Date.now()}-${idx}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        // UI 즉시 추가
        setIdeas((prev) => [...formatted, ...prev]);
      }
    } catch (err) {
      console.error("Auto generation error:", err);
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

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            오늘의 아이디어
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            사회적 고충 기사 및 생활 속 영감을 바탕으로 매일 AI가 새롭게 탐색·착상한 발명 아이디어 초안입니다.
          </p>
        </div>

        <button
          onClick={handleGenerateToday}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
          <span>{generating ? "AI 아이디어 착상 중..." : "⚡ AI 오늘의 아이디어 즉시 생성"}</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="glass-panel p-6 rounded-2xl border border-card-border">
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
            <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">오늘의 발명 아이디어를 불러오는 중...</span>
          </div>
        </div>
      ) : filteredIdeas.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-slate-800/80 max-w-md mx-auto space-y-4">
          <h3 className="text-md font-bold text-slate-400">등록된 오늘의 아이디어가 없습니다.</h3>
          <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
            상단의 [⚡ AI 오늘의 아이디어 즉시 생성] 버튼을 누르면 AI가 새로운 발명품 초안 3개를 즉시 만들어 드립니다!
          </p>
          <button
            onClick={handleGenerateToday}
            disabled={generating}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            첫 아이디어 즉시 생성
          </button>
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
