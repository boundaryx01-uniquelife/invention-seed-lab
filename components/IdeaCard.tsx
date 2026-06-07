"use client";

import { useState } from "react";
import Link from "next/link";
import { Idea } from "@/types/idea";
import StatusBadge from "./StatusBadge";
import RatingPanel from "./RatingPanel";
import { 
  Star, 
  BrainCircuit, 
  Wrench, 
  User, 
  GraduationCap, 
  Lightbulb,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface IdeaCardProps {
  idea: Idea;
  onRated?: (updatedIdea: Idea) => void;
  hideActions?: boolean;
}

export default function IdeaCard({ idea, onRated, hideActions = false }: IdeaCardProps) {
  const [showRating, setShowRating] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIdea, setCurrentIdea] = useState<Idea>(idea);

  const handleRateSuccess = (averageScore: number, status: string) => {
    const updated = {
      ...currentIdea,
      averageScore,
      status: status as Idea["status"],
    };
    setCurrentIdea(updated);
    setShowRating(false);
    if (onRated) onRated(updated);
  };

  return (
    <div className={`glass-panel glass-panel-hover rounded-2xl p-5 flex flex-col justify-between gap-4 relative overflow-hidden transition-all duration-300 ${
      currentIdea.status === "failed" ? "border-rose-950/20" : ""
    }`}>
      {/* Background Glow */}
      <div className={`absolute top-0 right-0 w-20 h-20 blur-2xl rounded-full opacity-15 pointer-events-none -mr-8 -mt-8 ${
        currentIdea.status === "excellent" ? "bg-emerald-400" :
        currentIdea.status === "saved" ? "bg-sky-400" :
        currentIdea.status === "developing" ? "bg-violet-400" :
        currentIdea.status === "failed" ? "bg-rose-400" : "bg-slate-400"
      }`} />

      <div className="space-y-2.5">
        {/* Category & Badges */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-wider">
            {currentIdea.category} &gt; {currentIdea.subCategory}
          </span>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={currentIdea.status} />
            {currentIdea.averageScore > 0 && (
              <div className="flex items-center gap-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full text-xs font-mono font-bold">
                <Star className="w-3 h-3 fill-amber-400" />
                <span>{currentIdea.averageScore}</span>
              </div>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-white tracking-tight flex items-start gap-1.5">
          <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <span>{currentIdea.title}</span>
        </h3>

        {/* Grade Target */}
        <div className="flex items-center gap-1 text-xs text-indigo-300 font-medium">
          <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentIdea.targetSchoolLevel}</span>
        </div>

        {/* Glance Core Idea */}
        <div className="pt-1 text-xs">
          <span className="text-slate-500 font-semibold block flex items-center gap-1">
            <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" /> 핵심 아이디어
          </span>
          <p className="mt-1 text-slate-200 font-medium leading-relaxed">
            {currentIdea.coreIdea}
          </p>
        </div>

        {/* Accordion Collapsible Details */}
        {isExpanded && (
          <div className="pt-3 border-t border-card-border/40 space-y-3 text-xs text-slate-300 animate-fadeIn duration-200">
            <div>
              <span className="text-slate-500 font-semibold block">불편상황 / 문제의 본질</span>
              <p className="mt-0.5 text-slate-300 leading-relaxed font-sans">{currentIdea.problem}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/40">
              <div>
                <span className="text-slate-500 font-semibold block flex items-center gap-1">
                  <User className="w-3.5 h-3.5" /> 사용 대상
                </span>
                <span className="text-slate-300">{currentIdea.targetUser}</span>
              </div>
              <div>
                <span className="text-slate-500 font-semibold block">사용 상황</span>
                <span className="text-slate-300">{currentIdea.usageSituation}</span>
              </div>
            </div>

            {currentIdea.realisticSolution && (
              <div>
                <span className="text-sky-400 font-semibold block flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" /> 현실적인 시제품 구현 구상
                </span>
                <p className="mt-0.5 text-slate-300 leading-relaxed">{currentIdea.realisticSolution}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-card-border/30 text-[11px]">
              <div>
                <span className="text-slate-500 block font-semibold">특허 가능성</span>
                <span className="text-slate-400">{currentIdea.patentPotential || "추가 선행기술 검토 필요"}</span>
              </div>
              <div>
                <span className="text-slate-500 block font-semibold">발명대회 적합성</span>
                <span className="text-slate-400">{currentIdea.contestSuitability}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!hideActions && (
        <div className="space-y-3 pt-2">
          {showRating && (
            <div className="pt-3 border-t border-card-border/30">
              <RatingPanel
                ideaId={currentIdea.id}
                onSuccess={handleRateSuccess}
                onCancel={() => setShowRating(false)}
              />
            </div>
          )}

          {!showRating && (
            <div className="flex items-center gap-2 pt-2 border-t border-card-border/20">
              {/* Expand Toggle */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="py-2 px-3 bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 transition-all cursor-pointer"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>상세 접기</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>상세 정보</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowRating(true)}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 border border-slate-700/50 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                평가
              </button>

              <Link
                href={`/develop/${currentIdea.id}`}
                className="flex-1 py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/20 text-indigo-400 text-xs font-semibold rounded-xl flex items-center justify-center gap-1 active:scale-[0.98] transition-all"
              >
                <BrainCircuit className="w-3.5 h-3.5" />
                발전
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
