"use client";

import { useRef, useState } from "react";
import { Filter, ChevronDown, ChevronUp } from "lucide-react";

interface CategoryFilterProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedSchoolLevel: string;
  onSelectSchoolLevel: (level: string) => void;
}

const CATEGORIES = [
  "전체",
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

const SCHOOL_LEVELS = ["전체", "초등 저학년", "초등 고학년", "중학생", "고등학생"];

export default function CategoryFilter({
  selectedCategory,
  onSelectCategory,
  selectedSchoolLevel,
  onSelectSchoolLevel,
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="w-full space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-slate-300 text-xs font-semibold">
          <Filter className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>현재 필터:</span>
          <span className="bg-indigo-950/40 text-indigo-400 px-2.5 py-0.5 rounded-md border border-indigo-500/20 text-[10px] font-semibold font-sans">
            분야: {selectedCategory}
          </span>
          <span className="bg-indigo-950/40 text-indigo-400 px-2.5 py-0.5 rounded-md border border-indigo-500/20 text-[10px] font-semibold font-sans">
            학교급: {selectedSchoolLevel}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-all bg-slate-900/40 border border-slate-800 px-3 py-1.5 rounded-xl hover:bg-slate-800"
        >
          <span>필터 조건 설정</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Collapsible Filters */}
      {isOpen && (
        <div className="space-y-4 pt-3 border-t border-slate-800/60 animate-fadeIn duration-200">
          {/* Category Horizontal Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              카테고리 영역
            </span>
            <div 
              ref={categoryScrollRef}
              className="flex gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth select-none w-full"
            >
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => onSelectCategory(cat)}
                    className={`px-4 py-2 text-xs font-semibold rounded-full shrink-0 border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-gradient-to-r from-indigo-600 to-sky-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20 scale-105"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* School Level Filter */}
          <div className="space-y-2">
            <span className="text-[10px] font-semibold text-slate-500 block uppercase tracking-wider">
              추천 대상 학교급
            </span>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_LEVELS.map((level) => {
                const isSelected = selectedSchoolLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => onSelectSchoolLevel(level)}
                    className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-indigo-950/40 border-indigo-500/50 text-indigo-400 shadow-md shadow-indigo-600/5"
                        : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    {level}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
