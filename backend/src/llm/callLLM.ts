// src/llm/callLLM.ts
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function callLLM(
  prompt: string,
  opts?: { json?: boolean }
): Promise<any> {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    messages: [
      { role: "system", content: "Return only what is asked. If JSON is requested, return valid JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const content = resp.choices?.[0]?.message?.content ?? "";
  return opts?.json ? JSON.parse(content) : content;
}
