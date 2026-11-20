/** Screen 2 — Campaign Portfolio Performance (mockup BH.2.png). */
import { ChartColumn, Coins, ExternalLink, Gauge, Layers, Megaphone, Table2, Users } from 'lucide-react';
import { useState } from 'react';
import { CROP_MIX, netRoi, PRODUCT_MIX, REGIONS, THEMES, themeCampaigns, type MixRow, type RegionId, type ThemeId } from '../data/bh';
import { crore, lakh, num, sum, times } from '../data/format';
import { R } from '../routes';
import { SERIES } from '../theme';
import { HBars, HeatGrid } from '../ui/charts';
import { Breadcrumb, Button, Card, FilterBar, FooterBar, KpiCard, PageHeader, SegmentedControl, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { ALL, CROP_OPTIONS, PRODUCT_OPTIONS, REGION_OPTIONS, THEME_OPTIONS, useDrillRegion, useGo, useScopeFilter } from './common';

type View = 'theme' | 'crop' | 'product' | 'geography';

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

  const regions = REGIONS.filter((r) => region === ALL || r.id === region);
  const themes = THEMES.filter((t) => theme === ALL || t.id === theme);
  const kpi = region === ALL
    ? { campaigns: sum(themes, (t) => themeCampaigns(t.id)), investment: sum(themes, (t) => t.investment), adopters: sum(themes, (t) => t.adopters) }
    : { campaigns: sum(regions, (r) => (theme === ALL ? r.campaigns : r.themeMix[theme as ThemeId])), investment: sum(regions, (r) => r.actual), adopters: sum(regions, (r) => r.adopters) };
  const avgExec = Math.round(sum(regions, (r) => r.observedExec) / regions.length);

  const mixRows: MixRow[] = view === 'crop' ? CROP_MIX.filter((m) => crop === ALL || m.name === crop)
    : view === 'product' ? PRODUCT_MIX.filter((m) => product === ALL || m.name === product)
    : view === 'geography' ? regions.map((r) => ({ id: r.id, name: `${r.name} region`, campaigns: r.campaigns, investment: r.actual, adopters: r.adopters, sales: r.sales }))
    : themes.map((t) => ({ id: t.id, name: t.name, campaigns: themeCampaigns(t.id), investment: t.investment, adopters: t.adopters, sales: t.sales }));
  const drillFor = (m: MixRow): string => (view === 'geography' ? R.region(m.id as RegionId) : view === 'theme' ? R.region(topRegionFor(m.id as ThemeId)) : R.region(drill));
  const groupLabel = { theme: 'Theme', crop: 'Crop', product: 'Product', geography: 'Region' }[view];

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'National Command Centre', onClick: () => go(R.command) }, { label: 'Campaign portfolio performance' }]} />
      <PageHeader title="National Campaign Portfolio Performance" />
      <FilterBar filters={[
        { key: 'region', label: 'Region', value: region, options: REGION_OPTIONS, onChange: setRegion },
        { key: 'crop', label: 'Crop', value: crop, options: CROP_OPTIONS, onChange: setCrop },
        { key: 'product', label: 'Product', value: product, options: PRODUCT_OPTIONS, onChange: setProduct },
        { key: 'theme', label: 'Theme', value: theme, options: THEME_OPTIONS, onChange: setTheme },
      ]} />
      <SegmentedControl<View> label="Analytical view" value={view} onChange={setView} options={[
        { value: 'theme', label: 'Theme-wise' }, { value: 'crop', label: 'Crop-wise' }, { value: 'product', label: 'Product-wise' }, { value: 'geography', label: 'Geography-wise' },
      ]} />
      <div className="kpis">
        <KpiCard icon={Megaphone} label="Active campaigns" value={num(kpi.campaigns)} sub={`across ${regions.length} region${regions.length > 1 ? 's' : ''}`} />
        <KpiCard icon={Coins} label="Actual marketing investment" value={crore(kpi.investment)} sub={`on ${num(kpi.adopters)} adopters`} />
        <KpiCard icon={Users} label="Recorded adopters" value={num(kpi.adopters)} sub="farmers" />
        <KpiCard icon={Gauge} label="Average regional execution" value={`${avgExec}%`} sub={`observed vs ${Math.round(sum(regions, (r) => r.plannedExec) / regions.length)}% planned`} ratio={avgExec} />
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
            rows={regions.map((r) => ({ key: r.id, label: r.name }))}
            cols={themes.map((t) => ({ key: t.id, label: t.short }))}
            value={(r, t) => REGIONS.find((x) => x.id === r)!.themeMix[t as ThemeId]}
            onCell={(r) => go(R.region(r as RegionId))}
            total
          />
        </Card>
        <Card title="Recorded adopters by theme" icon={ChartColumn}>
          <HBars
            rows={themes.map((t) => ({ label: t.name, values: [t.adopters] }))}
            series={[{ key: 'adopters', label: 'Recorded adopters', color: SERIES.planned }]}
            max={Math.max(...THEMES.map((t) => t.adopters))}
            format={num}
          />
        </Card>
      </div>

      <FooterBar onBack={() => go(R.command)} onNext={() => go(R.region(region === ALL ? drill : (region as RegionId)))} />
    </div>
  );
}
