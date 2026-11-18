/**
 * Field Sales Manager - My Campaigns journey:
 * TM.C1 select a business priority -> Campaign Wizard CW.1-CW.4 -> TM.C2 review & approval -> TM.C3 my campaign portfolio.
 */
import { Fragment, useMemo, useRef, useState } from 'react';
import {
  CalendarRange, CheckCircle2, Eye, FlaskConical, Lock, MapPin, MessageSquare, Plus, Save, ShieldCheck, Trash2,
  Sprout, Store, Target, Users, Wallet, Smartphone, RefreshCw, Pencil,
} from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { Btn, cx } from '../ui';
import { ColumnBars } from '../ui/index';
import {
  ACTIVITIES, APPROVED, CAMPAIGN, CAMPAIGN_RETAILERS, PORTFOLIO, PORTFOLIO_MONTHS, PRIORITIES, SELECTED_RETAILERS, type ActivityLine,
} from './data';
import { APPROVAL_STEPS, setCampaignStage, stageLabel, useCampaignState } from './state';
import { AiPanel, Context, Footer, Note, Panel, Status, Steps, TmPage, WIZARD, crore, lakh } from './ui';
import { ApprovalPipeline, Donut, IconTiles, MAP_COLORS, Ring, StageTimeline, TmMap, VILLAGE_PLACE } from './viz';

const VILLAGE_CHOICES = ['Dhanora', 'Wadi Gaon', 'Ambad HQ', 'Pimpalgaon', 'Other villages'];
const MIX_COLORS = ['#2f8a3b', '#3972b8', '#d7a62f', '#8fb08a', '#c8553d'];
const ACTIVITY_ICONS = [Users, Store, Users, Smartphone, RefreshCw];
const PLACES = ['Dhanora / Wadi Gaon', 'Dhanora', 'Wadi Gaon', '3 linked retailers', 'Retailer channel', 'Village meetings', 'Consent-based digital', 'Field follow-up'];
const TIMINGS = ['Indicative crop-stage window', 'Pre-activation', 'Relevant crop-stage window', 'Follow-up support', 'Post-activity'];
const OWNERS = ['Select owner', 'R. Jadhav', 'S. Patil', 'V. Shinde', 'P. Kale'];

/** The four-step campaign journey shown on TM.C1, TM.C2 and TM.C3. */
const JOURNEY: { label: string; to: ScreenId }[] = [
  { label: 'Select Business Priority', to: 'tm.c1' },
  { label: 'Campaign Wizard', to: 'cw.1' },
  { label: 'Review & Approval', to: 'tm.c2' },
  { label: 'Campaign Portfolio', to: 'tm.c3' },
];

function PlanLink({ extra }: { extra?: { label: string; value: string; sub?: string }[] }) {
  return (
    <Context tone="green" items={[
      { label: 'Approved plan linked', value: 'Ambad ABP ₹4.20 Cr', sub: 'Plan v3 · targets reconciled' },
      { label: 'Onion approved crop allocation', value: crore(APPROVED.onion) },
      { label: 'Plan-linked growth objective', value: '₹25 L', sub: 'Already included in the ABP — not additional sales or a forecast' },
      ...(extra ?? []),
    ]} />
  );
}

