/** Screen 3 — Regional Performance (no mockup; same anatomy as the territory screen). */
import { ChartColumn, Gauge, MapPin, Megaphone, Target, Users } from 'lucide-react';
import { campaignsOf, regionById, regionMetrics, territoriesOf } from '../data/bh';
import { crore, num, pct, pp, ratio, sum } from '../data/format';
import { R } from '../routes';
import { SERIES } from '../theme';
import { GroupedBars, HBars } from '../ui/charts';
import { Breadcrumb, Button, Card, FooterBar, KpiCard, PageHeader, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { useGo, useRouteRegion } from './common';

export function RegionalPerformance() {
  const go = useGo();
  const id = useRouteRegion();
  const r = regionById(id);
  const m = regionMetrics(r);
  const terrs = territoriesOf(id);
  const camps = campaignsOf(id);
  const hasDetail = (t: (typeof terrs)[number]) => t.activitiesDone !== null;
  const firstDetail = terrs.find(hasDetail);

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Campaign portfolio performance', onClick: () => go(R.portfolio) }, { label: `${r.name} region` }]} />
      <PageHeader title={`${r.name} Region Performance`} />
      <div className="kpis">
        <KpiCard icon={Target} label="Region achievement vs YTD ABP" value={crore(r.achieved, 1)} sub={<>of {crore(r.abp, 1)}<StatusChip tone="ok">{pct(m.achievementPct)}</StatusChip></>} ratio={m.achievementPct} />
        <KpiCard icon={Megaphone} label="Active campaigns" value={r.campaigns} sub={`across ${terrs.length} territories`} />
        <KpiCard icon={Gauge} label="Observed execution" value={`${r.observedExec}%`} sub={<>vs {r.plannedExec}% planned<StatusChip tone="warn">{pp(m.execVariance)}</StatusChip></>} ratio={r.observedExec} />
        <KpiCard icon={Users} label="Recorded adopters" value={num(r.adopters)} sub="farmers" />
      </div>

      <Card title="Territory performance" icon={MapPin} flush>
        {terrs.length ? (
          <DataTable
            rows={terrs}
            rowKey={(t) => t.id}
            onRowClick={(t) => (hasDetail(t) ? go(R.territory(t.id)) : undefined)}
            columns={[
              { key: 'name', header: 'Territory', render: (t) => <b>{t.name}</b> },
              { key: 'abp', header: 'ABP', align: 'right', render: (t) => crore(t.abp) },
              { key: 'sales', header: 'YTD sales', align: 'right', render: (t) => crore(t.ytdSales) },
              { key: 'ach', header: 'Achievement', align: 'right', render: (t) => <StatusChip tone={t.ytdSales >= t.abp ? 'ok' : 'warn'}>{pct(ratio(t.ytdSales, t.abp))}</StatusChip> },
              { key: 'camp', header: 'Campaigns', align: 'right', render: (t) => t.campaigns },
              { key: 'act', header: 'Activities', align: 'center', render: (t) => (hasDetail(t) ? `${t.activitiesDone} / ${t.activitiesPlanned}` : <StatusChip tone="neutral">Pending</StatusChip>) },
              { key: 'adopt', header: 'Adopters', align: 'right', render: (t) => (t.adopters !== null ? num(t.adopters) : <StatusChip tone="neutral">Pending</StatusChip>) },
              { key: 'view', header: 'View', align: 'center', render: (t) => (hasDetail(t) ? <Button small onClick={() => go(R.territory(t.id))}>View</Button> : <StatusChip tone="neutral">Pending</StatusChip>) },
            ]}
            total={{ name: `Total (${r.name})`, abp: crore(sum(terrs, (t) => t.abp)), sales: crore(sum(terrs, (t) => t.ytdSales)), ach: pct(ratio(sum(terrs, (t) => t.ytdSales), sum(terrs, (t) => t.abp))), camp: sum(terrs, (t) => t.campaigns) }}
          />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">Territory plans pending</StatusChip></div>}
      </Card>

      <div className="grid g2">
        <Card title="Planned vs observed execution by campaign" icon={ChartColumn}>
          {camps.length ? (
            <GroupedBars data={camps.map((c) => ({ name: c.short, planned: c.plannedExec, observed: c.observedExec }))} x="name" unit="%" max={100}
              series={[{ key: 'planned', label: 'Planned execution', color: SERIES.planned }, { key: 'observed', label: 'Observed execution', color: SERIES.observed }]} />
          ) : (
            <GroupedBars data={[{ name: `${r.name} region`, planned: r.plannedExec, observed: r.observedExec }]} x="name" unit="%" max={100}
              series={[{ key: 'planned', label: 'Planned execution', color: SERIES.planned }, { key: 'observed', label: 'Observed execution', color: SERIES.observed }]} />
          )}
        </Card>
        <Card title="Recorded adopters by campaign" icon={Users}>
          {camps.length ? (
            <HBars rows={camps.map((c) => ({ label: c.short, values: [c.adoptionTarget, c.adopters] }))}
              series={[{ key: 'target', label: 'Adoption target', color: SERIES.planned }, { key: 'adopters', label: 'Recorded adopters', color: SERIES.observed }]}
              max={Math.max(...camps.map((c) => c.adoptionTarget))} format={num} />
          ) : <StatusChip tone="neutral">Campaign-level records pending</StatusChip>}
        </Card>
      </div>

      <FooterBar onBack={() => go(R.portfolio)} onNext={() => go(firstDetail ? R.territory(firstDetail.id) : R.effectiveness(id))} />
    </div>
  );
}
