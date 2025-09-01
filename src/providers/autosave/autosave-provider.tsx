'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from 'react';
import { useAtomValue } from 'jotai';
import { modelVisibilityAtom, shapeKeysAtom, isLoadingAtom } from 'app/store/playground';
import { useUpdatePlayground } from 'app/hooks/use-playgrounds';
import { usePlaygroundContext } from 'app/providers/playground-provider';
import { getCurrentConfig } from 'app/hooks/use-playground-config';
import type { ShapeKeyEntry } from 'app/store/playground';

interface AutosaveContextType {
  isSaving: boolean;
  lastSaved: Date | null;
  saveManually: () => Promise<void>;
  shouldSave: boolean;
  setShouldSave: (value: boolean) => void;
}

const AutosaveContext = createContext<AutosaveContextType | null>(null);

export function useAutosave() {
  const context = useContext(AutosaveContext);
  if (!context) {
    throw new Error('useAutosave must be used within an AutosaveProvider');
  }
  return context;
}

interface AutosaveProviderProps {
  children: ReactNode;
  debounceMs?: number;
  enabled?: boolean;
}

export function AutosaveProvider({
  children,
  debounceMs = 2000,
  enabled = true,
}: AutosaveProviderProps) {
  const modelVisMap = useAtomValue(modelVisibilityAtom);
  const skMap = useAtomValue(shapeKeysAtom);
  const isLoading = useAtomValue(isLoadingAtom);
  const { id: slug } = usePlaygroundContext();
  const { mutate: updatePlayground } = useUpdatePlayground();
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [shouldSave, setShouldSave] = useState(false);

  // Use refs to track initialization and previous values
  const initializedRef = useRef(false);
  const prevValuesRef = useRef({
    modelVisMap: '',
    shapeKeys: '',
  });

  // Memoize the serialized model visibility map
  const serializedModelVisMap = useMemo(() => JSON.stringify(modelVisMap), [modelVisMap]);

  // Memoize the serialized shape keys with their current values
  const serializedShapeKeys = useMemo(
    () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(skMap).map(([k, v]) => {
            const entries = v as ShapeKeyEntry[];
            const val = entries[0]?.mesh.morphTargetInfluences?.[entries[0].index] ?? 0;
            return [k, val];
          })
        )
      ),
    [skMap]
  );

  // Initialize on first load with valid data
  useEffect(() => {
    if (!initializedRef.current && Object.keys(skMap).length > 0) {
      console.debug('Initializing autosave with current state');
      initializedRef.current = true;
      prevValuesRef.current = {
        modelVisMap: serializedModelVisMap,
        shapeKeys: serializedShapeKeys,
      };
    }
  }, [skMap, serializedModelVisMap, serializedShapeKeys]);

  // Check if values have changed and set shouldSave flag
  useEffect(() => {
    // Skip if not initialized, still loading, or disabled
    if (!initializedRef.current || isLoading || !enabled) {
      return;
    }

    const { modelVisMap: prevModelVisMap, shapeKeys: prevShapeKeys } = prevValuesRef.current;

    // Check if values have changed
    if (prevModelVisMap !== serializedModelVisMap || prevShapeKeys !== serializedShapeKeys) {
      console.debug('Changes detected, will trigger save');

      // Update stored previous values
      prevValuesRef.current = {
        modelVisMap: serializedModelVisMap,
        shapeKeys: serializedShapeKeys,
      };

      // Use a small delay before setting shouldSave to true to avoid triggering
      // saves too frequently during rapid changes (like dragging a slider)
      const timer = setTimeout(() => {
        setShouldSave(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [serializedModelVisMap, serializedShapeKeys, isLoading, enabled]);

  // Function to save config (can be called manually or automatically)
  const saveConfig = useCallback(async () => {
    if (!slug || isLoading || !enabled) {
      console.debug('Save skipped: ', !slug ? 'No slug' : !enabled ? 'Disabled' : 'Still loading');
      return;
    }

    try {
      setIsSaving(true);
      const config = getCurrentConfig(modelVisMap, skMap);
      console.debug('Saving playground config:', config);

      return new Promise<void>((resolve, reject) => {
        updatePlayground(
          {
            slug: slug as string,
            payload: { config },
          },
          {
            onSuccess: () => {
              console.debug('Save successful');
              setLastSaved(new Date());
              setIsSaving(false);
              setShouldSave(false); // Reset the save flag
              resolve();
            },
            onError: (error) => {
              console.error('Failed to save playground config:', error);
              setIsSaving(false);
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      console.error('Failed to save playground config:', error);
      setIsSaving(false);
      throw error;
    }
  }, [modelVisMap, skMap, slug, updatePlayground, isLoading, enabled]);

  // Manual save function exposed through context
  const saveManually = useCallback(async () => {
    return saveConfig();
  }, [saveConfig]);

  // Debounced effect to save when shouldSave is true
  useEffect(() => {
    if (!shouldSave || isSaving) return;

    const timer = setTimeout(() => {
      saveConfig();
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [shouldSave, debounceMs, saveConfig, isSaving]);

  const value = useMemo(
    () => ({
      isSaving,
      lastSaved,
      saveManually,
      shouldSave,
      setShouldSave,
    }),
    [isSaving, lastSaved, saveManually, shouldSave]
  );

  return <AutosaveContext.Provider value={value}>{children}</AutosaveContext.Provider>;
}
