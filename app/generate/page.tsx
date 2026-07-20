"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import { 
  BrainCircuit, 
  Settings2, 
  Wand2, 
  Save, 
  AlertCircle,
  CheckCircle2,
  Atom,
  MessageSquarePlus,
  Sparkles
} from "lucide-react";
import IdeaCard from "@/components/IdeaCard";

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

const CRITERIA = [
  { value: "최근 기사 기반", label: "최근 사회 뉴스/기사 기반" },
  { value: "생활 불편함 기반", label: "일상생활 속 불편함 해결" },
  { value: "학교 현장 문제 기반", label: "학교 현장에서 자주 겪는 문제" },
  { value: "제품 리뷰 불만 기반", label: "기성 제품 후기/리뷰 불만 보완" },
  { value: "사회 변화 기반", label: "고령화, 기후변화 등 거시 트렌드" },
  { value: "무작위 혼합", label: "무작위 창의성 조합" },
];

function GenerateIdeasForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 💡 서브 탭 모드: 'preset' (조건 설정 생성) | 'painpoint' (불편함 분해 생성)
  const [activeTab, setActiveTab] = useState<"preset" | "painpoint">("preset");

  // 탭 1 상태값
  const [category, setCategory] = useState("생활안전");
  const [schoolLevel, setSchoolLevel] = useState("초등 고학년");
  const [count, setCount] = useState(3);
  const [criteria, setCriteria] = useState("무작위 혼합");
  const [customPrompt, setCustomPrompt] = useState("");

  // 탭 2 상태값 (불편함 문장 입력)
  const [painpointText, setPainpointText] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  // URL 쿼리 파라미터로 초기 탭 및 프롬프트 바인딩
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const promptParam = searchParams.get("prompt");
    const categoryParam = searchParams.get("category");

    if (tabParam === "painpoint") {
      setActiveTab("painpoint");
    }
    if (promptParam) {
      setCustomPrompt(promptParam);
      setPainpointText(promptParam);
    }
    if (categoryParam && CATEGORIES.includes(categoryParam)) {
      setCategory(categoryParam);
    }
  }, [searchParams]);
  
  // AI 생성 결과 리스트 (초안 상태)
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);

  // 1. 조건 설정 기반 AI 생성
  const handleGeneratePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setGeneratedIdeas([]);

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          schoolLevel: showAdvanced ? schoolLevel : "초등 고학년",
          count: showAdvanced ? count : 3,
          criteria: showAdvanced ? criteria : "무작위 혼합",
          prompt: customPrompt,
        }),
      });

      const data = await res.json();

      if (data.success && Array.isArray(data.ideas)) {
        const formatted: Idea[] = data.ideas.map((item: any, idx: number) => ({
          ...item,
          id: item.id || `gen-${Date.now()}-${idx}`,
          status: "draft", // 미평가 초안
          averageScore: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
        setGeneratedIdeas(formatted);
        setSuccessMsg(`✨ 참신한 발명품 아이디어 초안 ${formatted.length}개가 생성되었습니다. 아래 [평가]를 통해 3.5점 이상 시 [아이디어 저장소]로 저장됩니다!`);
      } else {
        setError(data.error || "아이디어 생성에 실패했습니다.");
      }
    } catch (err) {
      setError("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 2. 불편함 문장 해부 기반 AI 생성
  const handleGeneratePainpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!painpointText.trim()) {
      setError("해부할 불편함 고충 문장을 입력해 주세요.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setGeneratedIdeas([]);

    try {
      // 불편함 분석 API 호출
      const res = await fetch("/api/analyze-painpoint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: painpointText }),
      });

      const data = await res.json();

      if (data.success && data.analysis && Array.isArray(data.analysis.solutions)) {
        const solutions = data.analysis.solutions;
        const formatted: Idea[] = solutions.map((sol: any, idx: number) => ({
          id: `painpoint-gen-${Date.now()}-${idx}`,
          title: sol.title || `${data.analysis.extractedProblem} 해결 발명품`,
          category: sol.expectedCategory || "생활안전",
          subCategory: "불편함 해부",
          targetSchoolLevel: sol.suggestedSchoolLevel || "초등 고학년",
          problem: data.analysis.extractedProblem || painpointText,
          targetUser: data.analysis.targetUser || "일반 시민",
          usageSituation: data.analysis.contextSituation || "실생활 이용 상황",
          coreIdea: sol.coreConcept || sol.title,
          idealSolution: sol.coreConcept,
          realisticSolution: sol.realisticApproach,
          prototypePlan: sol.realisticApproach,
          operatingPrinciple: "문제 원인 차단 및 구조적 마찰/센서 제어 방식",
          expectedMaterials: ["3D 프린팅 레일", "아두이노", "기본 프레임"],
          expectedDifficulty: "medium",
          expectedCostLevel: "low",
          patentPotential: "불편함 특정 기믹에 대한 실용신안 청구 가능",
          contestSuitability: "학생이 일상 고충을 직접 관찰하여 발굴한 우수 안건",
          noveltyNote: "기존 불편 상황의 한계를 구조적으로 극복",
          similarRiskNote: "기존 보조제품 대비 차별화 기믹 강조 필요",
          status: "draft",
          averageScore: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          sourceBasis: [{ type: "생활 불편함", summary: painpointText, searchHint: "불편함 해결 발명" }],
          searchKeywords: {
            patent: ["불편 해결 발명"],
            contestWinners: ["고충 개선"],
            products: ["아이디어 보조기구"],
            general: [painpointText.substring(0, 15)],
            expanded: ["아두이노 개선"]
          }
        }));

        setGeneratedIdeas(formatted);
        setSuccessMsg(`✨ 입력하신 고충을 해부하여 ${formatted.length}개의 발명 솔루션 초안을 도출했습니다. [평가]를 거쳐 [아이디어 저장소]로 저장해 보세요!`);
      } else {
        // Fallback 생성
        const genRes = await fetch("/api/generate-ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            category: "생활안전",
            schoolLevel: "초등 고학년",
            count: 3,
            prompt: painpointText,
          }),
        });
        const genData = await genRes.json();
        if (genData.success && Array.isArray(genData.ideas)) {
          setGeneratedIdeas(genData.ideas);
          setSuccessMsg("✨ 불편함을 바탕으로 참신한 아이디어 초안이 도출되었습니다!");
        } else {
          setError("불편함 해부 분석에 실패했습니다.");
        }
      }
    } catch (err) {
      setError("불편함 해부 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 평가 완료 시 오늘의 아이디어와 동일하게 저장소/실패목록으로 자동 이동 알림
  const handleRated = (updatedIdea: Idea) => {
    const isSaved = updatedIdea.status === "saved" || updatedIdea.status === "excellent" || updatedIdea.status === "developing";
    setGeneratedIdeas((prev) => prev.filter((item) => item.id !== updatedIdea.id));

    if (isSaved) {
      setSuccessMsg(`🎉 [${updatedIdea.title}] 평가 완료! 3.5점 이상 획득으로 [아이디어 저장소]로 안전하게 이동 저장되었습니다.`);
    } else {
      setSuccessMsg(`📌 [${updatedIdea.title}] 평가 완료. 평점 미달로 [실패 목록]으로 분류 이동되었습니다.`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 id="generate-title" className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-sky-400" />
            아이디어 생성실
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            조건 설정 생성 또는 일상 고충 문장 해부를 통해 참신한 발명품 아이디어를 착상합니다.
          </p>
        </div>

        {/* 💡 2안 반영: 서브 탭 selector */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => { setActiveTab("preset"); setError(""); setSuccessMsg(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "preset"
                ? "bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>💡 조건 설정 생성</span>
          </button>
          <button
            onClick={() => { setActiveTab("painpoint"); setError(""); setSuccessMsg(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "painpoint"
                ? "bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>🔍 불편함 해부 생성</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side: Selected Mode Input Form */}
        <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-6">
          {activeTab === "preset" ? (
            // ── 탭 1: 조건 설정 생성 ──
            <>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" />
                조건 설정 생성 모드
              </h3>

              <form onSubmit={handleGeneratePreset} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">분야 영역</label>
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

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full py-2 px-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-between transition-all cursor-pointer"
                  >
                    <span>상세 조건 설정</span>
                    <span className="text-[10.5px] text-indigo-400 font-bold">
                      {showAdvanced ? "접기 ▲" : "펼치기 ▼"}
                    </span>
                  </button>
                </div>

                {showAdvanced && (
                  <div className="space-y-4 pt-3 border-t border-slate-800/60 animate-fadeIn duration-200">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">대상 학교급</label>
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
                      <label className="block text-xs font-semibold text-slate-400 mb-2">생성 기준</label>
                      <select
                        value={criteria}
                        onChange={(e) => setCriteria(e.target.value)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900/60 p-3 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer"
                      >
                        {CRITERIA.map((crit) => (
                          <option key={crit.value} value={crit.value}>
                            {crit.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">생성 개수 ({count}개)</label>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        value={count}
                        onChange={(e) => setCount(Number(e.target.value))}
                        className="w-full accent-indigo-500 cursor-ew-resize"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">추가 기획 의도 (선택)</label>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="예: '자석을 활용한 장치', '우천 시 신발 보호' 등"
                        className="w-full h-20 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  AI 아이디어 착상하기
                </button>
              </form>
            </>
          ) : (
            // ── 탭 2: 불편함 해부 생성 ──
            <>
              <h3 className="text-md font-bold text-white flex items-center gap-2">
                <MessageSquarePlus className="w-5 h-5 text-sky-400" />
                생활 고충 해부 모드
              </h3>

              <form onSubmit={handleGeneratePainpoint} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    일상 속 고충 / 불편함 하소연 입력
                  </label>
                  <textarea
                    value={painpointText}
                    onChange={(e) => setPainpointText(e.target.value)}
                    placeholder="예: '비 오는 날 우산 들고 가방 메면 가방 밑단이 젖어서 교과서가 상해요', '어르신들이 키오스크 글자가 너무 작아 결제를 실패해요' 등 생각나는 불편함을 적어주세요."
                    className="w-full h-36 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-all resize-none leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !painpointText.trim()}
                  className="w-full py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-sky-600/10 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  불편함 해부 & 발명 솔루션 착상
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Side: Generated Draft Ideas View */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-950/30 border border-rose-900/50 text-sm text-rose-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-sm text-emerald-400 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="glass-panel py-20 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/10 space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                <div className="absolute w-14 h-14 border-2 border-sky-500/20 border-b-sky-400 rounded-full animate-spin [animation-direction:reverse]" />
                <div className="absolute p-2.5 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-xl shadow-lg shadow-indigo-500/30">
                  <Atom className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-md font-bold text-white">AI 창의적 발명품 엔진 작동 중...</h4>
                <p className="text-xs text-slate-500 max-w-[300px] mx-auto leading-relaxed">
                  선행기술 회피, 학생 시제품 구현 가능성 및 발명대회 심사 기준을 다각도로 해부하여 아이디어 초안을 도출하는 중입니다.
                </p>
              </div>
            </div>
          )}

          {/* Generated Ideas Cards View */}
          {!loading && generatedIdeas.length > 0 && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-900/40 flex justify-between items-center">
                <span className="text-xs text-slate-300 font-bold">
                  💡 착상된 아이디어 초안 ({generatedIdeas.length}개)
                </span>
                <span className="text-[11px] text-indigo-400">
                  각 카드 하단 [평가]를 완료하면 3.5점 이상 시 [아이디어 저장소]로 안전 보관됩니다!
                </span>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {generatedIdeas.map((idea) => (
                  <IdeaCard key={idea.id || idea.title} idea={idea} onRated={handleRated} />
                ))}
              </div>
            </div>
          )}

          {!loading && generatedIdeas.length === 0 && !successMsg && (
            <div className="glass-panel py-20 px-6 text-center rounded-2xl border border-slate-800/80 space-y-4">
              <BrainCircuit className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-md font-bold text-slate-400">
                {activeTab === "preset"
                  ? "원하는 조건 분야를 선택 후 AI 생성하기를 눌러보세요!"
                  : "일상 속 작은 고충이라도 적어주시면 AI가 멋진 발명품으로 바꿔드립니다!"}
              </h3>
              <p className="text-xs text-slate-600 max-w-[320px] mx-auto leading-relaxed">
                생성된 발명 아이디어 초안은 [평가]를 거쳐 3.5점 이상 시 아이디어 저장소로 안전하게 승격 이동합니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GenerateIdeas() {
  return (
    <Suspense fallback={
      <div className="flex h-[80vh] items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <GenerateIdeasForm />
    </Suspense>
  );
}
