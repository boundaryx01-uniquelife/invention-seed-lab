import { NextResponse } from "next/server";
import { doc, getDoc, collection, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";
import { sendTelegramMessage } from "@/lib/telegram";
import { Idea } from "@/types/idea";

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

// 동적 생성할 뉴스 기사의 JSON 스키마
const newsSchema = {
  type: "object",
  properties: {
    title: { type: "string", description: "실제 뉴스 헤드라인 느낌의 제목 (예: 보행자 위협하는 무음 킥보드 급증)" },
    source: { type: "string", description: "모의 언론사명 및 날짜 (예: 안전일보 / 2026-06-15)" },
    url: { type: "string", description: "구글 뉴스 검색 쿼리 URL (예: https://www.google.com/search?q=킥보드+안전)" },
    problem: { type: "string", description: "뉴스 기사 요약 및 구체적인 사회적 고충/불편함 기술" },
    category: { type: "string", description: "카테고리 (생활안전, 학교생활, 환경·에너지, 고령자·장애 보조, 반려동물, 재난·기후, 디지털·AI, 의료·건강, 교통·이동, 가정생활, 운동·놀이, 학습도구 중 1개)" },
    aiInspiration: { type: "string", description: "AI가 제안하는 구체적 발명 해결책 아이디어 영감 및 힌트" },
    suggestedPrompt: { type: "string", description: "생성실로 넘겨줄 기획 프롬프트 기본값" }
  },
  required: ["title", "source", "url", "problem", "category", "aiInspiration", "suggestedPrompt"],
  additionalProperties: false
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
  // 1. CRON_SECRET 보안 토큰 검증
  const authHeader = request.headers.get("authorization");
  const systemSecret = process.env.CRON_SECRET;

  if (!systemSecret) {
    console.error("CRON_SECRET is not configured in environment variables.");
    return NextResponse.json({ success: false, error: "Server misconfiguration." }, { status: 500 });
  }

  if (!authHeader || !authHeader.startsWith("Bearer ") || authHeader.split(" ")[1] !== systemSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
  }

  try {
    // 2. 글로벌 설정 로드
    const settingsRef = doc(db, "settings", "global");
    const snap = await getDoc(settingsRef);

    const defaultSettings = {
      aiProvider: "gemini",
      dailyIdeaCount: 5,
      defaultSchoolLevel: "초등 고학년",
      defaultCategory: "생활안전",
      telegramBotToken: "",
      telegramChatId: "",
    };

    const config = snap.exists() ? { ...defaultSettings, ...snap.data() } : defaultSettings;

    // 3. 1단계: 오늘의 불편 뉴스 기사 자동 생성 (AI 호출)
    const newsPrompt = `
    학생 발명 아이디어의 훌륭한 재료가 될 만한 '실제 기사 스타일의 사회적 불편 이슈' 1개를 생성해 주세요.
    영역(카테고리)은 반드시 '${config.defaultCategory || "생활안전"}'과 연관이 있거나 CATEGORIES 범위 내에 있어야 합니다.
    기사 헤드라인 제목, 모의 언론사 정보, 구체적인 사회적 고충 상황을 실감나게 채워 주십시오.
    반드시 제공된 JSON Schema를 만족하는 단일 JSON 객체 형태로만 리턴해 주십시오. 다른 설명은 포함하지 마십시오.
    `;

    const { responseText: newsResponseText } = await generateWithFallback({
      prompt: newsPrompt,
      task: "generate",
      systemInstruction: "너는 최신 사회 문제와 안전사고, 생활 불편함을 발굴하는 뉴스 에디터 AI이다. 제공된 스키마 규격의 JSON 객체로만 응답해라.",
      responseSchema: newsSchema
    });

    const parsedNews = cleanAndParseJson<any>(newsResponseText);

    // 4. 2단계: 뉴스 기사와 유기적으로 연계된 아이디어 자동 생성
    const generateCount = Math.min(Math.max(Number(config.dailyIdeaCount) || 3, 1), 10);
    const userPrompt = `
    다음 요구사항에 맞춰 새로운 학생 발명 아이디어 ${generateCount}개를 생성해 주세요.

    [중요 조건]
    - 생성할 아이디어 중 최소 1개는 반드시 다음 '오늘의 뉴스' 고충점을 해결하는 최적의 아이디어로 제시해 주십시오:
      뉴스 제목: "${parsedNews.title}"
      사회적 문제점: "${parsedNews.problem}"
      * 이 연계 아이디어의 "sourceBasis" 배열 항목에는 기사 제목과 문제점이 정확하게 매핑되도록 기재해주시고, 카테고리는 "${parsedNews.category}"로 설정하십시오.

    - 나머지 아이디어들은 자유롭게 아래 영역과 대상에 맞춰 생성해 주십시오:
      영역(카테고리): ${config.defaultCategory || "생활안전"}
      대상 학교급: ${config.defaultSchoolLevel || "초등 고학년"}
      아이디어 생성 기준: 무작위 혼합

    반드시 제공된 JSON Schema(arrayResponseSchema) 형태를 만족하는 JSON 배열로만 정밀하게 리턴해 주십시오. 다른 설명 텍스트나 사족은 절대 포함하지 마십시오.
    `;

    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "generate",
      systemInstruction,
      responseSchema: arrayResponseSchema
    });

    const parsedIdeas = cleanAndParseJson<any[]>(responseText);

    // 5. Firestore Batch Write (news 및 ideas 컬렉션 동시 추가)
    const batch = writeBatch(db);
    const newsRef = collection(db, "news");
    const ideasRef = collection(db, "ideas");
    
    // 신규 뉴스 문서 배칭
    const newNewsDocRef = doc(newsRef);
    const finalNewsData = {
      ...parsedNews,
      id: newNewsDocRef.id,
      createdAt: new Date(),
    };
    batch.set(newNewsDocRef, finalNewsData);

    const savedIdeas: Idea[] = [];
    parsedIdeas.forEach((item) => {
      const newDocRef = doc(ideasRef);
      const newIdea: Idea = {
        ...item,
        id: newDocRef.id,
        status: "draft",
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: "cron",
      };
      batch.set(newDocRef, newIdea);
      savedIdeas.push(newIdea);
    });

    await batch.commit();

    // 6. 텔레그램 연동 알림 푸시
    if (config.telegramBotToken && config.telegramChatId) {
      const dateString = new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      let messageText = `🔔 <b>[발명씨앗 Lab] 오늘의 자동 발명 아이디어가 생성되었습니다!</b>\n`;
      messageText += `━━━━━━━━━━━━━━━━━━━━\n`;
      messageText += `📅 <b>생성 일시:</b> ${dateString}\n`;
      messageText += `📰 <b>오늘의 뉴스:</b> ${parsedNews.title}\n`;
      messageText += `📂 <b>기본 영역:</b> ${config.defaultCategory}\n`;
      messageText += `🎓 <b>대상 학교급:</b> ${config.defaultSchoolLevel}\n`;
      messageText += `🤖 <b>사용 모델:</b> ${provider}\n`;
      messageText += `💡 <b>생성된 아이디어 개수:</b> ${savedIdeas.length}개\n\n`;
      
      messageText += `📝 <b>생성된 아이디어 목록:</b>\n`;
      savedIdeas.forEach((idea, idx) => {
        messageText += `<b>${idx + 1}. ${idea.title}</b>\n`;
        messageText += `└ <i>${idea.coreIdea}</i>\n`;
      });
      messageText += `\n━━━━━━━━━━━━━━━━━━━━\n`;
      messageText += `🔬 연구소 대시보드 및 일일 채점방에서 확인 후 평가를 진행해 주세요!`;

      await sendTelegramMessage(config.telegramBotToken, config.telegramChatId, messageText);
    }

    return NextResponse.json({
      success: true,
      provider,
      newsTitle: parsedNews.title,
      count: savedIdeas.length,
      ideas: savedIdeas.map((idea) => ({ id: idea.id, title: idea.title }))
    });

  } catch (error: any) {
    console.error("Cron auto generation error:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "자동 아이디어 생성 중 오류 발생"
    }, { status: 500 });
  }
}
