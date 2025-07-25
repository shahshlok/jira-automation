export function extractTestCasesFromStory(storyJson: any) {
  if (!storyJson?.fields?.subtasks) return [];
  
  return storyJson.fields.subtasks.map((st: any) => ({
    key: st.key,
    summary: st.fields.summary ?? '',
    status: st.fields.status?.name ?? 'Unknown'
  }));
}