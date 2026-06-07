import { db } from "../firebase";
import { collection, addDoc } from "firebase/firestore";
import { GeminiProvider } from "./providers/gemini";
import { OpenAIProvider } from "./providers/openai";

export interface AiProvider {
  name: "gemini" | "openai";
  modelName: string;
  generate(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<string>;
}

// JSON 결과의 마크다운 백틱 코드 블록을 청소하고 파싱하는 유틸리티
export function cleanAndParseJson<T = any>(text: string): T {
  let cleanText = text.trim();
  
  if (cleanText.startsWith("```")) {
    const firstLineBreak = cleanText.indexOf("\n");
    const lastBackticks = cleanText.lastIndexOf("```");
    
    if (firstLineBreak !== -1 && lastBackticks !== -1 && lastBackticks > firstLineBreak) {
      cleanText = cleanText.substring(firstLineBreak + 1, lastBackticks).trim();
    } else {
      // 백틱 기호 자체 제거 시도
      cleanText = cleanText.replace(/```(json)?/gi, "").trim();
    }
  }
  
  // 가끔 앞뒤에 이상한 괄호가 생기는 경우를 대비
  const startJson = cleanText.indexOf("[");
  const startObj = cleanText.indexOf("{");
  let startIndex = -1;
  
  if (startJson !== -1 && startObj !== -1) {
    startIndex = Math.min(startJson, startObj);
  } else {
    startIndex = startJson !== -1 ? startJson : startObj;
  }
  
  if (startIndex !== -1) {
    const endJson = cleanText.lastIndexOf("]");
    const endObj = cleanText.lastIndexOf("}");
    const endIndex = Math.max(endJson, endObj);
    if (endIndex !== -1 && endIndex > startIndex) {
      cleanText = cleanText.substring(startIndex, endIndex + 1);
    }
  }

  return JSON.parse(cleanText) as T;
}

// Firestore에 AI 로그 기록
async function logAiExecution(log: {
  provider: "gemini" | "openai";
  model: string;
  task: "generate" | "analyze" | "develop";
  success: boolean;
  errorType?: string;
  prompt?: string;
  response?: string;
}) {
  try {
    const logsRef = collection(db, "aiLogs");
    await addDoc(logsRef, {
      ...log,
      createdAt: new Date(), // Client SDK initializeApp 기반이므로 JS Date 사용 가능
    });
  } catch (error) {
    console.error("AI execution logging failed:", error);
  }
}

// Fallback 메커니즘을 가진 AI 생성 실행기
export async function generateWithFallback(params: {
  prompt: string;
  task: "generate" | "analyze" | "develop";
  systemInstruction?: string;
  responseSchema?: any;
}): Promise<{ provider: "gemini" | "openai"; responseText: string }> {
  const primaryProviderName = (process.env.AI_PROVIDER || "gemini").toLowerCase() as "gemini" | "openai";
  
  const gemini = new GeminiProvider();
  const openai = new OpenAIProvider();
  
  const providers: AiProvider[] = primaryProviderName === "openai" 
    ? [openai, gemini] 
    : [gemini, openai];
  
  let lastError: any = null;

  for (const provider of providers) {
    try {
      console.log(`[AI] Attempting task "${params.task}" using ${provider.name} (${provider.modelName})...`);
      const responseText = await provider.generate(
        params.prompt,
        params.systemInstruction,
        params.responseSchema
      );
      
      // 로그 저장 (비동기로 실행)
      logAiExecution({
        provider: provider.name,
        model: provider.modelName,
        task: params.task,
        success: true,
        prompt: params.prompt.substring(0, 1000), // 프롬프트 길이를 제한해 로깅
        response: responseText.substring(0, 1000),
      });

      return {
        provider: provider.name,
        responseText,
      };
    } catch (error: any) {
      console.error(`[AI] Error with provider ${provider.name}:`, error);
      lastError = error;
      
      // 실패 로그 기록
      logAiExecution({
        provider: provider.name,
        model: provider.modelName,
        task: params.task,
        success: false,
        errorType: error.message || "Unknown error",
        prompt: params.prompt.substring(0, 1000),
      });
    }
  }

  throw new Error(`[AI] All providers failed. Last error: ${lastError?.message || "Unknown"}`);
}
