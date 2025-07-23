import { useQuery } from '@tanstack/react-query';
import { fetchProjects } from '../api/fetchHelpers';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}