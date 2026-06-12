"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Sparkles, Calendar, ArrowRight, BrainCircuit } from "lucide-react";

export default function TodayIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 필터 상태
  const [category, setCategory] = useState("전체");
  const [schoolLevel, setSchoolLevel] = useState("전체");

  const fetchTodayIdeas = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // 오늘 날짜 이후의 모든 아이디어 조회 (KST 기준)
      const ideasRef = collection(db, "ideas");
      const q = query(
        ideasRef,
        where("createdAt", ">=", startOfToday),
        orderBy("createdAt", "desc")
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

      // 오늘 생성된 아이디어가 없으면, Fallback 고정 씨앗 로드
      if (loaded.length === 0) {
        const { FALLBACK_SEEDS } = await import("@/constants/fallbackSeeds");
        const todayIndex = new Date().getDate() % FALLBACK_SEEDS.length;
        const seedData = FALLBACK_SEEDS[todayIndex];

        // 가상 임시 카드를 즉시 삽입 (대기 차단)
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

        // 조용하게 백그라운드로 Firestore에 해당 씨앗 자동 등록
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

          // 진짜 ID로 실시간 교체
          setIdeas([
            {
              ...tempIdea,
              id: docRef.id,
            },
          ]);
        } catch (dbErr) {
          console.error("Failed to silently upload fallback seed to Firestore:", dbErr);
        }
        return;
      }

      setIdeas(loaded);
    } catch (err) {
      console.error("Failed to load today's ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayIdeas();
  }, []);

  // 평점 완료 시 카드 상태 실시간 동기화
  const handleRated = (updatedIdea: Idea) => {
    setIdeas((prev) =>
      prev.map((item) => (item.id === updatedIdea.id ? updatedIdea : item))
    );
  };

  // 클라이언트 레벨 필터링 (Firestore 복합 색인 에러 방지)
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea) => {
      const matchCat = category === "전체" || idea.category === category;
      const matchLevel = schoolLevel === "전체" || idea.targetSchoolLevel === schoolLevel;
      return matchCat && matchLevel;
    });
  }, [ideas, category, schoolLevel]);

  // 오늘 날짜 텍스트 가공
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
                : "오늘 새롭게 생성된 아이디어가 없습니다. 생성실에서 직접 아이디어를 대량 생산해 보세요!"}
            </p>
          </div>
          <div className="pt-2">
            {category !== "전체" || schoolLevel !== "전체" ? (
              <button
                onClick={() => {
                  setCategory("전체");
                  setSchoolLevel("전체");
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
              >
                필터 초기화
              </button>
            ) : (
              <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white text-xs font-semibold rounded-xl shadow-md transition-all hover:opacity-95"
              >
                생성실로 이동 <ArrowRight className="w-4 h-4" />
              </Link>
            )}
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
