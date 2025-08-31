'use client';

import { Stack, Title } from '@mantine/core';
import EmptyState from './components/empty-state';
import HistoryList from './components/history-list';
import { usePlaygrounds } from 'app/hooks/use-playgrounds';

export default function NewPlaygroundView() {
  const { data: playgrounds, isLoading } = usePlaygrounds();

  if (isLoading) {
    return (
      <Stack>
        <Title order={2}>Playground Sessions</Title>
        <HistoryList /> {/* HistoryList already has skeleton loading */}
      </Stack>
    );
  }

  return (
    <Stack>
      <Title order={2}>Playground Sessions</Title>
      {playgrounds && playgrounds.length > 0 ? <HistoryList /> : <EmptyState />}
    </Stack>
  );
}
