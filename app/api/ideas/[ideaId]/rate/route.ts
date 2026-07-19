import { NextResponse } from "next/server";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    const { scores } = await request.json();

    if (!ideaId) {
      return NextResponse.json({ success: false, error: "아이디어 ID가 필요합니다." }, { status: 400 });
    }

    if (!scores || typeof scores !== "object") {
      return NextResponse.json({ success: false, error: "유효한 평가 점수 데이터가 없습니다." }, { status: 400 });
    }

    const { novelty = 3, feasibility = 3, utility = 3, studentFit = 3, marketability = 3 } = scores;
    const scoreArray = [novelty, feasibility, utility, studentFit, marketability].map(Number);
    const avgScore = Number((scoreArray.reduce((a, b) => a + b, 0) / scoreArray.length).toFixed(1));

    const ideaRef = doc(db, "ideas", ideaId);

    let updatedIdeaData: any = null;

    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(ideaRef);
      if (!sfDoc.exists()) {
        throw new Error("해당 아이디어가 존재하지 않습니다.");
      }

      const existingData = sfDoc.data();
      const currentStatus = existingData.status || "draft";

      let nextStatus = currentStatus;
      if (avgScore >= 4.3) {
        nextStatus = "excellent";
      } else if (avgScore >= 3.5) {
        nextStatus = "saved";
      } else {
        nextStatus = "failed";
      }

      const updatePayload = {
        averageScore: avgScore,
        scores: { novelty, feasibility, utility, studentFit, marketability },
        status: nextStatus,
        updatedAt: new Date(),
      };

      transaction.update(ideaRef, updatePayload);
      updatedIdeaData = { ...existingData, ...updatePayload, id: ideaId };
    });

    return NextResponse.json({
      success: true,
      message: "평가가 성공적으로 저장되었습니다.",
      idea: updatedIdeaData,
    });
  } catch (error: any) {
    console.error("아이디어 채점 오류:", error);
    return NextResponse.json({ success: false, error: error.message || "평가 처리 도중 오류가 발생했습니다." }, { status: 500 });
  }
}
