/**
 * Screens 11–16 — Market Opportunity (BH.4.png), Theme Approval Inbox (BH.4b.png), Theme Detailed Review (BH.4c.png),
 * Theme Decision modal (BH.4d.png), Suggest Strategic Theme (BH.4e.png), Recommendation Review & Submit drawer (BH.4f.png).
 */
import { AlertTriangle, Box, ChartColumn, CircleCheck, Clock, Eye, FileSearch, FileText, Layers, Link2, MapPin, MessageCircle, Plus, Save, Send, Sprout, Store, Target, Trophy, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AMBAD, ambadMetrics, ATTRIBUTION_STATUS, campaignById, campaignMetrics, CAMPAIGNS, MARKET, NATIONAL, NATIONAL_METRICS, READINESS_ITEMS, READINESS_STATUS,
  REGIONS, regionById, regionMetrics, THEME_DELIVERABLES, THEME_QUEUE, THEME_STATUS, themeCandidates, themeDirections, themeEvidence, TERRITORIES,
  type CampaignId, type Priority, type RegionId, type ThemeProposal,
} from '../data/bh';
import { crore, num, pct } from '../data/format';
import { R } from '../routes';
import { useBhStore, type ThemeDecision } from '../store/bhStore';
import { SERIES } from '../theme';
import { HBars, Legend } from '../ui/charts';
import { Breadcrumb, Button, Card, FilterBar, FooterBar, KpiCard, PageHeader, PanelFooter, SegmentedControl, Select, StatusChip, STEPS, WorkflowStepper } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { Drawer, EvidenceDrawer, Modal, type Evidence } from '../ui/overlay';
import { ALL, CROP_OPTIONS, opt, PRODUCT_OPTIONS, REGION_OPTIONS, useGo, useScopeFilter } from './common';

function ThemeTabs({ active }: { active: 'inbox' | 'opportunity' }) {
  const go = useGo();
  return <SegmentedControl value={active} onChange={(v) => go(v === 'inbox' ? R.inbox : R.opportunity)} options={[{ value: 'inbox', label: 'Theme approval inbox' }, { value: 'opportunity', label: 'Market opportunity' }]} />;
}

const stepOf = (status: string) => (status === 'review_pending' || status === 'clarification_requested' ? 1 : 3);

