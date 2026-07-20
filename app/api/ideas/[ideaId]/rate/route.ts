import { NextResponse } from "next/server";
import { doc, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ideaId: string }> }
) {
  try {
    const { ideaId } = await params;
    const body = await request.json();

    if (!ideaId) {
      return NextResponse.json({ success: false, error: "아이디어 ID가 필요합니다." }, { status: 400 });
    }

    // scores 객체 혹은 body 루트 파싱 호환
    const scoresData = body.scores || body;

    const novelty = Number(scoresData.novelty || 3);
    const feasibility = Number(scoresData.feasibility || 3);
    const utility = Number(scoresData.utility || scoresData.problemClarity || 3);
    const studentFit = Number(scoresData.studentFit || scoresData.contestSuitability || 3);
    const marketability = Number(scoresData.marketability || scoresData.patentPotential || 3);

    const scoreArray = [novelty, feasibility, utility, studentFit, marketability];
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
        memo: body.memo || "",
        updatedAt: new Date(),
      };

      transaction.update(ideaRef, updatePayload);
      updatedIdeaData = { ...existingData, ...updatePayload, id: ideaId };
    });

    return NextResponse.json({
      success: true,
      message: "평가가 성공적으로 저장되었습니다.",
      data: {
        averageScore: avgScore,
        status: updatedIdeaData.status,
        idea: updatedIdeaData,
      },
    });
  } catch (error: any) {
    console.error("아이디어 채점 오류:", error);
    return NextResponse.json({ success: false, error: error.message || "평가 처리 도중 오류가 발생했습니다." }, { status: 500 });
  }
}
