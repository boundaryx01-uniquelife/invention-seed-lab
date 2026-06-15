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
  const [statusFilter, setStatusFilter] = useState("all"); // all, draft, saved, excellent, developing
  const [sortBy, setSortBy] = useState("newest"); // newest, rating, feasibility, patent, contest

  // 1. 컴포넌트 마운트 시 로컬 캐시 즉시 복구 (SWR 패턴)
  useEffect(() => {
    const cached = localStorage.getItem("ideas_repository_cache_v2");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const restoreDates = (item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        });
        setIdeas(parsed.map(restoreDates));
        setLoading(false); // 캐시 로드 성공 시 로딩 스피너 제거
      } catch (e) {
        console.error("Failed to parse ideas repository cache:", e);
      }
    }
  }, []);

  const fetchIdeas = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const ideasRef = collection(db, "ideas");
      // [최적화] 최근 300개 아이디어로 스캔량 제한 (풀스캔 제거)
      const q = query(ideasRef, orderBy("createdAt", "desc"), limit(300));
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

      setIdeas(loaded);
      // [최적화] 로컬 캐시 갱신
      localStorage.setItem("ideas_repository_cache_v2", JSON.stringify(loaded));
    } catch (err) {
      console.error("Failed to fetch repository ideas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas(true); // 백그라운드에서 조용히 갱신
  }, []);

  const handleRated = (updatedIdea: Idea) => {
    setIdeas((prev) =>
      prev.map((item) => (item.id === updatedIdea.id ? updatedIdea : item))
    );
  };

  // 필터 초기화
  const handleResetFilters = () => {
    setSearchTerm("");
    setCategory("전체");
    setSchoolLevel("전체");
    setStatusFilter("all");
    setSortBy("newest");
  };

  // 복합 클라이언트 필터링 및 검색, 정렬 연산
  const processedIdeas = useMemo(() => {
    // 1) 필터 및 검색 수행
    let result = ideas.filter((idea) => {
      // 카테고리 필터
      const matchCat = category === "전체" || idea.category === category;
      
      // 학교급 필터
      const matchLevel = schoolLevel === "전체" || idea.targetSchoolLevel === schoolLevel;
      
      // 상태 필터 (failed는 기본적으로 all에서 숨기고 별도 failed 필터 혹은 failures 탭에서 보게 유도)
      let matchStatus = true;
      if (statusFilter === "all") {
        matchStatus = idea.status !== "failed"; // 실패 목록은 기본적으로 제외
      } else {
        matchStatus = idea.status === statusFilter;
      }

      // 검색어 매칭 (제목, 문제 상황, 핵심 아이디어 검색)
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = 
        !term || 
        idea.title.toLowerCase().includes(term) ||
        idea.problem.toLowerCase().includes(term) ||
        idea.coreIdea.toLowerCase().includes(term);

      return matchCat && matchLevel && matchStatus && matchSearch;
    });

    // 2) 정렬 수행
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return b.createdAt.getTime() - a.createdAt.getTime();
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
            등록된 발명 아이디어들의 전체 명단을 검색하고 심사 상태를 제어합니다.
          </p>
        </div>
      </div>

      {/* Search & Sorting & Status Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search bar */}
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

          {/* Status filter */}
          <div className="md:col-span-3 flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-1">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer py-1.5"
            >
              <option value="all">상태: 전체보기 (실패 제외)</option>
              <option value="draft">상태: 검토 대기 (draft)</option>
              <option value="saved">상태: 저장됨 (saved)</option>
              <option value="excellent">상태: 우수 후보 (excellent)</option>
              <option value="developing">상태: 발전 중 (developing)</option>
              <option value="failed">상태: 실패 목록 (failed)</option>
            </select>
          </div>

          {/* Sorting filter */}
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

        {/* Categories Chip selectors */}
        <CategoryFilter
          selectedCategory={category}
          onSelectCategory={setCategory}
          selectedSchoolLevel={schoolLevel}
          onSelectSchoolLevel={setSchoolLevel}
        />

        {/* Reset button */}
        {(searchTerm || category !== "전체" || schoolLevel !== "전체" || statusFilter !== "all" || sortBy !== "newest") && (
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
            <span className="text-sm text-slate-400">데이터베이스에서 아이디어를 조회 중...</span>
          </div>
        </div>
      ) : processedIdeas.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-slate-800/80 max-w-md mx-auto space-y-4">
          <h3 className="text-md font-bold text-slate-400">검색 조건에 맞는 아이디어가 없습니다.</h3>
          <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
            검색어 입력을 변경하거나 카테고리/상태 필터를 확장하여 다른 아이디어를 발굴해 보세요.
          </p>
          {ideas.length > 0 && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all cursor-pointer"
            >
              필터 초기화
            </button>
          )}
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
