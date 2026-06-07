"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea } from "@/types/idea";
import { 
  BrainCircuit, 
  Settings2, 
  Wand2, 
  Save, 
  X,
  FileText,
  AlertCircle,
  CheckCircle2,
  Atom
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

export default function GenerateIdeas() {
  const router = useRouter();
  const [category, setCategory] = useState("생활안전");
  const [schoolLevel, setSchoolLevel] = useState("초등 고학년");
  const [count, setCount] = useState(3);
  const [criteria, setCriteria] = useState("무작위 혼합");
  const [customPrompt, setCustomPrompt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // AI 생성 결과 리스트
  const [previewIdeas, setPreviewIdeas] = useState<any[]>([]);
  // 선택 저장 대상 인덱스셋
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");
    setPreviewIdeas([]);
    setSelectedIndices(new Set());

    try {
      const res = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          schoolLevel: showAdvanced ? schoolLevel : "초등 고학년", // 상세 설정이 안 열려 있으면 기본값
          count: showAdvanced ? count : 3,
          criteria: showAdvanced ? criteria : "무작위 혼합",
          prompt: showAdvanced ? customPrompt : "",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPreviewIdeas(data.ideas);
        // 기본적으로 전체 선택 상태로 시작
        setSelectedIndices(new Set(data.ideas.map((_: any, i: number) => i)));
      } else {
        setError(data.error || "아이디어 생성에 실패했습니다.");
      }
    } catch (err) {
      setError("서버 호출 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleSaveSelected = async () => {
    if (selectedIndices.size === 0) return;
    setLoading(true);
    setError("");

    try {
      const batch = writeBatch(db);
      const ideasRef = collection(db, "ideas");

      const selectedIdeas = previewIdeas.filter((_, i) => selectedIndices.has(i));

      selectedIdeas.forEach((item) => {
        const newDocRef = doc(ideasRef); // 자동 생성 문서 레퍼런스
        const newIdea: Idea = {
          ...item,
          id: newDocRef.id,
          status: "draft",
          averageScore: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: "admin",
        };
        batch.set(newDocRef, newIdea);
      });

      await batch.commit();

      setSuccessMsg(`${selectedIdeas.length}개의 발명 아이디어가 '검토 대기(draft)' 상태로 정상 저장되었습니다.`);
      setPreviewIdeas([]); // 저장 완료 후 프리뷰 비우기
      setSelectedIndices(new Set());
    } catch (err: any) {
      setError(err.message || "아이디어 데이터베이스 저장 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="pb-6 border-b border-card-border">
        <h2 id="generate-title" className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
          <BrainCircuit className="w-8 h-8 text-sky-400" />
          아이디어 생성실
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          간단히 분야만 선택하여 즉시 창의적인 발명 아이디어를 대량 생산할 수 있습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Side Settings Form */}
        <div className="glass-panel p-6 rounded-2xl border border-card-border space-y-6">
          <h3 className="text-md font-bold text-white flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-400" />
            아이디어 생성 설정
          </h3>

          <form onSubmit={handleGenerate} className="space-y-4">
            {/* Category selection */}
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

            {/* Toggle button for Advanced settings */}
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

            {/* Advanced configurations collapsible */}
            {showAdvanced && (
              <div className="space-y-4 pt-3 border-t border-slate-800/60 animate-fadeIn duration-200">
                {/* School level selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">대상 학생 학교급</label>
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

                {/* Criteria selection */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">아이디어 생성 기준</label>
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

                {/* Generation Count */}
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
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>1개</span>
                    <span>3개 (추천)</span>
                    <span>5개</span>
                  </div>
                </div>

                {/* Custom additional prompt */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">추가 기획 방향 (선택)</label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="예: '물과 관련된 것', '자석을 활용한 장치' 등 세부 소재 키워드를 입력하세요."
                    className="w-full h-20 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {/* Submit button */}
            <button
              id="btn-run-generate"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              AI 아이디어 생성하기
            </button>
          </form>
        </div>

        {/* Right Side: Previews / Logs */}
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

          {/* Loading Animation */}
          {loading && (
            <div className="glass-panel py-20 flex flex-col items-center justify-center rounded-2xl border border-indigo-500/10 space-y-6">
              <div className="relative flex items-center justify-center">
                {/* Outmost spinning ring */}
                <div className="w-20 h-20 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
                {/* Middle counter-spinning ring */}
                <div className="absolute w-14 h-14 border-2 border-sky-500/20 border-b-sky-400 rounded-full animate-spin [animation-direction:reverse]" />
                {/* Inner glowing atomic core */}
                <div className="absolute p-2.5 bg-gradient-to-tr from-accent-violet to-accent-blue rounded-xl shadow-lg shadow-indigo-500/30">
                  <Atom className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <h4 className="text-md font-bold text-white">창의적 아이디어 발굴 엔진 작동 중...</h4>
                <p className="text-xs text-slate-500 max-w-[280px] mx-auto leading-relaxed">
                  선행기술 회피, 학생 제작 가능성 및 발명대회 기준을 다각도로 분석하여 엄선된 보고서 초안을 도출 중입니다. 잠시만 기다려주세요.
                </p>
              </div>
            </div>
          )}

          {/* Previews Result List */}
          {!loading && previewIdeas.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-900/40 border border-slate-800 p-4 rounded-xl">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">생성 완료 (미리보기)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">저장할 후보를 고른 뒤 아래 저장 버튼을 눌러주세요.</p>
                </div>
                <button
                  onClick={handleSaveSelected}
                  disabled={selectedIndices.size === 0}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-md transition-all active:scale-[0.98]"
                >
                  <Save className="w-3.5 h-3.5" />
                  선택 {selectedIndices.size}개 저장소 등록
                </button>
              </div>

              <div className="space-y-6">
                {previewIdeas.map((idea, index) => {
                  const isSelected = selectedIndices.has(index);
                  // preview 시에는 임시 껍데기 id를 할당해서 아이디어 카드 렌더링
                  const tempIdea: Idea = {
                    ...idea,
                    id: `temp-${index}`,
                    status: "draft",
                    averageScore: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  return (
                    <div 
                      key={index}
                      className={`relative rounded-2xl border transition-all duration-300 ${
                        isSelected 
                          ? "border-emerald-500/50 bg-emerald-950/5 shadow-[0_0_20px_rgba(16,185,129,0.03)]" 
                          : "border-slate-800/80 bg-slate-950/10"
                      }`}
                    >
                      {/* Checkbox badge overlay */}
                      <button
                        onClick={() => toggleSelect(index)}
                        className={`absolute top-4 left-4 z-20 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-emerald-600 border-emerald-500 text-white"
                            : "bg-slate-900 border-slate-700 text-transparent hover:border-slate-500"
                        }`}
                      >
                        ✓
                      </button>
                      <div className="pl-6">
                        <IdeaCard idea={tempIdea} hideActions={true} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
