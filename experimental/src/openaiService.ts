import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const JSON_MODE = process.env.OPENAI_JSON_MODE === "true";

async function chatJSON(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]) {
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages,
    ...(JSON_MODE && { response_format: { type: "json_object" } }),
    temperature: 0.7,
    max_tokens: 500
  });
  const raw = res.choices[0].message.content;
  try { 
    return JSON.parse(raw || "{}"); 
  } catch { 
    throw new Error("Model did not return valid JSON"); 
  }
}

// Test-case generator
export async function generateTestCases(storySummary: string) {
  const data = await chatJSON([
    { role: "system", content: "You are a QA assistant. Respond with JSON containing an array of test cases. Each test case should have 'title', 'description', 'steps', and 'expected_result' fields." },
    { role: "user", content: `Generate 5 test cases for: "${storySummary}"` }
  ]);
  return data;  // already an object/array
}

// Story generator
export async function generateUserStories(epicSummary: string) {
  const data = await chatJSON([
    { role: "system", content: "You are a BA assistant. Respond with JSON containing an array of user stories. Each story should have 'title', 'description', 'acceptance_criteria', and 'priority' fields." },
    { role: "user", content: `Generate 3 user stories for epic: "${epicSummary}"` }
  ]);
  return data;
}

// Function calling helper (Phase 2)
export async function extractLocation(text: string) {
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [{ role: "user", content: `${text}` }],
    tools: [{
      type: "function",
      function: {
        name: "extract_location",
        description: "Extracts city and state.",
        parameters: {
          type: "object",
          properties: {
            city: { type: "string" },
            state: { type: "string" }
          },
          required: ["city", "state"]
        }
      }
    }],
    tool_choice: { type: "function", function: { name: "extract_location" } }
  });
  
  const toolCall = res.choices[0].message.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("No tool call returned");
  }
  
  return JSON.parse(toolCall.function.arguments);
}

// Safe logging helper that strips sensitive data
function safeDevLog(label: string, obj: unknown) {
  if (process.env.NODE_ENV !== "development") return;
  
  if (typeof obj === 'object' && obj !== null) {
    const safe = { ...obj } as any;
    // Remove sensitive fields
    const sensitiveFields = ['Authorization', 'authorization', 'apiKey', 'api_key', 'token', 'headers'];
    for (const field of sensitiveFields) {
      if (field in safe) {
        safe[field] = '[REDACTED]';
      }
    }
    // Handle nested headers
    if (safe.headers && typeof safe.headers === 'object') {
      safe.headers = { ...safe.headers };
      if ((safe.headers as any).Authorization) (safe.headers as any).Authorization = '[REDACTED]';
    }
    console.log(label, safe);
  } else {
    console.log(label, obj);
  }
}

// Simple single response function for chat
export async function generateChat(messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]): Promise<string> {
  const jsonMode = process.env.OPENAI_JSON_MODE === 'true';
  
  safeDevLog('generateChat request', { 
    messageCount: messages.length, 
    jsonMode, 
    model: MODEL 
  });

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages,
    ...(jsonMode && { response_format: { type: 'json_object' } }),
    temperature: 0.7,
    max_tokens: 500
  });

  const content = res.choices[0].message.content || '';
  
  safeDevLog('generateChat response', { 
    contentLength: content.length, 
    jsonMode 
  });

  return content;
}