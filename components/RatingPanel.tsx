"use client";

import { useState, useMemo } from "react";
import { Star, AlertCircle } from "lucide-react";

interface RatingPanelProps {
  ideaId: string;
  onSuccess: (averageScore: number, status: string) => void;
  onCancel?: () => void;
}

const CRITERIA = [
  { key: "problemClarity", label: "문제의 명확성", desc: "해결하려는 문제가 구체적이고 뚜렷한가?" },
  { key: "novelty", label: "아이디어의 독창성", desc: "기존 특허나 제품 대비 새로움이 돋보이는가?" },
  { key: "feasibility", label: "학생 제작 가능성", desc: "초·중·고 학생 수준에서 프로토타입 제작이 쉬운가?" },
  { key: "contestSuitability", label: "발명대회 적합성", desc: "학생 발명대회 심사 항목에 부합하는가?" },
  { key: "patentPotential", label: "특허 등록 가능성", desc: "선행기술을 피하고 특허화할 여지가 있는가?" },
  { key: "developmentPotential", label: "추가 발전 가능성", desc: "확장되거나 고도화할 보완점이 명확한가?" },
];

export default function RatingPanel({ ideaId, onSuccess, onCancel }: RatingPanelProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    problemClarity: 3,
    novelty: 3,
    feasibility: 3,
    contestSuitability: 3,
    patentPotential: 3,
    developmentPotential: 3,
  });
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const averageScore = useMemo(() => {
    const sum = Object.values(scores).reduce((acc, score) => acc + score, 0);
    return Math.round((sum / 6) * 100) / 100;
  }, [scores]);

  const handleScoreChange = (key: string, val: number) => {
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/ideas/${ideaId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...scores,
          memo,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess(data.data.averageScore, data.data.status);
      } else {
        setError(data.error || "평가 저장에 실패했습니다.");
      }
    } catch (err) {
      setError("서버와의 통신 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 평점에 따라 바뀔 상태 예측 텍스트
  const statusPreview = useMemo(() => {
    if (averageScore >= 4.3) return { text: "우수 후보 (excellent)", color: "text-emerald-400" };
    if (averageScore >= 3.5) return { text: "저장 목록 (saved)", color: "text-sky-400" };
    return { text: "실패 목록 (failed)", color: "text-rose-400" };
  }, [averageScore]);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-indigo-500/20 max-w-lg w-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Star className="w-5 h-5 text-indigo-400 fill-indigo-400" />
          아이디어 심사 및 평가
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-md hover:bg-slate-800"
          >
            닫기
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          {CRITERIA.map((crit) => (
            <div key={crit.key} className="flex flex-col sm:flex-row justify-between sm:items-center p-3 rounded-xl bg-slate-900/40 border border-slate-800/40">
              <div className="mb-2 sm:mb-0">
                <span className="text-sm font-semibold text-slate-200 block">{crit.label}</span>
                <span className="text-xs text-slate-500">{crit.desc}</span>
              </div>
              <div className="flex gap-1.5 self-end sm:self-auto">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = scores[crit.key] === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleScoreChange(crit.key, val)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                        isSelected
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-110"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700/80"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Live Score Preview */}
        <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900/30 flex justify-between items-center">
          <div>
            <span className="text-xs text-slate-400 block font-mono">예상 평균 평점</span>
            <span className="text-2xl font-black text-white font-mono">{averageScore}</span>
            <span className="text-xs text-slate-500 font-mono"> / 5.0</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">이동 대상 그룹</span>
            <span className={`text-sm font-bold ${statusPreview.color}`}>{statusPreview.text}</span>
          </div>
        </div>

        {/* Memo Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            실패 원인 또는 보완 지도 메모 (선택)
          </label>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="평점이 낮을 경우 실패 사유(예: 기존 제품과 너무 유사 등)를 적어주시면 실패 데이터베이스에 함께 보관됩니다."
            className="w-full h-20 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all resize-none"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-950/30 border border-rose-900/50 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold rounded-xl transition-all"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-2 w-full py-3 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/10 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "평가 제출 중..." : "평가 저장 완료"}
          </button>
        </div>
      </form>
    </div>
  );
}