// ================================================================ 11 Market Opportunity
export function MarketOpportunity() {
  const go = useGo();
  const [region, setRegion] = useScopeFilter();
  const [territory, setTerritory] = useState(ALL);
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [sel, setSel] = useState<RegionId>(region === ALL ? 'west' : (region as RegionId));
  const regions = REGIONS.filter((r) => region === ALL || r.id === region);
  const selRegion = regionById(regions.some((r) => r.id === sel) ? sel : regions[0].id);
  const a = ambadMetrics();
  const tiles = selRegion.id === 'west'
    ? [
      { icon: ChartColumn, label: `${MARKET.state} product penetration`, value: MARKET.penetration, chip: 'Source validation required' },
      { icon: Sprout, label: 'Ambad local trial-to-adoption', value: pct(a.trialToAdoptionPct, 0) },
      { icon: Target, label: 'Dhanora vs Wadi Gaon gap', value: `${a.villageGap.toFixed(1)} pp` },
      { icon: CircleCheck, label: 'Activity completion', value: pct(a.activityPct) },
      { icon: Users, label: 'Farmer follow-up completion', value: pct(a.followUpPct, 0) },
      { icon: Store, label: 'Retailer activation', value: pct(a.retailerActivationPct) },
    ]
    : [
      { icon: Target, label: 'Business gap', value: crore(regionMetrics(selRegion).gap, 1) },
      { icon: ChartColumn, label: 'Achievement', value: pct(regionMetrics(selRegion).achievementPct) },
      { icon: CircleCheck, label: 'Observed execution', value: `${selRegion.observedExec}%` },
      { icon: Users, label: 'Recorded adopters', value: num(selRegion.adopters) },
      { icon: Layers, label: 'Active campaigns', value: String(selRegion.campaigns) },
      { icon: Sprout, label: 'Crop and product records', value: 'Pending' },
    ];
  const gapRows = [...regions].sort((x, y) => regionMetrics(y).gap - regionMetrics(x).gap);

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic themes & approvals', onClick: () => go(R.inbox) }, { label: 'Market opportunity' }]} />
      <PageHeader title="Market Opportunity" right={<ThemeTabs active="opportunity" />} />
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: (v) => { setRegion(v); if (v !== ALL) setSel(v as RegionId); } },
        { key: 'territory', label: 'Territory', value: territory, options: [opt(ALL, 'All territories'), ...TERRITORIES.map((t) => opt(t.id, t.name))], onChange: (v) => { setTerritory(v); if (v !== ALL) { setRegion('west'); setSel('west'); } } },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
      ]} />
      <div className="kpis">
        <KpiCard icon={Target} label="YTD business ABP" value={crore(NATIONAL.abp, 1)} />
        <KpiCard icon={Layers} label="Actual achievement" value={crore(NATIONAL.achieved, 1)} />
        <KpiCard attention icon={AlertTriangle} label="Business gap" value={crore(NATIONAL_METRICS.gap, 1)} />
        <KpiCard icon={Trophy} label="Achievement" value={pct(NATIONAL_METRICS.achievementPct)} />
      </div>
      <Card title="Regional business gap and marketing coverage" icon={Layers} flush>
        <DataTable rows={regions} rowKey={(r) => r.id} selected={selRegion.id} onRowClick={(r) => setSel(r.id)}
          columns={[
            { key: 'n', header: 'Region', render: (r) => <span className="row"><span className={`radio${r.id === selRegion.id ? ' on' : ''}`} /><b>{r.name}</b></span> },
            { key: 'abp', header: 'YTD ABP', align: 'right', render: (r) => crore(r.abp, 1) },
            { key: 'ach', header: 'Actual sales', align: 'right', render: (r) => crore(r.achieved, 1) },
            { key: 'gap', header: 'Business gap', align: 'right', render: (r) => <b>{crore(regionMetrics(r).gap, 1)}</b> },
            { key: 'c', header: 'Active campaigns', align: 'right', render: (r) => r.campaigns },
            { key: 'e', header: 'Observed execution', align: 'right', render: (r) => `${r.observedExec}%` },
            { key: 'x', header: 'Explore', align: 'center', render: (r) => <Button small onClick={() => go(R.region(r.id))}>Explore</Button> },
          ]}
          total={{ n: 'Total', abp: crore(NATIONAL.abp, 1), ach: crore(NATIONAL.achieved, 1), gap: crore(NATIONAL_METRICS.gap, 1), c: `${NATIONAL.campaigns} campaigns`, e: '–' }}
        />
      </Card>
      <div className="grid" style={{ gridTemplateColumns: '.9fr 1fr 1.25fr' }}>
        <Card title="Regional business gaps" note="₹ Cr" icon={ChartColumn}>
          <HBars labelWidth={60} rows={gapRows.map((r) => ({ label: r.name, values: [regionMetrics(r).gap / 100] }))} series={[{ key: 'g', label: 'Business gap', color: SERIES.planned }]} max={Math.max(...gapRows.map((r) => regionMetrics(r).gap / 100))} format={(v) => `₹${v.toFixed(1)} Cr`} />
        </Card>
        <Card title="Crop × product × geography opportunity" icon={MapPin}>
          <div className="row" style={{ flexWrap: 'wrap' }}>
            {selRegion.id === 'west'
              ? <><StatusChip tone="info" icon={MapPin}>Ambad / Jalna</StatusChip><StatusChip tone="info" icon={Sprout}>{AMBAD.crop}</StatusChip><StatusChip tone="info" icon={Box}>{AMBAD.product}</StatusChip></>
              : <StatusChip tone="info" icon={MapPin}>{selRegion.name} region</StatusChip>}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
            {tiles.map((t) => (
              <div key={t.label} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>
                <div className="row" style={{ gap: 6, alignItems: 'flex-start' }}><t.icon size={15} color="var(--brand)" /><span className="kpi-label">{t.label}</span></div>
                <div className="strong" style={{ fontSize: 18, marginTop: 4 }}>{t.value}</div>
                {t.chip && <StatusChip wrap tone="warn">{t.chip}</StatusChip>}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Potential theme candidates" note="next season / revised themes" icon={Layers} flush>
          <DataTable rows={themeCandidates()} rowKey={(c) => c.id}
            columns={[
              { key: 't', header: 'Theme', render: (c) => c.name },
              { key: 'k', header: 'Key indicator', render: (c) => c.indicator },
              { key: 's', header: 'Status', align: 'center', render: () => <StatusChip tone="warn">Candidate</StatusChip> },
              { key: 'a', header: 'Action', align: 'center', render: (c) => <Button small onClick={() => go(`${R.suggest}?candidate=${c.id}&region=west&territory=ambad&crop=${AMBAD.crop}&product=${AMBAD.product}`)}>Select</Button> },
            ]} />
        </Card>
      </div>
      <FooterBar onBack={() => go(R.command)} onNext={() => go(R.inbox)} />
    </div>
  );
}

// ================================================================ 12 Theme Approval Inbox
export function ThemeInbox() {
  const go = useGo();
  const store = useBhStore();
  const [region, setRegion] = useScopeFilter();
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const queue = THEME_QUEUE.filter((t) => (region === ALL || t.region === region || t.region === 'multi')
    && (crop === ALL || t.crop === crop) && (product === ALL || t.product === product)
    && (status === ALL || store.themeStatus[t.id] === status));
  const [selId, setSelId] = useState(THEME_QUEUE[0].id);
  const sel = queue.find((t) => t.id === selId) ?? queue[0] ?? null;
  const st = Object.values(store.themeStatus);
  const open = st.filter((s) => s === 'review_pending' || s === 'clarification_requested').length;

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic themes & approvals' }, { label: 'Theme approval inbox' }]} />
      <PageHeader title="Theme Approval Inbox" right={<ThemeTabs active="inbox" />} />
      <div className="kpis">
        <KpiCard icon={Layers} label="Under review" value={open} />
        <KpiCard attention icon={Clock} label="Awaiting decision" value={st.filter((s) => s === 'review_pending').length} />
        <KpiCard icon={MessageCircle} label="Clarification requested" value={st.filter((s) => s === 'clarification_requested').length} />
      </div>
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: setRegion },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
        { key: 'status', label: 'Status', value: status, options: [opt(ALL, 'All statuses'), ...Object.entries(THEME_STATUS).map(([k, v]) => opt(k, v.bh === '—' ? v.mh : v.bh))], onChange: setStatus },
      ]} />
      <Card title="Strategic theme approval queue" icon={FileText} flush right={<Button small icon={Plus} onClick={() => go(R.suggest)}>Suggest new theme</Button>}>
        {queue.length ? (
          <DataTable rows={queue} rowKey={(t) => t.id} selected={sel?.id} onRowClick={(t) => setSelId(t.id)}
            columns={[
              { key: 'n', header: 'Proposed theme', render: (t) => <span className="row"><span className={`radio${t.id === sel?.id ? ' on' : ''}`} />{t.name}</span> },
              { key: 'g', header: 'Region', render: (t) => t.geography },
              { key: 'c', header: 'Priority crop / product', render: (t) => t.cropProduct },
              { key: 'p', header: 'Proposed by', render: (t) => t.proposedBy },
              { key: 'pr', header: 'Priority', align: 'center', render: (t) => <StatusChip tone={t.priority === 'High' ? 'warn' : 'ok'}>{t.priority}</StatusChip> },
              { key: 's', header: 'Review status', align: 'center', render: (t) => { const s = THEME_STATUS[store.themeStatus[t.id]]; return <StatusChip tone={s.tone}>{s.bh === '—' ? s.mh : s.bh}</StatusChip>; } },
            ]} />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">No themes match the filters</StatusChip></div>}
      </Card>
      {sel && (
        <div className="grid g3">
          <Card title="Selected theme opportunity evidence" icon={ChartColumn} right={<StatusChip tone="warn">{sel.id === 'croptek-next' ? 'Next season (revision)' : sel.priority}</StatusChip>}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px 10px' }}>
              {themeEvidence(sel.id).map((e) => <div key={e.label}><div className="strong" style={{ fontSize: 20, color: 'var(--brand)' }}>{e.value}</div><div className="muted" style={{ fontSize: 12 }}>{e.label}</div></div>)}
            </div>
          </Card>
          <Card title="Strategic alignment and approval readiness" icon={CircleCheck}>
            {READINESS_ITEMS.map((i) => <div key={i} className="list-row"><Target size={15} />{i}<span className="right"><StatusChip tone={READINESS_STATUS[i].tone}>{READINESS_STATUS[i].label}</StatusChip></span></div>)}
          </Card>
          <Card title="Strategic theme brief" icon={FileText}>
            <div className="kv">
              <span>Objective</span><b>{sel.objective}</b>
              <span>Priority (state / crop)</span><b>{sel.state}{sel.crop ? ` / ${sel.crop}` : ''}</b>
              <span>Product</span><b>{sel.product ?? 'Pending'}</b>
              <span>Financial business case</span><b>To be developed by Zonal Manager</b>
            </div>
          </Card>
        </div>
      )}
      {sel && <Card><WorkflowStepper steps={STEPS.themeReview} current={stepOf(store.themeStatus[sel.id])} /></Card>}
      <FooterBar onBack={() => go(R.opportunity)} onNext={sel ? () => go(R.review(sel.id)) : undefined} />
    </div>
  );
}

