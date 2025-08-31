import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from 'app/lib/api';
import {
  IPlayground,
  PlaygroundCreatePayload,
  PlaygroundUpdatePayload,
  PlaygroundListResponse,
  PlaygroundSingleResponse,
} from 'app/types/apis/playground';

export function usePlaygrounds() {
  return useQuery<IPlayground[] | null>({
    queryKey: ['playground'],
    queryFn: async () => {
      const { data } = await api.get<PlaygroundListResponse>('/playground');
      return data.data;
    },
  });
}

export function useCreatePlayground() {
  const qc = useQueryClient();
  return useMutation<IPlayground, Error, PlaygroundCreatePayload>({
    mutationFn: async (payload) => {
      const { data } = await api.post<PlaygroundSingleResponse>('/playground', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['playground'] }),
  });
}

export function usePlayground(slug: string | undefined) {
  return useQuery<IPlayground | null>({
    queryKey: ['playground', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data } = await api.get<PlaygroundSingleResponse>(`/playground/${slug}`);
      return data.data;
    },
    enabled: !!slug,
  });
}

export function useUpdatePlayground() {
  const qc = useQueryClient();
  return useMutation<IPlayground, Error, { slug: string; payload: PlaygroundUpdatePayload }>({
    mutationFn: async ({ slug, payload }) => {
      const { data } = await api.patch<PlaygroundSingleResponse>(`/playground/${slug}`, payload);
      return data.data;
    },
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ['playground', vars.slug] }),
  });
}
