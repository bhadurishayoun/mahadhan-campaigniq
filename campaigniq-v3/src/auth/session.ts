import type { PersonaId } from './nav';

export interface Session {
  name: string;
  persona: PersonaId;
  userId: string;
  /** Signed in with the master credentials: every persona is open without signing in again. */
  master?: boolean;
}
