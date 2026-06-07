import { NextResponse } from "next/server";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { generateWithFallback, cleanAndParseJson } from "@/lib/ai";
import { verifyAdmin } from "@/lib/auth";

const developResponseSchema = {
  type: "object",
  properties: {
    ideaTitle: { type: "string", description: "아이디어명" },
    problemSummary: { type: "string", description: "문제 요약" },
    improvedCoreIdea: { type: "string", description: "개선된 핵심 아이디어" },
    idealSolution: { type: "string", description: "이상적인 해결방법" },
    realisticSolution: { type: "string", description: "현실적인 해결방법" },
    prototypePlan: { type: "string", description: "학생 제작용 시제품 계획" },
    operatingPrinciple: { type: "string", description: "작동 원리" },
    materials: { type: "array", items: { type: "string" }, description: "준비물" },
    estimatedCost: { type: "string", description: "예상 비용" },
    difficulty: { type: "string", description: "제작 난이도" },
    patentSearchKeywords: { type: "array", items: { type: "string" }, description: "특허 검색어" },
    contestWinnerSearchKeywords: { type: "array", items: { type: "string" }, description: "기존 수상작 검색어" },
    productSearchKeywords: { type: "array", items: { type: "string" }, description: "시판 제품 검색어" },
    differentiationPoints: { type: "array", items: { type: "string" }, description: "차별점" },
    guidanceForStudent: { type: "array", items: { type: "string" }, description: "학생에게 보완 지도할 내용" }
  },
  required: [
    "ideaTitle",
    "problemSummary",
    "improvedCoreIdea",
    "idealSolution",
    "realisticSolution",
    "prototypePlan",
    "operatingPrinciple",
    "materials",
    "estimatedCost",
    "difficulty",
    "patentSearchKeywords",
    "contestWinnerSearchKeywords",
    "productSearchKeywords",
    "differentiationPoints",
    "guidanceForStudent"
  ]
};

const systemInstruction = `
너는 초·중·고 학생 발명대회 작품을 지도하는 발명 교육 전문가이다.
선택한 아이디어를 학생 발명대회 출품 가능성이 높아지도록 발전시킨다.

반드시 다음 두 방향을 구분한다.
1. 이상적인 해결방법: 기술적 제약을 크게 보지 않고 가장 완성도 높은 형태로 제안한다. 센서, AI, 자동화, 앱 연동, 데이터 분석 등을 포함할 수 있다.
2. 현실적인 해결방법: 학생이 실제로 제작 가능한 형태로 제안한다. 3D 프린터, 아두이노, ESP32, 마이크로비트, 목재, 종이, 자석, 고무줄, 레버, 스위치 등으로 구현 가능한 구조를 우선한다.

출력은 반드시 제공된 JSON Schema를 만족하는 단일 JSON 객체여야 한다. 다른 텍스트 설명은 제외해라.
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
    const { ideaId } = await request.json();

    if (!ideaId) {
      return NextResponse.json(
        { success: false, error: "발전시킬 아이디어 ID가 누락되었습니다." },
        { status: 400 }
      );
    }

    // 2. Firestore에서 기존 아이디어 조회
    const ideaRef = doc(db, "ideas", ideaId);
    const ideaSnap = await getDoc(ideaRef);

    if (!ideaSnap.exists()) {
      return NextResponse.json(
        { success: false, error: "존재하지 않는 아이디어입니다." },
        { status: 404 }
      );
    }

    const originalIdea = ideaSnap.data();

    // 3. AI 프롬프트 구성
    const userPrompt = `
다음 발명 아이디어를 학생 발명대회 출품작으로 정밀하게 발전 및 고도화해 주세요.

[원본 아이디어 정보]
- 제목: ${originalIdea.title}
- 대분류: ${originalIdea.category} / 세부분류: ${originalIdea.subCategory}
- 대상 학교급: ${originalIdea.targetSchoolLevel}
- 해결하려는 문제 상황: ${originalIdea.problem}
- 핵심 아이디어: ${originalIdea.coreIdea}
- 추천 재료: ${originalIdea.expectedMaterials?.join(", ") || "미지정"}

