import type { PersonaId } from './nav';

export interface PersonaCredential {
  persona: PersonaId;
  designation: string;
  userId: string;
  password: string;
  note: string;
}

export const PERSONA_CREDENTIALS: PersonaCredential[] = [
  {
    persona: 'strategy',
    designation: 'Strategy Head',
    userId: 'SH001',
    password: 'Strategy@123',
    note: 'Command centre and module workspace owner',
  },
  {
    persona: 'pm',
    designation: 'Zonal Manager',
    userId: 'PM001',
    password: 'Product@123',
    note: 'Campaign recommendations and proposal owner',
  },
  {
    persona: 'tm',
    designation: 'Field Sales Manager',
    userId: 'TM001',
    password: 'Territory@123',
    note: 'Territory planning and execution owner',
  },
  {
    persona: 'mh',
    designation: 'Marketing Head',
    userId: 'MH001',
    password: 'Marketing@123',
    note: 'Regional approvals and rollout governance owner',
  },
];

/**
 * Master (showcase) login: one ID and password that opens every persona. It works with any persona selected on
 * the sign-in page, and after sign-in the avatar menu switches personas without signing out, so the full user
 * journey (Business Head -> Marketing Head -> Zonal Manager -> Field Sales Manager) can be shown in one session.
 * Demo-grade only: credentials live in the front end, like the persona credentials above.
 */
export const MASTER_CREDENTIAL = {
  userId: 'MASTER001',
  password: 'Mahadhan@2026',
  note: 'Showcase access to all personas',
};

export function credentialForPersona(persona: PersonaId): PersonaCredential | undefined {
  return PERSONA_CREDENTIALS.find((item) => item.persona === persona);
}

export function isMasterCredentials(userId: string, password: string): boolean {
  return MASTER_CREDENTIAL.userId.toLowerCase() === userId.trim().toLowerCase() && MASTER_CREDENTIAL.password === password;
}

/** Valid if the master credentials are used, or the selected persona's own credentials. */
export function validatePersonaCredentials(persona: PersonaId, userId: string, password: string): boolean {
  if (isMasterCredentials(userId, password)) return true;
  const match = credentialForPersona(persona);
  if (!match) return false;
  return match.userId.toLowerCase() === userId.trim().toLowerCase() && match.password === password;
}
