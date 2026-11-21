/** Screen 2 — Campaign Portfolio Performance (mockup BH.2.png). */
import { ChartColumn, ExternalLink, Layers, Table2 } from 'lucide-react';
import { useState } from 'react';
import { ALL_CAMPAIGNS, netRoi, REGIONS, THEMES, type MixRow, type Season, type RegionId, type ThemeId } from '../data/bh';
import { crore, lakh, num, sum, times } from '../data/format';
import { R } from '../routes';
import { SERIES } from '../theme';
import { HBars, HeatGrid } from '../ui/charts';
import { Breadcrumb, Button, Card, FilterBar, FooterBar, KpiCard, PageHeader, SegmentedControl, Select, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { ALL, CROP_OPTIONS, PRODUCT_OPTIONS, REGION_OPTIONS, THEME_OPTIONS, useDrillRegion, useGo, useScopeFilter, useBack } from './common';

type View = 'theme' | 'crop' | 'product' | 'geography';
type SortKey = 'roi' | 'investment' | 'adopters' | 'sales';

/** Region with the most campaigns for a theme (drill target for a theme row). */
const topRegionFor = (t: ThemeId): RegionId => [...REGIONS].sort((a, b) => b.themeMix[t] - a.themeMix[t])[0].id;

export function Portfolio() {
  const go = useGo();
  const [region, setRegion] = useScopeFilter();
  const [crop, setCrop] = useState(ALL);
  const [product, setProduct] = useState(ALL);
  const [theme, setTheme] = useState(ALL);
  const [view, setView] = useState<View>('theme');
  const drill = useDrillRegion();

  const [season, setSeason] = useState<'all' | Season>('all');
  const [sortBy, setSortBy] = useState<SortKey>('roi');
  const regions = REGIONS.filter((r) => region === ALL || r.id === region);
  const themes = THEMES.filter((t) => theme === ALL || t.id === theme);
  // Every figure on this page comes from the campaign records in scope, so season and filters reconcile everywhere.
  const camps = ALL_CAMPAIGNS.filter((c) => (region === ALL || c.region === region) && (theme === ALL || c.theme === theme)
    && (season === 'all' || c.season === season) && (crop === ALL || c.crop === crop) && (product === ALL || c.product === product));
  const group = (key: string, name: string, g: typeof camps): MixRow => ({ id: key, name, campaigns: g.length, investment: sum(g, (c) => c.actual), adopters: sum(g, (c) => c.adopters), sales: sum(g, (c) => c.sales) });
  const by = (f: (c: (typeof camps)[number]) => string) => [...new Set(camps.map(f))].map((k) => group(k, k, camps.filter((c) => f(c) === k)));
  const kpi = { campaigns: camps.length, investment: sum(camps, (c) => c.actual), adopters: sum(camps, (c) => c.adopters) };
  const avgExec = Math.round(sum(regions, (r) => r.observedExec) / regions.length);
  const SORTS: Record<SortKey, (m: MixRow) => number> = { roi: (m) => netRoi(m.sales, m.investment), investment: (m) => m.investment, adopters: (m) => m.adopters, sales: (m) => m.sales };

  const mixRows: MixRow[] = (view === 'crop' ? by((c) => c.crop)
    : view === 'product' ? by((c) => c.product)
    : view === 'geography' ? regions.map((r) => group(r.id, `${r.name} region`, camps.filter((c) => c.region === r.id))).filter((m) => m.campaigns > 0)
    : themes.map((t) => group(t.id, t.name, camps.filter((c) => c.theme === t.id))).filter((m) => m.campaigns > 0))
    .sort((x, y) => SORTS[sortBy](y) - SORTS[sortBy](x));
  const drillFor = (m: MixRow): string => (view === 'geography' ? R.region(m.id as RegionId) : view === 'theme' ? R.region(topRegionFor(m.id as ThemeId)) : R.region(drill));
  const groupLabel = { theme: 'Theme', crop: 'Crop', product: 'Product', geography: 'Region' }[view];

  const back = useBack(R.command);
  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Marketing and Command Centre', onClick: () => go(R.command) }, { label: 'Campaign Portfolio Performance' }]} />
      <PageHeader title="Campaign Portfolio Performance" />
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: setRegion },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
        { key: 'theme', label: 'Theme', value: theme, options: THEME_OPTIONS, onChange: setTheme },
      ]} />
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <SegmentedControl<View> value={view} onChange={setView} options={[
        { value: 'theme', label: 'Theme-wise' }, { value: 'crop', label: 'Crop-wise' }, { value: 'product', label: 'Product-wise' }, { value: 'geography', label: 'Geography-wise' },
        ]} />
        <div className="row" style={{ gap: 12 }}>
          <label className="row" style={{ gap: 6 }}><span className="seg-label">Season</span><Select label="Season" value={season} onChange={(v) => setSeason(v as 'all' | Season)} options={[{ value: 'all', label: 'All seasons' }, { value: 'Kharif', label: 'Kharif' }, { value: 'Rabi', label: 'Rabi' }]} /></label>
          <label className="row" style={{ gap: 6 }}><span className="seg-label">Sort by</span><Select label="Sort by" value={sortBy} onChange={(v) => setSortBy(v as SortKey)} options={[{ value: 'roi', label: 'Net ROI (high–low)' }, { value: 'investment', label: 'Investment' }, { value: 'adopters', label: 'Adopters' }, { value: 'sales', label: 'Incremental sales' }]} /></label>
        </div>
      </div>
      <div className="kpis">
        <KpiCard label="Active campaigns" value={num(kpi.campaigns)} />
        <KpiCard label="Actual marketing investment" value={crore(kpi.investment)} />
        <KpiCard label="Recorded adopters" value={num(kpi.adopters)} />
        <KpiCard label="Average regional execution" value={`${avgExec}%`} />
      </div>

      <Card title={`${groupLabel}-wise campaign performance`} icon={Layers} flush>
        <DataTable
          rows={mixRows}
          rowKey={(m) => m.id}
          onRowClick={(m) => go(drillFor(m))}
          columns={[
            { key: 'name', header: groupLabel, render: (m) => m.name },
            { key: 'camp', header: 'Active campaigns', align: 'right', render: (m) => m.campaigns },
            { key: 'inv', header: 'Marketing investment', align: 'right', render: (m) => lakh(m.investment) },
            { key: 'adopt', header: 'Recorded adopters', align: 'right', render: (m) => num(m.adopters) },
            { key: 'sales', header: 'Incremental sales', align: 'right', render: (m) => lakh(m.sales) },
            { key: 'roi', header: 'Net ROI', align: 'center', render: (m) => <StatusChip tone="ok">{times(netRoi(m.sales, m.investment))}</StatusChip> },
            { key: 'view', header: 'View', align: 'center', render: (m) => <Button small icon={ExternalLink} onClick={() => go(drillFor(m))}>View</Button> },
          ]}
          total={{ name: 'Total', camp: num(sum(mixRows, (m) => m.campaigns)), inv: lakh(sum(mixRows, (m) => m.investment)), adopt: num(sum(mixRows, (m) => m.adopters)), sales: lakh(sum(mixRows, (m) => m.sales)), roi: <StatusChip tone="ok">{times(netRoi(sum(mixRows, (m) => m.sales), sum(mixRows, (m) => m.investment)))}</StatusChip> }}
        />
      </Card>

      <div className="grid g2">
        <Card title="Region × theme: active campaign count" icon={Table2}>
          <HeatGrid
            rows={REGIONS.map((r) => ({ key: r.id, label: r.name }))}
            highlight={region === ALL ? undefined : region}
            cols={themes.map((t) => ({ key: t.id, label: t.short }))}
            value={(r, t) => camps.filter((c) => c.region === r && c.theme === t).length}
            onCell={(r) => go(R.region(r as RegionId))}
            total
          />
        </Card>
        <Card title="Recorded adopters by theme" icon={ChartColumn}>
          <HBars
            rows={themes.map((t) => ({ label: t.name, values: [sum(camps.filter((c) => c.theme === t.id), (c) => c.adopters)] }))}
            series={[{ key: 'adopters', label: 'Recorded adopters', color: SERIES.planned }]}
            max={Math.max(1, ...themes.map((t) => sum(camps.filter((c) => c.theme === t.id), (c) => c.adopters)))}
            format={num}
          />
        </Card>
      </div>

      <FooterBar onBack={back} onNext={() => go(R.region(region === ALL ? drill : (region as RegionId)))} />
    </div>
  );
}
