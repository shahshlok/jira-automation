export function extractTestCasesFromStory(storyJson) {
  if (!storyJson?.fields?.subtasks) return [];
  
  return storyJson.fields.subtasks.map(st => ({
    key: st.key,
    summary: st.fields.summary ?? '',
    status: st.fields.status?.name ?? 'Unknown'
  }));
}