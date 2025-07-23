import { useQuery } from '@tanstack/react-query';
import { fetchStories } from '../api/fetchHelpers';

export function useStories(epicKey: string | null) {
  return useQuery({
    queryKey: ['stories', epicKey],
    queryFn: () => fetchStories(epicKey!),
    enabled: !!epicKey,
    staleTime: 5 * 60 * 1000,
  });
}