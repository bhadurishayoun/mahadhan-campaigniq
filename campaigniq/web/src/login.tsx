import { useMemo, useState } from 'react';
import { AlertCircle, BadgeCheck, Briefcase, Eye, EyeOff, Lock, MapPin, Megaphone, Package, ShieldCheck, Sprout, UserRound, type LucideIcon } from 'lucide-react';
import type { PersonaId } from './nav';
import { PERSONAS } from './nav';
import { credentialForPersona, isMasterCredentials, validatePersonaCredentials } from './personaAuth';

const PERSONA_ICON: Record<PersonaId, LucideIcon> = { strategy: Briefcase, mh: Megaphone, pm: Package, tm: MapPin };

interface LoginPayload {
  name: string;
  persona: PersonaId;
  userId: string;
  master: boolean;
}

export function LoginPage({ onLogin, initialPersona }: { onLogin: (payload: LoginPayload) => void; initialPersona?: PersonaId }) {
  const choices = useMemo(() => PERSONAS.filter((p) => p.available), []);
  const [name, setName] = useState('');
  const [persona, setPersona] = useState<PersonaId>(initialPersona ?? choices[0]?.id ?? 'strategy');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const selected = credentialForPersona(persona);
  const designation = PERSONAS.find((item) => item.id === persona)?.label ?? 'Persona';

  const canSubmit = name.trim().length > 1 && userId.trim().length > 0 && password.length > 0;

  function handleSubmit() {
    if (!canSubmit) {
      setError('Please fill name, persona ID and password.');
      return;
    }

    if (!validatePersonaCredentials(persona, userId, password)) {
      setError('Invalid persona ID or password. Please use the assigned credentials.');
      return;
    }

    setError('');
    onLogin({ name: name.trim(), persona, userId: userId.trim().toUpperCase(), master: isMasterCredentials(userId, password) });
  }

  return (
    <div className="login">
      <div className="login-shell">
        <section className="login-hero">
          <div className="login-brand">
            <Sprout size={30} className="login-leaf" />
            <div>
              <div className="login-title">Mahadhan CampaignIQ</div>
              <div className="login-sub">Campaign planning, approvals and tracking</div>
            </div>
          </div>
          <h2>Build. Approve. Execute. Learn.</h2>
          <p>Planning and execution workspaces for Business Head, Marketing Head, Zonal Manager and Field Sales Manager.</p>
          <div className="login-hero-points">
            <span><ShieldCheck size={14} /> Secure persona-based access</span>
            <span><ShieldCheck size={14} /> Map-rich planning intelligence</span>
            <span><ShieldCheck size={14} /> Role-specific decision dashboards</span>
          </div>
        </section>

        <section className="login-card">
          <h2>Sign In</h2>
          <p className="login-card-sub">Enter your details to access your assigned workspace.</p>

          <label className="login-field">
            <span>Full name</span>
            <div className="login-input-wrap">
              <UserRound size={16} />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sayak Patil" />
            </div>
          </label>

          <div className="login-field" role="radiogroup" aria-label="Designation / Persona">
            <span>Designation / Persona</span>
            <div className="login-personas">
              {choices.map((p) => {
                const Icon = PERSONA_ICON[p.id];
                return (
                  <button key={p.id} type="button" role="radio" aria-checked={persona === p.id} className={`login-persona ${persona === p.id ? 'active' : ''}`} onClick={() => { setPersona(p.id); setError(''); }}>
                    <Icon size={22} strokeWidth={1.75} />
                    <b>{p.label}</b>
                  </button>
                );
              })}
            </div>
            <small>Selected designation: {designation}</small>
          </div>

          <label className="login-field">
            <span>Persona ID</span>
            <div className="login-input-wrap">
              <BadgeCheck size={16} />
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={selected?.userId ?? 'e.g. TM001'} />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-input-wrap">
              <Lock size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
              />
              <button type="button" className="login-eye" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((v) => !v)}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="login-error">
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          <button type="button" className="login-cta" onClick={handleSubmit} disabled={!canSubmit}>Sign In</button>

          <div className="login-note">Secure access is controlled by persona ID and password.</div>
        </section>
      </div>
    </div>
  );
}
