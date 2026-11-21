/** Screens 11–12 — Campaign Execution: live control tower and activity corrective action. */
import { CalendarCheck, CalendarDays, Camera, CircleAlert, CircleCheck, ClipboardCheck, ClipboardList, FileText, Lightbulb, ListChecks, TriangleAlert, Upload, Users, Wrench, type LucideIcon } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { lakh, num } from '../../data/format';
import {
  ACTION_REASONS, activityName, AT_RISK_ACTIVITY, budgetMix, CAMPAIGN_ACTIVITIES, CORRECTIVE_ACTIONS, executionCounts, FSM_CAMPAIGN, OWNERS, READINESS,
  statusAfter, UNIT_STATUS_LABEL, unitsWith, type ActivityUnit, type UnitStatus,
} from '../../data/fsm';
import { F } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useFsmStore } from '../../store/fsmStore';
import { Button, Card, FilterRows, KpiCard, Select, StatusChip, type Tone } from '../../ui/core';
import { DataTable } from '../../ui/DataTable';
import { ALL, useGo } from '../common';
import { FsmPage } from './frame';

const SECTION = 'Campaign execution';
const opt = (value: string, label = value) => ({ value, label });
const TONE: Record<UnitStatus, Tone> = { completed: 'ok', scheduled: 'neutral', at_risk: 'warn', rescheduled: 'info', escalated: 'risk' };
const ICON: Record<UnitStatus, LucideIcon> = { completed: CircleCheck, scheduled: CalendarDays, at_risk: TriangleAlert, rescheduled: CalendarCheck, escalated: CircleAlert };

function List({ items }: { items: { icon?: LucideIcon; label: ReactNode; value?: ReactNode; tone?: 'warn' }[] }) {
  return <>{items.map((i, k) => <div key={k} className="list-row">{i.icon && <i.icon size={16} color={i.tone === 'warn' ? 'var(--amber)' : undefined} />}<span>{i.label}</span>{i.value !== undefined && <b className="right">{i.value}</b>}</div>)}</>;
}

/** Activity units with saved corrective actions applied. */
export function useUnits() {
  const fsm = useFsmStore();
  return unitsWith(fsm.units);
}

function CampaignChip() {
  const fsm = useFsmStore();
  return <StatusChip tone="ok">{fsm.campaigns['onion-croptek'] === 'launched' ? 'Approved and launched · in progress' : 'In progress'}</StatusChip>;
}

// ================================================================ 11 Live Control Tower
type TowerView = 'week' | 'activity';
type TowerSort = 'week' | 'activity' | 'owner' | 'status';

