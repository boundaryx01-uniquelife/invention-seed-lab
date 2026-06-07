import { NextResponse } from "next/server";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";
import { verifyAdmin } from "@/lib/auth";

// AI가 준수해야 할 개별 아이디어의 JSON 스키마
const ideaSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "아이디어명" },
    category: { type: "string", description: "대분류 (예: 생활안전, 학교생활, 환경·에너지 등)" },
    subCategory: { type: "string", description: "세부분류" },
    targetSchoolLevel: { type: "string", description: "추천 학교급" },
    problem: { type: "string", description: "해결하려는 문제 상황" },
    targetUser: { type: "string", description: "주요 사용 대상" },
    usageSituation: { type: "string", description: "실제 사용 상황/환경" },
    coreIdea: { type: "string", description: "핵심 아이디어 요약" },
    idealSolution: { type: "string", description: "기술적 한계를 고려하지 않은 이상적인 해결방법" },
    realisticSolution: { type: "string", description: "3D 프린터, 아두이노 등으로 구현 가능한 현실적인 해결방법" },
    prototypePlan: { type: "string", description: "학생이 직접 제작할 수 있는 시제품 구성" },
    operatingPrinciple: { type: "string", description: "물리적/구조적 작동 원리" },
    expectedMaterials: {
      type: "array",
      items: { type: "string" },
      description: "예상 재료 목록"
    },
    expectedDifficulty: { 
      type: "string", 
      enum: ["easy", "medium", "hard"],
      description: "제작 난이도"
    },
    expectedCostLevel: { 
      type: "string", 
      enum: ["low", "medium", "high"],
      description: "예상 비용 수준"
    },
    patentPotential: { type: "string", description: "특허 등록 가능성 예비 판단 (단정하지 말고 추가 검토 필요 수준으로 표현)" },
    contestSuitability: { type: "string", description: "학생 발명대회 적합성 수준 및 이유" },
    noveltyNote: { type: "string", description: "새로움 판단 및 차별성 요약" },
    similarRiskNote: { type: "string", description: "기존 특허/제품과 유사 가능성 및 추가 검토가 필요한 사항" },
    sourceBasis: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string", description: "최근 기사 | 생활 불편함 | 학교 현장 문제 | 제품 리뷰 불만 | 사회 변화" },
          summary: { type: "string", description: "발명의 근거가 되는 실생활 문제 요약" },
          searchHint: { type: "string", description: "구체적 증명을 위해 검색할 키워드" }
        },
        required: ["type", "summary", "searchHint"]
      }
    },
    searchKeywords: {
      type: "object",
      properties: {
        patent: { type: "array", items: { type: "string" }, description: "특허정보넷 Kipris 등에서 사용할 특허 검색어" },
        contestWinners: { type: "array", items: { type: "string" }, description: "전국학생발명대회 등 수상작 검색어" },
        products: { type: "array", items: { type: "string" }, description: "네이버 쇼핑, 아마존 등 시판 제품 검색어" },
        general: { type: "array", items: { type: "string" }, description: "구글/포털 일반 검색어" },
        expanded: { type: "array", items: { type: "string" }, description: "관련 기술 확장 검색어" }
      },
      required: ["patent", "contestWinners", "products", "general", "expanded"]
    }
  },
  required: [
    "title", "category", "subCategory", "targetSchoolLevel", "problem",
    "targetUser", "usageSituation", "coreIdea", "idealSolution", "realisticSolution",
    "prototypePlan", "operatingPrinciple", "expectedMaterials", "expectedDifficulty",
    "expectedCostLevel", "patentPotential", "contestSuitability", "noveltyNote",
    "similarRiskNote", "sourceBasis", "searchKeywords"
  ]
};

// Next.js API Routes에 전달할 스키마 (배열 형태)
const arrayResponseSchema = {
  type: "array",
  items: ideaSchema,
  description: "생성된 발명 아이디어 카드들의 배열"
};

const systemInstruction = `
너는 초·중·고 학생 발명대회 아이디어 발굴 보조 AI이다.
목표는 학생이 실제로 이해하고 설명할 수 있으며, 발명대회에 출품할 수 있고, 학생 특허 등록 가능성까지 검토할 수 있는 발명 아이디어 초안을 생성하는 것이다.

아이디어는 단순한 상상에서 출발하면 안 된다.
반드시 다음 중 하나 이상의 근거를 바탕으로 한다.
1. 최근 사회 문제
2. 최근 기사에서 드러난 문제
3. 생활 속 불편함
4. 학교 현장에서 반복되는 문제
5. 제품 리뷰나 사용자 후기에서 나타난 불만
6. 고령화, 기후위기, 안전사고, 환경문제 등 사회 변화
7. 기존 제품의 한계
8. 학생이 직접 관찰할 수 있는 문제

각 아이디어는 다음 조건을 만족해야 한다.
1. 초·중·고 학생이 이해하고 설명할 수 있어야 한다.
2. 실제 시제품 제작 가능성이 있어야 한다.
3. 기존 제품을 단순히 조합한 수준이면 안 된다.
4. 해결하려는 문제가 명확해야 한다.
5. 구조와 작동 원리가 설명 가능해야 한다.
6. 특허 검색이 가능하도록 키워드를 제공해야 한다.
7. 이상적인 해결 방법과 현실적인 해결 방법을 구분해야 한다.
8. 발명대회 출품 가능성을 예비 평가해야 한다.
9. 유사 제품이나 특허가 있을 가능성을 함께 표시해야 한다.
10. 법적 특허 가능성을 단정하지 말고 “추가 검토 필요” 수준으로 표현한다.

출력은 반드시 제공된 JSON 스키마 규격을 충족하는 JSON 배열이어야 한다.
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
    const { category, schoolLevel, count, criteria, prompt } = await request.json();

    const generateCount = Math.min(Math.max(Number(count) || 1, 1), 10); // 한 번에 1~10개 제한

    const userPrompt = `
다음 요구사항에 맞춰 새로운 학생 발명 아이디어 ${generateCount}개를 생성해 주세요.

[요구사항]
- 영역(카테고리): ${category || "전체"}
- 대상 학교급: ${schoolLevel || "전체"}
- 아이디어 생성 기준: ${criteria || "무작위 혼합"}
${prompt ? `- 사용자 추가 기획 의도/참고사항: ${prompt}` : ""}

반드시 제공된 JSON Schema 형태를 만족하는 JSON 배열로만 정밀하게 리턴해 주십시오. 다른 설명 텍스트나 사족은 절대 포함하지 마십시오.
`;

    // AI Provider Adapter 실행 (Fallback 지원)
    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "generate",
      systemInstruction,
      responseSchema: arrayResponseSchema
    });

    // 결과 파싱
    const parsedIdeas = cleanAndParseJson<any[]>(responseText);

    return NextResponse.json({
      success: true,
      provider,
      ideas: parsedIdeas,
    });
  } catch (error: any) {
    console.error("아이디어 AI 생성 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message || "아이디어를 생성하는 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
