import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";


// Test-case generator using standard Responses API (no MCP)
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
These test cases are generated based on the user story context. Would you like to:
1. Export these test cases to JIRA (they will be created as subtasks under the current story)
2. Modify or regenerate them
3. Generate additional test cases

Please let me know how you'd like to proceed!`
        },
        {
          role: "user",
          content: `Generate test cases for the user story: "${storySummary}"`
        }
      ]
    });
    console.log(response.output_text)
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
These user stories are generated based on the epic context. Would you like to:
1. Export these user stories to JIRA (they will be linked to the current epic)
2. Modify or regenerate them
3. Generate additional user stories

Please let me know how you'd like to proceed!`
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