/** Screen 3 — Regional Performance (no mockup; same anatomy as the territory screen). */
import { ChartColumn, MapPin, Users } from 'lucide-react';
import { campaignsOf, REGIONS, regionById, territoriesOf } from '../data/bh';
import { crore, num, pct, ratio, sum } from '../data/format';
import { approvalQueue, impactRows } from '../data/zm';
import { R } from '../routes';
import { SERIES } from '../theme';
import { GroupedBars, HBars } from '../ui/charts';
import { Breadcrumb, Button, Card, FooterBar, KpiCard, PageHeader, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { useGo, useRouteRegion, useBack } from './common';

export function RegionalPerformance() {
  const go = useGo();
  const id = useRouteRegion();
  const r = regionById(id);
  const terrs = territoriesOf(id);
  const camps = campaignsOf(id);
  const hasDetail = (t: (typeof terrs)[number]) => t.activitiesDone !== null;
  // Territories without BH detail read the Zonal Manager local plans and impact records (same figures as the ZM screens).
  const impact = impactRows();
  const queue = approvalQueue();
  const acts = (t: (typeof terrs)[number]) => {
    if (hasDetail(t)) return { done: t.activitiesDone!, planned: t.activitiesPlanned! };
    const i = impact.find((x) => x.territory === t.id); const q = queue.find((x) => x.territory === t.id);
    return i?.done != null ? { done: i.done, planned: i.planned } : q ? { done: 0, planned: q.units } : null;
  };
  const adopters = (t: (typeof terrs)[number]) => t.adopters ?? impact.find((x) => x.territory === t.id)?.adopters ?? null;
  const firstDetail = terrs.find(hasDetail);

  const back = useBack(R.portfolio);
  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Campaign Portfolio Performance', onClick: () => go(R.portfolio) }, { label: `${r.name} region` }]} />
      <PageHeader title={`${r.name} Region Performance`} />
      <div className="kpis">
        <KpiCard label="Region achievement vs ABP" value={crore(r.achieved, 1)} />
        <KpiCard label="Active campaigns" value={r.campaigns} />
        <KpiCard label="Planned Execution" value={`${r.observedExec}%`} />
        <KpiCard label="Recorded adopters" value={num(r.adopters)} />
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
              { key: 'sales', header: 'Sales', align: 'right', render: (t) => crore(t.ytdSales) },
              { key: 'ach', header: 'Achievement', align: 'right', render: (t) => <StatusChip tone={t.ytdSales >= t.abp ? 'ok' : 'warn'}>{pct(ratio(t.ytdSales, t.abp))}</StatusChip> },
              { key: 'camp', header: 'Campaigns', align: 'right', render: (t) => (t.campaigns ? t.campaigns : <span className="na">None</span>) },
              { key: 'act', header: 'Activities', align: 'center', render: (t) => { const a = acts(t); return a ? `${a.done} / ${a.planned}` : <span className="na">No local plan</span>; } },
              { key: 'adopt', header: 'Adopters', align: 'right', render: (t) => { const a = adopters(t); return a !== null ? num(a) : <span className="na">Not started</span>; } },
              { key: 'view', header: 'View', align: 'center', render: (t) => (hasDetail(t) ? <Button small onClick={() => go(R.territory(t.id))}>View</Button> : <span className="na">Summary only</span>) },
            ]}
            total={{ name: 'Total', abp: crore(sum(terrs, (t) => t.abp)), sales: crore(sum(terrs, (t) => t.ytdSales)), ach: pct(ratio(sum(terrs, (t) => t.ytdSales), sum(terrs, (t) => t.abp))), camp: sum(terrs, (t) => t.campaigns),
              act: `${sum(terrs, (t) => acts(t)?.done ?? 0)} / ${sum(terrs, (t) => acts(t)?.planned ?? 0)}`, adopt: num(sum(terrs, (t) => adopters(t) ?? 0)) }}
          />
        ) : <div style={{ padding: '6px 16px 10px' }}><StatusChip tone="neutral">Territory plans pending</StatusChip></div>}
      </Card>

      <div className="grid g2">
        <Card title={`Planned vs observed execution by ${camps.length ? 'campaign' : 'region'}`} icon={ChartColumn}>
          {camps.length ? (
            <GroupedBars data={camps.map((c) => ({ name: c.short, planned: c.plannedExec, observed: c.observedExec }))} x="name" unit="%" max={100}
              series={[{ key: 'planned', label: 'Planned execution', color: SERIES.planned }, { key: 'observed', label: 'Observed execution', color: SERIES.observed }]} />
          ) : (
            <GroupedBars data={REGIONS.map((x) => ({ name: x.name, planned: x.plannedExec, observed: x.observedExec }))} x="name" unit="%" max={100} highlight={r.name}
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

      <FooterBar onBack={back} onNext={() => go(firstDetail ? R.territory(firstDetail.id) : R.effectiveness(id))} />
    </div>
  );
}
