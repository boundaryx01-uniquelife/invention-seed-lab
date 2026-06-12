"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import { 
  Sparkles, 
  FolderHeart, 
  AlertTriangle, 
  BrainCircuit, 
  TrendingUp, 
  Plus, 
  BarChart3, 
  Lightbulb, 
  Layers,
  ArrowRight
} from "lucide-react";
import StatusBadge from "@/components/StatusBadge";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  // 통계 상태값들
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    saved: 0,
    failed: 0,
    excellent: 0,
    developing: 0,
    avgScore: 0,
  });

  const [categoryDistribution, setCategoryDistribution] = useState<{ name: string; count: number; percent: number }[]>([]);
  const [topIdeas, setTopIdeas] = useState<Idea[]>([]);
  const [recentIdeas, setRecentIdeas] = useState<Idea[]>([]);

  // 1. 컴포넌트 마운트 시 로컬 캐시 즉시 복구 (SWR 패턴)
  useEffect(() => {
    const cached = localStorage.getItem("dashboard_cache_v2");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const restoreDates = (item: any) => ({
          ...item,
          createdAt: item.createdAt ? new Date(item.createdAt) : undefined,
          updatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        });

        if (parsed.stats) setStats(parsed.stats);
        if (parsed.categoryDistribution) setCategoryDistribution(parsed.categoryDistribution);
        if (parsed.topIdeas) setTopIdeas(parsed.topIdeas.map(restoreDates));
        if (parsed.recentIdeas) setRecentIdeas(parsed.recentIdeas.map(restoreDates));
        setLoading(false); // 캐시 로드 성공 시 즉시 렌더링
      } catch (e) {
        console.error("Dashboard cache restore failed:", e);
      }
    }
  }, []);

  // 2. 백그라운드 데이터 갱신 및 Firestore 최적화 쿼리
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const ideasRef = collection(db, "ideas");
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // [최적화 1] 서버사이드 개수 집계 (getCountFromServer로 비용 및 지연 대폭 감소)
        const [
          totalSnap,
          todaySnap,
          savedSnap,
          failedSnap,
          excellentSnap,
          developingSnap
        ] = await Promise.all([
          getCountFromServer(ideasRef),
          getCountFromServer(query(ideasRef, where("createdAt", ">=", startOfToday))),
          getCountFromServer(query(ideasRef, where("status", "==", "saved"))),
          getCountFromServer(query(ideasRef, where("status", "==", "failed"))),
          getCountFromServer(query(ideasRef, where("status", "==", "excellent"))),
          getCountFromServer(query(ideasRef, where("status", "==", "developing")))
        ]);

        const totalCount = totalSnap.data().count;
        const todayCount = todaySnap.data().count;
        const savedCount = savedSnap.data().count;
        const failedCount = failedSnap.data().count;
        const excellentCount = excellentSnap.data().count;
        const developingCount = developingSnap.data().count;

        // [최적화 2] 최근 5개 아이디어 전용 쿼리
        const recentQuery = query(ideasRef, orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(recentQuery);
        const loadedRecent: Idea[] = [];
        recentSnap.forEach((doc) => {
          const data = doc.data();
          loadedRecent.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Idea);
        });

        // [최적화 3] 통계 분석 및 TOP 5를 위한 스캔 제한 (최근 300개 캡핑)
        const statsQuery = query(ideasRef, orderBy("createdAt", "desc"), limit(300));
        const statsSnap = await getDocs(statsQuery);
        const statsIdeas: Idea[] = [];
        statsSnap.forEach((doc) => {
          const data = doc.data();
          statsIdeas.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
          } as Idea);
        });

        // 300개 데이터를 활용한 평균 평점 및 영역별 분포 가공
        let totalRatedScore = 0;
        let ratedCount = 0;
        const catCounts: Record<string, number> = {};

        statsIdeas.forEach((idea) => {
          catCounts[idea.category] = (catCounts[idea.category] || 0) + 1;
          if (idea.averageScore > 0) {
            totalRatedScore += idea.averageScore;
            ratedCount++;
          }
        });

        const avgScore = ratedCount > 0 ? Math.round((totalRatedScore / ratedCount) * 100) / 100 : 0;

        const dist = Object.entries(catCounts).map(([name, count]) => ({
          name,
          count,
          percent: statsIdeas.length > 0 ? Math.round((count / statsIdeas.length) * 100) : 0,
        })).sort((a, b) => b.count - a.count);

        // TOP 5 (인메모리 정렬로 복합 인덱스 요구 차단)
        const sortedByScore = [...statsIdeas]
          .filter(i => i.averageScore > 0)
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, 5);

        // 갱신된 데이터를 상태에 적용
        const nextStats = {
          total: totalCount,
          today: todayCount,
          saved: savedCount,
          failed: failedCount,
          excellent: excellentCount,
          developing: developingCount,
          avgScore,
        };

        setStats(nextStats);
        setCategoryDistribution(dist);
        setTopIdeas(sortedByScore);
        setRecentIdeas(loadedRecent);

        // [최적화 4] 로컬 캐시 스토리지 최신화
        localStorage.setItem("dashboard_cache_v2", JSON.stringify({
          stats: nextStats,
          categoryDistribution: dist,
          topIdeas: sortedByScore,
          recentIdeas: loadedRecent,
        }));

      } catch (err) {
        console.error("Dashboard background fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">연구소 대시보드를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  const statCards = [
    { name: "오늘 생성된 아이디어", value: stats.today, icon: Sparkles, color: "text-amber-400 bg-amber-500/10 border-amber-500/10" },
    { name: "저장된 아이디어 수", value: stats.saved, icon: FolderHeart, color: "text-sky-400 bg-sky-500/10 border-sky-500/10" },
    { name: "실패 목록 아이디어", value: stats.failed, icon: AlertTriangle, color: "text-rose-400 bg-rose-500/10 border-rose-500/10" },
    { name: "우수 후보 아이디어", value: stats.excellent, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/10" },
    { name: "개발 심화 중", value: stats.developing, icon: BrainCircuit, color: "text-violet-400 bg-violet-500/10 border-violet-500/10" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-card-border">
        <div>
          <h2 id="dashboard-title" className="text-2xl md:text-3xl font-black text-white tracking-tight">연구소 통계 대시보드</h2>
          <p className="text-slate-400 text-sm mt-1">발명씨앗 Lab의 전체 현황 및 평점 분석 대시보드입니다.</p>
        </div>
        <div className="flex gap-2">
          <Link
            id="btn-create-idea"
            href="/generate"
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/10 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            아이디어 생성실 가기
          </Link>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((c, idx) => {
          const Icon = c.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl flex flex-col justify-between gap-4 border border-card-border">
              <div className="flex justify-between items-start">
                <span className="text-xs text-slate-400 font-medium leading-tight">{c.name}</span>
                <div className={`p-2 rounded-lg ${c.color} border`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-3xl font-black text-white font-mono">{c.value}</span>
                <span className="text-xs text-slate-500 font-mono ml-1">개</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts & Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent & Top Score */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent List */}
          <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-indigo-400" />
                최근 분석/생성된 아이디어
              </h3>
              <Link href="/ideas" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                전체보기 <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentIdeas.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  생성된 아이디어가 존재하지 않습니다. 먼저 아이디어를 생성해 보세요.
                </div>
              ) : (
                recentIdeas.map((idea) => (
                  <Link
                    key={idea.id}
                    href={`/develop/${idea.id}`}
                    className="flex justify-between items-center p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-900/50 transition-all group"
                  >
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-slate-200 group-hover:text-sky-400 transition-colors">
                        {idea.title}
                      </h4>
                      <span className="text-xs text-slate-500">
                        {idea.category} • {idea.targetSchoolLevel}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={idea.status} />
                      {idea.averageScore > 0 ? (
                        <span className="text-sm font-mono font-bold text-amber-400 flex items-center gap-0.5">
                          ★ {idea.averageScore}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-slate-600">미평가</span>
                      )}
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Top Rated TOP 5 */}
          <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              최우수 평점 아이디어 (TOP 5)
            </h3>
            
            <div className="space-y-3">
              {topIdeas.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  아직 평가된 우수 아이디어가 없습니다.
                </div>
              ) : (
                topIdeas.map((idea, index) => (
                  <Link
                    key={idea.id}
                    href={`/develop/${idea.id}`}
                    className="flex justify-between items-center p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-900/50 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-black text-slate-600 font-mono w-4">{index + 1}</span>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-sky-400 transition-colors">
                          {idea.title}
                        </h4>
                        <span className="text-xs text-slate-500">{idea.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono font-bold text-amber-400">★ {idea.averageScore}</span>
                      <StatusBadge status={idea.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Stats Overview & Category Distribution */}
        <div className="space-y-6">
          {/* Average Indicator */}
          <div className="glass-panel p-6 rounded-2xl border border-card-border flex flex-col items-center justify-center text-center gap-3 bg-gradient-to-b from-indigo-950/20 to-slate-950/40">
            <BarChart3 className="w-10 h-10 text-indigo-400" />
            <div>
              <span className="text-xs text-slate-400 font-medium block">연구소 7일 전체 평균 점수</span>
              <span className="text-5xl font-black text-white font-mono tracking-tight mt-1">
                {stats.avgScore}
              </span>
              <span className="text-sm text-slate-500 font-mono"> / 5.0</span>
            </div>
            <p className="text-xs text-slate-500 max-w-[200px]">
              보통 이상(3.5 이상)을 받은 아이디어의 비중이 높을수록 연구소 건강도가 올라갑니다.
            </p>
          </div>

          {/* Category Distribution Chart */}
          <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-sky-400" />
              영역별 분포 현황
            </h3>
            
            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {categoryDistribution.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  등록된 데이터가 없습니다.
                </div>
              ) : (
                categoryDistribution.map((cat, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{cat.name}</span>
                      <span className="text-slate-400 font-mono">{cat.count}개 ({cat.percent}%)</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-sky-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${cat.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
