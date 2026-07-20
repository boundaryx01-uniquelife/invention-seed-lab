"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import IdeaCard from "@/components/IdeaCard";
import CategoryFilter from "@/components/CategoryFilter";
import { Search, FolderOpen, ArrowUpDown, Filter, RotateCcw } from "lucide-react";

export default function IdeaRepository() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);

  // 검색 및 필터, 정렬 상태값
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("전체");
  const [schoolLevel, setSchoolLevel] = useState("전체");
  // 기본값: "saved_all" (평가받아 저장 승인된 아이디어들만 기본 노출)
  const [statusFilter, setStatusFilter] = useState("saved_all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchIdeas = async () => {
    setLoading(true);
    try {
      const ideasRef = collection(db, "ideas");
      const q = query(ideasRef, orderBy("createdAt", "desc"), limit(300));
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
      console.error("Failed to fetch repository ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, []);

  const handleRated = (updatedIdea: Idea) => {
    setIdeas((prev) =>
      prev.map((item) => (item.id === updatedIdea.id ? updatedIdea : item))
    );
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setCategory("전체");
    setSchoolLevel("전체");
    setStatusFilter("saved_all");
    setSortBy("newest");
  };

  const processedIdeas = useMemo(() => {
    const result = ideas.filter((idea) => {
      const matchCat = category === "전체" || idea.category === category;
      const matchLevel = schoolLevel === "전체" || idea.targetSchoolLevel === schoolLevel;
      
      // 💡 정밀 상태 필터링: "saved_all" 일 때는 평가를 받아 저장 승인된 아이디어만 선별
      let matchStatus = true;
      if (statusFilter === "saved_all") {
        matchStatus = idea.status === "saved" || idea.status === "excellent" || idea.status === "developing";
      } else if (statusFilter !== "all") {
        matchStatus = idea.status === statusFilter;
      }

      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        !term || 
        idea.title.toLowerCase().includes(term) ||
        idea.problem.toLowerCase().includes(term) ||
        idea.coreIdea.toLowerCase().includes(term);

      return matchCat && matchLevel && matchStatus && matchSearch;
    });

    result.sort((a, b) => {
      if (sortBy === "newest") {
        return (b.createdAt?.getTime ? b.createdAt.getTime() : 0) - (a.createdAt?.getTime ? a.createdAt.getTime() : 0);
      }
      
      if (sortBy === "rating") {
        return (b.averageScore || 0) - (a.averageScore || 0);
      }

      if (sortBy === "feasibility") {
        const valA = a.scores?.feasibility || 0;
        const valB = b.scores?.feasibility || 0;
        return valB - valA;
      }

      if (sortBy === "patent") {
        const valA = a.scores?.patentPotential || 0;
        const valB = b.scores?.patentPotential || 0;
        return valB - valA;
      }

      if (sortBy === "contest") {
        const valA = a.scores?.contestSuitability || 0;
        const valB = b.scores?.contestSuitability || 0;
        return valB - valA;
      }

      return 0;
    });

    return result;
  }, [ideas, searchTerm, category, schoolLevel, statusFilter, sortBy]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <FolderOpen className="w-8 h-8 text-sky-400" />
            아이디어 저장소
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            평가를 거쳐 검증 및 저장(Saved/Excellent) 승인된 우수 발명 아이디어들의 정식 보관소입니다.
          </p>
        </div>
      </div>

      {/* Search & Sorting & Status Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="아이디어명, 핵심 기술, 해결 문제 검색..."
              className="block w-full rounded-xl border border-slate-700 bg-slate-900/40 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
            />
          </div>

          <div className="md:col-span-3 flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-1">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer py-1.5"
            >
              <option value="saved_all">보관소: 평가 승인작만 보기 (기본)</option>
              <option value="draft">보관소: 미평가 검토 대기 (draft)</option>
              <option value="saved">상태: 일반 저장됨 (saved)</option>
              <option value="excellent">상태: 우수 후보 (excellent)</option>
              <option value="developing">상태: 심층 발전 중 (developing)</option>
              <option value="failed">상태: 실패 목록 (failed)</option>
              <option value="all">전체 보기 (초안+실패 포함)</option>
            </select>
          </div>

          <div className="md:col-span-3 flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-1">
            <ArrowUpDown className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer py-1.5"
            >
              <option value="newest">정렬: 최신순</option>
              <option value="rating">정렬: 평균 평점 높은순</option>
              <option value="feasibility">정렬: 제작 가능성 높은순</option>
              <option value="patent">정렬: 특허 가능성 높은순</option>
              <option value="contest">정렬: 대회 적합성 높은순</option>
            </select>
          </div>
        </div>

        <hr className="border-card-border/50" />

        <CategoryFilter
          selectedCategory={category}
          onSelectCategory={setCategory}
          selectedSchoolLevel={schoolLevel}
          onSelectSchoolLevel={setSchoolLevel}
        />

        {(searchTerm || category !== "전체" || schoolLevel !== "전체" || statusFilter !== "saved_all" || sortBy !== "newest") && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              필터 및 정렬 전체 초기화
            </button>
          </div>
        )}
      </div>

      {/* Ideas Card Grid */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">보관된 저장소 아이디어를 조회 중...</span>
          </div>
        </div>
      ) : processedIdeas.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-slate-800/80 max-w-md mx-auto space-y-4">
          <h3 className="text-md font-bold text-slate-400">평가 승인되어 저장된 아이디어가 없습니다.</h3>
          <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
            [오늘의 아이디어]나 [아이디어 생성]에서 초안을 평가(3.5점 이상)하여 아이디어 저장소로 승격시켜 보세요!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {processedIdeas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onRated={handleRated} />
          ))}
        </div>
      )}
    </div>
  );
}