요구된 JSON Schema 구조에 따라 엄격하게 결과를 리턴해 주십시오.
`;

    // AI Adapter 실행
    const { provider, responseText } = await generateWithFallback({
      prompt: userPrompt,
      task: "develop",
      systemInstruction,
      responseSchema: developResponseSchema,
    });

    const parsedLog = cleanAndParseJson(responseText);

    // 4. 기존 발전 기록 조회 및 신규 버전 넘버 계산
    const logsRef = collection(db, "developmentLogs");
    const q = query(
      logsRef,
      where("ideaId", "==", ideaId),
      orderBy("version", "desc"),
      limit(1)
    );
    
    // index가 필수적일 수 있으나, 만약 index가 없으면 SDK 레벨에서 에러가 날 수 있으므로 방어 처리
    let nextVersion = 1;
    try {
      const snap = await getDocs(q);
      if (!snap.empty) {
        nextVersion = (snap.docs[0].data().version || 0) + 1;
      }
    } catch (indexError) {
      // index가 없는 경우 대체 방법으로 version을 알아내기 위해 전체 카운팅 시도
      console.warn("Index not built yet for developmentLogs version ordering. Fallback to count.");
      const fallbackQuery = query(logsRef, where("ideaId", "==", ideaId));
      const fallbackSnap = await getDocs(fallbackQuery);
      nextVersion = fallbackSnap.size + 1;
    }

    // 5. developmentLogs에 기록 저장
    const logData = {
      ideaId,
      version: nextVersion,
      originalIdeaSummary: originalIdea.coreIdea,
      improvedCoreIdea: parsedLog.improvedCoreIdea,
      idealSolution: parsedLog.idealSolution,
      realisticSolution: parsedLog.realisticSolution,
      prototypePlan: parsedLog.prototypePlan,
      operatingPrinciple: parsedLog.operatingPrinciple,
      materials: parsedLog.materials,
      estimatedCost: parsedLog.estimatedCost,
      difficulty: parsedLog.difficulty,
      patentSearchKeywords: parsedLog.patentSearchKeywords,
      contestWinnerSearchKeywords: parsedLog.contestWinnerSearchKeywords,
      productSearchKeywords: parsedLog.productSearchKeywords,
      differentiationPoints: parsedLog.differentiationPoints,
      guidanceForStudent: parsedLog.guidanceForStudent,
      createdAt: new Date(),
      createdBy: "admin",
    };

    const newLogDoc = await addDoc(logsRef, logData);

    // 6. ideas 문서의 상태를 'developing'으로 업데이트
    // AI가 발굴한 검색 키워드도 추가로 ideas에 업데이트하여 일반 검색소에서 즉시 노출되도록 동기화
    await updateDoc(ideaRef, {
      status: "developing",
      idealSolution: parsedLog.idealSolution,
      realisticSolution: parsedLog.realisticSolution,
      prototypePlan: parsedLog.prototypePlan,
      operatingPrinciple: parsedLog.operatingPrinciple,
      expectedDifficulty: parsedLog.difficulty.toLowerCase().includes("easy") ? "easy" : parsedLog.difficulty.toLowerCase().includes("hard") ? "hard" : "medium",
      searchKeywords: {
        patent: parsedLog.patentSearchKeywords || [],
        contestWinners: parsedLog.contestWinnerSearchKeywords || [],
        products: parsedLog.productSearchKeywords || [],
        general: originalIdea.searchKeywords?.general || [],
        expanded: originalIdea.searchKeywords?.expanded || []
      },
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      provider,
      version: nextVersion,
      developmentLogId: newLogDoc.id,
      data: parsedLog,
    });
  } catch (error: any) {
    console.error("아이디어 발전 API 오류:", error);
    return NextResponse.json(
      { success: false, error: error.message || "아이디어를 발전시키는 도중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
