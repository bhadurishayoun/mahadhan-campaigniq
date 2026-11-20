/** Screen 1 — National Command Centre (mockup BH.1.png). */
import { AlertCircle, BadgeIndianRupee, ChartColumn, ChartColumnIncreasing, ClipboardCheck, Coins, ExternalLink, Layers, Megaphone, Target, TriangleAlert, Users } from 'lucide-react';
import { useState } from 'react';
import { CAMPAIGNS, netRoi, REGIONS, regionMetrics, regionRoi, THEME_QUEUE, THEME_STATUS, type ThemeId } from '../data/bh';
import { crore, num, pct, ratio, sum, times } from '../data/format';
import { R } from '../routes';
import { attentionItems } from '../shell/attention';
import { useBhStore } from '../store/bhStore';
import { SERIES } from '../theme';
import { GroupedBars } from '../ui/charts';
import { Button, Card, DualBar, FilterBar, FooterBar, KpiCard, PageHeader, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { ALL, CAMPAIGN_OPTIONS, CROP_OPTIONS, PRODUCT_OPTIONS, REGION_OPTIONS, THEME_OPTIONS, useGo, useScopeFilter } from './common';

export function CommandCentre() {
  const go = useGo();
  const store = useBhStore();
  const [region, setRegion] = useScopeFilter();
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [campaign, setCampaign] = useState(ALL);

  // Crop, product and campaign records exist for West campaigns; picking one narrows the view to West.
  const westOnly = crop !== ALL || product !== ALL || campaign !== ALL;
  const rows = REGIONS.filter((r) => (region === ALL || r.id === region) && (!westOnly || r.id === 'west'));
  const filtered = rows.length !== REGIONS.length;
  const campaignsOf = (r: (typeof REGIONS)[number]) => (campaign !== ALL ? 1 : theme === ALL ? r.campaigns : r.themeMix[theme as ThemeId]);

  const t = {
    abp: sum(rows, (r) => r.abp), achieved: sum(rows, (r) => r.achieved), approved: sum(rows, (r) => r.approved),
    actual: sum(rows, (r) => r.actual), adopters: sum(rows, (r) => r.adopters), campaigns: sum(rows, campaignsOf),
    planned: Math.round(sum(rows, (r) => r.plannedExec) / rows.length), observed: Math.round(sum(rows, (r) => r.observedExec) / rows.length),
  };
  if (campaign !== ALL) {
    const c = CAMPAIGNS.find((x) => x.id === campaign)!;
    Object.assign(t, { approved: c.approved, actual: c.actual, adopters: c.adopters, planned: c.plannedExec, observed: c.observedExec });
  }
  const sales = campaign !== ALL ? CAMPAIGNS.find((x) => x.id === campaign)!.sales : sum(rows, (r) => r.sales);
  const achPct = ratio(t.achieved, t.abp);
  const utilPct = ratio(t.actual, t.approved);
  const scopeName = filtered ? (rows.length === 1 ? `${rows[0].name} region` : 'Selection') : 'Total (national)';

  return (
    <div className="page">
      <PageHeader title="National Business & Marketing Command Centre" />
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: setRegion },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
        { key: 'theme', label: 'Theme', value: theme, options: THEME_OPTIONS, onChange: setTheme },
        { key: 'campaign', label: 'Campaign', value: campaign, options: CAMPAIGN_OPTIONS, onChange: setCampaign },
      ]} />

      <div className="kpis" style={{ gridTemplateColumns: 'repeat(6, minmax(0, 1fr))' }}>
        <KpiCard icon={Target} label="Achievement vs YTD ABP" value={crore(t.achieved, 1)} sub={<>of {crore(t.abp, 1)}<StatusChip tone="ok">{pct(achPct)}</StatusChip></>} ratio={achPct} />
        <KpiCard icon={Coins} label="Investment vs approved" value={crore(t.actual)} sub={<>of {crore(t.approved)}<StatusChip tone="ok">{pct(utilPct, 0)}</StatusChip></>} ratio={utilPct} />
        <KpiCard icon={Megaphone} label="Active campaigns" value={num(t.campaigns)} sub={`${rows.length} region${rows.length > 1 ? 's' : ''}`} />
        <KpiCard icon={Users} label="Farmer adoption" value={num(t.adopters)} sub="farmers" />
        <KpiCard icon={ChartColumnIncreasing} label="Incremental sales" value={crore(sales)} sub="validated" />
        <KpiCard icon={BadgeIndianRupee} label="Portfolio net ROI" value={times(netRoi(sales, t.actual))} sub="35% margin" />
      </div>

      <Card title="National campaign portfolio performance (region-wise)" icon={Layers} flush>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          onRowClick={(r) => go(R.region(r.id))}
          columns={[
            { key: 'region', header: 'Region', render: (r) => <b>{r.name}</b> },
            { key: 'ach', header: 'YTD business achievement', render: (r) => <span className="row nw">{crore(r.achieved, 1)} / {crore(r.abp, 1)}<StatusChip tone="ok">{pct(regionMetrics(r).achievementPct)}</StatusChip></span> },
            { key: 'camp', header: 'Campaigns running', align: 'right', render: (r) => campaignsOf(r) },
            { key: 'exec', header: 'Planned vs observed execution', render: (r) => <span className="row nw">{r.plannedExec}% / {r.observedExec}%<DualBar planned={r.plannedExec} observed={r.observedExec} /></span> },
            { key: 'inv', header: 'Marketing investment', align: 'right', render: (r) => crore(r.actual) },
            { key: 'adopt', header: 'Recorded adoption', align: 'right', render: (r) => num(r.adopters) },
            { key: 'sales', header: 'Attributed incremental sales', align: 'right', render: (r) => crore(r.sales) },
            { key: 'roi', header: 'Net ROI', align: 'center', render: (r) => <StatusChip tone="ok">{times(regionRoi(r))}</StatusChip> },
            { key: 'view', header: 'Drilldown', align: 'center', render: (r) => <Button small icon={ExternalLink} onClick={() => go(R.region(r.id))}>View</Button> },
          ]}
          total={{
            region: scopeName,
            ach: <span className="row nw">{crore(t.achieved, 1)} / {crore(t.abp, 1)}<StatusChip tone="ok">{pct(achPct)}</StatusChip></span>,
            camp: num(t.campaigns),
            exec: <span className="row nw">{t.planned}% / {t.observed}%<DualBar planned={t.planned} observed={t.observed} /></span>,
            inv: crore(t.actual),
            adopt: num(t.adopters),
            sales: crore(sales),
            roi: <StatusChip tone="ok">{times(netRoi(sales, t.actual))}</StatusChip>,
          }}
        />
      </Card>

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.3fr 1fr' }}>
        <Card title="Regional execution comparison (planned vs observed)" icon={ChartColumn}>
          <GroupedBars
            data={rows.map((r) => ({ region: r.name, planned: r.plannedExec, observed: r.observedExec }))}
            x="region" unit="%" max={100}
            series={[{ key: 'planned', label: 'Planned execution', color: SERIES.planned }, { key: 'observed', label: 'Observed execution', color: SERIES.observed }]}
          />
        </Card>
        <Card title="Strategic theme approval queue" icon={ClipboardCheck} flush>
          <DataTable
            rows={THEME_QUEUE}
            rowKey={(q) => q.id}
            onRowClick={(q) => go(R.review(q.id))}
            columns={[
              { key: 'theme', header: 'Strategic theme', render: (q) => q.name },
              { key: 'mh', header: 'Marketing Head', align: 'center', render: (q) => { const s = THEME_STATUS[store.themeStatus[q.id]]; return <StatusChip tone={s.tone === 'risk' ? 'risk' : 'ok'}>{s.mh}</StatusChip>; } },
              { key: 'bh', header: 'Business Head', align: 'center', render: (q) => { const s = THEME_STATUS[store.themeStatus[q.id]]; return s.bh === '—' ? '—' : <StatusChip tone={s.tone}>{s.bh}</StatusChip>; } },
            ]}
          />
        </Card>
        <Card title="Management attention" icon={TriangleAlert}>
          {attentionItems(store.themeStatus).map((a) => (
            <button key={a.id} type="button" className="list-row" style={{ width: '100%', textAlign: 'left' }} onClick={() => go(a.to)}>
              <AlertCircle size={16} color="var(--amber)" />{a.text}
            </button>
          ))}
        </Card>
      </div>

      <FooterBar onBack={() => window.history.back()} onNext={() => go(R.portfolio)} />
    </div>
  );
}
