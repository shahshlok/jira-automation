import { useQuery } from '@tanstack/react-query';
import { fetchTestCases } from '../api/fetchHelpers';

export function useTestCases(storyKey: string | null) {
  return useQuery({
    queryKey: ['testcases', storyKey],
    queryFn: () => fetchTestCases(storyKey!),
    enabled: !!storyKey,
    staleTime: 2 * 60 * 1000, // 2 minutes (shorter for real-time updates)
  });
}