import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

async function chatTextResponse(messages: { role: "user" | "system" | "assistant"; content: string }[]) {
    const res = await openai.responses.create({
      model: MODEL,
      input: messages,
    });
    return res.output_text || "";
  }

// Test-case generator using Responses API
export async function generateTestCases(storySummary: string) {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: "You are a QA assistant. Generate test cases in plain text format with clear sections for title, description, steps, and expected result."
        },
        {
          role: "user",
          content: `Generate 5 test cases for: "${storySummary}"`
        }
      ]
    });
  
    return response.output_text || "";
  }
  
  // Story generator using Responses API
  export async function generateUserStories(epicSummary: string) {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: "You are a BA assistant. Generate user stories in plain text format with clear sections for title, description, acceptance criteria, and priority."
        },
        {
          role: "user",
          content: `Generate 3 user stories for epic: "${epicSummary}"`
        }
      ]
    });
  
    return response.output_text || "";
  }

  function safeDevLog(label: string, obj: unknown) {
    if (process.env.NODE_ENV !== "development") return;
  
    if (typeof obj === 'object' && obj !== null) {
      const safe = { ...obj } as any;
      const sensitiveFields = ['Authorization', 'authorization', 'apiKey', 'api_key', 'token', 'headers'];
      for (const field of sensitiveFields) {
        if (field in safe) {
          safe[field] = '[REDACTED]';
        }
      }
      if (safe.headers && typeof safe.headers === 'object') {
        safe.headers = { ...safe.headers };
        if ((safe.headers as any).Authorization) (safe.headers as any).Authorization = '[REDACTED]';
      }
      console.log(label, safe);
    } else {
      console.log(label, obj);
    }
  }

  export async function generateChat(messages: { role: "user" | "system" | "assistant"; content: string }[]): Promise<string> {
  safeDevLog("generateChat request", {
    messageCount: messages.length,
    model: MODEL,
  });

  const res = await openai.responses.create({
    model: MODEL,
    input: messages,
  });

  const content = res.output_text || "";

  safeDevLog("generateChat response", {
    contentLength: content.length,
  });

  return content;
}