// ================================================================ 13 Theme Detailed Review + 14 Decision modal
export function ThemeReview() {
  const go = useGo();
  const store = useBhStore();
  const { themeId = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const t = THEME_QUEUE.find((x) => x.id === themeId) ?? THEME_QUEUE[0];
  const s = THEME_STATUS[store.themeStatus[t.id]];
  const west = regionById('west');
  const c = campaignById('croptek');
  const cm = campaignMetrics(c);
  const rows = [
    { p: 'West region business gap', v: crore(regionMetrics(west).gap, 2), scope: 'Regional business', st: 'Review', facts: [{ label: 'West YTD ABP', value: crore(west.abp, 1) }, { label: 'West achievement', value: crore(west.achieved, 1) }] },
    { p: 'Ambad all-product onion ABP', v: crore(AMBAD.onionAbp), scope: 'Territory / all-product', st: 'Review', facts: [{ label: 'Territory all-product ABP', value: crore(TERRITORIES[0].abp) }, { label: 'Onion all-product ABP', value: crore(AMBAD.onionAbp) }] },
    { p: 'Croptek-specific allocation', v: 'Pending', scope: 'Product-specific', st: 'Pending', facts: [{ label: 'SKU mapping', value: 'Pending' }] },
    { p: `${MARKET.state} penetration`, v: MARKET.penetration, scope: 'State market signal', st: 'Validate', facts: [{ label: 'Source validation', value: 'Required' }] },
    { p: 'Existing campaign adoption', v: `${c.adopters} / ${c.adoptionTarget} = ${pct(cm.adoptionPct, 0)}`, scope: 'Prior regional campaign', st: 'Review', facts: [{ label: 'Campaign', value: c.name }, { label: 'Adoption target', value: num(c.adoptionTarget) }, { label: 'Recorded adopters', value: num(c.adopters) }] },
    { p: 'Regional execution', v: `${c.observedExec}% vs ${c.plannedExec}% planned`, scope: 'Prior regional campaign', st: 'Review', facts: [{ label: 'Planned execution', value: `${c.plannedExec}%` }, { label: 'Observed execution', value: `${c.observedExec}%` }] },
    { p: 'Actual ROI', v: ATTRIBUTION_STATUS, scope: 'Prior regional campaign', st: 'Pending', facts: [{ label: 'Attribution', value: 'Pending' }] },
  ];
  const showEvidence = (title: string, facts: Evidence['facts']) => setEvidence({ title, owner: 'Marketing Head and Zonal Manager records', facts });

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic themes & approvals', onClick: () => go(R.inbox) }, { label: 'Theme approval inbox', onClick: () => go(R.inbox) }, { label: 'Detailed review' }]} />
      <PageHeader title="Strategic Theme Business Alignment & Detailed Review" right={<StatusChip tone={s.tone}>{s.bh === '—' ? s.mh : `Business Head: ${s.bh.toLowerCase()}`}</StatusChip>} />
      <Card>
        <div className="row" style={{ gap: 24, flexWrap: 'wrap' }}>
          <span className="row"><Layers size={20} color="var(--amber)" /><span><div className="kpi-label">Selected theme (Marketing Head)</div><b className="strong">{t.name}</b></span></span>
          <span className="row"><MapPin size={18} color="var(--brand)" /><span><div className="kpi-label">Geography</div><b className="strong">{t.state}</b></span></span>
          <span className="row"><Sprout size={18} color="var(--brand)" /><span><div className="kpi-label">Crop / product</div><b className="strong">{t.cropProduct}</b></span></span>
          <span style={{ marginLeft: 'auto' }}><StatusChip tone="ok">Distinct from existing authorised campaign</StatusChip></span>
        </div>
      </Card>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)' }}>
        <div className="stack">
          <Card title="Business and market alignment" icon={ChartColumn} flush>
            <DataTable rows={rows} rowKey={(r) => r.p}
              columns={[
                { key: 'p', header: 'Parameter', render: (r) => r.p },
                { key: 'v', header: 'Current value', render: (r) => <b className="ok-text">{r.v}</b> },
                { key: 's', header: 'Scope', render: (r) => <StatusChip tone="neutral">{r.scope}</StatusChip> },
                { key: 'st', header: 'Review status', align: 'center', render: (r) => <StatusChip tone={r.st === 'Pending' ? 'neutral' : 'warn'}>{r.st}</StatusChip> },
                { key: 'x', header: 'View', align: 'center', render: (r) => <button type="button" className="link-btn" onClick={() => showEvidence(r.p, r.facts)}>View</button> },
              ]} />
          </Card>
          <Card title="Prior campaign interim evidence" icon={Target} right={<Legend series={[{ key: 'p', label: 'Planned / target', color: SERIES.planned }, { key: 'o', label: 'Observed / achieved', color: SERIES.observed }]} />}>
            <HBars labelWidth={200} max={100} format={(v) => `${v}%`}
              rows={[{ label: 'Regional execution', values: [c.plannedExec, c.observedExec] }, { label: 'Adoption target achievement', values: [100, Math.round(cm.adoptionPct)] }]}
              series={[{ key: 'p', label: 'Planned', color: SERIES.planned }, { key: 'o', label: 'Observed', color: SERIES.observed }]} />
          </Card>
        </div>
        <div className="stack">
          <Card title="Strategic theme review" icon={FileText} right={<><Button small icon={FileSearch} onClick={() => showEvidence(`Source evidence — ${t.name}`, themeEvidence(t.id).map((e) => ({ label: e.label, value: e.value })))}>Source evidence</Button><Button small primary onClick={() => setParams({ modal: 'decision' })}>Theme decision</Button></>}>
            <div className="kv">
              <span>Strategic objective</span><b>{t.objective}</b>
              <span>Priority geography</span><b>{t.state}</b>
              <span>Crop</span><b>{t.crop ?? 'Pending'}</b>
              <span>Product</span><b>{t.product ?? 'Pending'}</b>
              <span>Target cohort</span><b>{t.cohort} <StatusChip tone="warn">Validate</StatusChip></b>
              <span>Campaign investment</span><b>Zonal Manager to develop</b>
            </div>
          </Card>
          <Card title="Approval-readiness checklist" icon={CircleCheck}>
            {READINESS_ITEMS.map((i) => <div key={i} className="list-row"><span className="check" />{i}<span className="right"><StatusChip tone={READINESS_STATUS[i].tone}>{READINESS_STATUS[i].label}</StatusChip></span></div>)}
          </Card>
        </div>
      </div>
      <FooterBar onBack={() => go(R.inbox)} onNext={() => go(R.suggest)} />
      {params.get('modal') === 'decision' && <DecisionModal t={t} onClose={() => setParams({})} onShowOriginal={() => showEvidence(`Original proposal — ${t.name}`, [
        { label: 'Proposed by', value: t.proposedBy }, { label: 'Geography', value: t.geography }, { label: 'Crop / product', value: t.cropProduct },
        { label: 'Objective', value: t.objective }, { label: 'Target cohort', value: t.cohort }, { label: 'Priority', value: t.priority },
      ])} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </div>
  );
}

