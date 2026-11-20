/**
 * Region comparison card: always all four regions (the region filter never hides regions), sorted high → low,
 * brand bars, the scope region in amber with a bold label, a dashed reference line, value at the bar end, tooltip.
 */
import type { LucideIcon } from 'lucide-react';
import { Bar, BarChart, Cell, LabelList, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { REGIONS, type Region, type RegionId } from '../data/bh';
import { C } from '../theme';
import { Card } from '../ui/core';

export function RegionBarsCard({ title, icon, sub, scope, value, format, reference, tooltip }: {
  title: string;
  icon: LucideIcon;
  sub: string;
  scope: RegionId | null;
  value: (r: Region) => number;
  format: (v: number) => string;
  reference: { value: number; label: string };
  tooltip: (r: Region) => string;
}) {
  const rows = [...REGIONS].sort((a, b) => value(b) - value(a)).map((r) => ({ id: r.id, name: r.name, v: value(r), r }));
  const max = rows[0].v * 1.08;
  const Tick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) => (
    <text x={x} y={y} dy={4} textAnchor="end" fontSize={13} fill={C.ink} fontWeight={rows.find((r) => r.name === payload?.value)?.id === scope ? 700 : 400}>{payload?.value}</text>
  );
  return (
    <Card title={title} icon={icon}>
      <div className="muted" style={{ fontSize: 12, marginTop: -6 }}>{sub}</div>
      <div style={{ flex: 1, minHeight: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 18, right: 64, left: 4, bottom: 0 }} barCategoryGap="28%">
            <XAxis type="number" hide domain={[0, max]} />
            <YAxis type="category" dataKey="name" width={56} tick={<Tick />} axisLine={false} tickLine={false} />
            <Tooltip cursor={{ fill: C.canvas }} content={({ active, payload }) => {
              const p = active ? (payload?.[0]?.payload as (typeof rows)[number] | undefined) : undefined;
              return p ? <div className="toast" style={{ background: C.card, color: C.ink, border: `1px solid ${C.line}` }}>{tooltip(p.r)}</div> : null;
            }} />
            <ReferenceLine x={reference.value} stroke={C.inkSoft} strokeDasharray="4 4" label={{ value: reference.label, position: 'top', fontSize: 12, fill: C.inkSoft }} />
            <Bar dataKey="v" barSize={16} radius={[0, 3, 3, 0]} isAnimationActive={false}>
              {rows.map((r) => <Cell key={r.id} fill={r.id === scope ? C.amber : C.brand} />)}
              <LabelList dataKey="v" position="right" formatter={(v: number) => format(v)} style={{ fontSize: 12, fontWeight: 600, fill: C.ink }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
