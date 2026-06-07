import OpenAI from "openai";
import { AiProvider } from "../index";

export class OpenAIProvider implements AiProvider {
  name: "openai" = "openai";
  modelName: string;
  private openai: OpenAI | null = null;

  constructor() {
    this.modelName = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async generate(prompt: string, systemInstruction?: string, responseSchema?: any): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API key is not configured.");
    }

    try {
      const messages: any[] = [];
      
      if (systemInstruction) {
        messages.push({ role: "system", content: systemInstruction });
      }
      
      messages.push({ role: "user", content: prompt });

      const options: any = {
        model: this.modelName,
        messages,
        temperature: 0.7,
      };

      // JSON 스키마를 명시적으로 전달받았을 경우, structured output 적용
      if (responseSchema) {
        options.response_format = {
          type: "json_schema",
          json_schema: {
            name: "response_schema",
            strict: true,
            schema: responseSchema,
          },
        };
      } else {
        // 일반 JSON 모드 활성화 (단, 프롬프트 내에 JSON 문구가 포함되어야 정상 작동)
        options.response_format = { type: "json_object" };
      }

      const response = await this.openai.chat.completions.create(options);
      const text = response.choices[0]?.message?.content;

      if (!text) {
        throw new Error("Received empty response from OpenAI.");
      }

      return text;
    } catch (error: any) {
      throw new Error(`OpenAI Error: ${error.message || error}`);
    }
  }
}
