'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppShell,
  Text,
  Title,
  Button,
  TextInput,
  Card,
  Group,
  Stack,
  ScrollArea,
  Box,
  Paper,
  Grid,
  ActionIcon,
  Burger,
  useMantineTheme,
  NavLink,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconClock,
  IconPolygon,
  IconLayoutGrid,
  IconLayoutList,
  IconAdjustments,
  IconUser,
  IconCreditCard,
  IconSettings,
  IconHistory,
} from '@tabler/icons-react';
import EmptyState from './components/empty-state';
import { usePlaygrounds, useCreatePlayground } from 'app/hooks/use-playgrounds';

export default function NewPlaygroundView() {
  const theme = useMantineTheme();
  const router = useRouter();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [opened, { toggle }] = useDisclosure();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: playgrounds, isLoading } = usePlaygrounds();
  const { mutateAsync: createPlayground, isPending } = useCreatePlayground();

  const handleCreateNewSession = async () => {
    try {
      const newPlayground = await createPlayground({
        name: 'Untitled Playground',
        config: {
          version: '1.0',
          timestamp: new Date().toISOString(),
          modelInfo: [],
          shapeKeys: {},
        },
      });
      if (newPlayground) {
        router.push(`/playground/${newPlayground.slug}`);
      }
    } catch (error) {
      console.error('Failed to create new playground session:', error);
    }
  };

  const filteredPlaygrounds = playgrounds?.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 240,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Title order={3}>Playground</Title>
          </Group>
          <Group>
            <ActionIcon variant="subtle" color="gray">
              <IconAdjustments size={20} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray">
              <IconUser size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Stack gap="xs" justify="space-between" h="100%">
          <Stack gap="xs">
            <NavLink label="Sessions" leftSection={<IconHistory size={16} />} active />
            <NavLink label="Billing" leftSection={<IconCreditCard size={16} />} />
            <NavLink label="Settings" leftSection={<IconSettings size={16} />} />
          </Stack>
        </Stack>
      </AppShell.Navbar>

      <AppShell.Main>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>Playground Sessions</Title>
            <Group gap={8}>
              <TextInput
                placeholder="Search sessions..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                style={{ width: '250px' }}
              />
              <ActionIcon
                variant={viewMode === 'grid' ? 'light' : 'subtle'}
                color="blue"
                onClick={() => setViewMode('grid')}
              >
                <IconLayoutGrid size={16} />
              </ActionIcon>
              <ActionIcon
                variant={viewMode === 'list' ? 'light' : 'subtle'}
                color="blue"
                onClick={() => setViewMode('list')}
              >
                <IconLayoutList size={16} />
              </ActionIcon>
            </Group>
          </Group>

          {isLoading ? (
            <Grid>
              {Array(8)
                .fill(0)
                .map((_, i) => (
                  <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 3 }} key={i}>
                    <Card withBorder padding="lg" radius="md" h={220}>
                      <Card.Section h={120} bg={theme.colors.gray[1]} />
                      <Box mt="md" h={16} w="70%" bg={theme.colors.gray[3]} />
                      <Box mt="sm" h={12} w="40%" bg={theme.colors.gray[2]} />
                    </Card>
                  </Grid.Col>
                ))}
            </Grid>
          ) : filteredPlaygrounds && filteredPlaygrounds.length > 0 ? (
            <Grid>
              <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 3 }}>
                <Card
                  withBorder
                  padding="lg"
                  radius="md"
                  h={220}
                  style={{
                    cursor: 'pointer',
                    border: `1px dashed ${theme.colors.blue[5]}`,
                    backgroundColor: theme.colors.blue[0],
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onClick={handleCreateNewSession}
                >
                  <Stack align="center" gap="md">
                    <ActionIcon
                      size="xl"
                      radius="xl"
                      variant="light"
                      color="blue"
                      loading={isPending}
                    >
                      <IconPlus size={24} />
                    </ActionIcon>
                    <Text fw={500} ta="center">
                      Create New Session
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>

              {filteredPlaygrounds.map((playground) => (
                <Grid.Col span={{ base: 12, xs: 6, sm: 4, md: 3 }} key={playground.id}>
                  <Card
                    withBorder
                    padding="lg"
                    radius="md"
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/playground/${playground.slug}`)}
                  >
                    <Card.Section
                      bg={theme.colors.gray[1]}
                      h={120}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <IconPolygon size={40} stroke={1.5} color={theme.colors.gray[5]} />
                    </Card.Section>

                    <Group justify="space-between" mt="md" mb="xs">
                      <Text fw={500} lineClamp={1}>
                        {playground.name || 'Untitled'}
                      </Text>
                    </Group>

                    <Group justify="space-between" mt={4}>
                      <Text size="xs" c="dimmed">
                        {playground.slug.substring(0, 8)}
                      </Text>
                      <Group gap={4} c="dimmed">
                        <IconClock size={12} />
                        <Text size="xs">{new Date(playground.updatedAt).toLocaleDateString()}</Text>
                      </Group>
                    </Group>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <Paper p="xl" withBorder radius="md">
              <EmptyState />
            </Paper>
          )}
        </Stack>
      </AppShell.Main>
    </AppShell>
  );
}
