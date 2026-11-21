/** Screen 4 — Territory Performance, Ambad (mockup BH.3.png). */
import { CalendarCheck, Coins, Lightbulb, MapPin, Plus, TrendingUp, Users } from 'lucide-react';
import { Navigate, useParams } from 'react-router-dom';
import { AMBAD, ambadMetrics, campaignById, netRoi, territoryById } from '../data/bh';
import { crore, lakh, num, pct, ratio, times } from '../data/format';
import { R } from '../routes';
import { useBhStore } from '../store/bhStore';
import { Bar, Breadcrumb, Button, Card, FooterBar, KpiCard, PageHeader, StatusChip } from '../ui/core';
import { DataTable } from '../ui/DataTable';
import { useGo } from './common';
import { useEffect } from 'react';

export function TerritoryPerformance() {
  const go = useGo();
  const store = useBhStore();
  const { territory = '' } = useParams();
  const t = territoryById(territory);
  useEffect(() => { if (t) store.setScope(t.region); }, [t?.region]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!t || t.id !== AMBAD.territoryId) return <Navigate to={R.region(t?.region ?? 'west')} replace />;
  const a = ambadMetrics();
  const opportunities = [
    { id: 'gap', parameter: 'Conversion gap (village)', current: `${a.villageGap.toFixed(1)} pp`, action: 'Review coverage and engagement' },
    { id: 'follow', parameter: 'Follow-up completion', current: pct(a.followUpPct), action: 'Strengthen farmer follow-ups' },
    { id: 'retail', parameter: 'Retailer activation', current: pct(a.retailerActivationPct), action: 'Review activation depth and support' },
    { id: 'roi', parameter: 'Croptek conversion net ROI', current: times(netRoi(campaignById('croptek').sales, campaignById('croptek').actual)), action: 'Extend to Dhanora village' },
  ];
  const suggestUrl = `${R.suggest}?region=${t.region}&territory=${t.id}&crop=${AMBAD.crop}&product=${AMBAD.product}`;

  return (
    <div className="page">
      <Breadcrumb items={[{ label: 'Campaign portfolio performance', onClick: () => go(R.portfolio) }, { label: 'West region', onClick: () => go(R.region(t.region)) }, { label: 'Ambad' }]} />
      <PageHeader title={`${t.name} Territory Performance`} />
      <div className="kpis">
        <KpiCard label="Territory all-product ABP" value={crore(t.abp)} />
        <KpiCard label="Activity Completed" value={pct(a.activityPct)} />
        <KpiCard label="Recorded adopters" value={num(a.adopters)} />
        <KpiCard label="Trial-to-adoption" value={pct(a.trialToAdoptionPct)} />
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 300px' }}>
        <Card title="Crop × product business and campaign performance" icon={MapPin} flush>
          <DataTable
            rows={AMBAD.cropRows}
            rowKey={(r) => r.crop}
            columns={[
              { key: 'crop', header: 'Crop', render: (r) => <b>{r.crop}</b> },
              { key: 'product', header: 'Product', render: (r) => r.product },
              { key: 'abp', header: 'All-product crop ABP', align: 'right', render: (r) => (r.allProductAbp !== null ? <b>{crore(r.allProductAbp)}</b> : <StatusChip tone="neutral">Pending</StatusChip>) },
              { key: 'pabp', header: 'Product-specific ABP', align: 'center', render: (r) => <StatusChip tone={r.allProductAbp !== null ? 'warn' : 'neutral'}>{r.allProductAbp !== null ? 'SKU mapping pending' : 'Pending'}</StatusChip> },
              { key: 'sales', header: 'YTD sales', align: 'center', render: (r) => <StatusChip tone={r.allProductAbp !== null ? 'warn' : 'neutral'}>{r.allProductAbp !== null ? 'SKU mapping pending' : 'Pending'}</StatusChip> },
              { key: 'trials', header: 'Trials', align: 'right', render: (r) => (r.trials !== null ? num(r.trials) : '–') },
              { key: 'adopt', header: 'Recorded adopters', align: 'right', render: (r) => (r.adopters !== null ? num(r.adopters) : '–') },
              { key: 'conv', header: 'Conversion', align: 'right', render: (r) => (r.trials ? <span className="ok-text">{pct(ratio(r.adopters ?? 0, r.trials))}</span> : '–') },
            ]}
          />
        </Card>
        <Card title="Campaign outcome" icon={Coins}>
          <div className="list-row"><Coins size={18} color="var(--amber)" /><div><div className="muted">Campaign-linked sales</div><div className="row"><b className="kpi-value">{lakh(AMBAD.campaignLinkedSales)}</b><StatusChip tone="warn">Provisional</StatusChip></div></div></div>
          <div className="list-row"><TrendingUp size={18} color="var(--amber)" /><div><div className="muted">Croptek campaign net ROI</div><b className="kpi-value" style={{ fontSize: 18 }}>{times(netRoi(campaignById('croptek').sales, campaignById('croptek').actual))}</b></div></div>
        </Card>
      </div>

      <div className="grid g3">
        <Card title="Village-wise trial-to-adoption" icon={Users}>
          {a.villages.map((v, i) => (
            <div key={v.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}><span>{v.name}</span><span>{v.adopters} / {v.trials} = <b>{pct(v.pct)}</b></span></div>
              <Bar value={v.pct} tone={i === 0 ? 'amber' : 'brand'} />
            </div>
          ))}
          <div className="row" style={{ justifyContent: 'space-between', background: 'var(--amber-soft)', borderRadius: 8, padding: '8px 12px', marginTop: 'auto' }}><b>Conversion gap</b><b className="kpi-value" style={{ fontSize: 18 }}>{a.villageGap.toFixed(1)} pp</b></div>
        </Card>
        <Card title="Intervention execution" icon={CalendarCheck}>
          {AMBAD.interventions.map((i) => (
            <div key={i.name} className="row" style={{ gap: 12 }}><span style={{ width: 180 }}>{i.name}</span><Bar value={ratio(i.done, i.planned)} /><span style={{ width: 40, textAlign: 'right' }}>{i.done} / {i.planned}</span></div>
          ))}
          <div className="row" style={{ justifyContent: 'space-between', background: 'var(--amber-soft)', borderRadius: 8, padding: '8px 12px', marginTop: 'auto' }}><b>Total</b><b>{a.activitiesDone} / {a.activitiesPlanned} ({pct(a.activityPct)})</b></div>
        </Card>
        <Card title="Strategic opportunities" icon={Lightbulb} flush right={<Button small icon={Plus} onClick={() => go(suggestUrl)}>Suggest theme</Button>}>
          <DataTable rows={opportunities} rowKey={(o) => o.id} columns={[
            { key: 'p', header: 'Parameter', render: (o) => o.parameter },
            { key: 'c', header: 'Current', align: 'right', render: (o) => <b>{o.current}</b> },
            { key: 'a', header: 'Review action', render: (o) => <StatusChip wrap tone="warn">{o.action}</StatusChip> },
          ]} />
        </Card>
      </div>

      <FooterBar onBack={() => go(R.region(t.region))} onNext={() => go(R.effectiveness(t.region))} />
    </div>
  );
}
