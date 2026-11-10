import { memo, useCallback, useEffect, useId, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { geoConicConformal, geoPath } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom as d3zoom, zoomIdentity, zoomTransform, type ZoomBehavior, type ZoomTransform } from 'd3-zoom';
import type { Feature, GeoJsonProperties, Geometry } from 'geojson';
import { ArrowRight, Crosshair, Minus, Plus, RotateCcw, Search, X } from 'lucide-react';
import { clamp, usePanelExpanded, useWidth } from '../ui';
import { loadIndia, loadJalnaTalukas, type IndiaGeo, type TalukaGeo } from './geo';
import { place as getPlace, type Place } from './places';
import './map.css';

/* ------------------------------------------------------------------ public API */

export type MapTone = 0 | 1 | 2 | 3 | 4;
/** Sequential fills for areas that carry a value (state opportunity, taluka score). */
export const MAP_TONES = ['#eef4e4', '#d4e9c1', '#a9d58c', '#6db556', '#2f8a3b'];
const NEUTRAL = '#eceee9';
const HIGHLIGHT = '#f5cf63';
const HIGHLIGHT_LINE = '#b8860b';

export interface MapMarker {
  /** id from src/map/places.json */
  id: string;
  /** label shown on the map (defaults to the place name) */
  label?: string;
  /** related information from the screen, shown in the tooltip */
  info?: ReactNode;
  /** marker colour (defaults to brand green) */
  color?: string;
  /** called when the place is clicked on the map or in the list (selection only - no navigation) */
  onSelect?: () => void;
  /** optional navigation offered as a button in the place's tooltip */
  action?: { label: string; run: () => void };
}
export interface AreaInfo {
  info?: ReactNode;
  tone?: MapTone;
  onSelect?: () => void;
}
/** 'markers' frames all of the map's places (with their surrounding taluka / district visible). */
export type MapView = 'india' | 'markers' | { state: string } | { district: string; state?: string } | { taluka: string };

interface Props {
  /** accessible name of the map */
  label: string;
  markers: MapMarker[];
  /** state-level information / shading (e.g. opportunity by state) */
  states?: Record<string, AreaInfo>;
  /** when given, Jalna's 8 talukas are drawn, with optional information / shading per taluka */
  talukas?: Record<string, AreaInfo>;
  /** initial view and "reset" target */
  view?: MapView;
  /** zooms here whenever it changes (e.g. a state picked from a list next to the map) */
  focus?: MapView | null;
  /** id of the selected marker */
  selected?: string;
  /** legend for the tone shading */
  scale?: { title: string; items: { label: string; tone: MapTone }[] };
  /** legend for marker colours, when markers are coloured by a category */
  markerLegend?: { label: string; color: string }[];
  height?: number;
}

/* ------------------------------------------------------------------ helpers */

