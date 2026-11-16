import { useMemo, useState } from 'react';
import { AlertCircle, ChevronDown, KeyRound, ShieldCheck, Sprout, UserRound } from 'lucide-react';
import type { PersonaId } from './nav';
import { PERSONAS } from './nav';
import { credentialForPersona, validatePersonaCredentials } from './personaAuth';

interface LoginPayload {
  name: string;
  persona: PersonaId;
  userId: string;
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
    onLogin({ name: name.trim(), persona, userId: userId.trim().toUpperCase() });
  }

  return (
    <div className="login">
      <div className="login-shell">
        <section className="login-hero">
          <div className="login-brand">
            <Sprout size={30} className="login-leaf" />
            <div>
              <div className="login-title">Mahadhan CampaignIQ</div>
              <div className="login-sub">Strategic campaign command center</div>
            </div>
          </div>
          <h2>Build. Approve. Execute. Learn.</h2>
          <p>Unified planning and execution workspaces for Product Manager, Territory Manager, and Marketing Head.</p>
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

          <label className="login-field">
            <span>Designation / Persona</span>
            <div className="select-wrap login-select">
              <select
                value={persona}
                onChange={(e) => {
                  setPersona(e.target.value as PersonaId);
                  setError('');
                }}
              >
                {choices.map((p) => (
                  <option key={p.id} value={p.id}>{p.label}</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
            <small>Selected designation: {designation}</small>
          </label>

          <label className="login-field">
            <span>Persona ID</span>
            <div className="login-input-wrap">
              <KeyRound size={16} />
              <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder={selected?.userId ?? 'e.g. TM001'} />
            </div>
          </label>

          <label className="login-field">
            <span>Password</span>
            <div className="login-input-wrap">
              <KeyRound size={16} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSubmit();
                }}
              />
            </div>
          </label>

          <label className="login-show-pwd">
            <input type="checkbox" checked={showPassword} onChange={(e) => setShowPassword(e.target.checked)} />
            <span>Show password</span>
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
