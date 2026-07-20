import { NextResponse } from "next/server";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const newsSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "사회 뉴스 제목" },
    source: { type: "string", description: "언론사 및 출처" },
    url: { type: "string", description: "참고 포털 검색 URL" },
    problem: { type: "string", description: "기사 속 실생활 고충 문제" },
    category: { type: "string", description: "카테고리 (생활안전, 학교생활, 환경·에너지 등)" },
    aiInspiration: { type: "string", description: "학생 발명 착상 아이디어 방향" },
    suggestedPrompt: { type: "string", description: "아이디어 생성실에 입력될 프롬프트" }
  },
  required: ["title", "source", "url", "problem", "category", "aiInspiration", "suggestedPrompt"],
  additionalProperties: false
};

const fallbackNews = [
  {
    title: "[사회 이슈] 빗물 노면 미끄러짐 사고 급증, 대중교통 승강장 안전 대책 시급",
    source: "교통안전 신문 / 2026.07",
    url: "https://www.google.com/search?q=버스승강장+미끄러짐+사고",
    problem: "장마철 버스 정류장과 지하철 입구 블록의 보행자 미끄러짐 낙상 사고가 매년 30% 이상 증가하고 있으나 시공 비용 문제로 차일피일 미뤄지는 고충",
    category: "생활안전",
    aiInspiration: "수분에 반응하여 마찰 계수를 순간적으로 높여주는 친환경 모듈형 논슬립 패드 및 센서등 고안",
    suggestedPrompt: "장마철 보행자 낙상 사고를 예방하는 모듈형 마찰 증대 안전 발판"
  },
  {
    title: "[학교 현장] 교실 무선 충전기 엉킴과 발열 문제로 화재 우려 목소리",
    source: "교육안전 일보 / 2026.07",
    url: "https://www.google.com/search?q=교실+스마트기기+충전+화재",
    problem: "디지털 교과서 도입으로 각 교실에 30개 이상의 스마트기기를 동시 충전하면서 케이블 꼬임과 과열로 소방 안전에 위협을 받는 현장",
    category: "학교생활",
    aiInspiration: "케이블 정리가 자동으로 되며 과열 시 전원을 물리적으로 이격시키는 자동 소화 거치대 발명",
    suggestedPrompt: "교실 스마트기기 과열 방지 및 자동 정리 기능의 안전 충전 거치대"
  }
];

export async function POST(request: Request) {
  try {
    const { category } = await request.json().catch(() => ({}));
    const targetCategory = category && category !== "전체" ? category : "생활안전";

    let newsData: any = null;

    try {
      const userPrompt = `
사회 속 고충과 실생활 결핍을 다룬 참신한 최신 뉴스 이슈 1건을 탐색하여 작성해 주세요.
카테고리: ${targetCategory}

반드시 지정된 JSON Schema 형태를 만족하는 단일 JSON 객체로만 정밀하게 응답해 주세요.
`;
      const { responseText } = await generateWithFallback({
        prompt: userPrompt,
        task: "analyze",
        systemInstruction: "너는 사회 결핍과 불편 이슈를 발굴하여 학생 발명 영감 기사로 리포팅하는 기자 AI이다.",
        responseSchema: newsSchema
      });

      newsData = cleanAndParseJson<any>(responseText);
    } catch (aiErr) {
      console.warn("News AI generation fallback triggered:", aiErr);
      newsData = fallbackNews[Math.floor(Math.random() * fallbackNews.length)];
      newsData.category = targetCategory;
    }

    if (!newsData || !newsData.title) {
      newsData = fallbackNews[0];
    }

    // Firestore 저장
    let docId = `news-${Date.now()}`;
    try {
      const newsRef = collection(db, "news");
      const added = await addDoc(newsRef, {
        ...newsData,
        createdAt: new Date(),
      });
      docId = added.id;
    } catch (dbErr) {
      console.warn("Firestore news write bypass:", dbErr);
    }

    return NextResponse.json({
      success: true,
      news: {
        ...newsData,
        id: docId,
        createdAt: new Date(),
      }
    });
  } catch (error: any) {
    console.error("Generate News API error:", error);
    return NextResponse.json({
      success: true,
      news: {
        ...fallbackNews[0],
        id: `news-fallback-${Date.now()}`,
        createdAt: new Date(),
      }
    });
  }
}
