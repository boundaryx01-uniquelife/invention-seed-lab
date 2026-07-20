"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Sparkles, Zap, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function TodayIdeasPage() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [hasGeneratedToday, setHasGeneratedToday] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [category, setCategory] = useState("전체");
  const [schoolLevel, setSchoolLevel] = useState("전체");

  // 오늘 날짜 YYYY-MM-DD 구하기
  const getTodayDateString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  };

  // 1. 마운트 시 오늘 생성 여부 확인 및 미평가(draft) 아이디어 수집
  useEffect(() => {
    const todayStr = getTodayDateString();
    const lastGen = localStorage.getItem("last_today_gen_date");
    if (lastGen === todayStr) {
      setHasGeneratedToday(true);
    }
  }, []);

  const fetchTodayIdeas = async () => {
    setLoading(true);
    try {
      const ideasRef = collection(db, "ideas");
      const q = query(ideasRef, orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);

      const loadedMap = new Map<string, Idea>();
      snap.forEach((doc) => {
        const data = doc.data();
        const title = data.title;
        // 💡 규칙 2: 평가 안 된 미평가(draft) 상태 아이디어만 오늘의 아이디어 공간에 노출!
        const status = data.status || "draft";
        if (status === "draft" && title && !loadedMap.has(title)) {
          loadedMap.set(title, {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt || Date.now()),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt || Date.now()),
          } as Idea);
        }
      });

      setIdeas(Array.from(loadedMap.values()));
    } catch (err) {
      console.warn("Firestore fetch today ideas bypassed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayIdeas();
  }, []);

  // ⚡ AI 오늘의 아이디어 즉시 생성 (하루 1회 제한 규칙 적용)
  const handleGenerateToday = async () => {
    const todayStr = getTodayDateString();
    if (hasGeneratedToday) {
      setToastMessage("오늘의 아이디어 생성은 하루 1회만 가능합니다. 더 생성을 원하시면 [아이디어 생성] 메뉴를 이용하세요!");
      setTimeout(() => setToastMessage(""), 4000);
      return;
    }

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
          status: "draft",
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        setIdeas((prev) => {
          const map = new Map<string, Idea>();
          formatted.forEach((item) => map.set(item.title, item));
          prev.forEach((item) => {
            if (!map.has(item.title)) map.set(item.title, item);
          });
          return Array.from(map.values());
        });

        // 💡 규칙 1: 생성 성공 시 오늘 날짜 저장하여 하루 1회 잠금
        localStorage.setItem("last_today_gen_date", todayStr);
        setHasGeneratedToday(true);
        setToastMessage("✨ 오늘 분량의 참신한 발명 아이디어 3개가 성공적으로 생성되었습니다!");
        setTimeout(() => setToastMessage(""), 4000);
      }
    } catch (err) {
      console.error("Auto generation error:", err);
    } finally {
      setGenerating(false);
    }
  };

  // 💡 규칙 2: 평가가 완료되면 오늘의 아이디어 탭에서는 즉시 제거!
  // (3.5점 이상 ➔ 아이디어 저장소로 이동 / 3.5점 미만 ➔ 실패 목록으로 이동)
  const handleRated = (updatedIdea: Idea) => {
    const isSaved = updatedIdea.status === "saved" || updatedIdea.status === "excellent" || updatedIdea.status === "developing";
    
    // 오늘의 아이디어 목록에서 즉시 제거
    setIdeas((prev) => prev.filter((item) => item.id !== updatedIdea.id));

    if (isSaved) {
      setToastMessage(`🎉 [${updatedIdea.title}] 평가 완료! 3.5점 이상으로 [아이디어 저장소]로 이동되었습니다.`);
    } else {
      setToastMessage(`📌 [${updatedIdea.title}] 평가 완료. 평점 미달로 [실패 목록]으로 이동되었습니다.`);
    }
    setTimeout(() => setToastMessage(""), 5000);
  };

  const filteredIdeas = useMemo(() => {
    const seen = new Set<string>();
    const result: Idea[] = [];

    for (const idea of ideas) {
      const matchCat = category === "전체" || idea.category === category;
      const matchLevel = schoolLevel === "전체" || idea.targetSchoolLevel === schoolLevel;
      const isDraft = (idea.status || "draft") === "draft";
      
      if (matchCat && matchLevel && isDraft && idea.title && !seen.has(idea.title)) {
        seen.add(idea.title);
        result.push(idea);
      }
    }

    return result;
  }, [ideas, category, schoolLevel]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-20 right-5 z-50 bg-indigo-900 border border-indigo-500 text-indigo-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce max-w-md">
          <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
          <span className="text-xs font-bold leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-8 h-8 text-amber-400 fill-amber-400/20" />
            오늘의 아이디어
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            평가 전 검토 대기(draft) 상태의 초안 명단입니다. 평가를 완료하면 저장소/실패목록으로 자동 분류 이동합니다.
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={handleGenerateToday}
            disabled={generating || hasGeneratedToday}
            className={`flex items-center gap-2 px-5 py-2.5 font-bold text-xs rounded-xl shadow-lg transition-all ${
              hasGeneratedToday
                ? "bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed"
                : "bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white shadow-amber-500/20 active:scale-95 cursor-pointer disabled:opacity-50"
            }`}
          >
            {hasGeneratedToday ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>오늘 아이디어 생성 완료 (1/1회)</span>
              </>
            ) : (
              <>
                <Zap className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
                <span>{generating ? "AI 아이디어 착상 중..." : "⚡ AI 오늘의 아이디어 즉시 생성"}</span>
              </>
            )}
          </button>
          
          {hasGeneratedToday && (
            <span className="text-[11px] text-slate-500">
              * 하루 1회 제한 (더 필요하시면{" "}
              <Link href="/generate" className="text-indigo-400 underline hover:text-indigo-300">
                아이디어 생성 탭
              </Link>
              을 이용하세요)
            </span>
          )}
        </div>
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
          <h3 className="text-md font-bold text-slate-400">
            {hasGeneratedToday
              ? "오늘의 검토 대기 아이디어 평가가 모두 완료되었습니다!"
              : "등록된 오늘의 아이디어가 없습니다."}
          </h3>
          <p className="text-xs text-slate-600 max-w-[300px] mx-auto leading-relaxed">
            {hasGeneratedToday
              ? "평가가 완료된 아이디어들은 [아이디어 저장소] 및 [실패 목록]으로 안전하게 이동했습니다. 추가 생성을 원하시면 [아이디어 생성] 탭을 이용하세요!"
              : "상단의 [⚡ AI 오늘의 아이디어 즉시 생성] 버튼을 눌러 하루 분량 초안 3개를 만들어 보세요!"}
          </p>
          {!hasGeneratedToday ? (
            <button
              onClick={handleGenerateToday}
              disabled={generating}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              오늘 분량 아이디어 즉시 생성
            </button>
          ) : (
            <Link
              href="/ideas"
              className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all"
            >
              아이디어 저장소 이동
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredIdeas.map((idea) => (
            <IdeaCard key={idea.id || idea.title} idea={idea} onRated={handleRated} />
          ))}
        </div>
      )}
    </div>
  );
}