type Shape<P extends GeoJsonProperties = GeoJsonProperties> = { i: number; f: Feature<Geometry, P>; d: string; c: [number, number]; b: [[number, number], [number, number]]; area: number; pa: number; name: string };
type Box = { x0: number; y0: number; x1: number; y1: number };
type Tip = { kind: 'district' | 'taluka' | 'marker'; key: string; x: number; y: number };

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const textW = (text: string, size: number) => text.length * size * 0.58 + 4;
const overlaps = (a: Box, list: Box[]) => list.some((b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0);
const fmtCoord = (p: Place) => `${p.lat.toFixed(4)}° N, ${p.lon.toFixed(4)}° E`;
const viewKey = (v: MapView | null | undefined) => (v ? JSON.stringify(v) : '');

/** District paths are the heavy part (790 shapes): rendered once and only redrawn when fills change. */
const AreaLayer = memo(function AreaLayer({ shapes, fills, prefix, className }: { shapes: Shape[]; fills: string[]; prefix: string; className: string }) {
  return (
    <g className={className}>
      {shapes.map((s) => <path key={s.i} d={s.d} fill={fills[s.i]} data-k={`${prefix}:${s.i}`} />)}
    </g>
  );
});

/* ------------------------------------------------------------------ component */

export function IndiaDistrictMap({ label, markers, states, talukas, view = 'india', focus, selected, scale, markerLegend, height = 360 }: Props) {
  const expanded = usePanelExpanded();
  const [stageRef, width] = useWidth<HTMLDivElement>(600);
  const W = Math.max(240, width);
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const H = expanded
    ? Math.max(height, Math.round(viewportH * 0.66))
    : Math.round(clamp(Math.min(height, W * 1.1), 240, Math.max(240, viewportH * 0.62)));

  // ---- data
  const [geo, setGeo] = useState<IndiaGeo | null>(null);
  const [tal, setTal] = useState<TalukaGeo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const wantTalukas = !!talukas;
  useEffect(() => {
    let alive = true;
    setError(null);
    loadIndia().then((g) => alive && setGeo(g)).catch((e: Error) => alive && setError(e.message));
    if (wantTalukas) loadJalnaTalukas().then((g) => alive && setTal(g)).catch((e: Error) => alive && setError(e.message));
    return () => { alive = false; };
  }, [wantTalukas, attempt]);

  // ---- projection fitted to India at the stage size (Lambert conformal conic, as used for maps of India)
  const projection = useMemo(() => (geo ? geoConicConformal().parallels([12, 28]).rotate([-80, 0]).fitExtent([[10, 10], [W - 10, H - 10]], geo.outline) : null), [geo, W, H]);
  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection]);

  const toShapes = useCallback(<P extends GeoJsonProperties>(features: Feature<Geometry, P>[], name: (p: P) => string): Shape<P>[] => {
    if (!path) return [];
    return features.map((f, i) => {
      const b = path.bounds(f) as [[number, number], [number, number]];
      return { i, f, d: path(f) ?? '', c: path.centroid(f) as [number, number], b, area: (b[1][0] - b[0][0]) * (b[1][1] - b[0][1]), pa: path.area(f), name: name(f.properties) };
    });
  }, [path]);
  const districtShapes = useMemo(() => (geo ? toShapes(geo.districts, (p) => p.d) : []), [geo, toShapes]);
  const stateShapes = useMemo(() => (geo ? toShapes(geo.states, (p) => p.s) : []), [geo, toShapes]);
  const talukaShapes = useMemo(() => (tal && wantTalukas ? toShapes(tal.talukas, (p) => p.t) : []), [tal, wantTalukas, toShapes]);
  const outlineD = useMemo(() => (geo && path ? path(geo.outline) ?? '' : ''), [geo, path]);
  const stateBorderD = useMemo(() => (geo && path ? path(geo.stateBorders) ?? '' : ''), [geo, path]);
  const talukaBorderD = useMemo(() => (tal && path && wantTalukas ? path(tal.borders) ?? '' : ''), [tal, path, wantTalukas]);

  // ---- places
  const placed = useMemo(() => markers.map((m) => { const p = getPlace(m.id); return { ...m, place: p, name: m.label ?? p.name }; }), [markers]);
  const markedDistricts = useMemo(() => new Set(placed.map((m) => `${m.place.state}|${m.place.district}`)), [placed]);
  const markedTalukas = useMemo(() => new Set(placed.filter((m) => m.place.taluka).map((m) => m.place.taluka!)), [placed]);
  const tonesKey = JSON.stringify([states && Object.entries(states).map(([k, v]) => [k, v.tone]), talukas && Object.entries(talukas).map(([k, v]) => [k, v.tone])]);
  const markedKey = [...markedDistricts, '#', ...markedTalukas].join(',');

  const districtFills = useMemo(() => districtShapes.map((s) => {
    const p = s.f.properties as { d: string; s: string };
    if (markedDistricts.has(`${p.s}|${p.d}`)) return HIGHLIGHT;
    const tone = states?.[p.s]?.tone;
    return tone !== undefined ? MAP_TONES[tone] : NEUTRAL;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [districtShapes, markedKey, tonesKey]);
  const talukaFills = useMemo(() => talukaShapes.map((s) => {
    const t = s.name;
    const tone = talukas?.[t]?.tone;
    if (tone !== undefined) return MAP_TONES[tone];
    return markedTalukas.has(t) ? HIGHLIGHT : NEUTRAL;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [talukaShapes, markedKey, tonesKey]);

  // ---- zoom / pan (d3-zoom: drag, Ctrl/⌘ + wheel, trackpad pinch, touch pinch, double-click)
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const animRef = useRef(0);
  const [t, setT] = useState<ZoomTransform>(zoomIdentity);
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef(0);
  const flashHint = useCallback((text: string) => {
    setHint(text);
    window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 1600);
  }, []);

  const ready = !!geo && !!projection;
  useEffect(() => {
    if (!ready || !svgRef.current || !gRef.current) return;
    const svg = select(svgRef.current);
    const g = select(gRef.current);
    let frame = 0;
    let latest = zoomTransform(svgRef.current);
    const behavior = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.7, 900])
      // Plain wheel scrolls the page; Ctrl/⌘ + wheel (and trackpad pinch, which sends ctrlKey) zooms the map.
      .filter((event: Event) => {
        if (event.type === 'wheel') {
          const wheel = event as WheelEvent;
          if (!wheel.ctrlKey && !wheel.metaKey) { flashHint('Hold Ctrl (⌘ on Mac) and scroll to zoom the map'); return false; }
          return true;
        }
        return !(event as MouseEvent).button;
      })
      // ~1.2x per mouse-wheel notch; trackpad pinch (small deltas + ctrlKey) is amplified so it stays responsive
      .wheelDelta((event: WheelEvent) => {
        const base = -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.0028);
        return Math.abs(event.deltaY) < 40 ? base * 4 : base;
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        latest = event.transform;
        g.attr('transform', latest.toString());
        if (!frame) frame = requestAnimationFrame(() => { frame = 0; setT(latest); });
      });
    svg.call(behavior);
    zoomRef.current = behavior;
    return () => { svg.on('.zoom', null); cancelAnimationFrame(frame); zoomRef.current = null; };
  }, [ready, flashHint]);

  const applyTransform = useCallback((target: ZoomTransform, animate: boolean) => {
    const el = svgRef.current; const behavior = zoomRef.current;
    if (!el || !behavior) return;
    const sel = select(el);
    cancelAnimationFrame(animRef.current);
    const from = zoomTransform(el);
    if (!animate || reducedMotion()) { behavior.transform(sel, target); return; }
    const c0 = from.invert([W / 2, H / 2]); const c1 = target.invert([W / 2, H / 2]);
    const start = performance.now(); const duration = 600;
    const step = (now: number) => {
      const p = ease(Math.min(1, (now - start) / duration));
      const k = from.k * Math.pow(target.k / from.k, p);
      const cx = c0[0] + (c1[0] - c0[0]) * p; const cy = c0[1] + (c1[1] - c0[1]) * p;
      behavior.transform(sel, zoomIdentity.translate(W / 2 - k * cx, H / 2 - k * cy).scale(k));
      if (p < 1) animRef.current = requestAnimationFrame(step);
    };
    animRef.current = requestAnimationFrame(step);
  }, [W, H]);

  const fitBounds = useCallback((b: [[number, number], [number, number]], pad = 0.84) => {
    const dx = Math.max(b[1][0] - b[0][0], 4); const dy = Math.max(b[1][1] - b[0][1], 4);
    const k = clamp(pad / Math.max(dx / W, dy / H), 0.7, 900);
    const x = (b[0][0] + b[1][0]) / 2; const y = (b[0][1] + b[1][1]) / 2;
    return zoomIdentity.translate(W / 2 - k * x, H / 2 - k * y).scale(k);
  }, [W, H]);

  const boundsOf = useCallback((v: MapView): [[number, number], [number, number]] | null => {
    if (!path || !geo) return null;
    if (v === 'india') return path.bounds(geo.outline) as [[number, number], [number, number]];
    if (v === 'markers') {
      if (!projection || !markers.length) return path.bounds(geo.outline) as [[number, number], [number, number]];
      const pts = markers.map((m) => { const p = getPlace(m.id); return projection([p.lon, p.lat]) ?? [0, 0]; });
      const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
      const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      const padX = Math.max((x1 - x0) * 0.18, 1.2); const padY = Math.max((y1 - y0) * 0.18, 1.2);
      return [[x0 - padX, y0 - padY], [x1 + padX, y1 + padY]];
    }
    if ('state' in v && !('district' in v)) return stateShapes.find((s) => s.name === v.state)?.b ?? null;
    if ('district' in v) return districtShapes.find((s) => s.name === v.district && (!v.state || (s.f.properties as { s: string }).s === v.state))?.b ?? null;
    if ('taluka' in v) return talukaShapes.find((s) => s.name === v.taluka)?.b ?? districtShapes.find((s) => s.name === 'Jalna')?.b ?? null;
    return null;
  }, [path, geo, projection, markers, stateShapes, districtShapes, talukaShapes]);

  // initial view (and after a resize, which refits the base projection)
  const viewK = viewKey(view);
  const talReady = !!talukaShapes.length;
  useEffect(() => {
    if (!ready) return;
    const b = boundsOf(view);
    if (b) applyTransform(fitBounds(b, view === 'india' ? 1 : 0.84), false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, viewK, W, H, talReady]);

  // external focus (e.g. a list next to the map)
  const focusK = viewKey(focus);
  const lastFocus = useRef(focusK);
  useEffect(() => {
    if (!ready || !focus || focusK === lastFocus.current) return;
    lastFocus.current = focusK;
    const b = boundsOf(focus);
    if (b) applyTransform(fitBounds(b), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, focusK]);

  const zoomBy = (factor: number) => {
    const el = svgRef.current;
    if (!el) return;
    const cur = zoomTransform(el);
    const k = clamp(cur.k * factor, 0.7, 900);
    const [cx, cy] = cur.invert([W / 2, H / 2]);
    applyTransform(zoomIdentity.translate(W / 2 - k * cx, H / 2 - k * cy).scale(k), true);
  };
  const reset = () => { const b = boundsOf(view); if (b) applyTransform(fitBounds(b, view === 'india' ? 1 : 0.84), true); setPinned(null); };

  // ---- tooltips (hover follows the pointer; click / tap pins it)
  const [hover, setHover] = useState<Tip | null>(null);
  const [pinned, setPinned] = useState<Tip | null>(null);
  const tipFromEvent = (event: ReactPointerEvent | ReactMouseEvent): Tip | null => {
    const target = (event.target as Element).closest?.('[data-k]');
    const stage = stageRef.current;
    if (!target || !stage) return null;
    const [kind, key] = (target.getAttribute('data-k') ?? '').split(':');
    const rect = stage.getBoundingClientRect();
    const k = kind === 'd' ? 'district' : kind === 't' ? 'taluka' : 'marker';
    return { kind: k, key, x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const placesIn = useCallback((test: (p: Place) => boolean) => placed.filter((m) => test(m.place)), [placed]);

  const zoomToPlace = useCallback((m: (typeof placed)[number], animate = true) => {
    const p = m.place;
    const tb = talukaShapes.length && p.taluka ? talukaShapes.find((s) => s.name === p.taluka)?.b : undefined;
    const b = tb ?? districtShapes.find((s) => s.name === p.district && (s.f.properties as { s: string }).s === p.state)?.b;
    if (!b || !projection) return;
    const target = fitBounds(b, 0.8);
    applyTransform(target, animate);
    const [bx, by] = projection([p.lon, p.lat]) ?? [0, 0];
    const [x, y] = target.apply([bx, by]);
    setPinned({ kind: 'marker', key: m.id, x, y });
  }, [talukaShapes, districtShapes, projection, fitBounds, applyTransform]);

  const onStageClick = (event: ReactMouseEvent) => {
    const tip = tipFromEvent(event);
    if (!tip) { setPinned(null); return; }
    if (tip.kind === 'marker') {
      const m = placed.find((x) => x.id === tip.key);
      if (m) { m.onSelect?.(); zoomToPlace(m); }
      return;
    }
    setPinned(tip);
    if (tip.kind === 'district') {
      const s = districtShapes[Number(tip.key)];
      states?.[(s.f.properties as { s: string }).s]?.onSelect?.();
    } else if (tip.kind === 'taluka') {
      talukas?.[talukaShapes[Number(tip.key)].name]?.onSelect?.();
    }
  };

  useEffect(() => {
    if (!pinned) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setPinned(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pinned]);

  // ---- overlay: markers + non-overlapping labels in screen space
  const overlay = useMemo(() => {
    if (!projection) return { points: [], markerLabels: [], areaLabels: [] };
    const taken: Box[] = [];
    const inside = (b: Box) => b.x0 >= 2 && b.y0 >= 2 && b.x1 <= W - 2 && b.y1 <= H - 2;

    const points = placed.map((m) => {
      const [bx, by] = projection([m.place.lon, m.place.lat]) ?? [0, 0];
      const [x, y] = t.apply([bx, by]);
      return { m, x, y };
    }).filter((p) => p.x > -10 && p.x < W + 10 && p.y > -10 && p.y < H + 10);
    for (const p of points) taken.push({ x0: p.x - 6, y0: p.y - 6, x1: p.x + 6, y1: p.y + 6 });

    // place-name labels first: right, left, above, below - first free spot wins
    const markerLabels: { id: string; text: string; x: number; y: number; selected: boolean }[] = [];
    const order = [...points].sort((a, b) => Number(b.m.id === selected) - Number(a.m.id === selected));
    for (const p of order) {
      const size = 11; const w = textW(p.m.name, size); const h = size + 3;
      const spots: [number, number][] = [[p.x + 9, p.y - h / 2], [p.x - 9 - w, p.y - h / 2], [p.x - w / 2, p.y - 9 - h], [p.x - w / 2, p.y + 9],
        [p.x + 6, p.y - 6 - h], [p.x - 6 - w, p.y - 6 - h], [p.x + 6, p.y + 6], [p.x - 6 - w, p.y + 6]];
      for (const [x0, y0] of spots) {
        const box = { x0, y0, x1: x0 + w, y1: y0 + h };
        if (!inside(box) || overlaps(box, taken)) continue;
        taken.push(box);
        markerLabels.push({ id: p.m.id, text: p.m.name, x: x0 + 2, y: y0 + h - 4, selected: p.m.id === selected });
        break;
      }
    }

    // area labels: state names when zoomed out, district (and taluka) names when zoomed in
    const pxPerDeg = projection.scale() * t.k * (Math.PI / 180);
    const zoomedIn = pxPerDeg > 55;
    const showTalukas = talukaShapes.length > 0 && pxPerDeg > 260;
    type Cand = { key: string; text: string; c: [number, number]; b: [[number, number], [number, number]]; pa: number; priority: number; cls: string; size: number };
    const cands: Cand[] = [];
    if (!zoomedIn) {
      for (const s of stateShapes) cands.push({ key: `s${s.i}`, text: s.name, c: s.c, b: s.b, pa: s.pa, priority: (states?.[s.name] ? 1e9 : 0) + s.area, cls: 'imap-lbl-state', size: 10.5 });
    } else {
      for (const s of districtShapes) {
        const p = s.f.properties as { d: string; s: string };
        if (showTalukas && p.d === 'Jalna' && p.s === 'Maharashtra') continue;
        cands.push({ key: `d${s.i}`, text: s.name, c: s.c, b: s.b, pa: s.pa, priority: (markedDistricts.has(`${p.s}|${p.d}`) ? 1e9 : 0) + s.area, cls: 'imap-lbl-district', size: 10 });
      }
      if (showTalukas) for (const s of talukaShapes) cands.push({ key: `t${s.i}`, text: s.name, c: s.c, b: s.b, pa: s.pa, priority: 2e9 + s.area, cls: 'imap-lbl-taluka', size: 10.5 });
    }
    cands.sort((a, b) => b.priority - a.priority);
    const areaLabels: { key: string; text: string; x: number; y: number; cls: string }[] = [];
    for (const c of cands) {
      const [x, y] = t.apply(c.c);
      if (x < 0 || x > W || y < 0 || y > H) continue;
      const bw = (c.b[1][0] - c.b[0][0]) * t.k; const bh = (c.b[1][1] - c.b[0][1]) * t.k;
      const w = textW(c.text, c.size); const h = c.size + 3;
      // the name must fit its own area: bounding box AND real (projected) area, so scattered enclaves aren't labelled
      if (bw < w * 0.85 || bh < h || Math.sqrt(c.pa) * t.k < w * 0.6) continue;
      const box = { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 };
      if (!inside(box) || overlaps(box, taken)) continue;
      taken.push(box);
      areaLabels.push({ key: c.key, text: c.text, x, y: y + c.size * 0.35, cls: c.cls });
      if (areaLabels.length > 140) break;
    }
    return { points, markerLabels, areaLabels };
  }, [projection, t, W, H, placed, selected, stateShapes, districtShapes, talukaShapes, states, markedDistricts]);

  // ---- tooltip content
  const tipData = (tip: Tip | null): { title: string; sub: string; body: ReactNode[]; zoom?: () => void; action?: MapMarker['action'] } | null => {
    if (!tip) return null;
    if (tip.kind === 'marker') {
      const m = placed.find((x) => x.id === tip.key);
      if (!m) return null;
      const p = m.place;
      return {
        title: m.name,
        sub: `${p.taluka ? `${p.taluka} taluka · ` : ''}${p.district} district · ${p.state}`,
        body: [m.info && <div key="i">{m.info}</div>, p.note && <div key="n" className="imap-tip-note">{p.note}</div>, <div key="c" className="imap-tip-coord">{fmtCoord(p)}</div>].filter(Boolean),
        zoom: () => zoomToPlace(m),
        action: m.action,
      };
    }
    if (tip.kind === 'district') {
      const s = districtShapes[Number(tip.key)];
      if (!s) return null;
      const p = s.f.properties as { d: string; s: string };
      const here = placesIn((pl) => pl.district === p.d && pl.state === p.s);
      return {
        title: p.d,
        sub: `District · ${p.s}`,
        body: [
          states?.[p.s]?.info && <div key="s"><b>{p.s}:</b> {states[p.s].info}</div>,
          here.length > 0 && <div key="p"><b>Mentioned here:</b> {here.map((m) => m.name).join(', ')}</div>,
        ].filter(Boolean),
        zoom: () => { applyTransform(fitBounds(s.b), true); setPinned(null); },
      };
    }
    const s = talukaShapes[Number(tip.key)];
    if (!s) return null;
    const here = placesIn((pl) => pl.taluka === s.name);
    return {
      title: `${s.name} taluka`,
      sub: 'Jalna district · Maharashtra',
      body: [
        talukas?.[s.name]?.info && <div key="i">{talukas[s.name].info}</div>,
        here.length > 0 && <div key="p"><b>Mentioned here:</b> {here.map((m) => m.name).join(', ')}</div>,
      ].filter(Boolean),
      zoom: () => { applyTransform(fitBounds(s.b), true); setPinned(null); },
    };
  };
  const highlightUsed = talukaFills.includes(HIGHLIGHT) || districtFills.some((fill, i) => fill === HIGHLIGHT && !(talukaShapes.length && districtShapes[i].name === 'Jalna'));
  const shownTip = pinned ?? hover;
  const tip = tipData(shownTip);
  const hoverShape = shownTip && shownTip.kind !== 'marker'
    ? (shownTip.kind === 'district' ? districtShapes[Number(shownTip.key)] : talukaShapes[Number(shownTip.key)])
    : null;

  // ---- search (places, talukas, districts)
  const listId = useId();
  const [query, setQuery] = useState('');
  const searchOptions = useMemo(() => [
    ...placed.map((m) => ({ text: `${m.name} — place, ${m.place.district}`, run: () => { m.onSelect?.(); zoomToPlace(m); } })),
    ...talukaShapes.map((s) => ({ text: `${s.name} — taluka, Jalna`, run: () => { applyTransform(fitBounds(s.b), true); setPinned({ kind: 'taluka', key: String(s.i), x: W / 2, y: H / 2 }); } })),
    ...districtShapes.map((s) => {
      const p = s.f.properties as { d: string; s: string };
      return { text: `${p.d} — district, ${p.s}`, run: () => { applyTransform(fitBounds(s.b), true); setPinned({ kind: 'district', key: String(s.i), x: W / 2, y: H / 2 }); } };
    }),
  ], [placed, talukaShapes, districtShapes, zoomToPlace, applyTransform, fitBounds, W, H]);
  const runSearch = (value: string, exactOnly = false) => {
    const v = value.trim().toLowerCase();
    if (!v) return false;
    const hit = searchOptions.find((o) => o.text.toLowerCase() === v)
      ?? (exactOnly ? undefined : searchOptions.find((o) => o.text.toLowerCase().startsWith(v)) ?? searchOptions.find((o) => o.text.toLowerCase().includes(v)));
    if (!hit) return false;
    hit.run();
    setQuery('');
    return true;
  };
  const [noMatch, setNoMatch] = useState(false);

  // ---- render
  const tipStyle = shownTip ? (() => {
    const left = clamp(shownTip.x, 120, W - 120);
    const below = shownTip.y < 150;
    return { left, top: below ? shownTip.y + 16 : shownTip.y - 12, transform: below ? 'translate(-50%, 0)' : 'translate(-50%, -100%)' };
  })() : undefined;

  return (
    <div className="imap">
      <div className="imap-toolbar">
        <form className="imap-search" onSubmit={(event) => { event.preventDefault(); setNoMatch(!runSearch(query)); }}>
          <Search size={14} aria-hidden />
          <input
            list={listId}
            value={query}
            placeholder="Find a district or place…"
            aria-label="Find a district or place on the map"
            onChange={(event) => { setQuery(event.target.value); setNoMatch(false); if (runSearch(event.target.value, true)) event.target.blur(); }}
          />
          <datalist id={listId}>{searchOptions.map((o) => <option key={o.text} value={o.text} />)}</datalist>
          {noMatch && <span className="imap-nomatch">No match</span>}
        </form>
        <div className="imap-zoom-btns" role="group" aria-label="Map zoom">
          <button type="button" onClick={() => zoomBy(1.8)} aria-label="Zoom in" data-tip="Zoom in"><Plus size={15} /></button>
          <button type="button" onClick={() => zoomBy(1 / 1.8)} aria-label="Zoom out" data-tip="Zoom out"><Minus size={15} /></button>
          <button type="button" onClick={reset} aria-label="Reset view" data-tip="Reset view"><RotateCcw size={14} /></button>
        </div>
      </div>

      <div className="imap-stage" ref={stageRef} style={{ height: H }}>
        {!ready && !error && <div className="imap-status">Loading district map…</div>}
        {error && (
          <div className="imap-status imap-error">
            Map data could not be loaded ({error}).
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setAttempt((n) => n + 1)}>Retry</button>
          </div>
        )}
        {ready && (
          <svg
            ref={svgRef}
            className="imap-svg"
            width={W}
            height={H}
            role="img"
            aria-label={`${label}. Drag to pan, Ctrl + scroll or pinch to zoom; use the place list below to jump to a district.`}
            onPointerMove={(event) => { if (event.pointerType === 'mouse') setHover(tipFromEvent(event)); }}
            onPointerLeave={() => setHover(null)}
            onClick={onStageClick}
          >
            <rect width={W} height={H} className="imap-sea" />
            <g ref={gRef}>
              <AreaLayer shapes={districtShapes as unknown as Shape[]} fills={districtFills} prefix="d" className="imap-districts" />
              {talukaShapes.length > 0 && <AreaLayer shapes={talukaShapes as unknown as Shape[]} fills={talukaFills} prefix="t" className="imap-talukas" />}
              {talukaBorderD && <path d={talukaBorderD} className="imap-taluka-lines" />}
              <path d={stateBorderD} className="imap-state-lines" />
              <path d={outlineD} className="imap-outline" />
              {hoverShape && <path d={hoverShape.d} className="imap-hover" />}
            </g>
            <g className="imap-overlay">
              {overlay.areaLabels.map((l) => <text key={l.key} x={l.x} y={l.y} textAnchor="middle" className={l.cls}>{l.text}</text>)}
              {overlay.points.map(({ m, x, y }) => (
                <g key={m.id} className={m.id === selected ? 'imap-marker sel' : 'imap-marker'} data-k={`m:${m.id}`} transform={`translate(${x},${y})`}>
                  <circle r={m.id === selected ? 10 : 9} className="imap-marker-hit" />
                  {m.id === selected && <circle r={9} className="imap-marker-halo" />}
                  <circle r={m.id === selected ? 6 : 5} fill={m.color ?? '#1f5f2c'} className="imap-marker-dot" />
                </g>
              ))}
              {overlay.markerLabels.map((l) => (
                <text key={l.id} x={l.x} y={l.y} className={l.selected ? 'imap-lbl-place sel' : 'imap-lbl-place'} data-k={`m:${l.id}`}>{l.text}</text>
              ))}
            </g>
          </svg>
        )}
        {hint && <div className="imap-hint" role="status">{hint}</div>}
        {tip && tipStyle && (
          <div className={pinned ? 'imap-tip pinned' : 'imap-tip'} style={tipStyle} role={pinned ? 'dialog' : 'tooltip'} aria-label={tip.title}>
            {pinned && <button type="button" className="imap-tip-close" aria-label="Close" onClick={() => setPinned(null)}><X size={13} /></button>}
            <strong>{tip.title}</strong>
            <span className="imap-tip-sub">{tip.sub}</span>
            {tip.body}
            {pinned ? (
              <div className="imap-tip-actions">
                {tip.zoom && <button type="button" className="btn btn-outline btn-sm" onClick={tip.zoom}><Crosshair size={12} />Zoom here</button>}
                {tip.action && <button type="button" className="btn btn-primary btn-sm" onClick={tip.action.run}>{tip.action.label}<ArrowRight size={12} /></button>}
              </div>
            ) : <span className="imap-tip-hint">Click for options</span>}
          </div>
        )}
      </div>

      {placed.length > 0 && (
        <div className="imap-places" aria-label="Places on this map">
          {placed.map((m) => (
            <button
              type="button"
              key={m.id}
              className={m.id === selected ? 'imap-place sel' : 'imap-place'}
              onClick={() => { m.onSelect?.(); zoomToPlace(m); }}
              title={`${m.name}: ${m.place.taluka ? `${m.place.taluka} taluka, ` : ''}${m.place.district} district, ${m.place.state} - click to zoom`}
            >
              <i style={{ background: m.color ?? '#1f5f2c' }} />{m.name}
            </button>
          ))}
        </div>
      )}

      <ul className="imap-legend" aria-label="Map legend">
        {highlightUsed && <li><i className="sw" style={{ background: HIGHLIGHT, borderColor: HIGHLIGHT_LINE }} />{talukaShapes.length ? 'Taluka / district' : 'District'} with a mentioned place</li>}
        {scale && <li className="imap-legend-scale"><span>{scale.title}</span>{scale.items.map((s) => <span key={s.label} className="imap-legend-step"><i className="sw" style={{ background: MAP_TONES[s.tone] }} />{s.label}</span>)}</li>}
        <li><i className="sw" style={{ background: NEUTRAL }} />Other districts</li>
        <li><i className="ln ln-state" />State / UT boundary</li>
        <li><i className="ln ln-district" />District boundary</li>
        {talukaShapes.length > 0 && <li><i className="ln ln-taluka" />Taluka boundary</li>}
        {placed.length > 0 && !markerLegend && <li><i className="mk" />Mentioned place (exact location)</li>}
        {markerLegend?.map((m) => <li key={m.label}><i className="mk" style={{ background: m.color, boxShadow: `0 0 0 1px ${m.color}` }} />{m.label}</li>)}
      </ul>
      <p className="imap-attrib">
        Boundaries: datta07/INDIAN-SHAPEFILES (2023 districts; India boundary as per Survey of India) · Places: GeoNames, © OpenStreetMap contributors
      </p>
    </div>
  );
}
