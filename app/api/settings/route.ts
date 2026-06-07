import { NextResponse } from "next/server";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { verifyAdmin } from "@/lib/auth";

// GET /api/settings
export async function GET() {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const settingsRef = doc(db, "settings", "global");
    const snap = await getDoc(settingsRef);

    const defaultSettings = {
      aiProvider: "gemini",
      geminiModel: "gemini-2.5-flash",
      openaiModel: "gpt-4o-mini",
      dailyIdeaCount: 5,
      defaultSchoolLevel: "초등 고학년",
      defaultCategory: "생활안전",
      saveThreshold: 3.5,
      excellentThreshold: 4.3,
      telegramBotToken: "",
      telegramChatId: "",
      autoGenTime: "07:00",
    };

    if (snap.exists()) {
      return NextResponse.json({
        success: true,
        settings: { ...defaultSettings, ...snap.data() },
      });
    }

    return NextResponse.json({
      success: true,
      settings: defaultSettings,
    });
  } catch (error: any) {
    console.error("설정 로드 오류:", error);
    return NextResponse.json({ success: false, error: "설정을 불러오지 못했습니다." }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: Request) {
  const isAdmin = await verifyAdmin();
  if (!isAdmin) {
    return NextResponse.json({ success: false, error: "권한이 없습니다." }, { status: 401 });
  }

  try {
    const data = await request.json();
    const settingsRef = doc(db, "settings", "global");

    // 저장 전 수치형 및 타입 가공
    const payload = {
      aiProvider: data.aiProvider || "gemini",
      geminiModel: data.geminiModel || "gemini-2.5-flash",
      openaiModel: data.openaiModel || "gpt-4o-mini",
      dailyIdeaCount: Number(data.dailyIdeaCount) || 5,
      defaultSchoolLevel: data.defaultSchoolLevel || "초등 고학년",
      defaultCategory: data.defaultCategory || "생활안전",
      saveThreshold: Number(data.saveThreshold) || 3.5,
      excellentThreshold: Number(data.excellentThreshold) || 4.3,
      telegramBotToken: data.telegramBotToken || "",
      telegramChatId: data.telegramChatId || "",
      autoGenTime: data.autoGenTime || "07:00",
      updatedAt: new Date(),
    };

    await setDoc(settingsRef, payload, { merge: true });

    return NextResponse.json({
      success: true,
      message: "설정이 성공적으로 저장되었습니다.",
    });
  } catch (error: any) {
    console.error("설정 저장 오류:", error);
    return NextResponse.json({ success: false, error: "설정을 저장하지 못했습니다." }, { status: 500 });
  }
}
