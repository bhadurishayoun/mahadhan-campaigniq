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
    designation: 'Product Manager',
    userId: 'PM001',
    password: 'Product@123',
    note: 'Campaign recommendations and proposal owner',
  },
  {
    persona: 'tm',
    designation: 'Territory Manager',
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

export function credentialForPersona(persona: PersonaId): PersonaCredential | undefined {
  return PERSONA_CREDENTIALS.find((item) => item.persona === persona);
}

export function validatePersonaCredentials(persona: PersonaId, userId: string, password: string): boolean {
  const match = credentialForPersona(persona);
  if (!match) return false;
  return match.userId.toLowerCase() === userId.trim().toLowerCase() && match.password === password;
}
