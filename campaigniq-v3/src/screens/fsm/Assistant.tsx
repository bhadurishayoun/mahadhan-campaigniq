/** Screen 15 — AI Copilot workspace for territory business and campaigns. Answers are built from the data module. */
import { ArrowRight, ChartColumn, CircleAlert, Lightbulb, MessageCircle, Send, Target, TriangleAlert, Wrench, type LucideIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { crore, lakh, num, pct } from '../../data/format';
import { activityName, AT_RISK_ACTIVITY, BUSINESS_PRIORITIES, clusterRows, executionCounts, FSM_CAMPAIGN, impactSummary, unitsWith, villagePerformance, dealersOf } from '../../data/fsm';
import { territoryById } from '../../data/bh';
import { F } from '../../routes';
import { useFsmStore } from '../../store/fsmStore';
import { Button, Card, KpiCard, StatusChip } from '../../ui/core';
import { DataTable } from '../../ui/DataTable';
import { useGo } from '../common';
import { FsmPage } from './frame';

type QuestionId = 'gaps' | 'opportunities' | 'risks' | 'diagnostics';
const QUESTIONS: { id: QuestionId; title: string; text: string; icon: LucideIcon; words: string[] }[] = [
  { id: 'gaps', title: 'Business target gaps', text: 'Where am I behind my approved target?', icon: Target, words: ['target', 'gap', 'behind', 'abp', 'plan'] },
  { id: 'opportunities', title: 'Campaign opportunities', text: 'Which villages or cohorts can be activated further?', icon: ChartColumn, words: ['opportunit', 'village', 'cohort', 'activate', 'campaign'] },
  { id: 'risks', title: 'Execution risks', text: 'Which activities need immediate attention?', icon: TriangleAlert, words: ['risk', 'activit', 'attention', 'week', 'priorit'] },
  { id: 'diagnostics', title: 'Performance diagnostics', text: 'Why is Croptek adoption lower in Dhanora, and what should I do?', icon: CircleAlert, words: ['why', 'adoption', 'lower', 'dhanora', 'conversion', 'diagnos'] },
];
const match = (q: string): QuestionId => {
  const t = q.toLowerCase();
  return [...QUESTIONS].sort((a, b) => b.words.filter((w) => t.includes(w)).length - a.words.filter((w) => t.includes(w)).length)[0].id;
};

interface Row { n: string; what: string; figure: string; to: string }

function List({ items }: { items: { icon?: LucideIcon; label: ReactNode; value?: ReactNode }[] }) {
  return <>{items.map((i, k) => <div key={k} className="list-row">{i.icon && <i.icon size={16} />}<span>{i.label}</span>{i.value !== undefined && <b className="right">{i.value}</b>}</div>)}</>;
}

export function FsmAssistant() {
  const go = useGo();
  const fsm = useFsmStore();
  const [q, setQ] = useState<QuestionId>('diagnostics');
  const [draft, setDraft] = useState('');
  const units = unitsWith(fsm.units);
  const atRisk = units.filter((u) => u.status === 'at_risk');
  const s = impactSummary();
  const vp = villagePerformance(units);
  const sorted = [...vp].sort((a, b) => b.conversionPct - a.conversionPct);
  const hi = sorted[0];
  const lo = sorted[sorted.length - 1];
  const k = executionCounts(units);
  const proposed = (t: 'ambad' | 'ghansawangi' | 'badnapur') => dealersOf(t).reduce((a, d) => a + (fsm.targets[d.id] ?? d.proposed), 0);

  const answers: Record<QuestionId, { summary: string; rows: Row[] }> = {
    gaps: {
      summary: `The Jalna cluster needs ${crore(clusterRows().reduce((a, r) => a + r.abp - r.lastYear, 0), 1)} above last year; Ambad's proposed plan leaves ${lakh(territoryById('ambad')!.abp - proposed('ambad'))} unallocated.`,
      rows: clusterRows().map((r) => ({ n: r.name, what: `ABP ${crore(r.abp, 1)} · proposed ${crore(proposed(r.id))}`, figure: lakh(r.abp - proposed(r.id)), to: F.outlets(r.id) })),
    },
    opportunities: {
      summary: `${BUSINESS_PRIORITIES.filter((p) => p.uplift).length} plan-linked priorities carry ${lakh(BUSINESS_PRIORITIES.reduce((a, p) => a + (p.uplift ?? 0), 0))} of uplift; ${hi.name} converts best at ${pct(hi.conversionPct)}.`,
      rows: [
        ...BUSINESS_PRIORITIES.filter((p) => p.uplift).map((p) => ({ n: p.name, what: p.villages.join(' · '), figure: lakh(p.uplift!), to: F.campaigns })),
        { n: `${hi.name} village`, what: `${num(hi.adopters)} adopters from ${num(hi.trials)} trials`, figure: pct(hi.conversionPct), to: F.diagnostic },
      ],
    },
    risks: {
      summary: atRisk.length ? `${atRisk.length} of ${k.planned} activity units are at risk; both need a corrective action before the next checkpoint.` : `No activity is at risk; ${k.completed} of ${k.planned} units are completed.`,
      rows: atRisk.length ? atRisk.map((u) => ({ n: `${u.village} · ${activityName(u.activity)}`, what: `Week ${u.week} · ${u.owner} · ${u.issue}`, figure: 'At risk', to: F.activity(u.id) }))
        : [{ n: 'Execution', what: `${k.completed} completed · ${k.scheduled} scheduled`, figure: `${k.completed} / ${k.planned}`, to: F.execution }],
    },
    diagnostics: {
      summary: `${lo.name}'s trial-to-adoption is ${pct(lo.conversionPct)} (${lo.adopters} adopters / ${lo.trials} trials), ${s.villageGap.toFixed(1)} pp below ${hi.name} (${pct(hi.conversionPct)}).`,
      rows: [
        ...[hi, lo].map((v) => ({ n: v.name, what: `${v.adopters} adopters / ${v.trials} trials`, figure: pct(v.conversionPct), to: F.diagnostic })),
        ...atRisk.filter((u) => u.village === lo.name).map((u) => ({ n: `${u.village} · ${activityName(u.activity)}`, what: u.issue ?? '', figure: 'At risk', to: F.activity(u.id) })),
      ],
    },
  };
  const a = answers[q];
  const current = QUESTIONS.find((x) => x.id === q)!;
  const ask = (id: QuestionId, text: string) => { setQ(id); fsm.ask(text); };
  const submit = () => { if (!draft.trim()) return; ask(match(draft), draft.trim()); setDraft(''); };

  return (
    <FsmPage section="AI Copilot workspace" sectionTo={F.assistant} trail={FSM_CAMPAIGN.name} title="AI Copilot workspace" back={F.diagnostic} next={F.plan}
      right={<StatusChip tone="ok">In progress</StatusChip>}>
      <div className="kpis">
        <KpiCard label="Linked growth objective" value={lakh(BUSINESS_PRIORITIES[0].uplift!)} />
        <KpiCard label="Tracked campaign-linked sales" value={lakh(s.tracked, 1)} />
        <KpiCard label="Activities at risk" value={num(k.atRisk)} />
        <KpiCard label="Village conversion gap (pp)" value={s.villageGap.toFixed(1)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '260px minmax(0, 1fr) 300px' }}>
        <div className="stack">
          <Card title="Ask about" icon={MessageCircle}>
            <div className="geo">
              {QUESTIONS.map((x) => (
                <button key={x.id} type="button" className={x.id === q ? 'on' : ''} onClick={() => ask(x.id, x.text)}><x.icon size={16} style={{ flex: 'none' }} /><span className="stack" style={{ gap: 0, alignItems: 'flex-start', textAlign: 'left' }}><b>{x.title}</b><small>{x.text}</small></span></button>
              ))}
            </div>
          </Card>
          <Card title="Recent questions" icon={MessageCircle}>
            {fsm.asked.length === 0 && <List items={[{ label: current.text }]} />}
            <div className="geo">
              {fsm.asked.map((t) => <button key={t} type="button" onClick={() => setQ(match(t))}><MessageCircle size={15} />{t}</button>)}
            </div>
          </Card>
        </div>
        <Card title={current.text} icon={Lightbulb}>
          <p style={{ margin: '0 0 12px' }}>{a.summary}</p>
          <DataTable rows={a.rows} rowKey={(r) => r.n} onRowClick={(r) => go(r.to)}
            columns={[
              { key: 'n', header: 'Item', render: (r) => <b>{r.n}</b> },
              { key: 'w', header: 'Detail', render: (r) => r.what },
              { key: 'f', header: 'Figure', align: 'right', render: (r) => r.figure },
              { key: 'o', header: 'Open', align: 'center', render: (r) => <Button small icon={ArrowRight} onClick={() => go(r.to)}>Open</Button> },
            ]} />
          <div className="ask-box">
            <input className="input" aria-label="Ask a question" placeholder="Ask a follow-up question" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
            <Button primary icon={Send} onClick={submit}>Ask</Button>
          </div>
        </Card>
        <div className="stack">
          <Card title="Next best actions" icon={Lightbulb}>
            <List items={[
              ...atRisk.map((u) => ({ label: `${u.issue}: ${u.village} ${activityName(u.activity).toLowerCase()} (${u.owner}).` })),
              { label: `Validate follow-up records with ${lo.name} trial farmers.` },
            ]} />
          </Card>
          <Card title="Related screens" icon={ArrowRight}>
            <div className="geo">
              {[['Live control tower', F.execution], ['Activity workspace', F.activity(atRisk[0]?.id ?? AT_RISK_ACTIVITY)], ['Campaign impact', F.impact], ['Village diagnostic', F.diagnostic]].map(([l, to]) => (
                <button key={l} type="button" onClick={() => go(to)}><ArrowRight size={15} />{l}</button>
              ))}
            </div>
            <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              <Button small primary icon={Wrench} onClick={() => go(F.activity(atRisk[0]?.id ?? AT_RISK_ACTIVITY))}>Create corrective action</Button>
            </div>
          </Card>
        </div>
      </div>
    </FsmPage>
  );
}
