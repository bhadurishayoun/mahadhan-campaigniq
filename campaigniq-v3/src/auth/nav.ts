/** Personas as shown on the sign-in page (same ids and labels as the v2 app, so sessions carry over). */
export type PersonaId = 'strategy' | 'pm' | 'tm' | 'mh';

export const PERSONAS: { id: PersonaId; label: string; initials: string; available: boolean; built: boolean }[] = [
  { id: 'strategy', label: 'Business Head', initials: 'BH', available: true, built: true },
  { id: 'pm', label: 'Zonal Manager', initials: 'ZM', available: true, built: false },
  { id: 'tm', label: 'Field Sales Manager', initials: 'FSM', available: true, built: false },
  { id: 'mh', label: 'Marketing Head', initials: 'MH', available: true, built: false },
];

export const isBuilt = (p: PersonaId) => PERSONAS.find((x) => x.id === p)?.built ?? false;
