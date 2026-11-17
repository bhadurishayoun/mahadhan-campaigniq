import type { PersonaId } from './nav';

export interface Session {
  name: string;
  persona: PersonaId;
  userId: string;
}

const KEY = 'campaigniq.session.v2';

export function loadSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Session;
    if (!parsed || typeof parsed.name !== 'string' || typeof parsed.persona !== 'string' || typeof parsed.userId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: Session | null) {
  try {
    if (!session) window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}
