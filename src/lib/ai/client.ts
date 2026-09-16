import "server-only";
import { env } from "../env";

// ---------------------------------------------------------------------------
// AI client adapter
//
// A thin, provider-agnostic seam. The real provider is OpenAI, using its
// Chat Completions JSON mode so the model returns strict JSON that we then
// validate with Zod. A deterministic "mock" provider is available for local /
// offline development (AI_PROVIDER=mock); it lets the full pipeline run without
// a key. The API key is read server-side only (never shipped to the client).
//
// The AI NEVER receives database credentials and NEVER executes queries. It is
// given text + a strict instruction to return JSON and nothing else.
// ---------------------------------------------------------------------------

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

export interface AiProvider {
  readonly name: string;
  // Returns raw JSON text (to be parsed + Zod-validated by the caller).
  completeJson(messages: ChatMessage[]): Promise<string>;
}

class OpenAiProvider implements AiProvider {
  readonly name = "openai";

  async completeJson(messages: ChatMessage[]): Promise<string> {
    if (!env.openaiApiKey) {
      throw new AiConfigError(
        "OPENAI_API_KEY is not set. Set it in your environment (server-side only) or use AI_PROVIDER=mock for local development.",
      );
    }
    // Lazy import so the dependency is only loaded when actually used.
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: env.openaiApiKey });

    const completion = await client.chat.completions.create({
      model: env.openaiModel,
      temperature: 0,
      response_format: { type: "json_object" },
      messages,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned an empty response.");
    }
    return content;
  }
}

export class AiConfigError extends Error {}

// The mock provider is implemented in ./mockProvider to keep this file focused.
export function getAiProvider(): AiProvider {
  if (env.aiProvider === "mock") {
    // Require lazily to avoid bundling mock logic into the OpenAI path.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MockProvider } = require("./mockProvider") as typeof import("./mockProvider");
    return new MockProvider();
  }
  return new OpenAiProvider();
}
