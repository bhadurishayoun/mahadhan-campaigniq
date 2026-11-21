/**
 * Screens 11–16 — Market Opportunity (BH.4.png), Theme Approval Inbox (BH.4b.png), Theme Detailed Review (BH.4c.png),
 * Theme Decision modal (BH.4d.png). The Business Head approves themes proposed by the Marketing Head.
 */
import { Box, ChartColumn, CircleCheck, Eye, FileSearch, FileText, Layers, MapPin, CheckCircle2, Save, Send, Sprout, Store, Target, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AMBAD, ambadMetrics, campaignById, netRoi, campaignMetrics, MARKET, NATIONAL, NATIONAL_METRICS, READINESS_ITEMS, READINESS_STATUS,
  REGIONS, regionById, regionMetrics, THEME_QUEUE, THEME_STATUS, themeCandidates, themeDirections, themeEvidence, TERRITORIES,
  type RegionId, type ThemeProposal,
} from '../data/bh';
import { crore, lakh, num, pct, times } from '../data/format';
import { R } from '../routes';
import { useBhStore, type ThemeDecision } from '../store/bhStore';
import { RegionBarsCard } from './RegionBars';
import { SERIES } from '../theme';
import { HBars, Legend } from '../ui/charts';
import { Breadcrumb, Button, Card, FilterBar, FooterBar, KpiCard, PageHeader, PanelFooter, SegmentedControl, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { EvidenceDrawer, Modal, type Evidence } from '../ui/overlay';
import { ALL, CROP_OPTIONS, opt, PRODUCT_OPTIONS, REGION_OPTIONS, useGo, useScopeFilter } from './common';

function ThemeTabs({ active }: { active: 'inbox' | 'opportunity' }) {
  const go = useGo();
  return <SegmentedControl value={active} onChange={(v) => go(v === 'inbox' ? R.inbox : R.opportunity)} options={[{ value: 'inbox', label: 'Theme approval inbox' }, { value: 'opportunity', label: 'Market opportunity' }]} />;
}


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
      { icon: ChartColumn, label: `${MARKET.state} product penetration`, value: MARKET.penetration, chip: 'Validate' },
      { icon: Sprout, label: 'Ambad trial-to-adoption', value: pct(a.trialToAdoptionPct) },
      { icon: Target, label: 'Village conversion gap', value: `${a.villageGap.toFixed(1)} pp` },
      { icon: CircleCheck, label: 'Activity completion', value: pct(a.activityPct) },
      { icon: Users, label: 'Farmer follow-up completion', value: pct(a.followUpPct) },
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
        <KpiCard label="Business ABP" value={crore(NATIONAL.abp, 1)} />
        <KpiCard label="Actual achievement" value={crore(NATIONAL.achieved, 1)} />
        <KpiCard label="Business gap" value={crore(NATIONAL_METRICS.gap, 1)} />
        <KpiCard label="Achievement" value={pct(NATIONAL_METRICS.achievementPct)} />
      </div>
      <Card title="Regional business gap and marketing coverage" icon={Layers} flush>
        <DataTable selectable rows={regions} rowKey={(r) => r.id} selected={selRegion.id} onRowClick={(r) => setSel(r.id)}
          columns={[
            { key: 'n', header: 'Region', render: (r) => <b>{r.name}</b> },
            { key: 'abp', header: 'ABP', align: 'right', render: (r) => crore(r.abp, 1) },
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
        <RegionBarsCard title="Regional business gaps" icon={ChartColumn} sub={`ABP − actual sales · total ${crore(NATIONAL_METRICS.gap, 1)}`} scope={region === ALL ? null : (region as RegionId)}
          value={(r) => regionMetrics(r).gap} format={(v) => crore(v, 1)}
          reference={{ value: NATIONAL_METRICS.gap / REGIONS.length, label: `Avg ${crore(NATIONAL_METRICS.gap / REGIONS.length, 1)}` }}
          tooltip={(r) => `ABP ${crore(r.abp, 1)} · Actual ${crore(r.achieved, 1)} · Gap ${crore(regionMetrics(r).gap, 1)} (${pct((regionMetrics(r).gap / r.abp) * 100)})`} />
        <Card title="Crop × product × geography opportunity" icon={MapPin}>
          <div className="row" style={{ flexWrap: 'nowrap', overflow: 'hidden' }}>
            {selRegion.id === 'west'
              ? <><StatusChip tone="info" icon={MapPin}>Ambad / Jalna</StatusChip><StatusChip tone="info" icon={Sprout}>{AMBAD.crop}</StatusChip><StatusChip tone="info" icon={Box}>{AMBAD.product}</StatusChip></>
              : <StatusChip tone="info" icon={MapPin}>{selRegion.name} region</StatusChip>}
          </div>
          <div className="opp-list">
            {tiles.map((t) => (
              <div key={t.label} className="opp-row">
                <t.icon size={16} />
                <span className="opp-label">{t.label}</span>
                {t.chip && <span className="opp-tag">{t.chip}</span>}
                <b className="opp-value">{t.value}</b>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Potential theme candidates" note="revised themes" icon={Layers} flush>
          <DataTable rows={themeCandidates()} rowKey={(c) => c.id}
            columns={[
              { key: 't', header: 'Theme', render: (c) => c.name },
              { key: 'k', header: 'Key indicator', render: (c) => c.indicator },
              { key: 's', header: 'Status', align: 'center', render: () => <StatusChip tone="warn">Candidate</StatusChip> },
              { key: 'a', header: 'Action', align: 'center', render: () => <Button small onClick={() => go(`${R.inbox}?theme=${THEME_QUEUE.find((t) => t.crop === AMBAD.crop && t.product === AMBAD.product)?.id ?? THEME_QUEUE[0].id}`)}>Review theme</Button> },
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
  const [params, setParams] = useSearchParams();
  const [selId, setSelId] = useState(params.get('theme') ?? THEME_QUEUE[0].id);
  const [evidence, setEvidence] = useState<Evidence | null>(null);
  const modalTheme = params.get('modal') === 'decision' ? THEME_QUEUE.find((t) => t.id === params.get('theme')) : undefined;
  const sel = queue.find((t) => t.id === selId) ?? queue[0] ?? null;
  const st = Object.values(store.themeStatus);
  const open = st.filter((s) => s === 'review_pending' || s === 'clarification_requested').length;

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Strategic themes & approvals' }, { label: 'Theme approval inbox' }]} />
      <PageHeader title="Theme Approval Inbox" right={<ThemeTabs active="inbox" />} />
      <div className="kpis">
        <KpiCard label="Under review" value={open} />
        <KpiCard label="Awaiting decision" value={st.filter((s) => s === 'review_pending').length} />
        <KpiCard label="Clarification requested" value={st.filter((s) => s === 'clarification_requested').length} />
      </div>
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: setRegion },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
        { key: 'status', label: 'Status', value: status, options: [opt(ALL, 'All statuses'), ...Object.entries(THEME_STATUS).map(([k, v]) => opt(k, v.bh === '—' ? v.mh : v.bh))], onChange: setStatus },
      ]} />
      <Card title="Strategic theme approval queue" icon={FileText} flush right={<Button small primary icon={CheckCircle2} onClick={sel && store.themeStatus[sel.id] !== 'clarification_requested' ? () => go(`${R.decision(sel.id)}&choice=approve`) : undefined}>Approve theme</Button>}>
        {queue.length ? (
          <DataTable selectable rows={queue} rowKey={(t) => t.id} selected={sel?.id} onRowClick={(t) => setSelId(t.id)}
            columns={[
              { key: 'n', header: 'Proposed theme', render: (t) => t.name },
              { key: 'g', header: 'Region', render: (t) => t.geography },
              { key: 'c', header: 'Priority crop / product', render: (t) => t.cropProduct },
              { key: 'p', header: 'Proposed by', render: (t) => t.proposedBy },
              { key: 'pr', header: 'Priority', align: 'center', render: (t) => <StatusChip tone={t.priority === 'High' ? 'warn' : 'ok'}>{t.priority}</StatusChip> },
              { key: 's', header: 'Review status', align: 'center', render: (t) => { const s = THEME_STATUS[store.themeStatus[t.id]]; return <StatusChip tone={s.tone}>{s.bh === '—' ? s.mh : s.bh}</StatusChip>; } },
            ]} />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">No themes match the filters</StatusChip></div>}
      </Card>
      {sel && (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr)' }}>
          <Card title={sel.name} icon={ChartColumn}>
            <div className="ev-grid">
              {themeEvidence(sel.id).map((e) => <div key={e.label} className="ev-cell"><b>{e.value}</b><span>{e.label.replace(/-/g, '‑')}</span></div>)}
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
      <FooterBar onBack={() => go(R.opportunity)} onNext={sel ? () => go(R.review(sel.id)) : undefined} />
      {modalTheme && <DecisionModal t={modalTheme} initialChoice={params.get('choice') as ThemeDecision['choice'] | null} onClose={() => setParams({})} onShowOriginal={() => setEvidence({ title: `Original proposal — ${modalTheme.name}`, owner: 'Marketing Head and Zonal Manager records', facts: [
        { label: 'Proposed by', value: modalTheme.proposedBy }, { label: 'Geography', value: modalTheme.geography }, { label: 'Crop / product', value: modalTheme.cropProduct },
        { label: 'Objective', value: modalTheme.objective }, { label: 'Target cohort', value: modalTheme.cohort }, { label: 'Priority', value: modalTheme.priority },
      ] })} />}
      {evidence && <EvidenceDrawer evidence={evidence} onClose={() => setEvidence(null)} />}
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
    { p: 'West region business gap', v: crore(regionMetrics(west).gap, 2), scope: 'Regional business', st: 'Review', facts: [{ label: 'West ABP', value: crore(west.abp, 1) }, { label: 'West achievement', value: crore(west.achieved, 1) }] },
    { p: 'Ambad all-product onion ABP', v: crore(AMBAD.onionAbp), scope: 'Territory / all-product', st: 'Review', facts: [{ label: 'Territory all-product ABP', value: crore(TERRITORIES[0].abp) }, { label: 'Onion all-product ABP', value: crore(AMBAD.onionAbp) }] },
    { p: 'Croptek-specific allocation', v: 'Pending', scope: 'Product-specific', st: 'Pending', facts: [{ label: 'SKU mapping', value: 'Pending' }] },
    { p: `${MARKET.state} penetration`, v: MARKET.penetration, scope: 'State market signal', st: 'Validate', facts: [{ label: 'Source validation', value: 'Required' }] },
    { p: 'Existing campaign adoption', v: `${c.adopters} / ${c.adoptionTarget} = ${pct(cm.adoptionPct, 0)}`, scope: 'Prior regional campaign', st: 'Review', facts: [{ label: 'Campaign', value: c.name }, { label: 'Adoption target', value: num(c.adoptionTarget) }, { label: 'Recorded adopters', value: num(c.adopters) }] },
    { p: 'Regional execution', v: `${c.observedExec}% vs ${c.plannedExec}% planned`, scope: 'Prior regional campaign', st: 'Review', facts: [{ label: 'Planned execution', value: `${c.plannedExec}%` }, { label: 'Observed execution', value: `${c.observedExec}%` }] },
    { p: 'Actual ROI', v: times(netRoi(c.sales, c.actual)), scope: 'Prior regional campaign', st: 'Review', facts: [{ label: 'Validated incremental sales', value: lakh(c.sales) }, { label: 'Actual investment', value: lakh(c.actual) }] },
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
      <FooterBar onBack={() => go(R.inbox)} onNext={() => go(R.tracker)} />
      {params.get('modal') === 'decision' && <DecisionModal t={t} initialChoice={params.get('choice') as ThemeDecision['choice'] | null} onClose={() => setParams({})} onShowOriginal={() => showEvidence(`Original proposal — ${t.name}`, [
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

function DecisionModal({ t, onClose, onShowOriginal, initialChoice }: { t: ThemeProposal; onClose: () => void; onShowOriginal: () => void; initialChoice?: ThemeDecision['choice'] | null }) {
  const store = useBhStore();
  const nav = useNavigate();
  const draft = store.decisions.find((d) => d.themeId === t.id && d.draft);
  const [choice, setChoice] = useState<ThemeDecision['choice']>(initialChoice ?? draft?.choice ?? 'return');
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
        <StatusChip tone="ok" icon={Sprout}>New theme proposal</StatusChip>
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
    </Modal>
  );
}
