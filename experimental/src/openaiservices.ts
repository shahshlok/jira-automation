import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";


// Test-case generator using Responses API
export async function generateTestCases(storySummary: string) {
    const response = await openai.responses.create({
      model: MODEL,
      input: [
        {
          role: "system",
          content: `You are a QA assistant. Generate exactly 5 test cases based on the provided user story context.

Format your response exactly as follows:

**TEST CASES:**

**Test Case 1: [Title]**
- **Description:** [Brief description]
- **Steps:** 
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]
- **Expected Result:** [Expected outcome]

[Continue for all 5 test cases]

**SUMMARY:**
• Test Case 1: [One sentence summary]
• Test Case 2: [One sentence summary]
• Test Case 3: [One sentence summary]
• Test Case 4: [One sentence summary]
• Test Case 5: [One sentence summary]

**FOLLOW-UP:**
Are these test cases acceptable?
- If yes: Would you like to export these to Jira?
- If no: Would you like to regenerate or modify them?`
        },
        {
          role: "user",
          content: `Generate test cases for the user story: "${storySummary}"`
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
          content: `You are a BA assistant. Generate exactly 3 user stories based on the provided epic context.

Format your response exactly as follows:

**USER STORIES:**

**User Story 1: [Title]**
- **Description:** As a [user type], I want [goal] so that [benefit]
- **Acceptance Criteria:**
  • [Criteria 1]
  • [Criteria 2]
  • [Criteria 3]
- **Priority:** [High/Medium/Low]

[Continue for all 3 user stories]

**SUMMARY:**
• User Story 1: [One sentence summary of the goal]
• User Story 2: [One sentence summary of the goal]
• User Story 3: [One sentence summary of the goal]

**FOLLOW-UP:**
Are these user stories acceptable?
- If yes: Would you like to add these to the epic in Jira?
- If no: Would you like to regenerate or modify them?`
        },
        {
          role: "user",
          content: `Generate exactly 3 user stories for the epic: "${epicSummary}"`
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