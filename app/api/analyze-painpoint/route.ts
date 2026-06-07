import { NextResponse } from "next/server";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";
import { verifyAdmin } from "@/lib/auth";

const painpointResponseSchema = {
  type: "object",
  properties: {
    analyzedProblem: { type: "string", description: "문제 요약" },
    targetUser: { type: "string", description: "사용 대상" },
    usageSituation: { type: "string", description: "사용 상황" },
    existingSolutions: {
      type: "array",
      items: { type: "string" },
      description: "기존 해결 방법"
    },
    limitations: {
      type: "array",
      items: { type: "string" },
      description: "기존 해결 방법의 한계"
    },
    suggestedIdeas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string", description: "아이디어명" },
          coreIdea: { type: "string", description: "핵심 아이디어" },
          realisticPrototype: { type: "string", description: "학생 제작용 시제품" },
          reason: { type: "string", description: "추천 이유" },
          risk: { type: "string", description: "유사 가능성 또는 한계" }
        },
        required: ["title", "coreIdea", "realisticPrototype", "reason", "risk"]
      },
      description: "발명 아이디어 후보 3~5개"
    },
    recommendedIdeaTitle: { type: "string", description: "가장 추천하는 아이디어" },
    searchKeywords: {
      type: "object",
      properties: {
        patent: { type: "array", items: { type: "string" } },
        contestWinners: { type: "array", items: { type: "string" } },
        products: { type: "array", items: { type: "string" } },
        general: { type: "array", items: { type: "string" } }
      },
      required: ["patent", "contestWinners", "products", "general"]
    }
  },
  required: [
    "analyzedProblem",
    "targetUser",
    "usageSituation",
    "existingSolutions",
    "limitations",
    "suggestedIdeas",
    "recommendedIdeaTitle",
    "searchKeywords"
  ]
};

const systemInstruction = `
너는 사용자가 입력한 생활 속 불편함을 발명 아이디어로 바꾸는 발명 코치이다.
사용자의 불편함을 분석하여 기존 솔루션의 한계를 짚고, 이를 기발하게 보완할 수 있는 학생 수준의 시제품 제작 가능 아이디어를 도출해라.

출력은 반드시 제공된 JSON Schema를 만족하는 단일 JSON 객체여야 한다. 다른 텍스트 설명은 배제해라.
`;

export async function POST(request: Request) {
  // 1. 권한 체크
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json(
      { success: false, error: "권한이 없습니다." },
      { status: 401 }
    );
  }

  try {
    const { userInput } = await request.json();

    if (!userInput || typeof userInput !== "string" || userInput.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "분석할 불편함 내용을 입력해주세요." },
        { status: 400 }
      );
    }

    const userPrompt = `
다음 사용자의 불편 사항을 바탕으로 문제를 분석하고 아이디어 후보를 제안해 주세요.

[사용자 입력 불편 사항]
"${userInput}"

요구된 JSON Schema 구조에 따라 엄격하게 결과를 리턴해 주십시오.
`;

    // AI Adapter 실행
    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "analyze",
      systemInstruction,
      responseSchema: painpointResponseSchema,
    });

    const parsedData = cleanAndParseJson(responseText);

    return NextResponse.json({
      success: true,
      provider,
      analysis: parsedData,
    });
  } catch (error: any) {
    console.error("불편함 분석 API 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message || "불편함을 분석하는 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
