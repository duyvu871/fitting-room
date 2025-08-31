'use client';

import { useRouter } from 'next/navigation';
import { useCreatePlayground } from 'app/hooks/use-playgrounds';
import { Button, Center, Stack, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export default function EmptyState() {
  const router = useRouter();
  const { mutateAsync: createPlayground, isPending } = useCreatePlayground();

  const handleCreateNewSession = async () => {
    try {
      const newPlayground = await createPlayground({});
      if (newPlayground) {
        router.push(`/playground/${newPlayground.slug}`);
      }
    } catch (error) {
      console.error('Failed to create new playground session:', error);
      // Optionally, show a toast notification to the user
    }
  };

  return (
    <Center h={300}>
      <Stack align="center">
        <Text size="lg" c="dimmed">
          No playground sessions found. Create a new one to start experimenting!
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleCreateNewSession}
          loading={isPending}
        >
          Create New Session
        </Button>
      </Stack>
    </Center>
  );
}
