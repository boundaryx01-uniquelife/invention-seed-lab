import { Idea } from "@/types/idea";

interface StatusBadgeProps {
  status: Idea["status"];
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const configs = {
    draft: {
      text: "검토 대기",
      classes: "bg-slate-800 text-slate-400 border-slate-700",
    },
    saved: {
      text: "저장됨",
      classes: "bg-sky-950/40 text-sky-400 border-sky-800/30",
    },
    excellent: {
      text: "우수 후보",
      classes: "bg-emerald-950/40 text-emerald-400 border-emerald-800/30",
    },
    developing: {
      text: "발전 중",
      classes: "bg-violet-950/40 text-violet-400 border-violet-800/30",
    },
    failed: {
      text: "실패 목록",
      classes: "bg-rose-950/40 text-rose-400 border-rose-800/30",
    },
  };

  const config = configs[status] || configs.draft;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${config.classes}`}>
      {config.text}
    </span>
  );
}