const CHOICES: { id: ThemeDecision['choice']; label: string; action: string; toast: string }[] = [
  { id: 'approve', label: 'Approve theme', action: 'Approve theme', toast: 'Theme approved and assigned to Marketing Head' },
  { id: 'return', label: 'Return with modifications', action: 'Return theme to Marketing Head', toast: 'Theme returned to Marketing Head with modifications' },
  { id: 'clarify', label: 'Request clarification', action: 'Send clarification request', toast: 'Clarification requested from Marketing Head' },
  { id: 'reject', label: 'Reject theme', action: 'Reject theme', toast: 'Theme rejected' },
];

function DecisionModal({ t, onClose, onShowOriginal }: { t: ThemeProposal; onClose: () => void; onShowOriginal: () => void }) {
  const store = useBhStore();
  const nav = useNavigate();
  const draft = store.decisions.find((d) => d.themeId === t.id && d.draft);
  const [choice, setChoice] = useState<ThemeDecision['choice']>(draft?.choice ?? 'return');
  const [comment, setComment] = useState(draft?.comment ?? '');
  const c = CHOICES.find((x) => x.id === choice)!;
  const record = (isDraft: boolean) => store.decideTheme({ themeId: t.id, choice, comment, at: new Date().toISOString(), draft: isDraft });
  const decided = store.themeStatus[t.id] !== 'review_pending' && store.themeStatus[t.id] !== 'clarification_requested';

  return (
    <Modal title="Strategic theme decision" onClose={onClose} status={<StatusChip tone={decided ? 'ok' : 'warn'}>{decided ? 'Decision recorded' : 'Decision pending'}</StatusChip>}
      footer={<PanelFooter onBack={onClose} action={<Button primary icon={Send} onClick={() => { record(false); store.toast(c.toast); nav(R.inbox); }}>{c.action}</Button>} />}>
      <div className="row" style={{ gap: 20, flexWrap: 'wrap' }}>
        <span className="row"><Layers size={18} color="var(--amber)" /><b className="strong">{t.name}</b></span>
        <span className="row"><MapPin size={16} color="var(--brand)" />{t.state} {t.cropProduct}</span>
        <span className="row"><Users size={16} color="var(--brand)" />Proposed by {t.proposedBy}</span>
        <StatusChip tone="ok" icon={Sprout}>New next-season theme proposal</StatusChip>
        <span style={{ marginLeft: 'auto' }} className="row"><Button small icon={Eye} onClick={onShowOriginal}>View original</Button><Button small icon={Save} onClick={() => { record(true); store.toast('Draft decision saved'); }}>Save draft</Button></span>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <Card flush>
          <DataTable rows={themeDirections(t)} rowKey={(r) => r.parameter}
            columns={[
              { key: 'p', header: 'Parameter', render: (r) => r.parameter },
              { key: 'o', header: 'Original Marketing Head proposal', render: (r) => r.proposal },
              { key: 'd', header: 'Business Head recommended direction', render: (r) => <b className="ok-text">{r.direction}</b> },
              { key: 's', header: 'Review status', align: 'center', render: (r) => <StatusChip tone={r.direction === 'Validate eligibility' ? 'neutral' : 'warn'}>{r.direction === 'Validate eligibility' ? 'Pending' : 'Review'}</StatusChip> },
            ]} />
        </Card>
        <Card title="Approval-readiness checklist">
          {READINESS_ITEMS.map((i) => <div key={i} className="list-row"><span className="check" />{i}<span className="right"><StatusChip tone={READINESS_STATUS[i].tone}>{READINESS_STATUS[i].label}</StatusChip></span></div>)}
        </Card>
      </div>
      <div className="seg" role="radiogroup" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {CHOICES.map((x) => (
          <button key={x.id} type="button" role="radio" aria-checked={x.id === choice} onClick={() => setChoice(x.id)} className="row" style={{ justifyContent: 'center', background: x.id === choice ? 'var(--amber-soft)' : 'var(--neutral)', color: 'var(--ink)', fontWeight: x.id === choice ? 700 : 500 }}>
            <span className={`radio${x.id === choice ? ' on' : ''}`} />{x.label}
          </button>
        ))}
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 2fr) 1fr 1fr', alignItems: 'end' }}>
        <label className="field"><span>Decision comments</span><input className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Modification focus" /></label>
        <div className="field"><span>Recipient</span><StatusChip tone="ok">Marketing Head</StatusChip></div>
        <div className="field"><span>Theme version</span><StatusChip tone="ok">{draft ? 'Saved draft' : 'Current draft'}</StatusChip></div>
      </div>
      <WorkflowStepper steps={STEPS.themeReview} current={decided ? 3 : 1} />
    </Modal>
  );
}

