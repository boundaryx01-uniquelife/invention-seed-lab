import { NextResponse } from "next/server";
import { doc, collection, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  // 1. 어드민 권한 체크
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "권한이 없습니다. 관리자 로그인이 필요합니다." },
      { status: 401 }
    );
  }

  const { ideaId } = await params;

  try {
    const body = await request.json();
    const {
      problemClarity,
      novelty,
      feasibility,
      contestSuitability,
      patentPotential,
      developmentPotential,
      memo,
    } = body;

    // 점수 필드 유효성 검사 (1~5점 사이)
    const scores = [
      problemClarity,
      novelty,
      feasibility,
      contestSuitability,
      patentPotential,
      developmentPotential,
    ];
    
    if (scores.some((s) => typeof s !== "number" || s < 1 || s > 5)) {
      return NextResponse.json(
        { success: false, error: "모든 평가는 1점 이상 5점 이하의 숫자여야 합니다." },
        { status: 400 }
      );
    }

    // 평균 점수 계산
    const sum = scores.reduce((acc, val) => acc + val, 0);
    const averageScore = Math.round((sum / 6) * 100) / 100; // 소수점 둘째자리까지 반올림

    // 평균 점수에 따른 상태 분류
    let newStatus: "excellent" | "saved" | "failed" = "failed";
    if (averageScore >= 4.3) {
      newStatus = "excellent";
    } else if (averageScore >= 3.5) {
      newStatus = "saved";
    }

    // Firestore Transaction 시작
    await runTransaction(db, async (transaction) => {
      const ideaRef = doc(db, "ideas", ideaId);
      const ideaDoc = await transaction.get(ideaRef);

      if (!ideaDoc.exists()) {
        throw new Error("존재하지 않는 아이디어입니다.");
      }

      const ideaData = ideaDoc.data();

      // ratings 컬렉션 문서 생성
      const ratingCollectionRef = collection(db, "ratings");
      const newRatingRef = doc(ratingCollectionRef); // ID 자동 생성

      const ratingData = {
        id: newRatingRef.id,
        ideaId,
        problemClarity,
        novelty,
        feasibility,
        contestSuitability,
        patentPotential,
        developmentPotential,
        averageScore,
        memo: memo || "",
        createdAt: new Date(),
        ratedBy: "admin", // 추후 확장 가능
      };

      // 1) ratings 문서 쓰기
      transaction.set(newRatingRef, ratingData);

      // 2) ideas 문서 평점 및 상태 업데이트
      transaction.update(ideaRef, {
        averageScore,
        status: newStatus,
        scores: {
          problemClarity,
          novelty,
          feasibility,
          contestSuitability,
          patentPotential,
          developmentPotential,
        },
        updatedAt: new Date(),
      });

      // 3) failures 컬렉션 연동 (3.5 미만이면 failures 업서트, 이상이면 삭제)
      const failureRef = doc(db, "failures", ideaId);
      if (newStatus === "failed") {
        const failureData = {
          id: ideaId,
          ideaId,
          title: ideaData.title,
          category: ideaData.category,
          averageScore,
          failureReason: memo || "평가 점수 기준 미달 (3.5 미만)",
          weakPoints: [
            problemClarity < 3.5 ? "명확하지 않은 문제 상황" : null,
            novelty < 3.5 ? "기존 제품과 유사 또는 독창성 부족" : null,
            feasibility < 3.5 ? "학생 수준에서 제작/구현 곤란" : null,
            contestSuitability < 3.5 ? "발명대회 출품작으로 영향력 부족" : null,
          ].filter(Boolean) as string[],
          reusePotential: "향후 기술 및 아이디어 접목 시 재검토 가능",
          createdAt: new Date(),
        };
        transaction.set(failureRef, failureData, { merge: true });
      } else {
        // 이미 존재했던 실패 항목일 경우 트랜잭션 내에서 삭제 처리
        transaction.delete(failureRef);
      }
    });

    return NextResponse.json({
      success: true,
      message: "평가가 완료되었습니다.",
      data: {
        averageScore,
        status: newStatus,
      },
    });
  } catch (error: any) {
    console.error("평가 저장 트랜잭션 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message || "평가 처리 도중 내부 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
