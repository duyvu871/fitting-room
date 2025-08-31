'use client';

import { useAtomValue, useSetAtom } from 'jotai';
import { showNotification } from '@mantine/notifications';
import { modelVisibilityAtom, shapeKeysAtom, applyImportedConfigAtom } from 'app/store/playground';
import { PlaygroundConfigSchema, type PlaygroundConfig } from 'app/sections/playground/schema';
import type { ShapeKeyEntry } from 'app/store/playground';

export function usePlaygroundConfig() {
  const modelVisMap = useAtomValue(modelVisibilityAtom);
  const skMap = useAtomValue(shapeKeysAtom);
  const apply = useSetAtom(applyImportedConfigAtom);

  function exportConfig(): void {
    const exportData: PlaygroundConfig = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      modelInfo: Object.entries(modelVisMap).map(([name, visible]) => ({ name, visible })),
      shapeKeys: Object.fromEntries(
        Object.entries(skMap).map(([k, v]) => {
          const entries = v as ShapeKeyEntry[];
          const val = entries[0]?.mesh.morphTargetInfluences?.[entries[0].index] ?? 0;
          return [k, val];
        })
      ),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `avatar-shapekeys-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    showNotification({
      title: 'Exported',
      message: 'Config exported successfully',
      color: 'green',
    });
  }

  async function importConfigFile(file: File | null): Promise<void> {
    if (!file) return;
    const text = await file.text();
    try {
      const json = JSON.parse(text);
      const parsed = PlaygroundConfigSchema.safeParse(json);
      if (!parsed.success) {
        const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
        showNotification({ title: 'Import failed', message: details.join('\n'), color: 'red' });
        return;
      }
      apply({ config: parsed.data });
      showNotification({ title: 'Imported', message: 'Config applied', color: 'green' });
    } catch (err: unknown) {
      showNotification({
        title: 'Import failed',
        message: String((err as Error)?.message ?? err),
        color: 'red',
      });
    }
  }

  return { exportConfig, importConfigFile };
}
