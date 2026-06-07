"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Idea, Rating } from "@/types/idea";
import IdeaCard from "@/components/IdeaCard";
import { ArrowLeft, Star, MessageSquare, Calendar, User, FileText, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function IdeaDetailsPage() {
  const { ideaId } = useParams() as { ideaId: string };
  const router = useRouter();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDetails() {
      if (!ideaId) return;
      setLoading(true);
      setError("");
      
      try {
        // 1. 아이디어 기본 정보 조회
        const ideaRef = doc(db, "ideas", ideaId);
        const ideaSnap = await getDoc(ideaRef);

        if (!ideaSnap.exists()) {
          setError("해당 아이디어가 데이터베이스에 존재하지 않습니다.");
          setLoading(false);
          return;
        }

        setIdea({ id: ideaSnap.id, ...ideaSnap.data() } as Idea);

        // 2. 해당 아이디어의 전체 평가 이력 조회
        const ratingsRef = collection(db, "ratings");
        const q = query(
          ratingsRef,
          where("ideaId", "==", ideaId),
          orderBy("createdAt", "desc")
        );
        const ratingsSnap = await getDocs(q);

        const loadedRatings: Rating[] = [];
        ratingsSnap.forEach((doc) => {
          const data = doc.data();
          loadedRatings.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          } as Rating);
        });

        setRatings(loadedRatings);
      } catch (err) {
        console.error("Error fetching idea details:", err);
        setError("데이터를 조회하는 중 문제가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetails();
  }, [ideaId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-400 font-medium">아이디어 연구 대장을 복원하는 중...</span>
        </div>
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="inline-flex p-3 bg-rose-950/30 border border-rose-900/50 rounded-2xl text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">데이터 로드 실패</h3>
        <p className="text-sm text-slate-400">{error}</p>
        <Link href="/ideas" className="text-xs text-indigo-400 hover:underline inline-block pt-2">
          &larr; 저장소로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Back button header */}
      <div className="pb-4 border-b border-card-border">
        <Link href="/ideas" className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" /> 아이디어 저장소 목록으로
        </Link>
        <h2 className="text-2xl font-black text-white mt-2 tracking-tight">아이디어 상세 기록</h2>
      </div>

      {/* Main Idea Card Display (actions hidden) */}
      <IdeaCard idea={idea} hideActions={true} />

      {/* Ratings History Timeline */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-slate-300 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-400" />
          심사 평가 이력 ({ratings.length}건)
        </h3>

        {ratings.length === 0 ? (
          <div className="glass-panel p-6 text-center text-slate-500 text-xs rounded-2xl">
            이 아이디어는 아직 평가 기록이 없습니다. 저장소 카드에서 '평가하기' 버튼을 누르면 평가할 수 있습니다.
          </div>
        ) : (
          <div className="space-y-4">
            {ratings.map((rate) => (
              <div 
                key={rate.id}
                className="glass-panel p-5 rounded-2xl border border-card-border space-y-4 bg-slate-950/20"
              >
                {/* Meta details */}
                <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>작성자: {rate.ratedBy || "admin"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{rate.createdAt.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                    평균 ★ {rate.averageScore}
                  </div>
                </div>

                <hr className="border-card-border/50" />

                {/* Score breakdown metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { label: "문제의 명확성", val: rate.problemClarity },
                    { label: "아이디어 독창성", val: rate.novelty },
                    { label: "학생 제작 가능성", val: rate.feasibility },
                    { label: "발명대회 적합성", val: rate.contestSuitability },
                    { label: "특허 등록 가능성", val: rate.patentPotential },
                    { label: "추가 발전 가능성", val: rate.developmentPotential },
                  ].map((item, i) => (
                    <div key={i} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900/60 flex justify-between items-center">
                      <span className="text-[11px] text-slate-400">{item.label}</span>
                      <span className="text-xs font-bold font-mono text-indigo-400">{item.val}점</span>
                    </div>
                  ))}
                </div>

                {/* Memo feedback */}
                {rate.memo && (
                  <div className="p-3.5 rounded-xl bg-slate-900/20 border border-slate-800/60 text-xs text-slate-300">
                    <span className="text-slate-500 font-semibold block mb-1 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-400" /> 심사 코멘트
                    </span>
                    <p className="leading-relaxed font-sans">{rate.memo}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
