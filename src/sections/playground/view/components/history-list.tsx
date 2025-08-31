'use client';

import Link from 'next/link';
import { usePlaygrounds } from 'app/hooks/use-playgrounds';
import { Card, Text, Group, Button, Skeleton, Stack } from '@mantine/core';
import { IconPolygon, IconClock } from '@tabler/icons-react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

export default function HistoryList() {
  const { data: playgrounds, isLoading, isError } = usePlaygrounds();

  if (isLoading) {
    return (
      <Stack>
        {[...Array(3)].map((_, i) => (
          <Card key={i} shadow="sm" padding="lg" radius="md" withBorder>
            <Skeleton height={20} width="70%" mb="sm" />
            <Skeleton height={14} width="40%" />
          </Card>
        ))}
      </Stack>
    );
  }

  if (isError) {
    return <Text c="red">Failed to load playground sessions.</Text>;
  }

  if (!playgrounds || playgrounds.length === 0) {
    return null; // EmptyState will handle this case
  }

  return (
    <Stack>
      {playgrounds.map((playground) => (
        <Card
          key={playground.id}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          component={Link}
          href={`/playground/${playground.slug}`}
        >
          <Group justify="space-between" align="center" mb="xs">
            <Group gap="xs">
              <IconPolygon stroke={1.5} size={20} />
              <Text fw={500} lineClamp={1}>
                {playground.name || 'Untitled Playground'}
              </Text>
            </Group>
            <Group gap={5} c="dimmed">
              <IconClock size={16} />
              <Text size="sm">{dayjs(playground.updatedAt).fromNow()}</Text>
            </Group>
          </Group>
          <Text size="sm" c="dimmed" lineClamp={2}>
            Session ID: {playground.slug}
          </Text>
        </Card>
      ))}
    </Stack>
  );
}