/* ------------------------------------------------------------------ TM.C1 */
export function TmC1() {
  const [selected, setSelected] = useState('onion');
  const priority = PRIORITIES.find((p) => p.id === selected)!;
  const focusVillages: Record<string, string[]> = { onion: ['Dhanora', 'Wadi Gaon'], maize: ['Ambad HQ', 'Pimpalgaon'], retail: VILLAGE_CHOICES };
  return (
    <TmPage crumbs={[{ label: 'My Plan', to: 'tm.1' }, { label: 'Approved Ambad Plan', to: 'tm.5' }, { label: 'My Campaigns' }]}
      code="TM.C1" title="Choose a Growth Priority" status="Plan approved · ready for campaign design"
      subtitle="Create campaigns against approved growth objectives — not against unverified market opportunities.">
      <Steps active={0} steps={JOURNEY} onStep />
      <div className="tm-approved">
        <div className="tm-approved-head"><CheckCircle2 size={30} /><div><b>Approved Business Plan — Ambad</b><small>Jalna district · Plan v3 · Targets reconciled</small></div></div>
        <div><span>Approved ABP target</span><b>{crore(APPROVED.abp)}</b></div>
        <div><span>Growth vs. last year</span><b>+{crore(APPROVED.growth)}</b></div>
        <div><span>Approved crop mix</span><b>Onion {crore(APPROVED.onion)}</b><small>Maize {crore(APPROVED.maize)} · Other {crore(APPROVED.other)}</small></div>
        <Btn small to="tm.5">View Approved Plan</Btn>
      </div>
      <div className="pm-two">
        <Panel title="Where should a campaign support growth?">
          <p className="tm-muted">Choose one approved business priority. Campaign outcomes and investment are calculated in the next step.</p>
          <div className="table-wrap">
            <table className="dt pm-table tm-table">
              <thead><tr><th>Growth priority</th><th>Focus geography</th><th className="r">Plan-linked uplift</th><th>Campaign</th><th /></tr></thead>
              <tbody>
                {PRIORITIES.map((p) => (
                  <tr key={p.id} className={cx(p.id === selected && 'row-highlight', 'row-click')} onClick={() => setSelected(p.id)}>
                    <td><b>{p.title}</b><small className="tm-sub">{p.sub}</small></td>
                    <td>{p.geo}</td>
                    <td className="r">{p.uplift}</td>
                    <td><Status tone="grey">Not drafted</Status></td>
                    <td className="r">{p.id === selected ? <Status tone="green" solid>Selected ✓</Status> : <Btn small onClick={() => setSelected(p.id)}>Select</Btn>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>Growth objectives are already included in the ₹4.20 Cr approved plan; they are not additional revenue. Campaign impact is not yet forecast.</Note>
          <div className="tm-uplift-bar" aria-label="Plan-linked uplift inside the approved plan">
            <span style={{ flex: 380 }}>Base plan ₹3.80 Cr</span>
            <span className="onion" style={{ flex: 25 }} title="Onion ₹25 L" />
            <span className="maize" style={{ flex: 15 }} title="Maize ₹15 L" />
          </div>
          <div className="tm-uplift-legend"><span><i className="onion" />Onion uplift ₹25 L</span><span><i className="maize" />Maize uplift ₹15 L</span><span>= ₹4.20 Cr approved</span></div>
        </Panel>
        <Panel title="Selected business priority" tone="green">
          <h2 className="tm-selected-title">{priority.title}</h2>
          <p className="tm-muted">Use targeted field and retailer engagement to support approved growth.</p>
          <dl className="tm-facts">
            <div><dt>Linked business uplift</dt><dd>{priority.uplift}</dd></div>
            <div><dt>Coverage focus</dt><dd>{priority.coverage}</dd></div>
            <div><dt>Primary audience</dt><dd>{priority.audience}</dd></div>
            <div><dt>Suggested approach</dt><dd>{priority.approach}</dd></div>
          </dl>
          <Note tone="warn">Checks before activation: verify audience eligibility, approved content and stock readiness during campaign design.</Note>
          <Btn variant="primary" to="cw.1" disabled={selected !== 'onion'}>Create Campaign Draft → CW.1</Btn>
          {selected !== 'onion' && <small className="tm-muted">This showcase follows the Onion — Croptek conversion campaign.</small>}
        </Panel>
      </div>
      <div className="tm-map-row">
        <TmMap title="Priority geography" label="Villages targeted by the selected business priority" height={280}
          selected={VILLAGE_PLACE[focusVillages[selected][0]]}
          markers={VILLAGE_CHOICES.map((v) => ({
            id: VILLAGE_PLACE[v], label: v,
            color: focusVillages[selected].includes(v) ? MAP_COLORS.green : MAP_COLORS.grey,
            info: focusVillages[selected].includes(v) ? `${v}: in the ${priority.title} focus` : `${v}: outside this priority`,
          }))}
          markerLegend={[{ label: 'Priority focus', color: MAP_COLORS.green }, { label: 'Other Ambad villages', color: MAP_COLORS.grey }]} />
        <div className="pm-stack">
          <AiPanel title="AI Planning Insight"><p className="tm-ai-text">Prioritise the plan-linked Onion conversion; confirm reach, budget and expected incremental contribution in the Wizard.</p></AiPanel>
          <Panel title="Campaign Wizard">
            <div className="tm-mini-flow">
              {['Objective', 'Activities', 'Forecast', 'Submit'].map((s, i) => <span key={s}><b>{i + 1}</b>{s}</span>)}
            </div>
          </Panel>
        </div>
      </div>
      <Footer back={{ label: 'Back to My Plan (Approved)', to: 'tm.5' }} source="Approved Ambad Plan v3" next="CW.1 — Campaign Wizard"
        secondary={<Btn to="tm.c3">Campaign Portfolio</Btn>}
        primary={{ label: 'Create Campaign Draft', to: 'cw.1' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ CW.1 */
export function Cw1() {
  const { toast } = useNav();
  const [villages, setVillages] = useState(['Dhanora', 'Wadi Gaon']);
  const [retailers, setRetailers] = useState(SELECTED_RETAILERS);
  const [type, setType] = useState('Retailer-led conversion');
  const toggle = (list: string[], item: string) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const onionTarget: Record<string, number> = { Dhanora: 12, 'Wadi Gaon': 28, 'Ambad HQ': 42, Pimpalgaon: 23, 'Other villages': 60 };
  const covered = villages.reduce((sum, v) => sum + (onionTarget[v] ?? 0), 0);
  return (
    <TmPage crumbs={[{ label: 'My Campaigns', to: 'tm.c1' }, { label: 'Approved Ambad Plan', to: 'tm.c1' }, { label: 'Onion Croptek Conversion' }, { label: 'Campaign Wizard' }]}
      code="CW.1" title="Objective & Target Villages" status="Draft">
      <Steps steps={WIZARD} active={0} onStep />
      <PlanLink />
      <IconTiles items={[
        { icon: MapPin, value: villages.length, label: 'Target villages', note: villages.join(' · ') || 'None selected', tone: 'green' },
        { icon: Target, value: lakh(covered), label: 'Onion target in scope', note: 'of ₹165 L village plan' },
        { icon: Store, value: retailers.length, label: 'Linked retailers', note: 'Outlet linkage to confirm', tone: 'blue' },
        { icon: Users, value: 'Pending', label: 'Eligible audience', note: 'CRM cohort validation', tone: 'amber' },
      ]} />
      <div className="pm-two">
        <Panel title="Campaign configuration">
          <div className="pm-form pm-form-2">
            <label className="pm-field"><span>Campaign name</span><input defaultValue={CAMPAIGN.name} /></label>
            <label className="pm-field"><span>Campaign objective</span><input defaultValue="Convert Non Saarthi nutrition users" /></label>
          </div>
          <div className="pm-field"><span>Geography — target villages (or click the map)</span>
            <div className="tm-chips">{VILLAGE_CHOICES.map((v) => <button key={v} type="button" className={cx(villages.includes(v) && 'active')} onClick={() => setVillages((l) => toggle(l, v))}>{villages.includes(v) ? '✓ ' : ''}{v}</button>)}</div>
          </div>
          <div className="pm-field"><span>Linked outlets / retailers <em className="tm-muted">({retailers.length} selected)</em></span>
            <div className="tm-checklist-select">{CAMPAIGN_RETAILERS.map((r) => (
              <label key={r}><input type="checkbox" checked={retailers.includes(r)} onChange={() => setRetailers((l) => toggle(l, r))} /> {r}</label>
            ))}</div>
          </div>
          <div className="pm-form pm-form-2">
            <div className="pm-field"><span>Target farmer audience</span>
              <div className="tm-audience"><b>Conventional - Non Saarthi Onion Growers in selected Villages</b><Status>Pending CRM cohort validation</Status></div>
            </div>
            <label className="pm-field"><span>Preferred campaign type</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {['Retailer-led conversion', 'Field demonstration-led', 'Trial-to-purchase nurture'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          </div>
          <div className="pm-field"><span>Suggested crop-stage focus (onion, days from transplanting)</span>
            <StageTimeline focus={[1, 2]} caption="Illustrative planning guidance; agronomy validation required."
              stages={[{ label: 'Establishment', days: '0–20' }, { label: 'Vegetative', days: '21–45' }, { label: 'Bulb initiation', days: '46–70' }, { label: 'Bulb development', days: '71–100' }, { label: 'Maturity', days: '101–125' }]} />
          </div>
        </Panel>
        <div className="pm-stack">
          <TmMap title="Campaign geography" label="Ambad villages selected for the campaign" height={260}
            markers={VILLAGE_CHOICES.map((v) => ({
              id: VILLAGE_PLACE[v], label: v, color: villages.includes(v) ? MAP_COLORS.green : MAP_COLORS.grey,
              info: `${v} · onion target ${lakh(onionTarget[v])} · ${villages.includes(v) ? 'selected' : 'not selected'}`,
              onSelect: () => setVillages((l) => toggle(l, v)),
            }))}
            markerLegend={[{ label: 'Selected', color: MAP_COLORS.green }, { label: 'Not selected', color: MAP_COLORS.grey }]} />
          <AiPanel title="AI Targeting Recommendation">
            <p className="tm-ai-text"><b>Dhanora and Wadi Gaon</b> hold ₹40 L of the onion target and the plan's largest coverage growth, with active dealers and linked retailers already mapped.</p>
            <ul className="tm-ai-list">
              <li><ShieldCheck size={12} /> Audience eligibility must be verified from the CRM cohort.</li>
              <li><ShieldCheck size={12} /> Communication consent must be checked before any outreach.</li>
              <li><ShieldCheck size={12} /> Confirm outlet linkage for the {retailers.length} selected retailers.</li>
            </ul>
          </AiPanel>
        </div>
      </div>
      <Footer back={{ label: 'Back to Business Priorities', to: 'tm.c1' }} source="Approved business & crop plan · CRM cohort · selected outlets" next="CW.2 — Activity & Budget Mix"
        secondary={<Btn icon={<Save size={13} />} onClick={() => toast('Campaign draft saved.')}>Save Draft</Btn>}
        primary={{ label: 'Plan Activities & Budget', to: 'cw.2' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ CW.2 */
export function Cw2() {
  const { toast } = useNav();
  const [lines, setLines] = useState<ActivityLine[]>(ACTIVITIES);
  const activityInputs = useRef<(HTMLInputElement | null)[]>([]);
  const total = lines.reduce((sum, l) => sum + (Number.isFinite(l.budget) ? l.budget : 0), 0);
  const units = lines.reduce((sum, l) => sum + l.units, 0);
  const update = (index: number, patch: Partial<ActivityLine>) => setLines((all) => all.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  const addActivity = () => setLines((all) => [...all, { activity: 'New activity', units: 1, unitLabel: 'units', where: 'Select village / channel', timing: 'To schedule', owner: '', budget: 0 }]);
  const removeActivity = (index: number) => setLines((all) => all.filter((_, i) => i !== index));
  return (
    <TmPage crumbs={[{ label: 'My Campaigns', to: 'tm.c1' }, { label: CAMPAIGN.name, to: 'cw.1' }, { label: 'Campaign Wizard' }, { label: 'Activity & Budget Mix' }]}
      code="CW.2" title="Campaign Activity & Budget Mix Planner" status="Draft and editable">
      <Steps steps={WIZARD} active={1} onStep />
      <Context items={[
        { label: 'Campaign name', value: CAMPAIGN.name },
        { label: 'Geography (villages)', value: CAMPAIGN.villages },
        { label: 'Selected retailers', value: '3' },
        { label: 'Linked growth objective', value: '₹25 L', sub: 'Already included in approved Ambad ABP ₹4.20 Cr' },
      ]} />
      <div className="cw2-layout">
        <div className="cw2-main">
          <Panel title="Campaign Activity Planner" actions={<Btn small icon={<Plus size={12} />} onClick={addActivity}>Add Activity</Btn>}>
            <p className="cw2-edit-hint">Plan key campaign activities, targets, owners and draft budget. All values are <strong>DRAFT and EDITABLE</strong> (not approved).</p>
            <div className="table-wrap cw2-table-wrap">
              <table className="dt pm-table tm-table cw2-table">
                <thead><tr><th>Activity <em>*</em></th><th>Planned units <em>*</em></th><th>Village / channel <em>*</em></th><th>Tentative timing <em>*</em></th><th>Assigned owner <em>*</em></th><th className="r">Draft budget <em>*</em></th><th>Edit</th></tr></thead>
                <tbody>{lines.map((line, index) => (
                  <tr key={index}>
                    <td><div className="cw2-activity-cell"><span className="cw2-activity-icon" style={{ color: MIX_COLORS[index % MIX_COLORS.length] }}>{(() => { const Icon = ACTIVITY_ICONS[index % ACTIVITY_ICONS.length]; return <Icon size={16} />; })()}</span><input ref={(element) => { activityInputs.current[index] = element; }} value={line.activity} onChange={(e) => update(index, { activity: e.target.value })} aria-label={`Activity ${index + 1}`} /></div></td>
                    <td><div className="cw2-units"><input type="number" min={0} value={line.units} onChange={(e) => update(index, { units: Number(e.target.value) })} aria-label={`Planned units ${index + 1}`} /><input value={line.unitLabel} onChange={(e) => update(index, { unitLabel: e.target.value })} aria-label={`Unit type ${index + 1}`} /></div></td>
                    <td><input className="cw2-field" list="cw2-places" value={line.where} onChange={(e) => update(index, { where: e.target.value })} aria-label={`Village or channel ${index + 1}`} /></td>
                    <td><input className="cw2-field" list="cw2-timings" value={line.timing} onChange={(e) => update(index, { timing: e.target.value })} aria-label={`Tentative timing ${index + 1}`} /></td>
                    <td><input className="cw2-field" list="cw2-owners" value={line.owner} onChange={(e) => update(index, { owner: e.target.value })} placeholder="Select owner" aria-label={`Assigned owner ${index + 1}`} /></td>
                    <td className="r"><label className="cw2-money"><span>₹</span><input type="number" min={0} step={0.05} value={line.budget} onChange={(e) => update(index, { budget: Number(e.target.value) })} aria-label={`Draft budget ${index + 1}`} /><span>L</span></label></td>
                    <td><div className="cw2-row-actions"><button type="button" aria-label={`Focus ${line.activity} name`} title="Edit activity name" onClick={() => activityInputs.current[index]?.focus()}><Pencil size={13} /></button><button type="button" className="cw2-delete" aria-label={`Remove ${line.activity}`} title="Remove activity" onClick={() => removeActivity(index)}><Trash2 size={14} /></button></div></td>
                  </tr>
                ))}</tbody>
                <tfoot><tr><td>Total Draft Campaign Budget</td><td>{units} units</td><td colSpan={3} /><td className="r">{lakh(total, 2)}</td><td /></tr></tfoot>
              </table>
              <datalist id="cw2-places">{PLACES.map((item) => <option key={item} value={item} />)}</datalist>
              <datalist id="cw2-timings">{TIMINGS.map((item) => <option key={item} value={item} />)}</datalist>
              <datalist id="cw2-owners">{OWNERS.map((item) => <option key={item} value={item} />)}</datalist>
            </div>
          </Panel>
          <Panel title="Crop-Stage-Linked Campaign Calendar">
            <div className="cw2-calendar-head"><span>Indicative placement of key activities across campaign phases</span><Status>Timing requires Agronomy validation</Status></div>
            <div className="cw2-calendar-phases">{['Preparation', 'Relevant Onion Crop-Stage Window', 'Follow-up'].map((phase, phaseIndex) => (
              <section key={phase} className={phaseIndex === 1 ? 'active' : ''}><b>{phase}</b><ul>{lines.filter((line) => phaseIndex === 0 ? /preparation|pre-activation/i.test(line.timing) : phaseIndex === 1 ? /stage window|bulb|crop-stage/i.test(line.timing) : /after|follow/i.test(line.timing)).map((line, i) => <li key={`${line.activity}-${i}`}>{line.activity}</li>)}</ul></section>
            ))}</div>
          </Panel>
          <Panel title="Campaign Readiness (Key Checks)" className="cw2-readiness-panel">
            <div className="cw2-readiness-grid"><Status>Owner assignment pending (2)</Status><Status>Agronomy content approval pending</Status><Status>Stock readiness not yet verified</Status><Status>Digital consent verification required</Status></div>
          </Panel>
        </div>
        <aside className="cw2-side">
          <Panel title="Budget Mix (Draft & Editable)" className="cw2-budget-panel">
            {lines.map((line, index) => <div className="cw2-budget-row" key={index}><span>{line.activity}</span><div className="cw2-budget-track"><i style={{ width: `${total > 0 ? Math.max(0, line.budget / total * 100) : 0}%`, background: MIX_COLORS[index % MIX_COLORS.length] }} /></div><b>{total > 0 ? Math.round(line.budget / total * 100) : 0}%</b></div>)}
            <div className="cw2-budget-total"><b>Total</b><b>{total > 0 ? Math.round(lines.reduce((sum, line) => sum + (total ? line.budget / total * 100 : 0), 0)) : 0}%</b></div>
            <div className="cw2-budget-sum">Total draft budget <strong>{lakh(total, 2)}</strong></div>
          </Panel>
          <AiPanel title="AI Activity Mix Recommendation">
            <ul className="tm-ai-list"><li>Prioritize demonstrations and retailer engagement in Dhanora and Wadi Gaon.</li><li>Confirm programme timing before booking demonstrations.</li><li>Verify stock and communication consent before activation.</li></ul>
          </AiPanel>
        </aside>
      </div>
      <Footer back={{ label: 'Back to CW.1 (Objective & Targeting)', to: 'cw.1' }}
        secondary={<Btn icon={<Save size={13} />} onClick={() => toast('Activity plan saved as draft.')}>Save Draft</Btn>}
        primary={{ label: 'Scenario & Expected Outcomes', to: 'cw.3' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ CW.3 */
const SCENARIOS = [
  { name: 'Conservative', mt: 8 },
  { name: 'Base Case', mt: 12 },
  { name: 'Optimistic', mt: 16 },
];

export function Cw3() {
  const { toast } = useNav();
  const [selected, setSelected] = useState('Base Case');
  const [realisation, setRealisation] = useState(100);
  const [margin, setMargin] = useState(35);
  const [reachPct, setReachPct] = useState(25);
  const [adoptPct, setAdoptPct] = useState(45);
  const [editing, setEditing] = useState(false);
  const cost = 3.0;
  const rows = useMemo(() => SCENARIOS.map((s) => {
    const sales = (s.mt * 1000 * realisation) / 1e5; // lakh
    const contribution = sales * (margin / 100);
    return { ...s, sales, contribution, roi: (contribution - cost) / cost };
  }), [realisation, margin]);
  const base = rows.find((r) => r.name === selected)!;
  const reached = 640;
  const trials = Math.round(reached * (reachPct / 100));
  const adopters = Math.round(trials * (adoptPct / 100));
  const coverage = (base.sales / 25) * 100;
  return (
    <TmPage crumbs={[{ label: 'My Campaigns', to: 'tm.c1' }, { label: CAMPAIGN.name, to: 'cw.1' }, { label: 'Campaign Wizard' }, { label: 'Scenario & Expected Outcomes' }]}
      code="CW.3" title="Expected Results" status="Forecast · assumptions unvalidated">
      <Steps steps={WIZARD} active={2} onStep />
      <Context items={[
        { label: 'Campaign', value: CAMPAIGN.name, sub: CAMPAIGN.villages },
        { label: 'Draft campaign budget', value: '₹3.00 L' },
        { label: 'Plan-linked objective', value: '₹25 L', sub: 'Already included in approved ABP ₹4.20 Cr' },
      ]} />
      <Panel title="Scenario simulator" actions={<>
        <Btn small onClick={() => setEditing((e) => !e)}>{editing ? 'Done' : 'Adjust Assumptions'}</Btn>
        <Btn small variant="primary" onClick={() => { setSelected('Base Case'); toast('Base scenario selected. Approvals are still pending.'); }}>Select Base Scenario</Btn>
      </>}>
        {editing && (
          <div className="tm-assumptions">
            <label>Average realisation <span>₹<input type="number" value={realisation} onChange={(e) => setRealisation(Number(e.target.value))} />/kg</span></label>
            <label>Contribution margin <span><input type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />%</span></label>
            <label>Campaign cost <span>₹{cost.toFixed(2)} L (from CW.2)</span></label>
          </div>
        )}
        <div className="tm-scenarios">
          {rows.map((r) => (
            <button key={r.name} type="button" className={cx('tm-scenario', r.name === selected && 'active')} onClick={() => setSelected(r.name)}>
              <span className="tm-scenario-name">{r.name}{r.name === selected && <Status tone="green" solid>Selected</Status>}</span>
              <dl>
                <div><dt>Forecast incremental sales</dt><dd>{lakh(r.sales)}</dd></div>
                <div><dt>Product volume</dt><dd>{r.mt} MT</dd></div>
                <div><dt>Incremental contribution</dt><dd>{lakh(r.contribution, 1)}</dd></div>
                <div><dt>Net ROI</dt><dd className={r.roi < 0 ? 'tm-neg' : 'tm-pos'}>{r.roi >= 0 ? '+' : '−'}{Math.abs(r.roi).toFixed(2)}×</dd></div>
              </dl>
              <div className="tm-roi-bar"><i className={r.roi < 0 ? 'neg' : ''} style={{ width: `${Math.min(100, Math.abs(r.roi) * 100)}%` }} /></div>
            </button>
          ))}
        </div>
        <Note>Forecasts assume ₹{realisation}/kg realisation and {margin}% contribution margin. Net ROI = (contribution − ₹3.0 L cost) ÷ ₹3.0 L. These are not actual results.</Note>
      </Panel>
      <div className="tm-viz-row">
        <Panel title="Sales, contribution and cost by scenario">
          <ColumnBars x="name" height={220} fmt={(v) => `₹${v}L`}
            series={[{ key: 'sales', name: 'Forecast sales' }, { key: 'contribution', name: 'Contribution' }, { key: 'cost', name: 'Campaign cost' }]}
            data={rows.map((r) => ({ name: r.name, sales: Number(r.sales.toFixed(1)), contribution: Number(r.contribution.toFixed(1)), cost }))} />
        </Panel>
        <Panel title={`${selected} at a glance`}>
          <div className="tm-ring-row">
            <Ring value={coverage} label={`${coverage.toFixed(0)}%`} sub="of ₹25 L objective" tone={coverage >= 100 ? 'green' : 'amber'} />
            <Ring value={Math.max(0, base.roi * 100)} label={`${base.roi >= 0 ? '+' : '−'}${Math.abs(base.roi).toFixed(2)}×`} sub="modelled net ROI" tone={base.roi >= 0 ? 'green' : 'red'} />
          </div>
          <div className="tm-recon">
            <div><span>{selected} forecast</span><b>{lakh(base.sales)}</b></div>
            <div className="tm-recon-gap"><span>Left for other interventions</span><b>{lakh(Math.max(25 - base.sales, 0))}</b></div>
          </div>
        </Panel>
      </div>
      <div className="pm-two">
        <Panel title="Estimated farmer conversion funnel">
          <div className="tm-funnel">
            {[
              { label: 'Eligible audience', value: 'Pending CRM validation', w: 100 },
              { label: 'Reached (planned)', value: reached.toLocaleString('en-IN'), w: 86 },
              { label: `Trial (${reachPct}% of reached)`, value: trials.toLocaleString('en-IN'), w: 66 },
              { label: `Adoption (${adoptPct}% of trials)`, value: adopters.toLocaleString('en-IN'), w: 48 },
              { label: 'Projected product volume', value: `${base.mt} MT`, w: 36 },
            ].map((s) => <div key={s.label} className="tm-funnel-step" style={{ width: `${s.w}%` }}><span>{s.label}</span><b>{s.value}</b></div>)}
          </div>
          <div className="tm-assumptions">
            <label>Reach → trial <span><input type="number" value={reachPct} onChange={(e) => setReachPct(Number(e.target.value))} />%</span></label>
            <label>Trial → adoption <span><input type="number" value={adoptPct} onChange={(e) => setAdoptPct(Number(e.target.value))} />%</span></label>
          </div>
        </Panel>
        <AiPanel title="AI Scenario Recommendation">
          <p className="tm-ai-text">The base scenario is positive on modelled net ROI but covers only {Math.round((rows[1].sales / 25) * 100)}% of the plan-linked objective. Evaluate higher conversion and complementary approved interventions. Confidence depends on CRM cohort, realisation, margin, stock and agronomy validation.</p>
          <small className="tm-muted">The ₹25 L sits inside the approved ABP; the campaign forecast is not additional business.</small>
        </AiPanel>
      </div>
      <Footer back={{ label: 'Back to Activity & Budget Mix', to: 'cw.2' }} source="CW.2 budget, planning assumptions (unvalidated)" next="CW.4 — Review & Submit"
        secondary={<Btn icon={<Save size={13} />} onClick={() => toast('Scenario saved as draft.')}>Save Draft</Btn>}
        primary={{ label: 'Review Campaign & Submit', to: 'cw.4' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ CW.4 */
interface Readiness { label: string; status: string; mandatory: boolean; resolved: boolean; done?: string }
const READINESS: Readiness[] = [
  { label: 'Approved plan linkage', status: 'Complete', mandatory: true, resolved: true },
  { label: 'Owner assignment (2 activities)', status: 'Pending', mandatory: false, resolved: false, done: 'Owners assigned' },
  { label: 'Stock readiness', status: 'Not verified', mandatory: false, resolved: false, done: 'Verified with channel manager' },
  { label: 'Agronomy / advisory content approval', status: 'Pending', mandatory: false, resolved: false, done: 'Submitted for content review' },
  { label: 'CRM audience eligibility', status: 'Validation required', mandatory: true, resolved: false, done: 'Validated' },
  { label: 'Communication consent', status: 'Validation required', mandatory: true, resolved: false, done: 'Validated' },
];

export function Cw4() {
  const { toast, go } = useNav();
  const { stage } = useCampaignState();
  const submitted = stage >= 1;
  // Once submitted, the mandatory items were necessarily resolved (submission is blocked otherwise).
  const [items, setItems] = useState(() => (submitted ? READINESS.map((i) => (i.mandatory ? { ...i, resolved: true } : i)) : READINESS));
  const blockers = items.filter((i) => i.mandatory && !i.resolved);
  const resolvedCount = items.filter((i) => i.resolved).length;
  const resolve = () => {
    setItems((all) => all.map((i) => (i.mandatory ? { ...i, resolved: true } : i)));
    toast('Mandatory items resolved: CRM eligibility and consent validated. Non-critical items stay open as submission conditions.');
  };
  const status = submitted ? stageLabel(stage) : blockers.length ? 'Draft — Pending Validation' : 'Draft — ready to submit';
  return (
    <TmPage crumbs={[{ label: 'My Campaigns', to: 'tm.c1' }, { label: CAMPAIGN.name, to: 'cw.1' }, { label: 'Campaign Wizard' }, { label: 'Review & Submit' }]}
      code="CW.4" title="Campaign Review, Approval & Submission" status={status}>
      <Steps steps={WIZARD} active={3} onStep />
      <Panel title={`Campaign approval brief — ${CAMPAIGN.name}`}>
        <div className="tm-brief">
          <dl className="tm-facts">
            <div><dt>Villages</dt><dd>Dhanora and Wadi Gaon</dd></div>
            <div><dt>Approach</dt><dd>Retailer-led conversion of eligible Non Saarthi nutrition users</dd></div>
            <div><dt>Linked retailers</dt><dd>3</dd></div>
            <div><dt>Audience</dt><dd><Status>{items[4].resolved ? 'Validated' : 'Validation pending'}</Status></dd></div>
          </dl>
          <div className="tm-brief-nums">
            <div><span>Draft campaign budget</span><b>₹3.00 L</b></div>
            <div><span>Base forecast incremental sales</span><b>₹12 L</b><small>12 MT at assumed ₹100/kg</small></div>
            <div><span>Contribution (35% margin)</span><b>₹4.2 L</b></div>
            <div><span>Net ROI</span><b>+0.40×</b><small>(₹4.2 L − ₹3.0 L) ÷ ₹3.0 L</small></div>
          </div>
        </div>
        <div className="tm-objective-bar" aria-label="Objective coverage">
          <span className="forecast" style={{ flex: 12 }}>Campaign forecast ₹12 L (48%)</span>
          <span className="other" style={{ flex: 13 }}>Other interventions ₹13 L</span>
        </div>
        <Note>Plan linkage: the ₹25 L growth objective is already inside the approved Ambad ABP (₹4.20 Cr). Forecasts are not actuals and are not double counted.</Note>
      </Panel>
      <div className="tm-viz-row">
        <Panel title="Activity & budget summary">
          <Donut center="₹3.00 L" sub="13 activities" size={130} segments={ACTIVITIES.map((a, i) => ({ label: `${a.activity} · ${a.units} ${a.unitLabel}`, value: a.budget, color: MIX_COLORS[i] }))} />
        </Panel>
        <Panel title="Readiness checklist" tone={blockers.length ? 'warn' : undefined}>
          <div className="tm-ready-head">
            <Ring value={(resolvedCount / items.length) * 100} label={`${resolvedCount}/${items.length}`} sub="items ready" tone={blockers.length ? 'amber' : 'green'} size={86} />
            <div>
              <b>{blockers.length ? `${blockers.length} mandatory blocker${blockers.length > 1 ? 's' : ''}` : 'No mandatory blockers'}</b>
              <small className="tm-muted">Non-critical items may be submitted as conditions.</small>
              {blockers.length > 0 && <Btn small onClick={resolve}>Resolve Readiness</Btn>}
            </div>
          </div>
          <ul className="tm-checks">
            {items.map((i) => (
              <li key={i.label} className={i.resolved ? 'ok' : i.mandatory ? 'risk' : 'warn'}>
                <span>{i.label}{i.mandatory && !i.resolved && <em className="tm-blocker">Mandatory</em>}</span>
                <Status>{i.resolved ? (i.done ?? i.status) : i.status}</Status>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
      <Panel title="Approval routing">
        <ApprovalPipeline current={submitted ? stage : 0} steps={APPROVAL_STEPS.map((s, i) => ({ ...s, skipped: i === 3 }))} />
        <Note>Submission is not launch authorisation. Mandatory blockers prevent submission, and launch stays <Lock size={11} /> locked until approvals are complete. Business Head escalation applies only above ₹5 L.</Note>
        <label className="pm-field"><span>Submission rationale</span><textarea className="tm-textarea" rows={2} defaultValue="Supports the approved Onion growth objective in Dhanora and Wadi Gaon; base scenario ROI +0.40× (forecast)." /></label>
      </Panel>
      <Footer back={{ label: 'Back to Scenario', to: 'cw.3' }} source="CW.1–CW.3 inputs, approved plan v3" next={submitted ? 'TM.C2 — Review & Approval tracker' : 'Resolve mandatory readiness, then submit'}
        secondary={<>
          <Btn icon={<Save size={13} />} onClick={() => toast('Campaign saved as draft.')}>Save Draft</Btn>
          {submitted && <Btn to="tm.c2" icon={<Eye size={13} />}>Track Approval</Btn>}
        </>}
        primary={{ label: submitted ? 'Submitted for Campaign Approval' : 'Submit for Campaign Approval', disabled: blockers.length > 0 || submitted,
          onClick: () => { setCampaignStage(1); toast('Submitted for campaign approval. Opening the approval tracker.'); go('tm.c2'); } }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.C2 */
const COMMENTS = [
  { at: 1, who: 'Zonal Manager — Crop Nutrition', text: 'Advisory content uses approved Croptek onion claims only. Leaflet v0.3 cleared; WhatsApp creative needs Marathi proofreading (condition).', tone: 'ok' },
  { at: 2, who: 'Marketing Head — West Region', text: 'Approved at ₹3.00 L. Condition: confirm Dhanora demo stock before Week 2 and keep consent logs for the digital wave.', tone: 'ok' },
];

export function TmC2() {
  const { toast } = useNav();
  const { stage } = useCampaignState();
  const submitted = stage >= 1;
  const approved = stage >= 3;
  const daysOpen = submitted ? [0, 1, 3, 4][stage] : 0;
  return (
    <TmPage crumbs={[{ label: 'My Campaigns', to: 'tm.c1' }, { label: CAMPAIGN.name, to: 'cw.4' }, { label: 'Review & Approval' }]}
      code="TM.C2" title="Approval Status" status={submitted ? stageLabel(stage) : 'Not yet submitted'}
      subtitle="Follow the campaign through content review and Marketing Head approval. Launch unlocks only after approval.">
      <Steps active={2} steps={JOURNEY} onStep />
      {!submitted && (
        <Note tone="warn">This campaign has not been submitted yet. Complete CW.4 — Review & Submit (resolve the mandatory readiness items, then submit).</Note>
      )}
      <IconTiles items={[
        { icon: CheckCircle2, value: `${Math.max(stage, 0)} / 3`, label: 'Approval steps complete', note: 'Business Head step not required', tone: approved ? 'green' : 'amber' },
        { icon: CalendarRange, value: `${daysOpen} day${daysOpen === 1 ? '' : 's'}`, label: 'Time in approval', note: 'SLA: 5 working days end to end' },
        { icon: Wallet, value: '₹3.00 L', label: approved ? 'Approved budget' : 'Requested budget', note: 'Below ₹5 L Business Head threshold', tone: 'blue' },
        { icon: Lock, value: approved ? 'Unlocked' : 'Locked', label: 'Launch authorisation', note: approved ? 'Ready for execution' : 'Until Marketing Head approves', tone: approved ? 'green' : 'grey' },
      ]} />
      <Panel title="Approval pipeline" actions={submitted && !approved
        ? <Btn small variant="primary" onClick={() => { setCampaignStage(stage + 1); toast(stage + 1 === 3 ? 'Marketing Head approved the campaign (showcase). Launch unlocked.' : 'Content review completed (showcase).'); }}>Showcase: advance approval</Btn>
        : undefined}>
        <ApprovalPipeline current={submitted ? stage : 0} steps={APPROVAL_STEPS.map((s, i) => ({ ...s, skipped: i === 3 }))} />
      </Panel>
      <div className="pm-two">
        <Panel title="Review comments & conditions" icon={<MessageSquare size={14} />}>
          {COMMENTS.filter((c) => stage > c.at).length === 0
            ? <p className="tm-muted">No reviewer comments yet.{submitted ? ' Content review is in progress.' : ''}</p>
            : (
              <ul className="tm-comments">
                {COMMENTS.filter((c) => stage > c.at).map((c) => <li key={c.who}><b>{c.who}</b><p>{c.text}</p></li>)}
              </ul>
            )}
          <label className="pm-field"><span>Reply to reviewers</span><textarea className="tm-textarea" rows={2} placeholder="e.g. Stock confirmation requested from channel manager." /></label>
          <div className="tm-row-actions"><Btn small onClick={() => toast('Reply posted to the approval thread.')}>Post Reply</Btn></div>
        </Panel>
        <div className="pm-stack">
          <Panel title="Submitted package">
            <ul className="tm-checks">
              <li className="ok"><span>Campaign brief & budget</span><Status>Attached</Status></li>
              <li className="ok"><span>Base-case scenario (+0.40× forecast ROI)</span><Status>Attached</Status></li>
              <li className={stage >= 2 ? 'ok' : 'warn'}><span>Advisory content (leaflet, WhatsApp)</span><Status>{stage >= 2 ? 'Reviewed — with conditions' : 'In review'}</Status></li>
              <li className="warn"><span>Stock readiness</span><Status>Condition — confirm before Week 2</Status></li>
            </ul>
          </Panel>
          <AiPanel title="AI Approval Assistant">
            <p className="tm-ai-text">{approved
              ? 'Approved with two conditions. Confirm Dhanora demo stock and keep consent logs before activating the digital wave.'
              : 'Typical approvals for campaigns under ₹5 L complete in 4–5 working days. Pre-confirming demo stock usually avoids a conditional approval.'}</p>
          </AiPanel>
        </div>
      </div>
      <Footer back={{ label: 'Back to Review & Submit', to: 'cw.4' }} source="Approval workflow (showcase simulation)"
        next={approved ? 'TM.C3 — Campaign Portfolio, then Campaign Execution' : 'Await reviewer decisions'}
        secondary={approved ? <Btn to="tm.ex1">Open Activity Tracker</Btn> : undefined}
        primary={{ label: 'Campaign Portfolio', to: 'tm.c3' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.C3 */
const STAGES = ['Not drafted', 'Draft', 'In approval', 'Approved', 'Live', 'Completed'] as const;

export function TmC3() {
  const { go } = useNav();
  const { stage } = useCampaignState();
  const onionStage = stage >= 3 ? 'Approved' : stage >= 1 ? 'In approval' : 'Draft';
  const campaigns = PORTFOLIO.map((c, i) => (i === 0 ? { ...c, stage: onionStage as typeof c.stage } : c));
  const current = campaigns.filter((c) => c.season === 'Rabi 2025–26');
  const budgetSum = current.reduce((sum, c) => sum + (c.budget ?? 0), 0);
  const [selected, setSelected] = useState(campaigns[0].name);
  const open = campaigns.find((c) => c.name === selected)!;
  const villageCampaigns = (village: string) => current.filter((c) => c.villages.includes(village));
  return (
    <TmPage crumbs={[{ label: 'My Campaigns', to: 'tm.c1' }, { label: 'Campaign Portfolio' }]}
      code="TM.C3" title="Campaign Portfolio" subtitle="All campaigns supporting the approved Ambad plan this season, with last season's results for reference.">
      <Steps active={3} steps={JOURNEY} onStep />
      <IconTiles items={[
        { icon: Target, value: current.length, label: 'Campaigns this season', note: `1 ${onionStage.toLowerCase()} · 1 draft · 1 idea`, tone: 'green' },
        { icon: Wallet, value: lakh(budgetSum, 2), label: 'Campaign budget requested', note: 'Onion ₹3.00 L + Maize ₹2.20 L (draft)', tone: 'amber' },
        { icon: Sprout, value: '₹40 L', label: 'Plan-linked growth covered', note: 'Onion ₹25 L + Maize ₹15 L objectives', tone: 'blue' },
        { icon: FlaskConical, value: '1.6×', label: 'Last-season campaign ROI', note: 'Kharif 2025 average (2 campaigns)' },
      ]} />
      <Panel title="Campaign pipeline">
        <div className="tm-pipeline-board">
          {STAGES.map((s) => {
            const inStage = campaigns.filter((c) => c.stage === s);
            return (
              <div key={s} className={cx('tm-board-col', inStage.length > 0 && 'has')}>
                <header><span>{s}</span><b>{inStage.length}</b></header>
                {inStage.map((c) => (
                  <button key={c.name} type="button" className={cx('tm-board-card', c.name === selected && 'active')} onClick={() => setSelected(c.name)} style={{ borderLeftColor: c.color }}>
                    <b>{c.name}</b><small>{c.crop} · {c.season}</small>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </Panel>
      <div className="tm-viz-row">
        <Panel title="Budget by campaign (this season)">
          <Donut center={lakh(budgetSum, 2)} sub="requested" segments={current.filter((c) => c.budget).map((c) => ({ label: c.name.replace('Ambad ', ''), value: c.budget!, color: c.color }))} />
        </Panel>
        <Panel title="Objective vs forecast">
          <div className="tm-obj-rows">
            <div><span>Onion conversion</span><div className="tm-obj-track"><i style={{ width: '48%' }} /><em style={{ left: '100%' }} /></div><b>₹12 L of ₹25 L</b></div>
            <div><span>Maize expansion</span><div className="tm-obj-track"><i className="none" style={{ width: '0%' }} /><em style={{ left: '100%' }} /></div><b>Not modelled · ₹15 L</b></div>
          </div>
          <small className="tm-muted">Forecasts are planning estimates; objectives are already inside the ₹4.20 Cr ABP.</small>
        </Panel>
        <TmMap title="Campaign footprint" label="Ambad villages covered by this season's campaigns" height={240}
          markers={VILLAGE_CHOICES.map((v) => {
            const list = villageCampaigns(v);
            return {
              id: VILLAGE_PLACE[v], label: v,
              color: list[0]?.color ?? MAP_COLORS.grey,
              info: list.length ? <><b>{v}</b><br />{list.map((c) => c.name).join(' · ')}</> : `${v}: no campaign yet`,
              onSelect: list[0] ? () => setSelected(list[0].name) : undefined,
            };
          })}
          markerLegend={[{ label: 'Onion', color: '#2f8a3b' }, { label: 'Maize', color: '#d7a62f' }, { label: 'Retailer programme', color: '#9aa79c' }]} />
      </div>
      <Panel title="Season timeline">
        <div className="wide-scroll">
          <div className="tm-timeline-grid" style={{ gridTemplateColumns: `200px repeat(${PORTFOLIO_MONTHS.length}, minmax(44px, 1fr))` }}>
            <span style={{ gridRow: 1 }} />{PORTFOLIO_MONTHS.map((m, i) => <span key={m + i} style={{ gridRow: 1 }} className={cx('tm-tl-month', i === 5 && 'now')}>{m}{i === 5 ? ' · now' : ''}</span>)}
            {campaigns.map((c, row) => (
              <Fragment key={c.name}>
                <button type="button" className={cx('tm-tl-label', c.name === selected && 'active')} style={{ gridRow: row + 2, gridColumn: 1 }} onClick={() => setSelected(c.name)}>{c.name}<small>{c.stage}</small></button>
                <i className="tm-tl-bar" style={{ gridRow: row + 2, gridColumn: `${c.months[0] + 2} / ${c.months[1] + 3}`, background: c.color, opacity: c.stage === 'Completed' ? 0.55 : c.stage === 'Not drafted' ? 0.35 : 1 }} />
              </Fragment>
            ))}
          </div>
        </div>
      </Panel>
      <div className="pm-two">
        <Panel title={open.name} tone="soft">
          <dl className="tm-facts">
            <div><dt>Crop · season</dt><dd>{open.crop} · {open.season}</dd></div>
            <div><dt>Villages</dt><dd>{open.villages.join(', ')}</dd></div>
            <div><dt>Budget</dt><dd>{open.budget ? lakh(open.budget, 2) : 'Not drafted'}</dd></div>
            <div><dt>Plan-linked objective</dt><dd>{open.objective}</dd></div>
            <div><dt>Forecast / result</dt><dd>{open.result ?? open.forecast}</dd></div>
            <div><dt>Status</dt><dd><Status>{open.stage}</Status></dd></div>
          </dl>
          <div className="tm-row-actions">
            {open.name === CAMPAIGN.name && <>
              <Btn small onClick={() => go('tm.c2')}>Approval tracker</Btn>
              <Btn small variant="primary" onClick={() => go(stage >= 3 ? 'tm.ex1' : 'cw.4')}>{stage >= 3 ? 'Open Activity Tracker' : 'Open in Wizard'}</Btn>
            </>}
            {open.stage === 'Draft' && <Btn small onClick={() => go('tm.c1')}>Continue draft</Btn>}
            {open.stage === 'Not drafted' && <Btn small onClick={() => go('tm.c1')}>Create from priority</Btn>}
            {open.stage === 'Completed' && <Btn small onClick={() => go('tm.im1')}>View results</Btn>}
          </div>
        </Panel>
        <AiPanel title="AI Portfolio Insight">
          <ul className="tm-ai-list">
            <li>Onion and Maize campaigns cover the full ₹40 L plan-linked uplift, but only Onion has a modelled forecast (48% of its objective).</li>
            <li>Last season's soybean sulphur campaign returned 1.8× — reuse its retailer-led format for the Maize draft.</li>
            <li>Ambad HQ is targeted by two campaigns; stagger activities to avoid retailer fatigue.</li>
          </ul>
        </AiPanel>
      </div>
      <Footer back={{ label: 'Back to Business Priorities', to: 'tm.c1' }} source="Campaign records, Kharif 2025 results (illustrative)"
        next={stage >= 3 ? 'Campaign Execution — Activity Tracker' : 'Campaign approval, then execution'}
        primary={{ label: stage >= 3 ? 'Go to Campaign Execution' : 'Track Approval', to: stage >= 3 ? 'tm.ex1' : 'tm.c2' }} />
    </TmPage>
  );
}
