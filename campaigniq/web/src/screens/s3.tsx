import { useState, type ReactNode } from 'react';
import './s3.css';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplet,
  FileText,
  Layers,
  ListChecks,
  MapPin,
  Megaphone,
  MessageSquare,
  Play,
  Plus,
  Scale,
  Shield,
  Sparkles,
  Sprout,
  Store,
  Target,
  TrendingUp,
  Users,
  Workflow,
  Zap,
} from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { useDataset } from '../data/datasets';
import {
  AiItem,
  Breadcrumbs,
  Btn,
  COLORS,
  Check,
  ContextStrip,
  DataTable,
  FlowFooter,
  Grid,
  Kpi,
  PageHeader,
  Panel,
  Pill,
  SourceBar,
  cx,
  type Tone,
} from '../ui';

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

function PlantArt({ stage, size = 92 }: { stage: number; size?: number }) {
  if (stage === 0) {
    return (
      <svg width={size} height={size} viewBox="0 0 90 100" aria-hidden>
        <rect x="8" y="80" width="74" height="13" rx="2" fill="#6b4529" />
        <rect x="8" y="78" width="74" height="5" rx="2" fill="#8a5a36" />
        {[16, 30, 45, 60, 74].map((x) => (
          <g key={x} stroke={COLORS.mid} strokeWidth="2.2" strokeLinecap="round" fill="none">
            <path d={`M${x},79 Q${x - 1},68 ${x - 6},60`} />
            <path d={`M${x},79 Q${x + 1},66 ${x + 5},58`} />
            <path d={`M${x},79 L${x},62`} stroke={COLORS.green} />
          </g>
        ))}
      </svg>
    );
  }
  const bulbR = [0, 0, 5, 8, 11, 13][stage] ?? 0;
  const leaves = 3 + stage * 2;
  const height = 34 + stage * 9;
  const baseY = 90 - bulbR * 1.4;
  const leafColor = stage === 5 ? '#93b444' : COLORS.green;
  const paths: ReactNode[] = [];
  for (let index = 0; index < leaves; index += 1) {
    const angle = ((-38 + (76 * index) / Math.max(leaves - 1, 1)) * Math.PI) / 180;
    const length = height * (0.75 + 0.25 * Math.cos(angle * 1.6));
    const tipX = 45 + Math.sin(angle) * length;
    const tipY = baseY - Math.cos(angle) * length;
    const ctrlX = 45 + Math.sin(angle) * length * 0.35;
    const ctrlY = baseY - length * 0.6;
    paths.push(
      <path key={index} d={`M45,${baseY} Q${ctrlX.toFixed(1)},${ctrlY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)}`} stroke={index % 2 ? leafColor : COLORS.mid} strokeWidth="2.6" strokeLinecap="round" fill="none" />,
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 90 100" aria-hidden>
      <ellipse cx="45" cy="93" rx="34" ry="6" fill="#7a5232" />
      {paths}
      {bulbR > 0 && (
        <g>
          <ellipse cx="45" cy={92 - bulbR * 0.75} rx={bulbR} ry={bulbR * 0.85} fill="#b0587f" />
          <ellipse cx={45 - bulbR * 0.35} cy={92 - bulbR} rx={bulbR * 0.3} ry={bulbR * 0.45} fill="#e3b3cb" opacity=".8" />
        </g>
      )}
    </svg>
  );
}

function OnionArt({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path d="M32,24 L24,4 M32,24 L32,2 M32,24 L40,5" stroke={COLORS.green} strokeWidth="3" strokeLinecap="round" />
      <path d="M32,22 C14,28 12,50 24,58 C28,61 36,61 40,58 C52,50 50,28 32,22 Z" fill="#a8426f" />
      <path d="M32,24 C24,32 24,50 30,59" stroke="#d68cae" strokeWidth="1.6" fill="none" />
      <path d="M32,24 C40,32 40,50 34,59" stroke="#d68cae" strokeWidth="1.6" fill="none" />
      <ellipse cx="25" cy="38" rx="3" ry="6" fill="#f0c3d7" opacity=".7" />
    </svg>
  );
}

function FlowStrip({ items, source }: { items: { label: string; to?: ScreenId; current?: boolean }[]; source?: ReactNode }) {
  const { go } = useNav();
  return (
    <div className="s3-crumb-row">
      <div className="s3-flow-strip">
        {items.map((item, index) => (
          <span key={item.label} className="row" style={{ gap: 8 }}>
            {index > 0 && <ArrowRight size={13} />}
            {item.to && !item.current ? (
              <button type="button" onClick={() => go(item.to!)}>{item.label}</button>
            ) : (
              <span className={cx(item.current && 's3-flow-current')}>{item.label}</span>
            )}
          </span>
        ))}
      </div>
      {source && <Pill tone="green">{source}</Pill>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S3.1 Crop Nutrition Calendar & Growth Stage Tracker                 */
/* ------------------------------------------------------------------ */

const STAGES = [
  { name: 'Nursery / Transplanting', window: 'Jan 5 – Jan 20', bg: COLORS.pale, fg: COLORS.dark, status: 'Completed' },
  { name: 'Vegetative Growth', window: 'Jan 21 – Feb 20', bg: COLORS.green, fg: '#fff', status: 'Current stage' },
  { name: 'Bulb Initiation', window: 'Feb 21 – Mar 4', bg: '#cde8b4', fg: COLORS.dark, status: 'Next nutrition window — High urgency' },
  { name: 'Bulb Development', window: 'Mar 5 – Mar 25', bg: '#c3df79', fg: COLORS.dark, status: 'Upcoming nutrition window — Medium urgency' },
  { name: 'Bulb Enlargement', window: 'Mar 26 – Apr 12', bg: '#d4da55', fg: COLORS.dark, status: 'Upcoming' },
  { name: 'Maturity / Harvest', window: 'Apr 13 – Apr 25', bg: '#e6d13c', fg: COLORS.dark, status: 'Upcoming' },
];
const CURRENT_STAGE = 1;

const DISTRIBUTION = [
  { cluster: 'Jalna', veg: 58, bulb: 27, other: 15 },
  { cluster: 'Ambad', veg: 52, bulb: 32, other: 16 },
  { cluster: 'Dhanora', veg: 60, bulb: 25, other: 15 },
  { cluster: 'Wadi Gaon', veg: 55, bulb: 29, other: 16 },
  { cluster: 'Ambad HQ', veg: 54, bulb: 31, other: 15 },
];

export function NutritionCalendar() {
  const { toast } = useNav();
  const [stage, setStage] = useState(CURRENT_STAGE);
  const [cluster, setCluster] = useState<string | null>(null);
  const selected = STAGES[stage];
  const selectedCluster = DISTRIBUTION.find((item) => item.cluster === cluster);

  return (
    <div className="stack">
      <Breadcrumbs items={[{ label: 'S2.2 Jalna District Intelligence', to: 's2.2' }, { label: 'S3.1 Crop Nutrition Calendar & Growth Stage Tracker' }]} />
      <PageHeader
        title="S3.1 — Crop Nutrition Calendar & Growth Stage Tracker"
        subtitle="Understand current and upcoming onion crop stages and approaching nutrition windows for Ambad/Jalna."
      />

      <div className="s3-kpi-grid">
        <Kpi icon={<Sprout size={20} />} label="Current Stage Coverage (Ambad/Jalna)" value="56%" sub="in Vegetative Growth" />
        <Kpi icon={<CalendarDays size={20} />} label="Clusters Approaching Next Window" value="3 of 5" sub="(in 6–9 days)" />
        <Kpi icon={<Target size={20} />} label="Timing Confidence" value="~85%" sub="(illustrative estimate)" />
        <div className="s3-kpi-cta">
          <Btn variant="primary" to="s3.2" icon={<ArrowRight size={14} />}>Explore Stage-wise Nutrition Needs → S3.2</Btn>
        </div>
      </div>

      <Panel
        title="Onion Crop-Stage Timeline — Late Rabi 2026–27 (Ambad/Jalna)"
        icon={<Droplet size={16} />}
        info
        actions={<Pill tone="grey">All stage dates are illustrative estimates for the Late Rabi cycle</Pill>}
      >
        <div className="wide-scroll">
        <div className="s3-timeline">
          <span />
          {STAGES.map((item, index) => (
            <div key={item.name} className="s3-tl-plant" onClick={() => setStage(index)} title={item.name}>
              {index === CURRENT_STAGE && (
                <div className="s3-tl-marker">
                  <span>Current Stage<br />(Ambad/Jalna)</span>
                  <i />
                </div>
              )}
              <PlantArt stage={index} size={index === 0 ? 96 : 88} />
            </div>
          ))}
          <span className="s3-tl-label under">Crop Stage</span>
          {STAGES.map((item, index) => (
            <button
              type="button"
              key={item.name}
              className={cx('s3-tl-chev', index === 0 && 'first', index === CURRENT_STAGE && 'current', index === stage && 'selected')}
              style={{ background: item.bg, color: item.fg }}
              onClick={() => setStage(index)}
            >
              {item.name}
            </button>
          ))}
          <span className="s3-tl-sub">Illustrative<br />Stage Window</span>
          {STAGES.map((item) => (
            <span key={item.name} className="s3-tl-date">{item.window}</span>
          ))}
        </div>
        </div>
        <div className="s3-tl-detail highlight-box">
          <strong>{selected.name}</strong>
          <span className="muted">Window: {selected.window} (illustrative)</span>
          <Pill tone={stage === CURRENT_STAGE ? 'green' : stage < CURRENT_STAGE ? 'grey' : stage === 2 ? 'red' : 'amber'}>{selected.status}</Pill>
          {stage >= 2 && stage <= 3 && (
            <Btn small variant="outline" to="s3.2" icon={<ArrowRight size={12} />}>View stage-wise needs</Btn>
          )}
        </div>
      </Panel>

      <Grid cols="1.25fr 1fr 1fr">
        <Panel
          title="Growth-Stage Distribution — Ambad/Jalna Clusters"
          icon={<MapPin size={16} />}
          info
          subtitle="Estimated share of onion acreage by current stage (illustrative)"
        >
          <div className="s3-stack-legend">
            <span><i style={{ background: COLORS.green }} />Vegetative Growth</span>
            <span><i style={{ background: COLORS.light }} />Bulb Initiation</span>
            <span><i style={{ background: '#f4ecb0' }} />Others</span>
          </div>
          <div className="s3-stackbars">
            {DISTRIBUTION.map((row) => (
              <div
                key={row.cluster}
                className={cx('s3-stack-row', cluster === row.cluster && 'selected')}
                onClick={() => setCluster(cluster === row.cluster ? null : row.cluster)}
              >
                <span>{row.cluster}</span>
                <div className="s3-stack-track">
                  <div style={{ width: `${row.veg}%`, background: COLORS.green, color: '#fff' }}>{row.veg}%</div>
                  <div style={{ width: `${row.bulb}%`, background: COLORS.light, color: COLORS.dark }}>{row.bulb}%</div>
                  <div style={{ width: `${row.other}%`, background: '#f4ecb0', color: '#6b5310' }}>{row.other}%</div>
                </div>
              </div>
            ))}
          </div>
          {selectedCluster && (
            <p className="small muted" style={{ marginBottom: 0 }}>
              <strong>{selectedCluster.cluster}:</strong> {selectedCluster.veg}% vegetative, {selectedCluster.bulb}% already in bulb initiation — {selectedCluster.veg >= 58 ? 'slightly delayed progression' : 'on track for the upcoming window'}.
            </p>
          )}
        </Panel>

        <Panel title="Anticipated Stage Transitions" icon={<ChevronRight size={16} />} info subtitle="Expected stage shifts for Ambad/Jalna (illustrative agronomic estimates).">
          <div className="s3-trans">
            <span><strong>Vegetative Growth</strong>→ Bulb Initiation</span>
            <span className="s3-trans-when"><CalendarDays size={15} /><span><strong>in 6–9 days</strong><span className="muted">(~ Feb 21 – Feb 24)</span></span></span>
            <Pill tone="green">High Confidence</Pill>
          </div>
          <div className="s3-trans">
            <span><strong>Bulb Initiation</strong>→ Bulb Development</span>
            <span className="s3-trans-when"><CalendarDays size={15} /><span><strong>in 12–16 days</strong><span className="muted">(~ Mar 5 – Mar 9)</span></span></span>
            <Pill tone="lime">Moderate-High Confidence</Pill>
          </div>
        </Panel>

        <Panel title="Upcoming Nutrition Windows" icon={<CalendarDays size={16} />} info subtitle="Key upcoming windows for onion in Ambad/Jalna (timing only).">
          <DataTable
            compact
            columns={[
              { key: 'stage', label: 'Stage / Window', render: (row) => <span><strong>{row.stage}</strong><br /><span className="muted small">(Nutrition Window)</span></span> },
              { key: 'timing', label: 'Illustrative Timing' },
              { key: 'urgency', label: 'Urgency', render: (row) => <Pill tone={row.urgency === 'High' ? 'red' : 'amber'}>{row.urgency}</Pill> },
            ]}
            rows={[
              { stage: 'Bulb Initiation', timing: 'Feb 21 – Mar 4', urgency: 'High' },
              { stage: 'Bulb Development', timing: 'Mar 5 – Mar 25', urgency: 'Medium' },
            ]}
            onRowClick={(row) => {
              setStage(row.stage === 'Bulb Initiation' ? 2 : 3);
              toast(`${row.stage} window highlighted on the timeline`);
            }}
          />
        </Panel>
      </Grid>

      <Panel>
        <div className="s3-insights">
          <h3><Sparkles size={18} color={COLORS.green} /> AI Timing Insights</h3>
          <div className="s3-insight"><MapPin size={16} color={COLORS.green} /><span>Ambad, Ambad HQ and Jalna (~55–58% acreage) are ~6–9 days from bulb initiation; prepare for the upcoming window.</span></div>
          <div className="s3-insight"><AlertTriangle size={16} color={COLORS.amber} /><span>Dhanora shows a relatively higher share in vegetative stage (60%); ~9–12 days to bulb initiation, indicating a slightly delayed progression.</span></div>
          <div className="s3-insight"><Sprout size={16} color={COLORS.green} /><span>Wadi Gaon is ~12–14 days from bulb development (~29% in bulb initiation), aligning with the next nutrition window.</span></div>
        </div>
      </Panel>

      <FlowFooter
        steps={[
          { label: 'S2.2 Jalna District Intelligence', to: 's2.2' },
          { label: 'S3.1 Crop Nutrition Calendar', current: true },
          { label: 'S3.2 Stage-wise Nutrition Intelligence', to: 's3.2' },
        ]}
        next={{ label: 'S3.2 Stage-wise Nutrition Intelligence', to: 's3.2', sub: 'Explore stage-wise nutrition needs for onion in Ambad/Jalna, aligned to the upcoming windows.' }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S3.2 Stage-wise Crop Nutrition Intelligence                         */
/* ------------------------------------------------------------------ */

type InputState = {
  key: string;
  title: string;
  desc: string;
  status: string;
  action: string;
  doneStatus: string;
  doneDesc: string;
  done: boolean;
};

const INITIAL_INPUTS: InputState[] = [
  { key: 'soil', title: 'Soil nutrient status', desc: 'Recent soil tests unavailable in some target clusters', status: 'Needs data', action: 'Request results', doneStatus: 'Results requested', doneDesc: 'Soil test results requested for Dhanora, Wadi Gaon and Other Villages', done: false },
  { key: 'stage', title: 'Crop-stage verification', desc: 'Onion bulb-initiation timing requires field confirmation', status: 'Pending', action: 'Review observations', doneStatus: 'Observations reviewed', doneDesc: 'Field observations reviewed; bulb-initiation timing broadly consistent with S3.1', done: false },
  { key: 'moisture', title: 'Moisture / irrigation', desc: 'Local field observations not yet fully validated', status: 'Needs review', action: 'Assign field check', doneStatus: 'Field check assigned', doneDesc: 'Field check assigned to Ambad field team', done: false },
];

export function StageNutrition() {
  const { toast } = useNav();
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [fit, setFit] = useState<'croptek' | 'complementary'>('croptek');
  const resolved = inputs.filter((item) => item.done).length;

  const toggle = (item: InputState) => {
    toast(item.done ? `${item.title}: reverted to “${item.status}”` : `${item.title}: ${item.doneStatus.toLowerCase()}`);
    setInputs((current) => current.map((entry) => (entry.key === item.key ? { ...entry, done: !entry.done } : entry)));
  };

  return (
    <div className="stack">
      <Breadcrumbs items={[{ label: 'S3.1 Crop Nutrition Calendar', to: 's3.1' }, { label: 'S3.2 Stage-wise Crop Nutrition Intelligence' }]} />
      <PageHeader
        code="S3.2"
        title="Stage-wise Crop Nutrition Intelligence"
        subtitle="Review stage-specific field evidence and select suitable products for a validated nutrition programme."
        back="s3.1"
      />
      <SourceBar right={<span>→ Selected: Onion / Bulb Initiation</span>}>
        <strong>SOURCE</strong> • S3.1 Crop Nutrition Calendar
      </SourceBar>

      <Panel>
        <div className="s3-crop-card">
          <div className="s3-crop-thumb"><OnionArt size={60} /></div>
          <div>
            <h2>ONION / BULB INITIATION</h2>
            <div className="s3-crop-meta">Ambad, Jalna &nbsp;•&nbsp; Estimated window: 21 Feb – 04 Mar 2027</div>
            <div className="small muted">Crop-stage timing is illustrative; field confirmation is required.</div>
          </div>
          <div className="s3-crop-status"><Pill tone="amber">Programme status: Under review</Pill></div>
        </div>
      </Panel>

      <Grid cols="1.1fr 1fr">
        <Panel
          title="Decision Inputs — Field Evidence"
          icon={<CheckCircle2 size={16} />}
          subtitle="What must be checked before making a crop-stage recommendation"
          actions={<Pill tone={resolved === inputs.length ? 'green' : 'grey'}>{resolved} of {inputs.length} actioned</Pill>}
        >
          {inputs.map((item) => (
            <div className="s3-input-row" key={item.key}>
              <span className={cx('s3-dot', !item.done && 'amber')} />
              <div>
                <strong>{item.title}</strong>
                <p>{item.done ? item.doneDesc : item.desc}</p>
              </div>
              <div className="s3-input-act">
                <Pill tone={item.done ? 'green' : 'amber'}>{item.done ? item.doneStatus : item.status}</Pill>
                <button type="button" className="s3-linkbtn" onClick={() => toggle(item)}>
                  {item.done ? 'Undo' : item.action} <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </Panel>

        <Panel
          title="Mahadhan Product Fit — Review Queue"
          icon={<Layers size={16} />}
          subtitle="Only candidate product families; final choice requires approved product-master data."
        >
          <div className={cx('mini-card s3-fit', fit === 'croptek' && 'selected')} onClick={() => setFit('croptek')}>
            <span className="s3-fit-icon">C</span>
            <div>
              <strong>Croptek programme</strong>
              <p>Stage fit pending agronomy review</p>
            </div>
            <Pill tone="amber">Validation required</Pill>
          </div>
          <div className={cx('mini-card s3-fit', fit === 'complementary' && 'selected')} onClick={() => setFit('complementary')}>
            <span className="s3-fit-icon"><Plus size={18} /></span>
            <div>
              <strong>Complementary nutrient options</strong>
              <p>Consider only when supported by soil or field evidence</p>
            </div>
            <Pill tone="grey">Conditional</Pill>
          </div>
          <button type="button" className="s3-master-link" onClick={() => toast('Opening product master & approved guidance (read-only)')}>
            <span className="s3-dot" />
            <span>View product master &amp; approved guidance</span>
            <span><ChevronRight size={14} /></span>
          </button>
        </Panel>
      </Grid>

      <Grid cols="1.6fr 1fr">
        <Panel className="ai-panel">
          <AiItem title="AI Decision Brief">
            <strong>Confirm field-stage and soil evidence before selecting the {fit === 'croptek' ? 'Croptek programme' : 'complementary nutrient options'}.</strong>
            <div className="small muted">Carry validated product options into S3.3; no unapproved dosage or claims.</div>
            {resolved < inputs.length && (
              <div className="small" style={{ marginTop: 4 }}>{inputs.length - resolved} field input(s) still open — the programme can be configured as a draft only.</div>
            )}
          </AiItem>
        </Panel>
        <Panel>
          <div className="s3-next-card">
            <span className="s3-eyebrow">Next step</span>
            <strong>Nutrition programme configuration</strong>
            <span className="small muted">{resolved === inputs.length ? 'Field checks actioned — ready for programme review' : 'Field checks pending before programme review'}</span>
            <Btn variant="primary" to="s3.3" icon={<ArrowRight size={14} />}>Configure Nutrition Programme → S3.3</Btn>
          </div>
        </Panel>
      </Grid>

      <div className="s3-footer">
        <Btn variant="outline" small to="s3.1" icon={<ArrowLeft size={13} />}>Back to S3.1 Crop Nutrition Calendar</Btn>
        <span className="s3-footer-mid">RECOMMENDED NEXT: S3.3 Complete Crop Nutrition Programme Builder</span>
        <Btn variant="primary" to="s3.3" icon={<ArrowRight size={14} />}>Configure Nutrition Programme → S3.3</Btn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S3.3 Complete Crop Nutrition Programme Builder                      */
/* ------------------------------------------------------------------ */

const STAGE_OPTIONS = ['Vegetative Growth', 'Bulb Initiation', 'Bulb Development', 'Bulb Enlargement', 'Maturity / Finish'];
const PRODUCT_OPTIONS = ['Croptek Core Programme', 'Potash Support Option', 'Micronutrient Support Option', 'Specialty Nutrition Add-on'];
const MASTER_MAPPED = new Set(['Croptek Core Programme', 'Potash Support Option']);
const OBJECTIVE_OPTIONS = [
  'Support early crop establishment and vegetative growth',
  'Support bulb initiation and uniform bulb set',
  'Support bulb development and size uniformity',
  'Support crop maturity and harvest readiness',
];
const WINDOW_OPTIONS = ['Early vegetative to pre-bulb', 'Bulb initiation stage', 'Bulb development stage', 'Late development to maturity'];
const VALIDATION_LABEL: Record<string, { tone: Tone; icon: ReactNode }> = {
  'Approved for Review': { tone: 'green', icon: <CheckCircle2 size={12} /> },
  'Validation Pending': { tone: 'amber', icon: <Clock size={12} /> },
  'Draft Option': { tone: 'grey', icon: <FileText size={12} /> },
};

type BuilderRow = { id: number; stage: string; product: string; objective: string; window: string; validation: string };

const INITIAL_ROWS: BuilderRow[] = [
  { id: 1, stage: 'Vegetative Growth', product: PRODUCT_OPTIONS[0], objective: OBJECTIVE_OPTIONS[0], window: WINDOW_OPTIONS[0], validation: 'Approved for Review' },
  { id: 2, stage: 'Bulb Initiation', product: PRODUCT_OPTIONS[1], objective: OBJECTIVE_OPTIONS[1], window: WINDOW_OPTIONS[1], validation: 'Validation Pending' },
  { id: 3, stage: 'Bulb Development', product: PRODUCT_OPTIONS[2], objective: OBJECTIVE_OPTIONS[2], window: WINDOW_OPTIONS[2], validation: 'Validation Pending' },
  { id: 4, stage: 'Maturity / Finish', product: PRODUCT_OPTIONS[3], objective: OBJECTIVE_OPTIONS[3], window: WINDOW_OPTIONS[3], validation: 'Draft Option' },
];

function Select({ value, options, onChange }: { value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <select value={value} onClick={(event) => event.stopPropagation()} onChange={(event) => onChange(event.target.value)}>
      {options.map((option) => <option key={option}>{option}</option>)}
    </select>
  );
}

export function ProgrammeBuilder() {
  const { toast } = useNav();
  const [rows, setRows] = useState(INITIAL_ROWS);
  const [selectedId, setSelectedId] = useState(2);
  const [submitted, setSubmitted] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const selectedRow = rows.find((row) => row.id === selectedId) ?? rows[0];

  const update = (id: number, patch: Partial<BuilderRow>) => {
    setRows((current) => current.map((row) => {
      if (row.id !== id) return row;
      // Edited stages that were already approved go back to pending validation.
      const validation = row.validation === 'Approved for Review' ? 'Validation Pending' : row.validation;
      return { ...row, ...patch, validation };
    }));
  };

  const addRow = () => {
    const id = Math.max(...rows.map((row) => row.id)) + 1;
    const used = new Set(rows.map((row) => row.stage));
    const stage = STAGE_OPTIONS.find((option) => !used.has(option)) ?? STAGE_OPTIONS[1];
    setRows((current) => [...current, { id, stage, product: PRODUCT_OPTIONS[2], objective: OBJECTIVE_OPTIONS[2], window: WINDOW_OPTIONS[2], validation: 'Draft Option' }]);
    setSelectedId(id);
    toast(`Added ${stage} row as a draft option`);
  };

  const pendingOthers = rows.filter((row) => row.validation === 'Validation Pending' && row.id !== selectedId).map((row) => row.stage);
  const products = rows.map((row) => row.product);
  const duplicate = products.find((product, index) => products.indexOf(product) !== index);
  const roleOverlap = products.includes('Croptek Core Programme') && products.includes('Potash Support Option');
  const stageCount = new Set(rows.map((row) => row.stage)).size;

  const save = () => {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSavedAt(time);
    toast(`Programme draft saved (${time})`);
  };

  const submit = () => {
    setSubmitted(true);
    toast('Programme submitted for agronomy review');
  };

  return (
    <div className="stack">
      <PageHeader
        code="S3.3"
        title="Complete Crop Nutrition Programme Builder"
        subtitle="Configure a stage-wise crop nutrition programme using validated products, define programme objectives, and submit for agronomy review."
        back="s3.2"
      />
      <FlowStrip
        items={[
          { label: 'S3.1 Crop Nutrition Calendar', to: 's3.1' },
          { label: 'S3.2 Stage-wise Crop Nutrition Intelligence', to: 's3.2' },
          { label: 'S3.3 Complete Crop Nutrition Programme Builder', current: true },
        ]}
        source="Source: S3.2 → Configure Nutrition Programme"
      />

      <Panel>
        <div className="s3-prog-head">
          <div className="s3-crop-thumb" style={{ width: 70, height: 70 }}><OnionArt size={52} /></div>
          <div>
            <h2>Onion Croptek Nutrition Programme — Ambad/Jalna ({submitted ? 'Submitted' : 'Draft'})</h2>
            <div className="s3-prog-meta">
              <div><span><small>Crop</small><strong>Onion</strong></span></div>
              <div><span><small>Geography</small><strong>Ambad / Jalna</strong></span></div>
              <div><Sprout size={18} color={COLORS.green} /><span><small>Selected Stage</small><strong>{selectedRow.stage}</strong></span></div>
              <div><FileText size={18} color={COLORS.dark} /><span><small>Programme Status</small><Pill tone={submitted ? 'blue' : 'amber'}>{submitted ? 'Submitted' : 'Draft'}</Pill></span></div>
              <div><Shield size={18} color={COLORS.dark} /><span><small>Agronomy Review Status</small><Pill tone={submitted ? 'blue' : 'amber'}>{submitted ? 'Under Agronomy Review' : 'Pending Validation'}</Pill></span></div>
              {savedAt && <div><span><small>Last saved</small><strong>{savedAt}</strong></span></div>}
            </div>
          </div>
        </div>
      </Panel>

      <Grid cols="1.7fr 1fr">
        <Panel title="Stage-wise Programme Builder" icon={<ListChecks size={16} />} subtitle="Select products from validated master, define programme objectives, and configure stage-wise plan.">
          <div className="table-wrap">
            <table className="s3-builder">
              <thead>
                <tr>
                  <th style={{ width: '17%' }}>Crop Stage</th>
                  <th style={{ width: '24%' }}>Selected Product <span style={{ fontWeight: 500 }}>(Validated Master)</span></th>
                  <th style={{ width: '25%' }}>Programme Objective</th>
                  <th style={{ width: '17%' }}>Application Window</th>
                  <th>Agronomy Validation</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const mapped = MASTER_MAPPED.has(row.product);
                  const validation = VALIDATION_LABEL[row.validation];
                  const inReview = submitted && row.validation !== 'Draft Option';
                  return (
                    <tr key={row.id} className={cx(row.id === selectedId && 'selected')} onClick={() => setSelectedId(row.id)}>
                      <td>
                        {row.id > INITIAL_ROWS.length ? (
                          <Select value={row.stage} options={STAGE_OPTIONS} onChange={(value) => update(row.id, { stage: value })} />
                        ) : (
                          <span className="s3-stage-cell">
                            {row.stage.startsWith('Bulb') ? <OnionArt size={22} /> : <Sprout size={20} color={COLORS.green} />}
                            {row.stage}
                          </span>
                        )}
                      </td>
                      <td>
                        <Select value={row.product} options={PRODUCT_OPTIONS} onChange={(value) => update(row.id, { product: value })} />
                        <span className={cx('s3-map-tag', mapped ? 'mapped' : 'draft')}>{mapped ? 'Master Mapped' : 'Draft Option'}</span>
                      </td>
                      <td><Select value={row.objective} options={OBJECTIVE_OPTIONS} onChange={(value) => update(row.id, { objective: value })} /></td>
                      <td><Select value={row.window} options={WINDOW_OPTIONS} onChange={(value) => update(row.id, { window: value })} /></td>
                      <td>
                        <Pill tone={inReview ? 'blue' : validation.tone}>
                          {validation.icon}{inReview ? 'In Agronomy Review' : row.validation}
                        </Pill>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <button type="button" className="s3-add-row" onClick={addRow}><Plus size={14} /> Add Stage / Product Option</button>
        </Panel>

        <div className="stack">
          <Panel title="Programme Comparison" icon={<Scale size={16} />} subtitle="How the Mahadhan programme differs from a typical programme.">
            <DataTable
              compact
              columns={[
                { key: 'aspect', label: 'Comparison Aspect', render: (row) => <strong>{row.aspect}</strong> },
                { key: 'conv', label: 'Conventional Farmer Programme', render: (row) => <Pill tone="grey">{row.conv}</Pill> },
                { key: 'mah', label: 'Mahadhan Programme', render: (row) => <Pill tone="green">{row.mah}</Pill> },
              ]}
              rows={[
                { aspect: 'Stage coverage', conv: 'Partial (key stages)', mah: `Complete (${stageCount} stages)` },
                { aspect: 'Input approach', conv: 'Generic & non-standard', mah: 'Stage-wise, validated master' },
                { aspect: 'Advisory consistency', conv: 'Variable by source', mah: 'Structured & review-based' },
                { aspect: 'Programme completeness', conv: 'Basic', mah: 'Comprehensive (configurable)' },
              ]}
            />
          </Panel>
          <Panel title="AI Programme Validation" icon={<Sparkles size={16} />} subtitle="Automated checks and action points before agronomy review." className="ai-panel">
            <Check status={selectedRow.stage === 'Bulb Initiation' ? 'done' : 'warn'}>
              {selectedRow.stage === 'Bulb Initiation' ? 'Bulb initiation stage selected correctly from S3.2.' : `Selected stage (${selectedRow.stage}) differs from the S3.2 selection (Bulb Initiation).`}
            </Check>
            <Check status="done">Confirm local soil / crop advisory before final approval.</Check>
            <Check status={pendingOthers.length ? 'pending' : 'done'}>
              {pendingOthers.length
                ? `${pendingOthers.length === 1 ? 'One stage still needs' : `${pendingOthers.length} stages still need`} agronomy validation (${pendingOthers.join(', ')}).`
                : 'No other stages awaiting agronomy validation.'}
            </Check>
            {duplicate ? (
              <Check status="warn">Same product selected in multiple stages ({duplicate}) — confirm intended role.</Check>
            ) : roleOverlap ? (
              <Check status="warn">One product role overlap to review (Core Programme vs. Potash Support Option).</Check>
            ) : (
              <Check status="done">No product role overlaps detected.</Check>
            )}
          </Panel>
        </div>
      </Grid>

      <div className="s3-footer">
        <Btn variant="outline" small to="s3.2" icon={<ArrowLeft size={13} />}>Back to S3.2</Btn>
        <span className="s3-footer-mid">Recommended Next: S3.4 Campaign Trigger &amp; Recommendation Engine</span>
        <div className="s3-action-bar">
          <Btn variant="outline" onClick={save}>Save Draft</Btn>
          <Btn variant="gold" onClick={submit} disabled={submitted}>{submitted ? 'Submitted for Agronomy Review' : 'Submit for Agronomy Review'}</Btn>
          <Btn variant="primary" to="s3.4" icon={<ArrowRight size={14} />}>Identify Campaign Opportunities → S3.4</Btn>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* S3.4 Intelligent Campaign Trigger & Recommendation Engine           */
/* ------------------------------------------------------------------ */

type Trigger = {
  n: number;
  trigger: string;
  geo: string;
  audience: string;
  intervention: string;
  reach: string;
  urgency: string;
  status: string;
  campaign: number;
};

const TRIGGER_ICONS: ReactNode[] = [<CalendarDays size={16} />, <Sprout size={16} />, <Store size={16} />, <TrendingUp size={16} />];
const INTERVENTION_ICONS: ReactNode[] = [<Megaphone size={15} />, <MessageSquare size={15} />, <Store size={15} />, <CalendarDays size={15} />];

const TRIGGERS: Trigger[] = [
  { n: 1, trigger: 'Upcoming Bulb-Initiation Window', geo: 'Ambad/Jalna', audience: 'Eligible conventional NPK farmers', intervention: 'Stage-specific farmer education plus retailer activation', reach: '≈ 12.4K farmers', urgency: 'High', status: 'Draft recommendation — agronomy approval required', campaign: 0 },
  { n: 2, trigger: 'Trial-to-Adoption Follow-up', geo: 'Ambad/Jalna', audience: 'Existing trial users', intervention: 'Field follow-up plus approved advisory communication', reach: '≈ 2.8K farmers', urgency: 'High', status: 'Eligible farmer list to be validated', campaign: 2 },
  { n: 3, trigger: 'Retailer Nutrition Awareness Activation', geo: 'Ambad/Jalna', audience: 'Selected high-influence retailers', intervention: 'Product education plus retailer-led farmer meetings', reach: '≈ 86 retailers', urgency: 'Medium', status: 'Stock and content readiness check pending', campaign: 1 },
  { n: 4, trigger: 'Crop-Stage Shift Monitoring', geo: 'Ambad/Jalna', audience: 'Programme coverage area farmers', intervention: 'Reassess campaign date and communication schedule', reach: '≈ 15.2K farmers', urgency: 'Conditional', status: 'Monitoring — no confirmed trigger event', campaign: 0 },
];

const CAMPAIGNS = [
  { name: 'Crop-Stage Awareness Campaign', icon: <Megaphone size={22} />, status: 'Pending agronomy approval', objective: 'Educate farmers approaching the relevant nutrition window.', target: 'Conventional NPK onion farmers', window: 'Late Feb 2027' },
  { name: 'Retailer-Led Conversion Campaign', icon: <Store size={22} />, status: 'Stock and content check pending', objective: 'Use selected retailers to reach conventional NPK farmers with approved product-value messaging.', target: 'High-influence retailer clusters', window: 'Late Feb to early Mar 2027' },
  { name: 'Trial Farmer Nurturing Campaign', icon: <Users size={22} />, status: 'Farmer list validation pending', objective: 'Convert engaged trial users through timely follow-ups.', target: 'Trial users', window: 'Rolling' },
];

const READINESS: { label: string; status: 'done' | 'pending' | 'todo'; value: string; tone: Tone }[] = [
  { label: 'Crop-stage window identified', status: 'done', value: 'Ready', tone: 'green' },
  { label: 'Target audience identified', status: 'done', value: 'Ready, subject to data validation', tone: 'green' },
  { label: 'Product programme approval', status: 'pending', value: 'Pending', tone: 'amber' },
  { label: 'Advisory content approval', status: 'pending', value: 'Pending', tone: 'amber' },
  { label: 'Stock availability', status: 'todo', value: 'Check required', tone: 'grey' },
  { label: 'Consent for digital communication', status: 'todo', value: 'Verify before sending', tone: 'grey' },
];

const LOGIC_STEPS = [
  { label: 'Crop Stage Approaching', icon: <Sprout size={20} />, state: 'done' },
  { label: 'Eligible Audience Identified', icon: <Users size={20} />, state: 'done' },
  { label: 'Programme Validation', icon: <Shield size={20} />, state: 'pending' },
  { label: 'Stock / Channel Readiness', icon: <Layers size={20} />, state: 'pending' },
  { label: 'Campaign Draft', icon: <Megaphone size={20} />, state: '' },
];

export function TriggerEngine() {
  const { toast, go } = useNav();
  const triggers = useDataset('nutrition.triggers', TRIGGERS);
  const [trigger, setTrigger] = useState(1);
  const [campaign, setCampaign] = useState<number | null>(null);
  const active = triggers.rows.find((item) => item.n === trigger) ?? triggers.rows[0];

  const viewRecommendation = (item: Trigger) => {
    setTrigger(item.n);
    toast(`Recommendation for “${item.trigger}”: ${(CAMPAIGNS[item.campaign] ?? CAMPAIGNS[0]).name}`);
  };

  return (
    <div className="stack">
      <PageHeader
        code="S3.4"
        title="Intelligent Campaign Trigger & Recommendation Engine"
        subtitle="Prioritize campaign triggers, generate recommendations, and prepare campaign drafts based on crop stage, programme, and readiness."
        back="s3.3"
      />
      <FlowStrip
        items={[
          { label: 'S3.1 Crop Nutrition Calendar', to: 's3.1' },
          { label: 'S3.2 Stage-wise Nutrition Intelligence', to: 's3.2' },
          { label: 'S3.3 Complete Crop Nutrition Programme Builder', to: 's3.3' },
          { label: 'S3.4 Campaign Trigger & Recommendation Engine', current: true },
        ]}
        source="Source click: S3.3 → Identify Campaign Opportunities"
      />

      <ContextStrip
        items={[
          { icon: <OnionArt size={34} />, label: 'Selected Programme', value: 'Croptek Onion Nutrition Programme' },
          { icon: <MapPin size={18} />, label: 'Crop & Geography', value: 'Onion | Ambad/Jalna' },
          { icon: <Sprout size={18} />, label: 'Current Stage Window', value: 'Bulb Initiation | 21 Feb – 4 Mar 2027', sub: '(Illustrative)' },
          { icon: <Zap size={18} />, label: 'Trigger Status', value: <Pill tone="green">Recommendations Generated</Pill> },
          { icon: <Shield size={18} />, label: 'Programme Approval', value: <Pill tone="amber">Pending Agronomy Validation</Pill> },
        ]}
      />

      <Panel data={triggers} title="Prioritized Campaign Trigger Queue" icon={<ListChecks size={16} />} subtitle="Recommended campaign triggers based on crop stage, audience, and programme readiness.">
        <DataTable
          rows={triggers.rows}
          highlight={(row) => row.n === trigger}
          onRowClick={(row) => setTrigger(row.n)}
          columns={[
            { key: 'n', label: '#', render: (row) => <span className="num-badge">{row.n}</span> },
            { key: 'trigger', label: 'Trigger (Priority)', render: (row, index) => <span className="s3-trig-name">{TRIGGER_ICONS[index]}{row.trigger}</span> },
            { key: 'geo', label: 'Geography' },
            { key: 'audience', label: 'Audience', render: (row) => <span className="s3-icon-cell"><Users size={15} />{row.audience}</span> },
            { key: 'intervention', label: 'Recommended Intervention', render: (row, index) => <span className="s3-icon-cell">{INTERVENTION_ICONS[index]}{row.intervention}</span> },
            { key: 'reach', label: 'Indicative Reach', render: (row) => <span className="s3-icon-cell"><Users size={14} />{row.reach}</span> },
            { key: 'urgency', label: 'Urgency', render: (row) => <Pill tone={row.urgency === 'High' ? 'red' : row.urgency === 'Medium' ? 'amber' : 'grey'}>{row.urgency}</Pill> },
            { key: 'status', label: 'Status', render: (row) => <span className="small">{row.status}</span> },
            {
              key: 'action',
              label: '',
              render: (row) => (
                <Btn small variant={row.n === trigger ? 'primary' : 'outline'} onClick={() => viewRecommendation(row)} icon={<ChevronRight size={12} />}>
                  View Recommendation
                </Btn>
              ),
            },
          ]}
        />
        <div className="highlight-box small" style={{ marginTop: 8 }}>
          <strong>Trigger {active.n} — {active.trigger}:</strong> recommended campaign is <strong>{(CAMPAIGNS[active.campaign] ?? CAMPAIGNS[0]).name}</strong> ({active.reach}, urgency {active.urgency.toLowerCase()}). {active.status}.
        </div>
      </Panel>

      <Panel title="Recommended Campaigns" icon={<Layers size={16} />} subtitle="Pre-configured campaign options aligned to the above triggers and current programme.">
        <div className="s3-campaigns">
          {CAMPAIGNS.map((item, index) => (
            <div
              key={item.name}
              className={cx('mini-card s3-camp', campaign === index && 'selected', campaign !== index && active.campaign === index && 'linked')}
              onClick={() => setCampaign(index)}
            >
              <span className="s3-camp-icon">{item.icon}</span>
              <div>
                <div className="row-between" style={{ alignItems: 'flex-start' }}>
                  <h4>{item.name}</h4>
                  <Pill tone="amber">{item.status}</Pill>
                </div>
                <dl>
                  <div><dt>Objective:</dt><dd>{item.objective}</dd></div>
                  <div><dt>Target:</dt><dd>{item.target}</dd></div>
                  <div><dt>Activation Window:</dt><dd>{item.window}</dd></div>
                </dl>
                <div className="s3-camp-foot">
                  <Btn
                    small
                    variant={campaign === index ? 'dark' : 'primary'}
                    icon={campaign === index ? <CheckCircle2 size={12} /> : <ChevronRight size={12} />}
                    onClick={() => {
                      setCampaign(index);
                      toast(`${item.name} selected`);
                    }}
                  >
                    {campaign === index ? 'Selected' : 'Select Campaign'}
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Grid cols="1.25fr 1fr">
        <Panel title="Trigger Logic & Readiness" icon={<Workflow size={16} />} subtitle="A simple view of the campaign trigger flow and key readiness checks.">
          <div className="s3-logic">
            <div className="s3-logic-flow">
              {LOGIC_STEPS.map((step, index) => (
                <span key={step.label} className="row" style={{ flex: 1, gap: 4, flexWrap: 'nowrap' }}>
                  {index > 0 && <ArrowRight size={13} className="muted" />}
                  <span className={cx('s3-logic-step', index === LOGIC_STEPS.length - 1 ? campaign !== null && 'done' : step.state)}>
                    {step.icon}{step.label}
                  </span>
                </span>
              ))}
            </div>
            <div>
              {READINESS.map((item) => (
                <Check key={item.label} status={item.status}>
                  <div className="s3-ready-row"><span>{item.label}</span><Pill tone={item.tone}>{item.value}</Pill></div>
                </Check>
              ))}
            </div>
          </div>
        </Panel>

        <Panel title="AI Recommendation" icon={<Sparkles size={16} />} className="ai-panel">
          <p style={{ margin: 0, fontSize: 13 }}>
            Prioritize preparation of the bulb-initiation awareness and retailer-led adoption campaign in Ambad/Jalna. The crop-stage window is approaching, but programme approval and channel readiness must be confirmed before activation.
          </p>
          <div className="s3-ai-steps">
            <div className="s3-ai-step"><Play size={15} /><span><strong>Prepare Now</strong>Draft the recommended campaign.</span></div>
            <div className="s3-ai-step"><Shield size={15} /><span><strong>Validate First</strong>Complete agronomy and content checks.</span></div>
            <div className="s3-ai-step"><BarChart3 size={15} /><span><strong>Monitor</strong>Continue monitoring stage shifts and readiness.</span></div>
          </div>
        </Panel>
      </Grid>

      <div className="s3-footer">
        <Btn variant="outline" small to="s3.3" icon={<ArrowLeft size={13} />}>Back to S3.3</Btn>
        <span className="s3-footer-mid">
          Source: S3.3 Complete Crop Nutrition Programme Builder <ArrowRight size={12} />
          <strong style={{ color: COLORS.dark }}>Current: S3.4 Campaign Trigger &amp; Recommendation Engine</strong> <ArrowRight size={12} />
          Recommended Next: S4.2 Campaign Creation Wizard
        </span>
        <div className="s3-footer-right">
          <Btn
            variant="primary"
            icon={<ArrowRight size={14} />}
            onClick={() => {
              toast(`Drafting ${(CAMPAIGNS[campaign ?? active.campaign] ?? CAMPAIGNS[0]).name} in the Campaign Creation Wizard`);
              go('s4.2');
            }}
          >
            Create Recommended Campaign → S4.2 Campaign Creation Wizard
          </Btn>
          <span className="small muted">Campaign can be drafted, but will not be auto-published.</span>
        </div>
      </div>
    </div>
  );
}
