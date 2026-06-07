import { GoogleGenerativeAI } from "@google/generative-ai";
import { AiProvider } from "../index";

export class GeminiProvider implements AiProvider {
  name: "gemini" = "gemini";
  modelName: string;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    this.modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  async generate(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini API key is not configured.");
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        systemInstruction: systemInstruction,
      });

      // JSON 출력을 강제하기 위해 config 설정
      const generationConfig: any = {
        temperature: 0.7,
      };

      // 스키마 요구사항이 있는 경우 혹은 JSON 형태일 때 JSON MIME 지정
      generationConfig.responseMimeType = "application/json";
      
      if (responseSchema) {
        generationConfig.responseSchema = responseSchema;
      }

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = result.response;
      const text = response.text();
      
      if (!text) {
        throw new Error("Received empty response from Gemini.");
      }

      return text;
    } catch (error: any) {
      throw new Error(`Gemini Error: ${error.message || error}`);
    }
  }
}
