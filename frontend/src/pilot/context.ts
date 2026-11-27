import { createContext, useContext, useSyncExternalStore } from 'react';
import type { PilotSession } from './session';

export const PilotSessionContext = createContext<PilotSession | null>(null);
export function usePilotSession() {
  const session = useContext(PilotSessionContext);
  if (!session) throw new Error('PilotSessionProvider requerido');
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot);
  return { session, ...snapshot };
}