// ================================================================ 15 Suggest Strategic Theme + 16 Review & Submit drawer
interface SuggestForm {
  region: RegionId; state: string; district: string; territory: string; crop: string; product: string; theme: string;
  objective: string; priority: Priority; cohort: string; period: string; link: 'modify' | 'separate'; targets: Record<string, string>; due: string; notes: string;
}

export function SuggestTheme() {
  const go = useGo();
  const store = useBhStore();
  const [params, setParams] = useSearchParams();
  const a = ambadMetrics();
  const candidate = themeCandidates().find((c) => c.id === params.get('candidate'));
  const camp = params.get('campaign') ? campaignById(params.get('campaign') as CampaignId) : null;
  const terr = TERRITORIES.find((t) => t.id === (params.get('territory') ?? 'ambad')) ?? TERRITORIES[0];
  const initial = useMemo<SuggestForm>(() => ({
    region: (params.get('region') as RegionId) ?? camp?.region ?? 'west', state: 'Maharashtra', district: 'Jalna', territory: terr.name.replace(' (Jalna)', ''),
    crop: params.get('crop') ?? 'Onion', product: params.get('product') ?? 'Croptek',
    theme: candidate?.name ?? (camp ? `${camp.short} — revised approach` : 'Structured farmer conversion & follow-up'),
    objective: 'Improve eligible farmer conversion', priority: 'High', cohort: 'Eligible non-adopters and trial users', period: `Kharif ${2027}`,
    link: 'modify', targets: {}, due: '', notes: '',
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const [f, setF] = useState<SuggestForm>(initial);
  const set = <K extends keyof SuggestForm>(k: K, v: SuggestForm[K]) => setF((x) => ({ ...x, [k]: v }));
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const measures = [
    { id: 'tta', kpi: 'Trial-to-adoption', current: pct(a.trialToAdoptionPct), icon: Target },
    { id: 'fu', kpi: 'Follow-up completion', current: pct(a.followUpPct), icon: Users },
    { id: 'gap', kpi: 'Village conversion gap', current: `${a.villageGap.toFixed(1)} pp`, icon: ChartColumn },
  ];
  const linked = THEME_QUEUE[0];
  const recId = 'suggestion-draft';
  const saveDraft = () => { store.saveRecommendation({ id: recId, name: f.theme, geography: `${f.state} / ${f.district} / ${f.territory}`, cropProduct: `${f.crop} / ${f.product}`, priority: f.priority, linkedThemeId: f.link === 'modify' ? linked.id : null, status: 'draft', targets: f.targets }); store.toast('Draft theme saved'); };
  const submit = () => {
    const id = `rec-${Date.now()}`;
    store.saveRecommendation({ id, name: f.theme, geography: `${f.state} / ${f.district} / ${f.territory}`, cropProduct: `${f.crop} / ${f.product}`, priority: f.priority, linkedThemeId: f.link === 'modify' ? linked.id : null, status: 'sent', targets: f.targets });
    store.addIntervention({ id, name: f.theme, category: 'Strategic theme', geography: f.territory, trigger: candidate?.indicator ?? `${a.villageGap.toFixed(1)} pp village conversion gap`, role: 'Marketing Head', priority: f.priority, status: 'awaiting_response', statusLabel: 'Assessment pending', deliverable: 'Strategic opportunity assessment and refined theme brief' });
    store.toast('Recommendation sent to Marketing Head');
    go(`${R.tracker}?selected=${id}`);
  };
  const regionOpts = REGIONS.map((r) => opt(r.id, r.name));
  const field = (label: string, el: JSX.Element) => <label className="field"><span>{label}</span>{el}</label>;
  const sel = (label: string, value: string, options: string[], k: keyof SuggestForm) => field(label, <Select label={label} value={value} options={options.map((o) => opt(o, o))} onChange={(v) => set(k, v as never)} />);

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic themes & approvals', onClick: () => go(R.inbox) }, { label: 'Suggest new theme' }]} />
      <PageHeader title="Suggest Strategic Marketing Theme" right={<StatusChip tone="warn">Draft · not submitted</StatusChip>} />
      <div className="kpis">
        <KpiCard icon={Target} label="Village conversion gap" value={`${a.villageGap.toFixed(1)} pp`} />
        <KpiCard icon={Users} label="Farmer follow-up completion" value={pct(a.followUpPct)} />
        <KpiCard icon={Store} label="Retailer activation" value={pct(a.retailerActivationPct)} />
        <KpiCard icon={Sprout} label="Local trial-to-adoption" value={pct(a.trialToAdoptionPct)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)' }}>
        <Card title="Strategic theme configuration" icon={Layers} right={<>
          <Button small icon={Eye} onClick={() => setEvidence({ title: 'Opportunity evidence — Ambad', owner: 'Field Sales Manager territory records', facts: [
            ...a.villages.map((v) => ({ label: `${v.name} trial-to-adoption`, value: `${v.adopters} / ${v.trials} = ${pct(v.pct)}` })),
            { label: 'Village conversion gap', value: `${a.villageGap.toFixed(1)} pp` }, { label: 'Activities completed', value: `${a.activitiesDone} / ${a.activitiesPlanned}` },
            { label: `${MARKET.state} penetration`, value: MARKET.penetration },
          ] })}>Opportunity evidence</Button>
          <Button small icon={Save} onClick={saveDraft}>Save draft</Button>
          <Button small primary onClick={() => setParams((p) => { const n = new URLSearchParams(p); n.set('drawer', 'submit'); return n; })}>Review recommendation</Button>
        </>}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
            {field('Region', <Select label="Region" value={f.region} options={regionOpts} onChange={(v) => set('region', v as RegionId)} />)}
            {sel('State', f.state, ['Maharashtra'], 'state')}
            {sel('District', f.district, ['Jalna'], 'district')}
            {sel('Territory', f.territory, ['Ambad', 'Jalna', 'Aurangabad', 'Nashik'], 'territory')}
            {sel('Crop', f.crop, ['Onion', 'Maize', 'Cotton', 'Soybean'], 'crop')}
            {sel('Product', f.product, ['Croptek', 'Mahadhan 19:19:19', 'Mahadhan Bensulf'], 'product')}
            <div style={{ gridColumn: 'span 2' }}>{field('Suggested theme', <input className="input" value={f.theme} onChange={(e) => set('theme', e.target.value)} />)}</div>
            <div style={{ gridColumn: 'span 2' }}>{sel('Strategic objective', f.objective, ['Improve eligible farmer conversion', 'Increase product trials', 'Strengthen retailer advocacy'], 'objective')}</div>
            <div style={{ gridColumn: 'span 2' }}><div className="field"><span>Priority</span><div className="row" style={{ gap: 16, height: 34 }}>
              {(['High', 'Medium', 'Low'] as Priority[]).map((p) => <button key={p} type="button" className="row" onClick={() => set('priority', p)}><span className={`radio${f.priority === p ? ' on' : ''}`} />{p}</button>)}
            </div></div></div>
            <div style={{ gridColumn: 'span 2' }}>{sel('Target cohort', f.cohort, ['Eligible non-adopters and trial users', 'Repeat users', 'Priority retailers'], 'cohort')}</div>
            <div style={{ gridColumn: 'span 2' }}>{sel('Target planning period', f.period, ['Kharif 2027', 'Rabi 2027–28', 'FY 2027–28'], 'period')}</div>
          </div>
          <b className="strong" style={{ marginTop: 4 }}>Proposed success measures</b>
          <DataTable rows={measures} rowKey={(m) => m.id}
            columns={[
              { key: 'k', header: 'KPI', render: (m) => <span className="row"><m.icon size={15} color="var(--brand)" />{m.kpi}</span> },
              { key: 'c', header: 'Current value', align: 'right', render: (m) => <b className="ok-text">{m.current}</b> },
              { key: 't', header: 'Proposed target', render: (m) => <input className="input" style={{ height: 30 }} placeholder="Enter target" value={f.targets[m.id] ?? ''} onChange={(e) => set('targets', { ...f.targets, [m.id]: e.target.value })} aria-label={`${m.kpi} target`} /> },
              { key: 'v', header: 'Validation', align: 'center', render: (m) => <StatusChip tone={f.targets[m.id] ? 'ok' : 'neutral'}>{f.targets[m.id] ? 'Entered' : 'Pending'}</StatusChip> },
            ]} />
        </Card>
        <div className="stack">
          <Card title="Existing theme alignment" icon={Link2}>
            <DataTable rows={[{ id: 'auth', name: CAMPAIGNS[0].name, status: <StatusChip tone="ok">Authorised</StatusChip>, overlap: '–' }, { id: linked.id, name: `${linked.name} (Marketing Head proposal)`, status: <StatusChip tone="warn">Awaiting decision</StatusChip>, overlap: <StatusChip tone="warn">Review required</StatusChip> }]} rowKey={(r) => r.id}
              columns={[{ key: 'n', header: 'Theme', render: (r) => r.name }, { key: 's', header: 'Status', align: 'center', render: (r) => r.status }, { key: 'o', header: 'Overlap', align: 'center', render: (r) => r.overlap }]} />
            {(['modify', 'separate'] as const).map((l) => (
              <button key={l} type="button" className="row" style={{ padding: '8px 10px', borderRadius: 8, background: f.link === l ? 'var(--amber-soft)' : 'transparent' }} onClick={() => set('link', l)}>
                <span className={`radio${f.link === l ? ' on' : ''}`} />{l === 'modify' ? 'Link as modification to existing theme' : 'Suggest separate theme'}
              </button>
            ))}
          </Card>
          <Card title="Recipient and deliverable" icon={Users}>
            <div className="kv"><span>Recipient</span><b>Marketing Head</b><span>Required deliverable</span><b>Strategic opportunity assessment and refined theme brief</b><span>Assessment due date</span><b>{f.due || 'Not set'}</b></div>
          </Card>
        </div>
      </div>
      <Card><WorkflowStepper steps={STEPS.themeSuggestion} current={0} /></Card>
      <FooterBar onBack={() => go(R.opportunity)} onNext={() => go(R.tracker)} />
      {params.get('drawer') === 'submit' && (
        <Drawer title="Strategic theme recommendation — review and submit" status={<StatusChip tone="warn">Draft · not sent</StatusChip>}
          onClose={() => setParams((p) => { const n = new URLSearchParams(p); n.delete('drawer'); return n; })}
          footer={<PanelFooter onBack={() => setParams((p) => { const n = new URLSearchParams(p); n.delete('drawer'); return n; })} action={<Button small primary icon={Send} onClick={submit}>Submit recommendation to Marketing Head</Button>} />}>
          <div className="row" style={{ gap: 14 }}>
            <FileText size={28} color="var(--brand)" />
            <div><b className="strong" style={{ fontSize: 16 }}>{f.theme}</b><div className="muted">{regionById(f.region).name} / {f.state} / {f.district} / {f.territory} · {f.crop} / {f.product}</div></div>
            <span style={{ marginLeft: 'auto' }} className="row"><StatusChip tone="warn">{f.priority} priority</StatusChip><StatusChip tone="ok">Recipient: Marketing Head</StatusChip></span>
          </div>
          <div className="row"><StatusChip tone="info" icon={Link2}>{f.link === 'modify' ? `Modification to: ${linked.name}` : 'Separate theme'}</StatusChip><span style={{ marginLeft: 'auto' }} className="row"><Button small icon={Eye} onClick={() => go(R.review(linked.id))}>View linked theme</Button><Button small icon={Save} onClick={saveDraft}>Save draft</Button></span></div>
          <div className="grid g2">
            <Card title="Strategic success measures" flush>
              <DataTable rows={measures} rowKey={(m) => m.id} columns={[
                { key: 'k', header: 'KPI', render: (m) => m.kpi },
                { key: 'c', header: 'Current value', align: 'right', render: (m) => <b className="ok-text">{m.current}</b> },
                { key: 't', header: 'Proposed target', align: 'right', render: (m) => f.targets[m.id] || <StatusChip tone="neutral">Not set</StatusChip> },
              ]} />
            </Card>
            <Card title="Requested deliverables">
              {THEME_DELIVERABLES.map((d) => <div key={d} className="list-row"><span className="check" />{d}<span className="right"><StatusChip tone="neutral">Pending</StatusChip></span></div>)}
            </Card>
          </div>
          <div className="grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
            <label className="field"><span>Assessment due date</span><input type="date" className="input" value={f.due} onChange={(e) => set('due', e.target.value)} /></label>
            <label className="field"><span>Additional instructions</span><input className="input" value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Strategic direction" /></label>
          </div>
          <WorkflowStepper steps={STEPS.themeSuggestion} current={0} />
        </Drawer>
      )}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
    </div>
  );
}
