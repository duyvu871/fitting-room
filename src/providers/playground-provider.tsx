'use client';

import { PropsWithChildren, createContext, useContext, useEffect, useMemo } from 'react';
import { playgroundIdAtom } from 'app/store/playground';
import { useSetAtom } from 'jotai';

export interface PlaygroundContextType {
  id: string;
}

export const PlaygroundContext = createContext<PlaygroundContextType | undefined>(undefined);

export default function PlaygroundProvider({ children, id }: PropsWithChildren<{ id: string }>) {
  const setJotaiPlaygroundId = useSetAtom(playgroundIdAtom);

  useEffect(() => {
    setJotaiPlaygroundId(id);
  }, [id, setJotaiPlaygroundId]);

  const value = useMemo(() => ({ id }), [id]);
  return <PlaygroundContext.Provider value={value}>{children}</PlaygroundContext.Provider>;
}

export function usePlaygroundContext() {
  const context = useContext(PlaygroundContext);
  if (context === undefined) {
    throw new Error('usePlaygroundContext must be used within a PlaygroundProvider');
  }
  return context;
}
