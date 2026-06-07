"use client";

import { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import { 
  MessageSquare, 
  HelpCircle, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Atom,
  Search
} from "lucide-react";

const CATEGORIES = [
  "생활안전",
  "학교생활",
  "환경·에너지",
  "고령자·장애 보조",
  "반려동물",
  "재난·기후",
  "디지털·AI",
  "의료·건강",
  "교통·이동",
  "가정생활",
  "운동·놀이",
  "학습도구",
];

const SCHOOL_LEVELS = ["초등 저학년", "초등 고학년", "중학생", "고등학생", "전체"];

export default function PainpointsRoom() {
  const [userInput, setUserInput] = useState("");
  const [category, setCategory] = useState("생활안전");
  const [schoolLevel, setSchoolLevel] = useState("초등 고학년");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // 분석 결과 상태값
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  // 저장 성공한 후보 리스트 (중복 저장 방지)
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim()) {
      setError("불편 상황을 상세히 기술해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setAnalysisResult(null);
    setSavedIndices(new Set());

    try {
      const res = await fetch("/api/analyze-painpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput }),
      });

      const data = await res.json();

      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        setError(data.error || "분석 도중 오류가 발생했습니다.");
      }
    } catch (err) {
      setError("서버 호출 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 특정 후보를 발명 아이디어 카드로 매핑하여 저장
  const handleSaveIdea = async (candidate: any, index: number) => {
    if (savedIndices.has(index)) return;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const ideasRef = collection(db, "ideas");
      const newDocRef = doc(ideasRef); // 자동 생성 ID

      // 분석 결과 객체를 Idea 타입 스키마 규격으로 매핑
      const newIdea: Idea = {
        id: newDocRef.id,
        title: candidate.title,
        category: category,
        subCategory: "불편함 가공",
        targetSchoolLevel: schoolLevel,
        problem: analysisResult.analyzedProblem,
        userPainPoint: userInput,
        targetUser: analysisResult.targetUser,
        usageSituation: analysisResult.usageSituation || "일상생활",
        coreIdea: candidate.coreIdea,
        idealSolution: candidate.coreIdea, // 이상적 솔루션 대체
        realisticSolution: candidate.realisticPrototype,
        prototypePlan: candidate.realisticPrototype,
        operatingPrinciple: "시제품의 구조를 물리적으로 결합하여 작동하는 방식",
        expectedMaterials: [],
        expectedDifficulty: "medium",
        expectedCostLevel: "medium",
        patentPotential: candidate.risk || "추가 선행기술 조사 필요",
        contestSuitability: candidate.reason || "실생활 밀착형 주제",
        noveltyNote: "불편함 입력실 가공에서 도출된 신규 과제",
        similarRiskNote: candidate.risk || "기존 물품과 구조 유사성 검토 필요",
        sourceBasis: [
          {
            type: "생활 불편함",
            summary: analysisResult.analyzedProblem,
            searchHint: analysisResult.searchKeywords?.general?.[0] || "불편함 키워드",
          },
        ],
        searchKeywords: {
          patent: analysisResult.searchKeywords?.patent || [],
          contestWinners: analysisResult.searchKeywords?.contestWinners || [],
          products: analysisResult.searchKeywords?.products || [],
          general: analysisResult.searchKeywords?.general || [],
          expanded: [],
        },
        status: "draft",
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "admin",
      };

      await setDoc(newDocRef, newIdea);

      setSavedIndices((prev) => {
        const next = new Set(prev);
        next.add(index);
        return next;
      });
      setSuccessMsg(`"${candidate.title}" 아이디어가 저장소에 '검토 대기(draft)' 상태로 성공적으로 등록되었습니다.`);
    } catch (err: any) {
      setError(err.message || "아이디어 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-6 border-b border-card-border">
        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <MessageSquare className="w-8 h-8 text-sky-400" />
          불편함 입력실
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          일상이나 학교생활에서 직접 겪은 사소한 불편을 적으면, AI가 원인을 정밀 분석하고 참신한 발명품 시나리오를 설계해 줍니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Input Form */}
        <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-6">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-400" />
            불편 사항 접수
          </h3>

          <form onSubmit={handleAnalyze} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">분야 카테고리 지정</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">대상 학교급 지정</label>
              <select
                value={schoolLevel}
                onChange={(e) => setSchoolLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
              >
                {SCHOOL_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">불편한 상황 설명</label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                required
                placeholder="예: '비 오는 날 학생들이 교실에 들어오면 우산 빗물 때문에 교실 바닥이 젖고 넘어지는 사고가 생깁니다.', '가위질을 오래 하면 손가락 마디가 눌려서 너무 아픕니다.' 등 상세히 적어주세요."
                className="w-full h-36 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Atom className="w-4 h-4" />
              불편함 정밀 분석 요청
            </button>
          </form>
        </div>

        {/* Right Analysis Result */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-sm text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-sm text-emerald-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Loading panel */}
          {loading && !analysisResult && (
            <div className="glass-panel py-20 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/10 space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-16 h-16 border-2 border-sky-500/20 border-t-sky-400 rounded-full animate-spin" />
                <div className="absolute w-10 h-10 border-2 border-indigo-500/20 border-b-indigo-400 rounded-full animate-spin [animation-direction:reverse]" />
                <div className="absolute">
                  <MessageSquare className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-md font-bold text-white">불편 요인 파악 및 솔루션 도출 중...</h4>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  기성 해결책의 문제점과 한계를 분석하고, 학생 발명대회에 적합하도록 실현 가능한 가벼운 공학적 해법을 모색하고 있습니다.
                </p>
              </div>
            </div>
          )}

          {/* Analysis View */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Problem Analysis Card */}
              <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-4">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Atom className="w-5 h-5 text-sky-400" />
                  불편 요소 및 상황 분석 리포트
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-semibold">도출된 명확한 문제</span>
                    <p className="text-slate-300 font-sans leading-relaxed">{analysisResult.analyzedProblem}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 block font-semibold">사용자 & 사용 환경</span>
                    <p className="text-slate-300 font-sans leading-relaxed">
                      {analysisResult.targetUser} / {analysisResult.usageSituation}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-3 border-t border-card-border/50">
                  <div>
                    <span className="text-slate-500 block font-semibold">기존 해결책</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                      {analysisResult.existingSolutions?.map((sol: string, i: number) => (
                        <li key={i}>{sol}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-semibold">기존 해결책의 한계</span>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-400">
                      {analysisResult.limitations?.map((lim: string, i: number) => (
                        <li key={i}>{lim}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {analysisResult.searchKeywords && (
                  <div className="pt-3 border-t border-card-border/50 text-xs">
                    <span className="text-slate-500 block font-semibold flex items-center gap-1">
                      <Search className="w-3.5 h-3.5" /> 분석 참고용 검색 키워드
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {analysisResult.searchKeywords.patent?.slice(0, 2).map((k: string, i: number) => (
                        <span key={i} className="bg-slate-900 border border-indigo-950 text-indigo-400 px-2 py-0.5 rounded-md">
                          특허: {k}
                        </span>
                      ))}
                      {analysisResult.searchKeywords.contestWinners?.slice(0, 2).map((k: string, i: number) => (
                        <span key={i} className="bg-slate-900 border border-emerald-950 text-emerald-400 px-2 py-0.5 rounded-md">
                          대회: {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Recommended Idea Candidates */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider block">
                  AI 추천 발명 아이디어 후보군
                </h3>

                <div className="space-y-4">
                  {analysisResult.suggestedIdeas?.map((candidate: any, index: number) => {
                    const isSaved = savedIndices.has(index);
                    const isBest = candidate.title === analysisResult.recommendedIdeaTitle;

                    return (
                      <div
                        key={index}
                        className={`glass-panel p-5 rounded-2xl border transition-all duration-300 relative ${
                          isSaved 
                            ? "border-emerald-500/40 bg-emerald-950/5" 
                            : isBest
                            ? "border-indigo-500/40 bg-indigo-950/5 shadow-[0_0_20px_rgba(99,102,241,0.05)]"
                            : "border-slate-800/80"
                        }`}
                      >
                        {isBest && !isSaved && (
                          <span className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> BEST 추천
                          </span>
                        )}

                        <div className="space-y-3">
                          <div>
                            <h4 className="text-md font-bold text-white flex items-center gap-2">
                              {candidate.title}
                            </h4>
                          </div>

                          <div className="text-xs text-slate-300 space-y-2">
                            <div>
                              <span className="text-slate-500 block font-semibold">핵심 발명 장치</span>
                              <p className="mt-0.5">{candidate.coreIdea}</p>
                            </div>
                            <div>
                              <span className="text-slate-500 block font-semibold">학생 제작형 프로토타입</span>
                              <p className="mt-0.5 text-slate-400">{candidate.realisticPrototype}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-card-border/50">
                              <div>
                                <span className="text-slate-500 block font-semibold">제안 근거</span>
                                <span className="text-slate-400">{candidate.reason}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block font-semibold">유사점/위험 요인</span>
                                <span className="text-rose-400/80">{candidate.risk || "없음"}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Save Action */}
                        <div className="mt-4 pt-3 border-t border-card-border/30 flex justify-end">
                          <button
                            onClick={() => handleSaveIdea(candidate, index)}
                            disabled={isSaved}
                            className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                              isSaved
                                ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/20"
                                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/10 active:scale-[0.98]"
                            }`}
                          >
                            <Save className="w-3.5 h-3.5" />
                            {isSaved ? "저장 완료" : "이 아이디어 카드로 저장"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
