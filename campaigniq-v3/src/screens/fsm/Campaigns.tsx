/** Screens 6–10 — My Campaigns: business priority, then the 4-step campaign wizard. */
import {
  CalendarDays, ChartColumn, CircleAlert, CircleCheck, ClipboardList, Coins, Filter, Lightbulb, ListChecks, Paperclip, Plus, Save, Settings2,
  SlidersHorizontal, Sprout, Target, Trash2, type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { territoryById } from '../../data/bh';
import { crore, lakh, num, pct, sum, times } from '../../data/format';
import {
  activityErrors, AUDIENCES, budgetMix, BUSINESS_PRIORITIES, CAMPAIGN_TYPES, CAMPAIGN_VILLAGES, CHANNELS, cropPlan, defaultWizard, funnel, objectiveCoverage,
  objectiveErrors, OBJECTIVES, OWNERS, PHASE_OF, priorityById, RETAILERS, TIMINGS, VILLAGE_FARMERS, wizardScenarios, type WizardActivity, type WizardState,
  DEALERS, clusterRows, type BusinessPriority,
} from '../../data/fsm';
import { F } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useFsmStore } from '../../store/fsmStore';
import { Bar, Button, Card, KpiCard, Select, StatusChip, StepTabs } from '../../ui/core';
import { DataTable } from '../../ui/DataTable';
import { useGo } from '../common';
import { FsmPage } from './frame';

const SECTION = 'My campaigns';
const opt = (v: string) => ({ value: v, label: v });

function List({ items }: { items: { icon?: LucideIcon; label: ReactNode; value?: ReactNode; tone?: 'warn' }[] }) {
  return <>{items.map((i, k) => <div key={k} className="list-row">{i.icon && <i.icon size={16} color={i.tone === 'warn' ? 'var(--amber)' : undefined} />}<span>{i.label}</span>{i.value !== undefined && <b className="right">{i.value}</b>}</div>)}</>;
}
function Notes({ title, items }: { title: string; items: ReactNode[] }) {
  return <Card title={title} icon={Lightbulb}><List items={items.map((t) => ({ label: t }))} /></Card>;
}

/** Wizard entries from the store (a fresh onion draft when none was started). */
function useWizard() {
  const fsm = useFsmStore();
  const w = fsm.wizard ?? defaultWizard(BUSINESS_PRIORITIES[0].id);
  return { w, set: fsm.setWizard, p: priorityById(w.priority) };
}

const STEPS: { label: string; icon: LucideIcon; to: string }[] = [
  { label: 'Objective & Targeting', icon: Target, to: F.objective },
  { label: 'Activity & Budget Mix', icon: ClipboardList, to: F.activities },
  { label: 'Scenario & Expected Outcomes', icon: ChartColumn, to: F.scenario },
  { label: 'Review & Submit', icon: CircleCheck, to: F.wizardReview },
];

/** The 4 wizard steps: reached steps can be revisited; later steps open once the current one is complete. */
function WizardTabs({ active }: { active: number }) {
  const go = useGo();
  const bh = useBhStore();
  const { w } = useWizard();
  return <StepTabs active={active} items={STEPS.map((s, i) => ({ label: s.label, icon: s.icon, onClick: () => (i <= Math.max(w.maxStep, active) ? go(s.to) : bh.toast('Complete the current step first')) }))} />;
}

/** Field wrapper with label and validation message. */
function Field({ label, error, children, sub }: { label: string; error?: string; children: ReactNode; sub?: string }) {
  return (
    <label className="field">
      <span>{label} *</span>
      {sub && <small className="muted">{sub}</small>}
      {children}
      {error && <small className="err">{error}</small>}
    </label>
  );
}

function CampaignKpis({ w, extra }: { w: WizardState; extra?: ReactNode }) {
  const p = priorityById(w.priority);
  return (
    <div className="kpis">
      <KpiCard label="Campaign budget" value={lakh(budgetMix(w.activities).total, 2)} />
      <KpiCard label="Selected villages" value={num(w.villages.length)} />
      <KpiCard label="Linked retailers" value={num(w.retailers.length)} />
      {extra ?? <KpiCard label="Plan-linked growth objective" value={p.uplift ? lakh(p.uplift) : lakh(0)} />}
    </div>
  );
}

