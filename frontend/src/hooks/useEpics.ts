import { useQuery } from '@tanstack/react-query';
import { fetchEpics } from '../api/fetchHelpers';

export function useEpics(projectKey: string | null) {
  return useQuery({
    queryKey: ['epics', projectKey],
    queryFn: () => fetchEpics(projectKey!),
    enabled: !!projectKey,
    staleTime: 5 * 60 * 1000,
  });
}