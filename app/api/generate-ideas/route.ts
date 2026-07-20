import { NextResponse } from "next/server";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";
import { collection, writeBatch, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

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
        required: ["type", "summary", "searchHint"],
        additionalProperties: false
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
      required: ["patent", "contestWinners", "products", "general", "expanded"],
      additionalProperties: false
    }
  },
  required: [
    "title", "category", "subCategory", "targetSchoolLevel", "problem",
    "targetUser", "usageSituation", "coreIdea", "idealSolution", "realisticSolution",
    "prototypePlan", "operatingPrinciple", "expectedMaterials", "expectedDifficulty",
    "expectedCostLevel", "patentPotential", "contestSuitability", "noveltyNote",
    "similarRiskNote", "sourceBasis", "searchKeywords"
  ],
  additionalProperties: false
};

const arrayResponseSchema = {
  type: "array",
  items: ideaSchema,
  description: "생성된 발명 아이디어 카드들의 배열"
};

const systemInstruction = `
너는 초·중·고 학생 발명대회 아이디어 발굴 보조 AI이다.
목표는 학생이 실제로 이해하고 설명할 수 있으며, 발명대회에 출품할 수 있고, 학생 특허 등록 가능성까지 검토할 수 있는 발명 아이디어 초안을 생성하는 것이다.

출력은 반드시 제공된 JSON 스키마 규격을 충족하는 JSON 배열이어야 한다.
`;

export async function POST(request: Request) {
  try {
    const { category, schoolLevel, count, criteria, prompt, topicPrompt } = await request.json();

    const generateCount = Math.min(Math.max(Number(count) || 1, 1), 10);
    const finalPrompt = prompt || topicPrompt || "";

    const userPrompt = `
다음 요구사항에 맞춰 새로운 학생 발명 아이디어 ${generateCount}개를 생성해 주세요.

[요구사항]
- 영역(카테고리): ${category || "전체"}
- 대상 학교급: ${schoolLevel || "전체"}
- 아이디어 생성 기준: ${criteria || "무작위 혼합"}
${finalPrompt ? `- 사용자 추가 기획 의도/참고사항: ${finalPrompt}` : ""}

반드시 제공된 JSON Schema 형태를 만족하는 JSON 배열로만 정밀하게 리턴해 주십시오. 다른 설명 텍스트나 사족은 절대 포함하지 마십시오.
`;

    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "generate",
      systemInstruction,
      responseSchema: arrayResponseSchema
    });

    const parsedIdeas = cleanAndParseJson<any[]>(responseText);

    // ⚡ Firestore DB 에 생성된 아이디어 영구 자동 적재
    const batch = writeBatch(db);
    const ideasRef = collection(db, "ideas");
    const savedIdeas: any[] = [];

    parsedIdeas.forEach((item) => {
      const newDocRef = doc(ideasRef);
      const newIdea = {
        ...item,
        id: newDocRef.id,
        status: "draft",
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "user-ai",
      };
      batch.set(newDocRef, newIdea);
      savedIdeas.push(newIdea);
    });

    await batch.commit();

    return NextResponse.json({
      success: true,
      provider,
      ideas: savedIdeas,
    });
  } catch (error: any) {
    console.error("아이디어 AI 생성 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message || "아이디어를 생성하는 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
