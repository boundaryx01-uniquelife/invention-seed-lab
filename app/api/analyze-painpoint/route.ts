import { NextResponse } from "next/server";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";

const painpointAnalysisSchema = {
  type: "object",
  properties: {
    extractedProblem: { type: "string", description: "입력된 텍스트에서 포착한 핵심 불편함 정의" },
    targetUser: { type: "string", description: "이 불편을 주로 겪는 주체" },
    contextSituation: { type: "string", description: "불편함이 발생하는 구체적 상황" },
    solutions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "솔루션 명칭" },
          coreConcept: { type: "string", description: "개선 발명 개념" },
          realisticApproach: { type: "string", description: "아두이노/3D프린터 등 학생 구현 방법" },
          expectedCategory: { type: "string", description: "카테고리" },
          suggestedSchoolLevel: { type: "string", description: "추천 학교급" }
        },
        required: ["title", "coreConcept", "realisticApproach", "expectedCategory", "suggestedSchoolLevel"],
        additionalProperties: false
      },
      description: "도출된 2~3가지 발명 솔루션 방향"
    }
  },
  required: ["extractedProblem", "targetUser", "contextSituation", "solutions"],
  additionalProperties: false
};

export async function POST(request: Request) {
  try {
    const { rawText } = await request.json();

    if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "분석할 불편함 내용을 입력해 주세요." },
        { status: 400 }
      );
    }

    const userPrompt = `
다음 생활 속 불편함 입력 내용을 전문적으로 해부하고, 학생 발명대회용 발명품으로 발전시킬 수 있는 2~3가지 해결 솔루션을 제시해 주세요:

[사용자 입력 내용]
"${rawText}"

반드시 지정된 JSON Schema 형태를 만족하는 단일 JSON 객체로만 응답해 주십시오. 사족은 제외하십시오.
`;

    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "analyze",
      systemInstruction: "너는 생활 속 고충을 발명품 아이디어로 해부하고 전환해주는 발명 코칭 전문가 AI이다.",
      responseSchema: painpointAnalysisSchema
    });

    const parsed = cleanAndParseJson<any>(responseText);

    return NextResponse.json({
      success: true,
      provider,
      analysis: parsed
    });
  } catch (error: any) {
    console.error("Painpoint Analysis Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "불편함 분석 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
