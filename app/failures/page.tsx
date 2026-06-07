"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Failure } from "@/types/idea";
import { AlertTriangle, Search, RefreshCw, Layers, Sparkles, BookOpen } from "lucide-react";

export default function FailureRepository() {
  const [failures, setFailures] = useState<Failure[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("전체");

  const fetchFailures = async () => {
    setLoading(true);
    try {
      const failuresRef = collection(db, "failures");
      const q = query(failuresRef, orderBy("createdAt", "desc"));
      const snap = await getDocs(q);

      const loaded: Failure[] = [];
      snap.forEach((doc) => {
        const data = doc.data();
        loaded.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        } as Failure);
      });

      setFailures(loaded);
    } catch (err) {
      console.error("Failed to load failures:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFailures();
  }, []);

  const categories = useMemo(() => {
    const list = new Set(failures.map((f) => f.category));
    return ["전체", ...Array.from(list)];
  }, [failures]);

  const filteredFailures = useMemo(() => {
    return failures.filter((fail) => {
      const matchCat = category === "전체" || fail.category === category;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch =
        !term ||
        fail.title.toLowerCase().includes(term) ||
        fail.failureReason.toLowerCase().includes(term);

      return matchCat && matchSearch;
    });
  }, [failures, searchTerm, category]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            실패 아이디어 분석소
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            평가 평점 3.5점 미만의 아이디어를 보관합니다. 한계를 분석하고 다른 아이디어의 발판으로 재활용합니다.
          </p>
        </div>
        <button
          onClick={fetchFailures}
          className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          데이터 동기화
        </button>
      </div>

      {/* Filter Options */}
      <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-500" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="실패 아이디어명, 실패 사유 키워드 검색..."
              className="block w-full rounded-xl border border-slate-700 bg-slate-900/40 py-2.5 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-500 focus:border-rose-500 focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-rose-500 transition-all"
            />
          </div>

          {/* Category drop */}
          <div className="flex items-center gap-2 bg-slate-900/40 border border-slate-800 rounded-xl px-3 py-1">
            <Layers className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-transparent border-none text-xs text-slate-300 focus:outline-none focus:ring-0 cursor-pointer py-1.5"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  영역: {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Failure Cards list */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-rose-900 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-400">실패 보관소를 정렬 중...</span>
          </div>
        </div>
      ) : filteredFailures.length === 0 ? (
        <div className="glass-panel py-16 px-6 text-center rounded-2xl border border-slate-800/80 max-w-md mx-auto space-y-4">
          <h3 className="text-md font-bold text-slate-400">실패 목록이 비어있습니다.</h3>
          <p className="text-xs text-slate-600 max-w-[280px] mx-auto leading-relaxed">
            3.5점 미만을 받은 아이디어가 아직 없거나, 조건에 맞는 검색 결과가 없습니다.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredFailures.map((fail) => (
            <div
              key={fail.id}
              className="glass-panel border border-rose-950/30 rounded-2xl p-6 flex flex-col justify-between gap-5 relative overflow-hidden"
            >
              {/* Top info */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono text-rose-400 font-semibold uppercase tracking-wider">
                    {fail.category}
                  </span>
                  <div className="flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                    평점 {fail.averageScore}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-200 tracking-tight">
                  {fail.title}
                </h3>

                <hr className="border-rose-950/20" />

                {/* Reasons & Weaknesses */}
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-rose-500/70 block">실패 사유 / 한계점</span>
                    <p className="mt-0.5 text-slate-300 leading-relaxed text-xs">{fail.failureReason}</p>
                  </div>

                  {fail.weakPoints && fail.weakPoints.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 block">진단된 구체적 결함</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {fail.weakPoints.map((weak, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-900 border border-slate-800 text-[10px] text-slate-400 px-2 py-0.5 rounded-md"
                          >
                            ⚠️ {weak}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <span className="text-xs font-semibold text-emerald-500/70 block flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> 재활용/개선 방향
                    </span>
                    <p className="mt-0.5 text-slate-400 text-xs leading-relaxed">{fail.reusePotential}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="pt-4 border-t border-rose-950/20 flex gap-2">
                <Link
                  href={`/develop/${fail.ideaId}`}
                  className="flex-1 py-2 px-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <BookOpen className="w-4 h-4" />
                  아이디어 재검토 및 상세
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