// ================================================================ 6 Select Business Priority
export function SelectPriority() {
  const go = useGo();
  const fsm = useFsmStore();
  const [sel, setSel] = useState(fsm.wizard?.priority ?? BUSINESS_PRIORITIES[0].id);
  const p = priorityById(sel);
  const ambad = clusterRows().find((r) => r.id === 'ambad')!;
  const crops = cropPlan('ambad');
  const status = (x: BusinessPriority) => {
    const s = fsm.campaigns[x.id];
    return s === 'launched' ? <StatusChip tone="ok">Approved and launched</StatusChip> : s === 'draft' ? <StatusChip tone="warn">Draft</StatusChip> : <StatusChip tone="neutral">Not drafted</StatusChip>;
  };
  const submitted = fsm.submitted.includes('ambad');
  const start = () => { fsm.startWizard(sel); go(F.objective); };
  const farmers = sum(p.villages.filter((v) => VILLAGE_FARMERS[v]), (v) => VILLAGE_FARMERS[v]);

  return (
    <FsmPage section={SECTION} sectionTo={F.campaigns} trail="Ambad" title="Select Business Priority"
      right={<StatusChip tone={submitted ? 'ok' : 'warn'}>{submitted ? 'Plan submitted · ready for campaign design' : 'Plan in draft'}</StatusChip>}
      back={F.review('ambad')} next={start} nextLabel="Create campaign draft">
      <div className="kpis">
        <KpiCard label="Approved ABP target" value={crore(ambad.abp)} />
        <KpiCard label="Growth vs last year" value={crore(ambad.abp - ambad.lastYear)} />
        <KpiCard label="Onion crop allocation" value={crore(crops[0].abp)} />
        <KpiCard label="Plan-linked uplift" value={lakh(sum(BUSINESS_PRIORITIES, (x) => x.uplift ?? 0))} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <div className="stack">
          <Card title="Where should a campaign support growth?" icon={Target} flush>
            <DataTable selectable rows={BUSINESS_PRIORITIES} rowKey={(x) => x.id} selected={sel} onRowClick={(x) => setSel(x.id)}
              columns={[
                { key: 'n', header: 'Growth priority', render: (x) => <span className="stack" style={{ gap: 2 }}><b>{x.name}</b><small>{x.description}</small></span> },
                { key: 'g', header: 'Focus geography', render: (x) => x.villages.join(' · ') },
                { key: 'u', header: 'Plan-linked uplift', align: 'right', render: (x) => (x.uplift ? <b>{lakh(x.uplift)}</b> : '–') },
                { key: 's', header: 'Campaign', align: 'center', render: status },
                { key: 'a', header: 'Action', align: 'center', render: (x) => <Button small primary={x.id === sel} onClick={() => setSel(x.id)}>{x.id === sel ? 'Selected' : 'Select'}</Button> },
              ]}
              total={{ n: 'Total', u: lakh(sum(BUSINESS_PRIORITIES, (x) => x.uplift ?? 0)) }} />
          </Card>
          <Notes title="Planning notes" items={[
            `Onion conversion carries the largest plan-linked uplift (${lakh(BUSINESS_PRIORITIES[0].uplift!)}); confirm reach, budget and expected contribution in the wizard.`,
            `Plan-linked uplift totals ${lakh(sum(BUSINESS_PRIORITIES, (x) => x.uplift ?? 0))}, the gap between Ambad's ABP and its proposed plan.`,
          ]} />
        </div>
        <Card title={p.name} icon={Sprout}>
          <List items={[
            { label: 'Linked business uplift', value: p.uplift ? lakh(p.uplift) : '–' },
            { label: 'Coverage focus', value: p.villages.join(' & ') },
            { label: 'Farmers in focus villages', value: num(farmers) },
            { label: 'Primary audience', value: p.audience },
            { label: 'Suggested approach', value: p.approach },
          ]} />
          <div className="card-sub">Checks before activation</div>
          <List items={[
            { icon: CircleAlert, tone: 'warn', label: 'Audience eligibility' },
            { icon: CircleAlert, tone: 'warn', label: 'Approved content' },
            { icon: CircleAlert, tone: 'warn', label: 'Stock readiness' },
          ]} />
        </Card>
      </div>
    </FsmPage>
  );
}

