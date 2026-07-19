import { NextResponse } from "next/server";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";

const developSchema = {
  type: "object",
  properties: {
    enhancedTitle: { type: "string", description: "고도화된 참신한 발명품 제목" },
    technicalAnalysis: { type: "string", description: "구조적/기술적 메커니즘 심층 분석" },
    idealSolutionDetails: { type: "string", description: "이상적 해결책 상세" },
    realisticSolutionDetails: { type: "string", description: "아두이노/3D프린터 기반 구현 가이드" },
    bomList: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string", description: "부품/재료명" },
          spec: { type: "string", description: "권장 규격 및 팁" },
          estimatedCost: { type: "string", description: "예상 가격대" }
        },
        required: ["name", "spec", "estimatedCost"],
        additionalProperties: false
      },
      description: "시제품 제작 BOM 리스트"
    },
    contestStrategy: { type: "string", description: "발명대회 심사위원 설득 포인트 및 꿀팁" },
    searchKeywords: {
      type: "object",
      properties: {
        patent: { type: "array", items: { type: "string" } },
        products: { type: "array", items: { type: "string" } },
        contestWinners: { type: "array", items: { type: "string" } }
      },
      required: ["patent", "products", "contestWinners"],
      additionalProperties: false
    }
  },
  required: ["enhancedTitle", "technicalAnalysis", "idealSolutionDetails", "realisticSolutionDetails", "bomList", "contestStrategy", "searchKeywords"],
  additionalProperties: false
};

export async function POST(request: Request) {
  try {
    const { idea } = await request.json();

    if (!idea || !idea.title) {
      return NextResponse.json(
        { success: false, error: "고도화할 아이디어 정보가 부족합니다." },
        { status: 400 }
      );
    }

    const userPrompt = `
다음 학생 발명 아이디어를 발명품 경진대회 및 특허 출원 수준으로 완성도를 끌어올리는 심층 연구 발전 리포트를 생성해 주세요:

[아이디어 기본 정보]
- 제목: ${idea.title}
- 핵심 아이디어: ${idea.coreIdea}
- 문제 상황: ${idea.problem}
- 카테고리: ${idea.category}
- 대상 학교급: ${idea.targetSchoolLevel}

지정된 JSON Schema 형태를 만족하는 단일 JSON 객체로만 정밀하게 리턴해 주십시오.
`;

    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "develop",
      systemInstruction: "너는 전국학생발명품경진대회 최고상 수상자를 배출하는 전문 발명 멘토 교수 AI이다.",
      responseSchema: developSchema
    });

    const parsed = cleanAndParseJson<any>(responseText);

    return NextResponse.json({
      success: true,
      provider,
      development: parsed
    });
  } catch (error: any) {
    console.error("Idea Development Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "아이디어 고도화 연구 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
