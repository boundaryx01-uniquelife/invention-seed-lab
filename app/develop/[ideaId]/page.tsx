"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea, DevelopmentLog } from "@/types/idea";
import { 
  BrainCircuit, 
  Wrench, 
  Lightbulb, 
  HelpCircle, 
  Layers, 
  Play, 
  Clipboard, 
  Check, 
  ArrowLeft,
  Sparkles,
  BookOpen,
  DollarSign,
  AlertTriangle,
  History,
  Atom,
  Search
} from "lucide-react";
import Link from "next/link";

export default function DevelopIdeaRoom() {
  const router = useRouter();
  const { ideaId } = useParams() as { ideaId: string };

  const [idea, setIdea] = useState<Idea | null>(null);
  const [logs, setLogs] = useState<DevelopmentLog[]>([]);
  const [selectedLogIndex, setSelectedLogIndex] = useState<number>(-1); // -1 이면 원본 혹은 최신 로그 없음

  const [loading, setLoading] = useState(true);
  const [developing, setDeveloping] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 클립보드 복사 피드백 상태
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. 아이디어 상세 조회
      const ideaRef = doc(db, "ideas", ideaId);
      const ideaSnap = await getDoc(ideaRef);

      if (!ideaSnap.exists()) {
        setError("해당 아이디어가 존재하지 않습니다.");
        setLoading(false);
        return;
      }
      setIdea({ id: ideaSnap.id, ...ideaSnap.data() } as Idea);

      // 2. 발전 로그 히스토리 조회
      const logsRef = collection(db, "developmentLogs");
      const q = query(logsRef, where("ideaId", "==", ideaId), orderBy("version", "desc"));
      const logsSnap = await getDocs(q);

      const loadedLogs: DevelopmentLog[] = [];
      logsSnap.forEach((doc) => {
        loadedLogs.push({ id: doc.id, ...doc.data() } as DevelopmentLog);
      });

      setLogs(loadedLogs);
      
      // 로그가 존재하면 가장 최신 로그(0번째 인덱스)를 디폴트로 활성화
      if (loadedLogs.length > 0) {
        setSelectedLogIndex(0);
      }
    } catch (err) {
      console.error("Error fetching idea development data:", err);
      setError("데이터를 가져오는 도중 문제가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ideaId) {
      fetchData();
    }
  }, [ideaId]);

  // AI 발전시키기 API 호출
  const handleDevelop = async () => {
    setDeveloping(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/develop-idea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ideaId }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccessMsg(`버전 ${data.version} 발전 연구 결과가 성공적으로 등록되었습니다.`);
        await fetchData(); // 화면 갱신
      } else {
        setError(data.error || "발전 처리에 실패했습니다.");
      }
    } catch (err) {
      setError("서버와의 통신 오류가 발생했습니다.");
    } finally {
      setDeveloping(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  // 선택된 활성 로그 데이터
  const activeLog = useMemo(() => {
    if (selectedLogIndex >= 0 && logs[selectedLogIndex]) {
      return logs[selectedLogIndex];
    }
    return null;
  }, [selectedLogIndex, logs]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">아이디어 연구 기록을 복원하는 중...</span>
        </div>
      </div>
    );
  }

  if (error && !idea) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="inline-flex p-3 bg-rose-950/30 border border-rose-900/50 rounded-2xl text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">오류가 발생했습니다</h3>
        <p className="text-sm text-slate-400">{error}</p>
        <Link href="/ideas" className="text-xs text-indigo-400 hover:underline inline-block pt-2">
          &larr; 저장소로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Upper bar */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <Link href="/ideas" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> 아이디어 저장소로 돌아가기
          </Link>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-violet-400" />
            발전 연구실 (Idea Lab)
          </h2>
        </div>
        
        {idea && (
          <button
            onClick={handleDevelop}
            disabled={developing}
            className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            {developing ? "AI 정밀 고도화 중..." : logs.length > 0 ? "AI 추가 발전시키기 (새 버전)" : "AI 정밀 발전 고도화 실행"}
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-sm text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-sm text-emerald-400">
          <Check className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Grid Layout */}
      {idea && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Area: Original Idea & Version selector */}
          <div className="lg:col-span-4 space-y-6">
            {/* Base Idea Details */}
            <div className="glass-panel p-5 rounded-2xl border border-card-border space-y-4">
              <span className="text-[10px] font-mono text-indigo-400 font-semibold tracking-wider block uppercase">
                {idea.category} • {idea.targetSchoolLevel}
              </span>
              <h3 className="text-lg font-bold text-white leading-snug">
                {idea.title}
              </h3>
              <hr className="border-card-border" />
              <div className="space-y-3 text-xs text-slate-300">
                <div>
                  <span className="text-slate-500 block font-semibold">발생된 일상 불편함</span>
                  <p className="mt-0.5 leading-relaxed">{idea.problem}</p>
                </div>
                <div>
                  <span className="text-slate-500 block font-semibold">초기 해결 가이드</span>
                  <p className="mt-0.5 leading-relaxed text-indigo-300">{idea.coreIdea}</p>
                </div>
              </div>
            </div>

            {/* Version History Tab */}
            <div className="glass-panel p-5 rounded-2xl border border-card-border space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-violet-400" />
                발전 연구 히스토리 ({logs.length})
              </h4>
              {logs.length === 0 ? (
                <div className="text-xs text-slate-500 py-4 text-center">
                  아직 가공된 발전 연구 기록이 없습니다. 우측 상단의 AI 정밀 발전을 실행해 보세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {logs.map((log, idx) => (
                    <button
                      key={log.id}
                      onClick={() => setSelectedLogIndex(idx)}
                      className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all ${
                        selectedLogIndex === idx
                          ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-600/5"
                          : "bg-slate-900/30 border-slate-800 text-slate-400 hover:bg-slate-850 hover:text-slate-200"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-semibold">연구 버전 #{log.version}</span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(log.createdAt?.toDate ? log.createdAt.toDate() : log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-400 truncate">
                        개선 핵심: {log.improvedCoreIdea || log.prototypePlan?.substring(0, 30)}...
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Area: Detailed Development content */}
          <div className="lg:col-span-8">
            {developing ? (
              <div className="glass-panel py-32 flex flex-col items-center justify-center rounded-2xl border border-violet-500/10 space-y-6">
                <div className="relative flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-violet-500/20 border-t-violet-400 rounded-full animate-spin" />
                  <div className="absolute w-10 h-10 border-2 border-indigo-500/20 border-b-indigo-400 rounded-full animate-spin [animation-direction:reverse]" />
                  <div className="absolute">
                    <Atom className="w-5 h-5 text-indigo-400 animate-pulse" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h4 className="text-md font-bold text-white">특허 및 시제품 시나리오 정교화 중...</h4>
                  <p className="text-xs text-slate-500 max-w-[340px] mx-auto leading-relaxed">
                    선행 기술 충돌 방지를 위한 확장 검색 키워드를 매핑하고, 학생이 직접 제작할 때 필요한 부품(아두이노, 3D 프린터 출력 등)과 현실적인 제작 원리를 조율하고 있습니다.
                  </p>
                </div>
              </div>
            ) : !activeLog ? (
              <div className="glass-panel p-10 text-center rounded-2xl border border-slate-800/80 space-y-4">
                <div className="p-4 bg-slate-900/40 rounded-full w-16 h-16 flex items-center justify-center mx-auto border border-slate-800">
                  <BrainCircuit className="w-8 h-8 text-violet-400" />
                </div>
                <h3 className="text-md font-bold text-slate-200">연구 기록이 아직 없습니다</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  우측 상단의 **'AI 정밀 발전 고도화 실행'** 버튼을 클릭하면, AI 발명 교육 전문가가 시제품 계획서 및 심사 보완 가이드를 실시간 작성합니다.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. Core Solutions (Ideal vs Realistic) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Ideal Solution */}
                  <div className="glass-panel p-6 rounded-2xl border border-indigo-500/10 space-y-3 bg-gradient-to-br from-indigo-950/10 to-slate-950/20">
                    <span className="text-[10px] font-mono text-indigo-400 font-semibold tracking-wider block uppercase">
                      Solution Type 01
                    </span>
                    <h4 className="text-md font-bold text-white flex items-center gap-1.5">
                      <Lightbulb className="w-5 h-5 text-indigo-400" /> 이상적인 해결방법
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeLog.idealSolution}
                    </p>
                  </div>

                  {/* Realistic Solution */}
                  <div className="glass-panel p-6 rounded-2xl border border-sky-500/10 space-y-3 bg-gradient-to-br from-sky-950/10 to-slate-950/20">
                    <span className="text-[10px] font-mono text-sky-400 font-semibold tracking-wider block uppercase">
                      Solution Type 02
                    </span>
                    <h4 className="text-md font-bold text-white flex items-center gap-1.5">
                      <Wrench className="w-5 h-5 text-sky-400" /> 현실적인 해결방법
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {activeLog.realisticSolution}
                    </p>
                  </div>
                </div>

                {/* 2. Prototype plan & Operating Principle */}
                <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
                  <h4 className="text-md font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5 text-violet-400" /> 시제품 구성 및 작동 원리
                  </h4>
                  
                  <div className="space-y-4 text-xs">
                    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40">
                      <span className="text-slate-500 font-semibold block mb-1">시제품 제작 계획</span>
                      <p className="text-slate-300 leading-relaxed font-sans">{activeLog.prototypePlan}</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40">
                      <span className="text-slate-500 font-semibold block mb-1">작동 메커니즘 / 작동 원리</span>
                      <p className="text-slate-300 leading-relaxed font-sans">{activeLog.operatingPrinciple}</p>
                    </div>

                    {/* BOM & Materials */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 col-span-2">
                        <span className="text-slate-500 font-semibold block mb-1.5">필요 준비물 / 재료 목록</span>
                        <div className="flex flex-wrap gap-1.5">
                          {activeLog.materials?.map((mat, i) => (
                            <span key={i} className="bg-slate-850 border border-slate-800 text-[10px] text-slate-300 px-2 py-0.5 rounded-md">
                              📦 {mat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/40 flex flex-col justify-between">
                        <div>
                          <span className="text-slate-500 font-semibold block">예상 비용 수준</span>
                          <span className="text-sm font-bold text-slate-200 block mt-1">{activeLog.estimatedCost || "미평가"}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t border-slate-800/60">
                          <span className="text-slate-500 font-semibold block">제작 난이도</span>
                          <span className="text-sm font-bold text-slate-200 block">{activeLog.difficulty}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Search Keywords */}
                <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
                  <h4 className="text-md font-bold text-white flex items-center gap-1.5">
                    <Search className="w-5 h-5 text-indigo-400" />
                    선행 기술 조사용 검색어 키워드 (클릭하여 복사)
                  </h4>

                  <div className="space-y-3 text-xs">
                    {/* Kipris Patent */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800/40 gap-3">
                      <div>
                        <span className="font-semibold text-slate-300 block">특허정보넷(KIPRIS) 특허 검색 키워드</span>
                        <span className="text-slate-500 text-[11px]">유사 특허 유무를 파악하기 위한 정밀 특허 용어입니다.</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeLog.patentSearchKeywords?.map((key, i) => (
                          <button
                            key={i}
                            onClick={() => handleCopy(key, `pat-${i}`)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-950/20 hover:border-indigo-500/30 border border-slate-700 text-slate-300 hover:text-indigo-400 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>{key}</span>
                            {copiedKey === `pat-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Contest Winner */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800/40 gap-3">
                      <div>
                        <span className="font-semibold text-slate-300 block">학생발명대회 수상작 검색 키워드</span>
                        <span className="text-slate-500 text-[11px]">역대 수상작 목록과 비교 검토를 위한 키워드입니다.</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeLog.contestWinnerSearchKeywords?.map((key, i) => (
                          <button
                            key={i}
                            onClick={() => handleCopy(key, `con-${i}`)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-950/20 hover:border-emerald-500/30 border border-slate-700 text-slate-300 hover:text-emerald-400 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>{key}</span>
                            {copiedKey === `con-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Product Search */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-slate-900/30 border border-slate-800/40 gap-3">
                      <div>
                        <span className="font-semibold text-slate-300 block">쇼핑몰 시판 제품 검색 키워드</span>
                        <span className="text-slate-500 text-[11px]">유사 기성품이 이미 유통되고 있는지 검색하기 위한 시장 용어입니다.</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {activeLog.productSearchKeywords?.map((key, i) => (
                          <button
                            key={i}
                            onClick={() => handleCopy(key, `prod-${i}`)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-sky-950/20 hover:border-sky-500/30 border border-slate-700 text-slate-300 hover:text-sky-400 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>{key}</span>
                            {copiedKey === `prod-${i}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Clipboard className="w-3 h-3" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Teacher's Guidance & Differentiation */}
                <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
                  <h4 className="text-md font-bold text-white flex items-center gap-1.5">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    대회 출품을 위한 지도 및 보완 방향
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                    <div className="space-y-2">
                      <span className="text-slate-500 font-semibold block">기존 제품 대비 차별화 포인트</span>
                      <ul className="list-decimal list-inside space-y-1 text-slate-300">
                        {activeLog.differentiationPoints?.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <span className="text-slate-500 font-semibold block">학생 지도 시 중점 피드백 요소</span>
                      <ul className="list-disc list-inside space-y-1 text-slate-300">
                        {activeLog.guidanceForStudent?.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