// ================================================================ 7 Objective & Targeting
export function WizardObjective() {
  const go = useGo();
  const bh = useBhStore();
  const { w, set, p } = useWizard();
  const [tried, setTried] = useState(false);
  const errors = tried ? objectiveErrors(w) : {};
  const crop = cropPlan('ambad').find((c) => c.crop === p.crop);
  const pool = RETAILERS.filter((r) => r.active && w.villages.includes(r.village));
  const farmers = sum(w.villages, (v) => VILLAGE_FARMERS[v] ?? 0);
  const toggle = (list: string[], x: string) => (list.includes(x) ? list.filter((y) => y !== x) : [...list, x]);
  const setVillages = (villages: string[]) => set({ villages, retailers: w.retailers.filter((id) => RETAILERS.find((r) => r.id === id && villages.includes(r.village))) });
  const next = () => {
    setTried(true);
    if (Object.keys(objectiveErrors(w)).length) { bh.toast('Complete the required fields'); return; }
    set({ maxStep: Math.max(w.maxStep, 1) });
    go(F.activities);
  };

  return (
    <FsmPage section={SECTION} sectionTo={F.campaigns} trail={w.name || p.campaignName} title="Objective & Targeting" back={F.campaigns} next={next}>
      <WizardTabs active={0} />
      <div className="kpis">
        <KpiCard label="Ambad approved ABP" value={crore(territoryById('ambad')!.abp)} />
        <KpiCard label={`${p.crop === 'All crops' ? 'Crop' : p.crop} crop allocation`} value={crop ? crore(crop.abp) : crore(territoryById('ambad')!.abp)} />
        <KpiCard label="Plan-linked growth objective" value={p.uplift ? lakh(p.uplift) : lakh(0)} />
        <KpiCard label="Farmers in selected villages" value={num(farmers)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title="Campaign configuration" icon={Settings2} right={<Button small icon={Save} onClick={() => bh.toast('Campaign draft saved')}>Save draft</Button>}>
          <div className="form-grid">
            <Field label="Campaign name" error={errors.name}>
              <input className="input" value={w.name} aria-label="Campaign name" onChange={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Campaign objective" error={errors.objective}>
              <Select label="Campaign objective" value={w.objective} options={[{ value: '', label: 'Choose an objective' }, ...OBJECTIVES.map(opt)]} onChange={(v) => set({ objective: v })} />
            </Field>
            <Field label="Geography (villages)" sub="Select the target villages" error={errors.villages}>
              <div className="pick">
                {CAMPAIGN_VILLAGES.map((v) => <button key={v} type="button" className={w.villages.includes(v) ? 'on' : ''} aria-pressed={w.villages.includes(v)} onClick={() => setVillages(toggle(w.villages, v))}>{w.villages.includes(v) && <CircleCheck size={14} />}{v}</button>)}
              </div>
            </Field>
            <Field label={`Linked retailers (${w.retailers.length} selected)`} sub="Retailers in the selected villages anchor execution" error={errors.retailers}>
              <div className="pick-list">
                {pool.map((r) => (
                  <label key={r.id} className="row"><input type="checkbox" checked={w.retailers.includes(r.id)} onChange={() => set({ retailers: toggle(w.retailers, r.id) })} />{r.name}<small className="muted">{r.village} · {DEALERS.find((d) => d.id === r.dealerId)!.name}</small></label>
                ))}
              </div>
            </Field>
            <Field label="Target farmer audience" error={errors.audience}>
              <Select label="Target farmer audience" value={w.audience} options={[{ value: '', label: 'Choose the audience' }, ...AUDIENCES.map(opt)]} onChange={(v) => set({ audience: v })} />
            </Field>
            <Field label="Preferred campaign type" error={errors.campaignType}>
              <Select label="Preferred campaign type" value={w.campaignType} options={[{ value: '', label: 'Choose a campaign type' }, ...CAMPAIGN_TYPES.map(opt)]} onChange={(v) => set({ campaignType: v })} />
            </Field>
          </div>
          <div className="list-row"><Sprout size={16} /><span><b>Stage focus:</b> bulb initiation to early maturation</span></div>
        </Card>
        <div className="stack">
          <Notes title="Targeting notes" items={[
            `${w.villages.join(' and ') || 'No village selected'}: ${num(farmers)} farmers in the selected villages.`,
            `${p.crop === 'All crops' ? 'The campaign' : `${p.crop} conversion`} links to ${p.uplift ? lakh(p.uplift) : 'the existing'} plan-linked uplift in Ambad's plan.`,
          ]} />
          <Card title="Data-validation checks" icon={ListChecks}>
            <List items={[
              { icon: CircleAlert, tone: 'warn', label: 'Audience eligibility in CRM' },
              { icon: CircleAlert, tone: 'warn', label: 'Communication consent recorded' },
              { icon: w.retailers.length ? CircleCheck : CircleAlert, tone: w.retailers.length ? undefined : 'warn', label: 'Outlet linkage confirmed', value: `${w.retailers.length} retailers` },
            ]} />
          </Card>
        </div>
      </div>
    </FsmPage>
  );
}

// ================================================================ 8 Activity & Budget Mix
export function WizardActivities() {
  const go = useGo();
  const bh = useBhStore();
  const { w, set } = useWizard();
  const [tried, setTried] = useState(false);
  const errors = tried ? activityErrors(w) : {};
  const mix = budgetMix(w.activities);
  const upd = (id: string, patch: Partial<WizardActivity>) => set({ activities: w.activities.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const add = () => set({ activities: [...w.activities, { id: `activity-${Date.now()}`, name: 'New activity', units: 1, unitLabel: 'units', cost: 0.1, channel: CHANNELS[0], timing: TIMINGS[1], owner: '' }] });
  const remove = (id: string) => set({ activities: w.activities.filter((a) => a.id !== id) });
  const unassigned = w.activities.filter((a) => !a.owner).length;
  const next = () => {
    setTried(true);
    if (Object.keys(activityErrors(w)).length) { bh.toast('Each activity needs a name, units, an owner and a budget'); return; }
    set({ maxStep: Math.max(w.maxStep, 2) });
    go(F.scenario);
  };
  const phases = ['Preparation', 'Crop-stage window', 'Follow-up'] as const;

  return (
    <FsmPage section={SECTION} sectionTo={F.campaigns} trail={w.name} title="Activity & Budget Mix" back={F.objective} next={next}>
      <WizardTabs active={1} />
      <CampaignKpis w={w} />
        <Card title="Campaign activity planner" icon={ClipboardList} flush right={<>
          <Button small icon={Plus} onClick={add}>Add activity</Button>
          <Button small icon={Save} onClick={() => bh.toast(`Activity plan saved · ${lakh(mix.total, 2)}`)}>Save draft</Button>
        </>}>
          <DataTable rows={w.activities} rowKey={(a) => a.id}
            columns={[
              { key: 'n', header: 'Activity', render: (a) => <input className="input" style={{ minWidth: 150 }} aria-label={`Activity name ${a.id}`} value={a.name} onChange={(e) => upd(a.id, { name: e.target.value })} /> },
              { key: 'u', header: 'Planned units', align: 'center', render: (a) => <span className="row" style={{ justifyContent: 'center' }}><input className="num-input" style={{ width: 56 }} type="number" min={0} aria-label={`Units ${a.name}`} value={a.units} onChange={(e) => upd(a.id, { units: Math.max(0, Number(e.target.value) || 0) })} /><small>{a.unitLabel}</small></span> },
              { key: 'c', header: 'Village / channel', render: (a) => <Select label={`Channel ${a.name}`} value={a.channel} options={CHANNELS.map(opt)} onChange={(v) => upd(a.id, { channel: v })} /> },
              { key: 't', header: 'Timing', render: (a) => <Select label={`Timing ${a.name}`} value={a.timing} options={TIMINGS.map(opt)} onChange={(v) => upd(a.id, { timing: v })} /> },
              { key: 'o', header: 'Owner', render: (a) => <Select label={`Owner ${a.name}`} value={a.owner} options={[{ value: '', label: 'Select owner' }, ...OWNERS.map(opt)]} onChange={(v) => upd(a.id, { owner: v })} /> },
              { key: 'b', header: 'Budget (₹ L)', align: 'center', render: (a) => <input className="num-input" style={{ width: 70 }} type="number" min={0} step={0.05} aria-label={`Budget ${a.name}`} value={a.cost} onChange={(e) => upd(a.id, { cost: Math.max(0, Number(e.target.value) || 0) })} /> },
              { key: 'x', header: 'Remove', align: 'center', render: (a) => <><Button small icon={Trash2} title={`Remove ${a.name}`} onClick={() => remove(a.id)}>{''}</Button>{errors[a.id] && <small className="err">{errors[a.id]}</small>}</> },
            ]}
            total={{ n: 'Total', u: num(sum(w.activities, (a) => a.units)), b: <b>{lakh(mix.total, 2)}</b> }} />
          {errors.list && <small className="err" style={{ padding: 12 }}>{errors.list}</small>}
        </Card>
      <div className="grid g2">
        <div className="stack">
          <Card title="Crop-stage campaign calendar" icon={CalendarDays}>
            <div className="phases">
              {phases.map((ph) => (
                <div key={ph} className={ph === 'Crop-stage window' ? 'on' : ''}>
                  <b>{ph === 'Crop-stage window' ? 'Onion crop-stage window' : ph}</b>
                  {w.activities.filter((a) => PHASE_OF[a.timing] === ph).map((a) => <span key={a.id}>{a.name}</span>)}
                </div>
              ))}
            </div>
          </Card>
          <Card title="Campaign readiness" icon={ListChecks}>
            <List items={[
              { icon: unassigned ? CircleAlert : CircleCheck, tone: unassigned ? 'warn' : undefined, label: 'Owner assignment', value: unassigned ? `${unassigned} pending` : 'Complete' },
              { icon: CircleAlert, tone: 'warn', label: 'Agronomy content approval', value: 'Pending' },
              { icon: CircleAlert, tone: 'warn', label: 'Stock readiness', value: 'Not verified' },
              { icon: CircleAlert, tone: 'warn', label: 'Digital consent', value: 'Pending' },
            ]} />
          </Card>
        </div>
        <div className="stack">
          <Card title="Budget mix" icon={Coins}>
            {mix.rows.map((r) => (
              <div key={r.id} className="list-row"><span style={{ width: 120 }}>{r.name}</span><span style={{ flex: 1 }}><Bar value={r.sharePct} /></span><b>{pct(r.sharePct, 0)}</b></div>
            ))}
            <div className="list-row"><b>Total</b><b className="right">{pct(mix.total ? 100 : 0, 0)}</b></div>
          </Card>
          <Notes title="Activity mix notes" items={[
            `${mix.rows[0]?.name ?? 'The first activity'} takes ${pct(mix.rows[0]?.sharePct ?? 0, 0)} of the ${lakh(mix.total, 2)} budget.`,
            unassigned ? `${unassigned} activit${unassigned === 1 ? 'y needs' : 'ies need'} an owner.` : 'Every activity has an owner.',
          ]} />
        </div>
      </div>
    </FsmPage>
  );
}

// ================================================================ 9 Scenario & Expected Outcomes
export function WizardScenario() {
  const go = useGo();
  const bh = useBhStore();
  const { w, set, p } = useWizard();
  const [adjust, setAdjust] = useState(false);
  const scen = wizardScenarios(w);
  const chosen = scen.find((s) => s.id === w.scenario) ?? scen[1];
  const objective = p.uplift ?? 0;
  const cov = objectiveCoverage(chosen.sales, objective || chosen.sales);
  const farmers = sum(w.villages, (v) => VILLAGE_FARMERS[v] ?? 0);
  const f = funnel(w.assumptions, farmers);
  const a = w.assumptions;
  const setA = (k: keyof typeof a, v: number) => set({ assumptions: { ...a, [k]: v } });
  const next = () => { set({ maxStep: Math.max(w.maxStep, 3) }); go(F.wizardReview); };
  const stages = [
    { label: 'Eligible farmers', v: f.farmers }, { label: 'Reached', v: f.reached }, { label: 'Trial', v: f.trials }, { label: 'Adoption', v: f.adopters },
  ];

  return (
    <FsmPage section={SECTION} sectionTo={F.campaigns} trail={w.name} title="Scenario & Expected Outcomes" back={F.activities} next={next} nextLabel="Review campaign & submit">
      <WizardTabs active={2} />
      <div className="kpis">
        <KpiCard label="Campaign budget" value={lakh(chosen.budget, 2)} />
        <KpiCard label="Plan-linked growth objective" value={lakh(objective)} />
        <KpiCard label={`${chosen.name} incremental sales`} value={lakh(chosen.sales)} />
        <KpiCard label="Net ROI" value={times(chosen.netRoi)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}>
        <Card title="Scenario simulation" icon={ChartColumn} right={<Button small icon={Save} onClick={() => bh.toast(`${chosen.name} scenario saved`)}>Save draft</Button>}>
          <div className="scenarios">
            {scen.map((s) => (
              <button key={s.id} type="button" className={s.id === chosen.id ? 'on' : ''} aria-pressed={s.id === chosen.id} onClick={() => set({ scenario: s.id })}>
                <span className="row"><span className={`radio${s.id === chosen.id ? ' on' : ''}`} /><b>{s.name}</b>{s.id === 'base' && <StatusChip tone="ok">Recommended</StatusChip>}</span>
                <span className="list-row">Incremental sales<b className="right">{lakh(s.sales)}</b></span>
                <span className="list-row">Product volume<b className="right">{num(s.volumeMt)} MT</b></span>
                <span className="list-row">Contribution at 35%<b className="right">{lakh(s.contribution, 1)}</b></span>
                <span className="list-row">Net ROI<b className="right">{times(s.netRoi)}</b></span>
              </button>
            ))}
          </div>
        </Card>
        <Card title="Financial impact & plan linkage" icon={Target}>
          <List items={[
            { label: 'Plan-linked growth objective', value: lakh(objective) },
            { label: `${chosen.name} forecast`, value: lakh(chosen.sales) },
            { label: 'Remaining to be covered', value: lakh(Math.max(0, cov.remaining)), tone: 'warn' },
            { label: 'Share of objective covered', value: pct(Math.min(100, cov.coveredPct), 0) },
          ]} />
        </Card>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}>
        <Card title="Estimated conversion funnel" icon={Filter} right={<Button small icon={SlidersHorizontal} primary={adjust} onClick={() => setAdjust((x) => !x)}>{adjust ? 'Done' : 'Adjust assumptions'}</Button>}>
          <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)' }}>
            <div>
              {stages.map((s) => (
                <div key={s.label} className="list-row"><span style={{ width: 110 }}>{s.label}</span><span style={{ flex: 1 }}><Bar value={(s.v / Math.max(1, f.farmers)) * 100} /></span><b>{num(s.v)}</b></div>
              ))}
              <div className="list-row"><span style={{ width: 110 }}>Product volume</span><b className="right">{num(f.volumeMt)} MT · {lakh(f.sales, 1)}</b></div>
            </div>
            <div>
              {([['reachPct', 'Reach rate (%)'], ['trialPct', 'Trial rate of reached (%)'], ['adoptionPct', 'Adoption rate of trials (%)'], ['kgPerAcre', 'Application rate (kg/acre)'], ['acresPerAdopter', 'Acres per adopter'], ['rupeesPerKg', 'Realisation (₹/kg)']] as [keyof typeof a, string][]).map(([k, label]) => (
                <div key={k} className="list-row"><span>{label}</span><input className="num-input right" style={{ width: 70 }} type="number" min={0} disabled={!adjust} aria-label={label} value={a[k]} onChange={(e) => setA(k, Math.max(0, Number(e.target.value) || 0))} /></div>
              ))}
            </div>
          </div>
        </Card>
        <Notes title="Scenario notes" items={[
          `${chosen.name} case gives ${times(chosen.netRoi)} net ROI and covers ${pct(Math.min(100, cov.coveredPct), 0)} of the ${lakh(objective)} plan-linked objective.`,
          `At the current assumptions the funnel reaches ${num(f.adopters)} adopters and ${num(f.volumeMt)} MT (${lakh(f.sales, 1)}).`,
        ]} />
      </div>
    </FsmPage>
  );
}

// ================================================================ 10 Review & Submit
export function WizardReview() {
  const go = useGo();
  const bh = useBhStore();
  const fsm = useFsmStore();
  const { w, set, p } = useWizard();
  const file = useRef<HTMLInputElement>(null);
  const scen = wizardScenarios(w);
  const chosen = scen.find((s) => s.id === w.scenario) ?? scen[1];
  const objective = p.uplift ?? 0;
  const cov = objectiveCoverage(chosen.sales, objective || chosen.sales);
  const mix = budgetMix(w.activities);
  const launched = fsm.campaigns[w.priority] === 'launched';
  const valid = !Object.keys(objectiveErrors(w)).length && !Object.keys(activityErrors(w)).length;
  const r = w.readinessResolved;
  const checks: { label: string; ok: boolean; sub: string }[] = [
    { label: 'Approved plan linkage', ok: true, sub: `Aligned to ${lakh(objective)} plan-linked uplift` },
    { label: 'Owner assignment', ok: w.activities.every((a) => a.owner), sub: 'Activity owners confirmed' },
    { label: 'Stock readiness', ok: r, sub: 'Product availability at linked outlets' },
    { label: 'Agronomy / advisory content', ok: r, sub: 'Content and messaging approval' },
    { label: 'CRM audience & consent', ok: r, sub: 'Farmer eligibility and consent' },
  ];
  const submit = () => {
    if (!valid) { bh.toast('Complete the objective and activity steps first'); go(Object.keys(objectiveErrors(w)).length ? F.objective : F.activities); return; }
    fsm.launchCampaign();
    bh.toast(`${w.name} approved and launched`);
    go(F.execution);
  };

  return (
    <FsmPage section={SECTION} sectionTo={F.campaigns} trail={w.name} title="Review & Submit" back={F.scenario} next={submit} nextLabel="Submit for campaign approval"
      right={<StatusChip tone={launched ? 'ok' : 'warn'}>{launched ? 'Approved and launched' : checks.every((c) => c.ok) ? 'Draft · ready to submit' : 'Draft · pending validation'}</StatusChip>}>
      <WizardTabs active={3} />
      <div className="kpis">
        <KpiCard label="Campaign budget" value={lakh(mix.total, 2)} />
        <KpiCard label={`Forecast sales (${chosen.name.toLowerCase()})`} value={lakh(chosen.sales, 2)} />
        <KpiCard label="Product volume" value={`${num(chosen.volumeMt)} MT`} />
        <KpiCard label="Net ROI" value={times(chosen.netRoi)} />
      </div>
      <div className="grid g3">
        <Card title="Campaign summary" icon={Target}>
          <List items={[
            { label: 'Campaign', value: w.name },
            { label: 'Objective', value: w.objective },
            { label: 'Villages', value: w.villages.join(', ') },
            { label: 'Linked retailers', value: num(w.retailers.length) },
            { label: 'Target audience', value: w.audience },
            { label: 'Campaign type', value: w.campaignType },
            { label: 'Plan linkage', value: `${lakh(chosen.sales)} of ${lakh(objective)} (${pct(Math.min(100, cov.coveredPct), 0)})` },
          ]} />
        </Card>
        <Card title="Activity & budget summary" icon={ClipboardList} flush>
          <DataTable rows={w.activities} rowKey={(a) => a.id}
            columns={[
              { key: 'n', header: 'Activity', render: (a) => a.name },
              { key: 'u', header: 'Planned units', align: 'right', render: (a) => `${a.units} ${a.unitLabel}` },
              { key: 'b', header: 'Budget', align: 'right', render: (a) => lakh(a.cost, 2) },
            ]}
            total={{ n: 'Total', b: lakh(mix.total, 2) }} />
        </Card>
        <Card title="Readiness & validation" icon={ListChecks} right={<Button small onClick={() => { set({ readinessResolved: true }); bh.toast('Readiness checks confirmed'); }}>Resolve readiness</Button>}>
          <List items={checks.map((c) => ({ icon: c.ok ? CircleCheck : CircleAlert, tone: c.ok ? undefined : 'warn' as const, label: <span className="stack" style={{ gap: 0 }}><b>{c.label}</b><small>{c.sub}</small></span>, value: <StatusChip tone={c.ok ? 'ok' : 'warn'}>{c.ok ? 'Complete' : 'Pending'}</StatusChip> }))} />
        </Card>
      </div>
      <Card title="Submission rationale & references" icon={Paperclip} right={<>
        <input ref={file} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { set({ attachment: f.name }); bh.toast(`Attached ${f.name}`); } e.target.value = ''; }} />
        <Button small icon={Paperclip} onClick={() => file.current?.click()}>{w.attachment ? `Attached: ${w.attachment}` : 'Attach reference'}</Button>
        <Button small icon={Save} onClick={() => bh.toast('Campaign draft saved')}>Save draft</Button>
      </>}>
        <textarea className="input" rows={3} maxLength={500} aria-label="Submission rationale" value={w.rationale} onChange={(e) => set({ rationale: e.target.value })} />
        <small>{w.rationale.length} / 500</small>
      </Card>
    </FsmPage>
  );
}
