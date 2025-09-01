'use client';

import SceneCanvas from 'app/components/3d/SceneCanvas';
import Lights from 'app/components/3d/Lights';
import OrbitControlsRig from 'app/components/3d/OrbitControlsRig';
import GLTFModel from 'app/components/3d/GLTFModel';
import { MODELS_TO_LOAD } from 'app/types/models/clothing';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  categorizeShapeKeyAtom,
  groupedShapeKeysAtom,
  isLoadingAtom,
  loadingTextAtom,
  modelVisibilityAtom,
  resetAllShapeKeysAtom,
  selectedBottomAtom,
  selectedTopAtom,
  setCombinedShapeKeyValueAtom,
  setLoadingTextAtom,
  setModelVisibleAtom,
  setSingleShapeKeyValueAtom,
  zoomValueAtom,
  showPerfAtom,
  shapeKeysAtom,
  applyImportedConfigAtom,
} from 'app/store/playground';
import { useEffect, useState, useRef, useCallback, memo, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import type { GroupedShapeKey, ShapeKeyEntry } from 'app/store/playground';
import {
  AppShell,
  Box,
  Button,
  Divider,
  Group,
  Paper,
  Radio,
  ScrollArea,
  Slider,
  Stack,
  Text,
  Title,
  Accordion,
  Drawer,
  ActionIcon,
  Burger,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconMenu2,
  IconSettings,
  IconEdit,
  IconCheck,
  IconX,
  IconDeviceFloppy,
  IconCloudUpload,
} from '@tabler/icons-react';
import { showNotification } from '@mantine/notifications';
import { PlaygroundConfigSchema, type PlaygroundConfig } from 'app/sections/playground/schema';
import { usePlaygroundConfig } from 'app/hooks/use-playground-config';
import { usePlayground, useUpdatePlayground } from 'app/hooks/use-playgrounds';
import { usePlaygroundContext } from 'app/providers/playground-provider';
import { useAutosave } from 'app/providers/autosave';
import { Loader } from '@mantine/core';

// Mantine-based slider for a single 0..1 shape key group
const SingleSlider = memo(({ label, keyName }: { label: string; keyName: string }) => {
  const setSingle = useSetAtom(setSingleShapeKeyValueAtom);
  const shapeKeys = useAtomValue(shapeKeysAtom);
  const [value, setValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const prevValueRef = useRef(0);
  const { setShouldSave } = useAutosave();

  // Get the current value from the model
  useEffect(() => {
    if (isDragging) return; // Skip updates while user is dragging

    if (shapeKeys[keyName] && shapeKeys[keyName][0]) {
      const entry = shapeKeys[keyName][0];
      if (entry.mesh.morphTargetInfluences) {
        const currentValue = entry.mesh.morphTargetInfluences[entry.index];
        if (Math.abs(currentValue - prevValueRef.current) > 0.001) {
          setValue(currentValue);
          prevValueRef.current = currentValue;
        }
      }
    }
  }, [shapeKeys, keyName, isDragging]);

  // Memoize the onChange handler to prevent recreating on each render
  const handleChange = useCallback(
    (v: number) => {
      setValue(v);
      prevValueRef.current = v;
      setSingle({ key: keyName, value: v });
    },
    [keyName, setSingle]
  );

  // Handle slider interaction events
  const handleChangeEnd = useCallback(() => {
    setIsDragging(false);
    setShouldSave(true); // Trigger save when user finishes dragging
  }, [setShouldSave]);

  // Use onMouseDown/onTouchStart to detect when dragging starts
  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  return (
    <Stack
      gap={6}
      style={{ borderRadius: 8, padding: 8, border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <Group justify="space-between" gap="xs">
        <Text size="xs" c="dimmed" tt="capitalize">
          {label}
        </Text>
        <Text size="xs" c={isDragging ? 'blue' : 'dimmed'} fw={isDragging ? 500 : 400}>
          {value.toFixed(2)}
        </Text>
      </Group>
      <Box onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
        <Slider
          step={0.01}
          min={0}
          max={1}
          value={value}
          onChange={handleChange}
          onChangeEnd={handleChangeEnd}
          thumbSize={16}
        />
      </Box>
    </Stack>
  );
});
SingleSlider.displayName = 'SingleSlider';

// Mantine-based slider for a combined -1..1 Up/Down group
const CombinedSlider = memo(
  ({ label, upKey, downKey }: { label: string; upKey: string; downKey: string }) => {
    const setCombined = useSetAtom(setCombinedShapeKeyValueAtom);
    const shapeKeys = useAtomValue(shapeKeysAtom);
    const [value, setValue] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const prevValueRef = useRef(0);
    const { setShouldSave } = useAutosave();

    // Get the current value from the model
    useEffect(() => {
      if (isDragging) return; // Skip updates while user is dragging

      // Check up key first
      if (shapeKeys[upKey] && shapeKeys[upKey][0]) {
        const entry = shapeKeys[upKey][0];
        if (entry.mesh.morphTargetInfluences) {
          const upValue = entry.mesh.morphTargetInfluences[entry.index];
          if (upValue > 0) {
            if (Math.abs(upValue - prevValueRef.current) > 0.001) {
              setValue(upValue);
              prevValueRef.current = upValue;
            }
            return;
          }
        }
      }

      // Check down key if up is not set
      if (shapeKeys[downKey] && shapeKeys[downKey][0]) {
        const entry = shapeKeys[downKey][0];
        if (entry.mesh.morphTargetInfluences) {
          const downValue = entry.mesh.morphTargetInfluences[entry.index];
          if (downValue > 0) {
            const negValue = -downValue; // Negative for down
            if (Math.abs(negValue - prevValueRef.current) > 0.001) {
              setValue(negValue);
              prevValueRef.current = negValue;
            }
            return;
          }
        }
      }

      // Default to 0 if neither is set
      if (Math.abs(prevValueRef.current) > 0.001) {
        setValue(0);
        prevValueRef.current = 0;
      }
    }, [shapeKeys, upKey, downKey, isDragging]);

    // Memoize the onChange handler to prevent recreating on each render
    const handleChange = useCallback(
      (v: number) => {
        setValue(v);
        prevValueRef.current = v;
        setCombined({ upKey, downKey, value: v });
      },
      [upKey, downKey, setCombined]
    );

    // Handle slider interaction events
    const handleChangeEnd = useCallback(() => {
      setIsDragging(false);
      setShouldSave(true); // Trigger save when user finishes dragging
    }, [setShouldSave]);

    // Use onMouseDown/onTouchStart to detect when dragging starts
    const handleMouseDown = useCallback(() => {
      setIsDragging(true);
    }, []);

    return (
      <Stack
        gap={6}
        style={{ borderRadius: 8, padding: 8, border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <Group justify="space-between" gap="xs">
          <Text size="xs" c="dimmed" tt="capitalize">
            {label}
          </Text>
          <Group gap={8} align="center">
            <Text size="xs" c={value < 0 ? 'blue' : 'dimmed'} fw={value < 0 ? 500 : 400}>
              Down
            </Text>
            <Text size="xs" c={isDragging ? 'blue' : 'dimmed'} fw={isDragging ? 500 : 400}>
              {value.toFixed(2)}
            </Text>
            <Text size="xs" c={value > 0 ? 'blue' : 'dimmed'} fw={value > 0 ? 500 : 400}>
              Up
            </Text>
          </Group>
        </Group>
        <Box onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
          <Slider
            step={0.01}
            min={-1}
            max={1}
            value={value}
            onChange={handleChange}
            onChangeEnd={handleChangeEnd}
            thumbSize={16}
            marks={[
              { value: -1, label: 'Down' },
              { value: 0, label: '0' },
              { value: 1, label: 'Up' },
            ]}
          />
        </Box>
      </Stack>
    );
  }
);
CombinedSlider.displayName = 'CombinedSlider';

// Clothing selection using Mantine Radio groups in the left navbar
const ClothingSelector = memo(() => {
  const [top, setTop] = useAtom(selectedTopAtom);
  const [bottom, setBottom] = useAtom(selectedBottomAtom);
  const modelVisibility = useAtomValue(modelVisibilityAtom);
  const setModelVisible = useSetAtom(setModelVisibleAtom);

  // Sync radio button state with model visibility
  useEffect(() => {
    // Check which top is visible
    if (modelVisibility.bodice) {
      setTop('bodice');
    } else if (modelVisibility.shirt) {
      setTop('shirt');
    } else {
      setTop('none');
    }

    // Check which bottom is visible
    if (modelVisibility.skirt) {
      setBottom('skirt');
    } else {
      setBottom('none');
    }
  }, [modelVisibility, setTop, setBottom]);

  // Update visibility immediately on user action to avoid any perceived delay
  const onChangeTop = useCallback(
    (v: 'none' | 'bodice' | 'shirt') => {
      setTop(v);
      setModelVisible({ name: 'bodice', visible: v === 'bodice' });
      setModelVisible({ name: 'shirt', visible: v === 'shirt' });
    },
    [setTop, setModelVisible]
  );

  const onChangeTopStr = useCallback(
    (value: string) => onChangeTop(value as 'none' | 'bodice' | 'shirt'),
    [onChangeTop]
  );

  const onChangeBottom = useCallback(
    (v: 'none' | 'skirt') => {
      setBottom(v);
      setModelVisible({ name: 'skirt', visible: v === 'skirt' });
    },
    [setBottom, setModelVisible]
  );

  const onChangeBottomStr = useCallback(
    (value: string) => onChangeBottom(value as 'none' | 'skirt'),
    [onChangeBottom]
  );

  return (
    <ScrollArea style={{ height: '100%' }}>
      <Stack gap="md" p="md">
        <Paper withBorder p="sm" radius="md">
          <Title order={6}>Tops</Title>
          <Radio.Group value={top} onChange={onChangeTopStr} mt="xs">
            <Stack gap={6}>
              <Radio value="none" label="None" />
              <Radio value="bodice" label="Bodice" />
              <Radio value="shirt" label="Shirt" />
            </Stack>
          </Radio.Group>
        </Paper>
        <Paper withBorder p="sm" radius="md">
          <Title order={6}>Bottoms</Title>
          <Radio.Group value={bottom} onChange={onChangeBottomStr} mt="xs">
            <Stack gap={6}>
              <Radio value="none" label="None" />
              <Radio value="skirt" label="Skirt" />
            </Stack>
          </Radio.Group>
        </Paper>
      </Stack>
    </ScrollArea>
  );
});
ClothingSelector.displayName = 'ClothingSelector';

// Shape key panels rendered inside the right aside
// Separate component for rendering a group of sliders
const SliderGroup = memo(({ list }: { list: GroupedShapeKey[] }) => {
  return (
    <Stack gap={8} mt="sm">
      {list.length === 0 && (
        <Text size="xs" c="dimmed" fs="italic">
          No shape keys found.
        </Text>
      )}
      {list.map((g) =>
        g.kind === 'single' ? (
          <SingleSlider key={`s-${g.key}`} label={g.label} keyName={g.key} />
        ) : (
          <CombinedSlider key={`c-${g.base}`} label={g.label} upKey={g.upKey} downKey={g.downKey} />
        )
      )}
    </Stack>
  );
});
SliderGroup.displayName = 'SliderGroup';

// Component for shape key panels
const ShapeKeyPanels = memo(() => {
  const groups = useAtomValue(groupedShapeKeysAtom);
  const categorize = useAtomValue(categorizeShapeKeyAtom);

  // Memoize the filtered groups to prevent recalculation on every render
  const { general, advanced, detailed } = useMemo(() => {
    const general = groups.filter(
      (g) => categorize(g.kind === 'combined' ? g.upKey : g.key) === 'general'
    );
    const advanced = groups.filter(
      (g) => categorize(g.kind === 'combined' ? g.upKey : g.key) === 'advanced'
    );
    const detailed = groups.filter((g) => !general.includes(g) && !advanced.includes(g));

    return { general, advanced, detailed };
  }, [groups, categorize]);

  return (
    <Accordion multiple defaultValue={['general', 'detailed']} variant="separated" radius="md">
      <Accordion.Item value="general">
        <Accordion.Control>
          <Title order={6}>General Body</Title>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            <SliderGroup list={general} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="detailed">
        <Accordion.Control>
          <Title order={6}>Detailed</Title>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            <SliderGroup list={detailed} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="advanced">
        <Accordion.Control>
          <Title order={6}>Advanced</Title>
        </Accordion.Control>
        <Accordion.Panel>
          <Stack gap="md">
            <SliderGroup list={advanced} />
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
});
ShapeKeyPanels.displayName = 'ShapeKeyPanels';

// Zoom slider using Mantine Slider
const ZoomControl = memo(() => {
  const [zoom, setZoom] = useAtom(zoomValueAtom);

  // Memoize the formatted zoom value
  const formattedZoom = useMemo(() => zoom.toFixed(1) + 'x', [zoom]);

  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between" mb="xs">
        <Title order={6}>Zoom</Title>
        <Text size="xs" c="dimmed">
          {formattedZoom}
        </Text>
      </Group>
      <Slider min={0.5} max={6} step={0.1} value={zoom} onChange={setZoom} />
    </Paper>
  );
});
ZoomControl.displayName = 'ZoomControl';

const PerfToggle = memo(() => {
  const [showPerf, setShowPerf] = useAtom(showPerfAtom);

  // Memoize the toggle handler
  const handleToggle = useCallback(() => setShowPerf((prev) => !prev), [setShowPerf]);

  // Memoize the button text
  const buttonText = useMemo(() => (showPerf ? 'Hide Stats' : 'Show Stats'), [showPerf]);

  return (
    <Paper withBorder p="sm" radius="md">
      <Group justify="space-between">
        <Title order={6}>Performance</Title>
        <Button size="xs" variant={showPerf ? 'filled' : 'light'} onClick={handleToggle}>
          {buttonText}
        </Button>
      </Group>
      <Text size="xs" c="dimmed" mt={6}>
        Adaptive DPR + Preload are enabled.
      </Text>
    </Paper>
  );
});
PerfToggle.displayName = 'PerfToggle';

const ExportImportControls = memo(() => {
  const { exportConfig, importConfigFile } = usePlaygroundConfig();
  const { isSaving, lastSaved, saveManually } = useAutosave();

  // Memoize handlers
  const handleExport = useCallback(() => exportConfig(), [exportConfig]);

  const handleImport = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      importConfigFile(e.target.files ? e.target.files[0] : null);
    },
    [importConfigFile]
  );

  const handleManualSave = useCallback(() => {
    saveManually();
  }, [saveManually]);

  // Format the last saved time
  const lastSavedTime = useMemo(() => {
    if (!lastSaved) return '';
    return lastSaved.toLocaleTimeString();
  }, [lastSaved]);

  return (
    <Group>
      <Button size="xs" onClick={handleExport}>
        Export
      </Button>
      <input
        id="import-config"
        style={{ display: 'none' }}
        type="file"
        accept="application/json"
        onChange={handleImport}
      />
      <label htmlFor="import-config">
        <Button size="xs" variant="light" component="span">
          Import
        </Button>
      </label>

      {/* Manual save button with status indicator */}
      <Button
        size="xs"
        variant="light"
        color={lastSaved ? 'green' : 'blue'}
        onClick={handleManualSave}
        disabled={isSaving}
        leftSection={isSaving ? <Loader size="xs" color="blue" /> : <IconDeviceFloppy size={16} />}
        rightSection={
          lastSaved && (
            <Tooltip label={`Last saved: ${lastSavedTime}`} position="top">
              <Box component="span" style={{ cursor: 'help' }}>
                <IconCheck size={14} color="green" />
              </Box>
            </Tooltip>
          )
        }
      >
        {isSaving ? 'Saving...' : 'Save'}
      </Button>
    </Group>
  );
});
ExportImportControls.displayName = 'ExportImportControls';

const LoadingOverlay = memo(() => {
  const isLoading = useAtomValue(isLoadingAtom);
  const text = useAtomValue(loadingTextAtom);
  if (!isLoading) return null;
  return (
    <Box
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.4)',
        zIndex: 50,
      }}
    >
      <Paper withBorder p="md" radius="md">
        <Stack gap={8} align="center">
          <Loader size="sm" />
          <Text size="xs" c="dimmed">
            {text}
          </Text>
        </Stack>
      </Paper>
    </Box>
  );
});
LoadingOverlay.displayName = 'LoadingOverlay';

export const MainContent = memo(() => {
  return (
    <>
      <LoadingOverlay />
      <SceneCanvas>
        <Lights />
        <OrbitControlsRig />
        {MODELS_TO_LOAD.map((m) => (
          <GLTFModel
            key={m.name}
            name={m.name}
            url={m.url}
            defaultVisible={m.defaultVisible}
            scale={m.scale}
          />
        ))}
      </SceneCanvas>
    </>
  );
});
MainContent.displayName = 'MainContent';

export default function PlaygroundView() {
  const [openClothing, setOpenClothing] = useState(false);
  const [openControls, setOpenControls] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const isMobile = useMediaQuery('(max-width: 768px)');
  const setText = useSetAtom(setLoadingTextAtom);
  const setVisible = useSetAtom(setModelVisibleAtom);
  const [isLoading, setIsLoading] = useAtom(isLoadingAtom);
  const resetAll = useSetAtom(resetAllShapeKeysAtom);
  const router = useRouter();
  const { id: slug } = usePlaygroundContext();
  const { data: playground } = usePlayground(slug as string);
  const { mutateAsync: updatePlayground } = useUpdatePlayground();
  const applyImportedConfig = useSetAtom(applyImportedConfigAtom);
  const shapeKeys = useAtomValue(shapeKeysAtom);

  // Track if config has been applied
  const configAppliedRef = useRef(false);

  // Access autosave context
  const { isSaving, lastSaved } = useAutosave();

  // Apply config when playground data is loaded
  useEffect(() => {
    if (playground && !configAppliedRef.current && Object.keys(shapeKeys).length > 0) {
      try {
        console.debug('Applying saved config from database:', playground.config);

        // Validate config before applying
        const parsed = PlaygroundConfigSchema.safeParse(playground.config);
        if (parsed.success) {
          applyImportedConfig({ config: parsed.data });
          configAppliedRef.current = true;
          console.debug('Config applied successfully');
        } else {
          console.error('Invalid config format:', parsed.error);
        }
      } catch (error) {
        console.error('Failed to apply config:', error);
      }
    }
  }, [playground, applyImportedConfig, shapeKeys]);

  useEffect(() => {
    if (playground) {
      setSessionName(playground.name || 'Untitled Playground');
    }
  }, [playground]);

  const handleUpdateName = useCallback(async () => {
    if (!playground || !slug) return;

    try {
      await updatePlayground({
        slug: slug as string,
        payload: {
          name: sessionName,
        },
      });
      setIsEditingName(false);
    } catch (error) {
      console.error('Failed to update playground name:', error);
    }
  }, [playground, slug, sessionName, updatePlayground, setIsEditingName]);

  // Set loading text when component mounts
  useEffect(() => {
    setText('Loading models...');
  }, [setText]);

  // Initialize models and handle loading state
  useEffect(() => {
    // Set initial visibility for all models
    MODELS_TO_LOAD.forEach((m) => setVisible({ name: m.name, visible: !!m.defaultVisible }));

    // Set loading to false after a short delay to ensure models are rendered
    const t = setTimeout(() => setIsLoading(false), 400);
    return () => clearTimeout(t);
  }, [setIsLoading, setVisible]);

  return (
    <AppShell padding={0} withBorder={false} style={{ height: '100svh', overflow: 'hidden' }}>
      <AppShell.Main>
        <Box
          style={{ position: 'relative', height: '100svh', width: '100%', overflow: 'hidden' }}
          className="canvas-background"
        >
          {/* Main content */}
          <MainContent />

          {/* Left overlay: Clothing selector (hidden on mobile, available via Drawer) */}
          {!isMobile && (
            <Box
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                width: 280,
                height: 'calc(100% - 32px)',
                zIndex: 100,
                pointerEvents: 'auto',
              }}
            >
              {/* Clothing selector */}
              <Paper withBorder radius="md" p={0} shadow="lg" style={{ height: '100%' }}>
                <Box p="md">
                  <Title order={5}>Clothing</Title>
                </Box>
                <Divider />
                <ClothingSelector />
              </Paper>
            </Box>
          )}

          {/* Right overlay: Controls (hidden on mobile, available via Drawer) */}
          {!isMobile && (
            <Box
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                width: 360,
                height: 'calc(100% - 32px)',
                zIndex: 100,
                pointerEvents: 'auto',
              }}
            >
              {/* Right overlay: Controls */}
              <Paper withBorder radius="md" p={0} shadow="lg" style={{ height: '100%' }}>
                <Stack gap="md" p="md" h="100%">
                  <Group justify="space-between" style={{ height: 'auto' }}>
                    {isEditingName ? (
                      <Group>
                        <TextInput
                          value={sessionName}
                          onChange={(e) => setSessionName(e.target.value)}
                          size="sm"
                          style={{ width: '200px' }}
                          rightSection={
                            <Group gap={4}>
                              <ActionIcon size="xs" color="green" onClick={handleUpdateName}>
                                <IconCheck size={14} />
                              </ActionIcon>
                              <ActionIcon
                                size="xs"
                                color="red"
                                onClick={() => setIsEditingName(false)}
                              >
                                <IconX size={14} />
                              </ActionIcon>
                            </Group>
                          }
                        />
                      </Group>
                    ) : (
                      <Group>
                        <Title order={5}>{sessionName}</Title>
                        <Tooltip label="Edit name">
                          <ActionIcon
                            size="sm"
                            variant="subtle"
                            onClick={() => setIsEditingName(true)}
                          >
                            <IconEdit size={14} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    )}
                    <Group>
                      <Button color="red" variant="light" size="xs" onClick={() => resetAll()}>
                        Reset
                      </Button>
                    </Group>
                    <ExportImportControls />
                  </Group>
                  <ZoomControl />
                  <PerfToggle />
                  <ScrollArea variant="light" style={{ height: '100%', flex: 1, borderRadius: 8 }}>
                    <Stack gap="md" pb="sm">
                      <ShapeKeyPanels />
                    </Stack>
                  </ScrollArea>
                </Stack>
              </Paper>
            </Box>
          )}

          {/* Mobile toggles */}
          {isMobile && (
            <>
              <ActionIcon
                size="lg"
                variant="filled"
                color="gray"
                style={{ position: 'absolute', top: 12, left: 12, zIndex: 200 }}
                onClick={() => setOpenClothing(true)}
              >
                <IconMenu2 />
              </ActionIcon>
              <ActionIcon
                size="lg"
                variant="filled"
                color="gray"
                style={{ position: 'absolute', top: 12, right: 12, zIndex: 200 }}
                onClick={() => setOpenControls(true)}
              >
                <IconSettings />
              </ActionIcon>

              <Drawer
                opened={openClothing}
                onClose={() => setOpenClothing(false)}
                title="Clothing"
                size="80%"
                position="left"
                classNames={{
                  body: '!p-0 relative',
                  // content: 'h-full flex flex-col overflow-hidden',
                }}
              >
                <Divider />
                <ClothingSelector />
              </Drawer>

              <Drawer
                position="right"
                shadow="lg"
                opened={openControls}
                onClose={() => setOpenControls(false)}
                title="Avatar Settings"
                size="80%"
                classNames={{
                  body: '!p-0 relative',
                  // content: 'h-full flex flex-col overflow-hidden',
                }}
              >
                {/* <Paper p={"sm"} shadow="lg" style={{ height: '100%' }}> */}
                <Stack gap="md" pl="sm" h="100%" style={{ height: '100%' }}>
                  <Group
                    style={{
                      justifyContent: 'space-between',
                      position: 'sticky',
                      top: 0,
                      zIndex: 100,
                    }}
                  >
                    <Group>
                      <Button color="red" size="xs" onClick={() => resetAll()}>
                        Reset
                      </Button>
                      <ExportImportControls />
                    </Group>
                  </Group>
                  <ZoomControl />
                  <PerfToggle />
                  {/* <ScrollArea style={{ height: '60vh', marginTop: 12 }}> */}
                  <ShapeKeyPanels />
                  {/* </ScrollArea> */}
                </Stack>
                {/* </Paper> */}
              </Drawer>
            </>
          )}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