export function ControlTower() {
  const go = useGo();
  const units = useUnits();
  const [village, setVillage] = useState(ALL);
  const [owner, setOwner] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [view, setView] = useState<TowerView>('week');
  const [sortBy, setSortBy] = useState<TowerSort>('week');
  const villages = [...new Set(units.flatMap((u) => u.village.split(', ')))];
  const shown = units.filter((u) => (village === ALL || u.village.split(', ').includes(village)) && (owner === ALL || u.owner === owner) && (status === ALL || u.status === status));
  const k = executionCounts(units);
  const exceptions = units.filter((u) => u.status === 'at_risk');
  const SORTS: Record<TowerSort, (u: ActivityUnit) => string | number> = { week: (u) => u.week, activity: (u) => activityName(u.activity), owner: (u) => u.owner, status: (u) => UNIT_STATUS_LABEL[u.status] };
  const sorted = [...shown].sort((a, b) => { const x = SORTS[sortBy](a), y = SORTS[sortBy](b); return typeof x === 'number' ? x - (y as number) : x.localeCompare(y as string); });
  const first = exceptions[0]?.id ?? AT_RISK_ACTIVITY;

  return (
    <FsmPage section={SECTION} sectionTo={F.execution} trail={FSM_CAMPAIGN.name} title="Live Control Tower" right={<CampaignChip />} back={F.wizardReview} next={F.activity(first)} nextLabel="View activity and take action">
      <FilterRows<TowerView> view={view} setView={setView} views={[{ value: 'week', label: 'Week view' }, { value: 'activity', label: 'Activity view' }]}
        filters={[
          { key: 'territory', label: 'Territory', value: 'ambad', options: [opt('ambad', 'Ambad')], onChange: () => undefined },
          { key: 'village', label: 'Village', value: village, options: [opt(ALL, 'All villages'), ...villages.map((v) => opt(v))], onChange: setVillage },
          { key: 'owner', label: 'Owner', value: owner, options: [opt(ALL, 'All owners'), ...OWNERS.map((o) => opt(o))], onChange: setOwner },
          { key: 'status', label: 'Status', value: status, options: [opt(ALL, 'All statuses'), ...(Object.keys(UNIT_STATUS_LABEL) as UnitStatus[]).map((s) => opt(s, UNIT_STATUS_LABEL[s]))], onChange: setStatus },
        ]}
        extras={[{ key: 'sort', label: 'Sort by', value: sortBy, onChange: (v) => setSortBy(v as TowerSort), options: [opt('week', 'Week'), opt('activity', 'Activity'), opt('owner', 'Owner'), opt('status', 'Status')] }]} />
      <div className="kpis">
        <KpiCard label="Planned activity units" value={num(k.planned)} />
        <KpiCard label="Completed" value={num(k.completed)} />
        <KpiCard label="Scheduled" value={num(k.scheduled)} />
        <KpiCard label="At risk" value={num(k.atRisk)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 320px' }}>
        {view === 'week' ? (
          <Card title="Campaign activity calendar" note="4-week execution window" icon={CalendarDays} flush>
            <DataTable rows={CAMPAIGN_ACTIVITIES.filter((a) => sorted.some((u) => u.activity === a.id))} rowKey={(a) => a.id}
              columns={[
                { key: 'a', header: 'Activity (planned units)', render: (a) => <span className="stack" style={{ gap: 0 }}><b>{a.name}</b><small>{a.units} {a.unitLabel}</small></span> },
                { key: 'o', header: 'Owner', render: (a) => [...new Set(sorted.filter((u) => u.activity === a.id).map((u) => u.owner))].join(', ') },
                ...([1, 2, 3, 4] as const).map((w) => ({
                  key: `w${w}`, header: `Week ${w}`, align: 'center' as const,
                  render: (a: (typeof CAMPAIGN_ACTIVITIES)[number]) => (
                    <span className="row" style={{ justifyContent: 'center', flexWrap: 'wrap', gap: 4 }}>
                      {sorted.filter((u) => u.activity === a.id && u.week === w).map((u) => {
                        const I = ICON[u.status];
                        return <button key={u.id} type="button" className={`cal-cell ${u.status}`} title={`${u.village} · ${UNIT_STATUS_LABEL[u.status]}`} onClick={() => go(F.activity(u.id))}><I size={13} />{u.village.split(', ')[0]}</button>;
                      })}
                    </span>
                  ),
                })),
              ]} />
            <div className="row" style={{ gap: 16, padding: '10px 14px', flexWrap: 'wrap' }}>
              {(['completed', 'scheduled', 'at_risk', 'rescheduled', 'escalated'] as UnitStatus[]).filter((s) => units.some((u) => u.status === s)).map((s) => {
                const I = ICON[s];
                return <span key={s} className="row"><I size={14} />{UNIT_STATUS_LABEL[s]} ({units.filter((u) => u.status === s).length})</span>;
              })}
            </div>
          </Card>
        ) : (
          <Card title="Activity units" icon={ClipboardList} flush>
            <DataTable rows={sorted} rowKey={(u) => u.id} onRowClick={(u) => go(F.activity(u.id))}
              columns={[
                { key: 'a', header: 'Activity', render: (u) => <b>{activityName(u.activity)}</b> },
                { key: 'v', header: 'Village', render: (u) => u.village },
                { key: 'w', header: 'Week', align: 'right', render: (u) => `Week ${u.week}` },
                { key: 'o', header: 'Owner', render: (u) => u.owner },
                { key: 's', header: 'Status', align: 'center', render: (u) => <StatusChip tone={TONE[u.status]}>{UNIT_STATUS_LABEL[u.status]}</StatusChip> },
                { key: 'x', header: 'Action', align: 'center', render: (u) => <Button small onClick={() => go(F.activity(u.id))}>Open</Button> },
              ]}
              total={{ a: 'Total', v: `${sorted.length} units` }} />
          </Card>
        )}
        <div className="stack">
          <Card title={`Execution exceptions (${exceptions.length})`} icon={TriangleAlert}>
            {exceptions.length === 0 && <List items={[{ icon: CircleCheck, label: 'All at-risk activities have a corrective action' }]} />}
            <List items={exceptions.map((u) => ({
              icon: TriangleAlert, tone: 'warn' as const,
              label: <span className="stack" style={{ gap: 0 }}><b>{u.village} — {activityName(u.activity).replace(/s$/, '')}</b><small>Week {u.week} · {u.issue}</small></span>,
              value: <Button small onClick={() => go(F.activity(u.id))}>Take action</Button>,
            }))} />
          </Card>
          <Card title="Next best actions" icon={Lightbulb}>
            <List items={[
              ...exceptions.map((u) => ({ label: `${u.issue} for the ${u.village} ${activityName(u.activity).toLowerCase().replace(/s$/, '')}: contact ${u.owner}.` })),
              { label: exceptions.length ? 'Reschedule or escalate to the Zonal Manager if not confirmed within 2 days.' : 'Keep weekly field evidence up to date for completed units.' },
            ]} />
          </Card>
        </div>
      </div>
    </FsmPage>
  );
}

// ================================================================ 12 Activity Execution & Corrective Action
export function ActivityExecution() {
  const go = useGo();
  const bh = useBhStore();
  const fsm = useFsmStore();
  const { activityId } = useParams();
  const units = useUnits();
  const unit = units.find((u) => u.id === activityId) ?? units.find((u) => u.id === AT_RISK_ACTIVITY)!;
  const act = CAMPAIGN_ACTIVITIES.find((a) => a.id === unit.activity)!;
  const siblings = units.filter((u) => u.activity === unit.activity);
  const saved = fsm.units[unit.id];
  const [action, setAction] = useState(saved?.action ?? CORRECTIVE_ACTIONS[0]);
  const [owner, setOwner] = useState(saved?.owner ?? unit.owner);
  const [date, setDate] = useState(saved?.date ?? '');
  const [reason, setReason] = useState(saved?.reason ?? (unit.issue && ACTION_REASONS.includes(unit.issue) ? unit.issue : ''));
  const [notes, setNotes] = useState(saved?.notes ?? '');
  const [tried, setTried] = useState(false);
  const files = useRef<HTMLInputElement>(null);
  const [evKind, setEvKind] = useState('Photos');
  const needsAction = unit.status === 'at_risk';
  const errors = {
    owner: !owner ? 'Choose an owner' : '',
    reason: !reason ? 'Choose a reason' : '',
    date: action === 'Propose reschedule' && !date ? 'Choose the new date' : '',
  };
  const related = units.filter((u) => u.status === 'at_risk' && u.id !== unit.id);
  const checklist = READINESS[unit.activity] ?? READINESS.default;
  const evidence = fsm.evidence[unit.id] ?? [];

  const save = () => {
    if (!needsAction) { go(F.impact); return; }
    setTried(true);
    if (errors.owner || errors.reason || errors.date) { bh.toast('Owner and reason are required'); return; }
    const status = statusAfter(action);
    fsm.saveAction(unit.id, { status, owner, date, reason, notes, action });
    bh.toast(`${unit.village} ${act.name.toLowerCase()}: ${action.toLowerCase()} · ${UNIT_STATUS_LABEL[status]}`);
    go(F.impact);
  };

  return (
    <FsmPage section={SECTION} sectionTo={F.execution} trail={`${unit.village} — ${act.name}`} title="Activity Execution & Corrective Action"
      right={<StatusChip tone={TONE[unit.status]}>{UNIT_STATUS_LABEL[unit.status]}</StatusChip>}
      back={F.execution} next={save} nextLabel={needsAction ? 'Save and assign corrective action' : 'Next'}>
      <div className="kpis">
        <KpiCard label="Planned week" value={`Week ${unit.week}`} />
        <KpiCard label={`${act.name} completed`} value={`${siblings.filter((u) => u.status === 'completed').length} / ${act.units}`} />
        <KpiCard label="Campaign activity units" value={num(units.length)} />
        <KpiCard label="Activity budget" value={lakh(act.cost, 2)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) 360px' }}>
        <div className="stack">
          <Card title="Activity unit" icon={ClipboardCheck}>
            <List items={[
              { label: 'Village', value: unit.village },
              { label: 'Assigned owner', value: unit.owner },
              { label: 'Planned window', value: `Week ${unit.week}` },
              { label: 'Campaign', value: FSM_CAMPAIGN.name },
              ...(unit.issue ? [{ icon: TriangleAlert, tone: 'warn' as const, label: 'Execution blocker', value: unit.issue }] : []),
            ]} />
          </Card>
          <Card title="Execution readiness checklist" icon={ListChecks}>
            <List items={[...checklist, { item: 'Field evidence', sub: 'Photos, attendance and notes after execution', status: evidence.length ? `${evidence.length} uploaded` : 'Not submitted' }].map((c) => ({
              icon: c.status === 'Pending' || c.status === 'Not submitted' ? CircleAlert : CircleCheck, tone: c.status === 'Pending' || c.status === 'Not submitted' ? 'warn' as const : undefined,
              label: <span className="stack" style={{ gap: 0 }}><b>{c.item}</b><small>{c.sub}</small></span>,
              value: <StatusChip tone={c.status === 'Pending' || c.status === 'Not submitted' ? 'warn' : 'neutral'}>{unit.status === 'completed' && c.item !== 'Field evidence' ? 'Done' : c.status}</StatusChip>,
            }))} />
          </Card>
        </div>
        <div className="stack">
          <Card title="Activity timeline" icon={CalendarDays}>
            <List items={[
              { icon: CircleCheck, label: `Planned · week ${unit.week}`, value: 'Scheduled' },
              { icon: unit.issue ? TriangleAlert : CircleCheck, tone: unit.issue ? 'warn' : undefined, label: unit.issue ? `Risk identified · ${unit.issue.toLowerCase()}` : 'No risk raised', value: unit.issue ? 'Flagged' : '–' },
              { icon: unit.status === 'at_risk' ? CircleAlert : CircleCheck, tone: unit.status === 'at_risk' ? 'warn' : undefined, label: unit.status === 'at_risk' ? 'Awaiting corrective action' : saved ? `${saved.action} · ${saved.reason}` : 'On track', value: UNIT_STATUS_LABEL[unit.status] },
            ]} />
          </Card>
          <Card title="Field evidence" icon={Camera} right={<StatusChip tone={evidence.length ? 'ok' : 'warn'}>{evidence.length ? `${evidence.length} uploaded` : 'Not submitted'}</StatusChip>}>
            <input ref={files} type="file" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) { fsm.addEvidence(unit.id, `${evKind}: ${f.name}`); bh.toast(`${evKind} uploaded`); } e.target.value = ''; }} />
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              {[['Photos', Camera], ['Attendance', Users], ['Completion notes', FileText]].map(([k, I]) => (
                <Button key={k as string} small icon={(k === 'Photos' ? Upload : I) as LucideIcon} onClick={() => { setEvKind(k as string); files.current?.click(); }}>{`Upload ${(k as string).toLowerCase()}`}</Button>
              ))}
            </div>
            <List items={evidence.map((f) => ({ icon: FileText, label: f }))} />
          </Card>
          <Card title={`Related exceptions (${related.length})`} icon={TriangleAlert}>
            {related.length === 0 && <List items={[{ icon: CircleCheck, label: 'No other at-risk activity' }]} />}
            <List items={related.map((u) => ({ icon: TriangleAlert, tone: 'warn' as const, label: `${u.village} — ${activityName(u.activity)} · ${u.issue}`, value: <Button small onClick={() => go(F.activity(u.id))}>View details</Button> }))} />
          </Card>
        </div>
        <Card title="Corrective action" icon={Wrench}>
          {needsAction ? (
            <div className="stack" style={{ gap: 12 }}>
              <div className="action-grid">
                {CORRECTIVE_ACTIONS.map((a) => <button key={a} type="button" className={a === action ? 'on' : ''} aria-pressed={a === action} onClick={() => setAction(a)}>{a === action && <CircleCheck size={15} />}{a}</button>)}
              </div>
              <label className="field"><span>Assigned owner *</span><Select label="Assigned owner" value={owner} options={[opt('', 'Select owner'), ...OWNERS.map((o) => opt(o))]} onChange={setOwner} />{tried && errors.owner && <small className="err">{errors.owner}</small>}</label>
              <label className="field"><span>Proposed new date{action === 'Propose reschedule' ? ' *' : ''}</span><input className="input" type="date" aria-label="Proposed new date" value={date} onChange={(e) => setDate(e.target.value)} />{tried && errors.date && <small className="err">{errors.date}</small>}</label>
              <label className="field"><span>Reason *</span><Select label="Reason" value={reason} options={[opt('', 'Select reason'), ...ACTION_REASONS.map((r) => opt(r))]} onChange={setReason} />{tried && errors.reason && <small className="err">{errors.reason}</small>}</label>
              <label className="field"><span>Action notes</span><textarea className="input" rows={3} maxLength={300} aria-label="Action notes" value={notes} onChange={(e) => setNotes(e.target.value)} /><small>{notes.length} / 300</small></label>
            </div>
          ) : (
            <List items={[
              { icon: CircleCheck, label: 'Status', value: UNIT_STATUS_LABEL[unit.status] },
              ...(saved ? [{ label: 'Action', value: saved.action }, { label: 'Owner', value: saved.owner }, { label: 'Reason', value: saved.reason }, ...(saved.date ? [{ label: 'New date', value: saved.date }] : [])] : []),
              { label: 'Campaign budget', value: lakh(budgetMix().total, 2) },
            ]} />
          )}
        </Card>
      </div>
    </FsmPage>
  );
}
