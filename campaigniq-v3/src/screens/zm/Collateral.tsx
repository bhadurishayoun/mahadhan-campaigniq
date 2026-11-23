/** Zonal Manager screens 10–14: collateral templates, designer, version comparison, review tracker, playbook release. */
import {
  CircleCheck, Eye, FileSearch, History, ImageIcon, Layers, LayoutTemplate, ListChecks, Lock, Minus, PenLine, Plus, RefreshCw, RotateCcw, Save, Send,
  ShieldCheck, Sprout, Users,
} from 'lucide-react';
import { useState } from 'react';
import imgDetailer from '../../assets/collateral/template-detailer.png';
import imgLeaflet from '../../assets/collateral/template-leaflet.png';
import imgWhatsapp from '../../assets/collateral/template-whatsapp.png';
import imgPoster from '../../assets/collateral/template-poster.png';
import imgBulbs from '../../assets/collateral/onion-bulbs.png';
import imgField from '../../assets/collateral/onion-field.png';
import imgRows from '../../assets/collateral/onion-rows.png';
import imgHarvest from '../../assets/collateral/onion-harvest.png';
import imgPack from '../../assets/collateral/product-pack.png';
import pbDetailer from '../../assets/collateral/playbook-detailer.png';
import pbLeaflet from '../../assets/collateral/playbook-leaflet.png';
import pbWhatsapp from '../../assets/collateral/playbook-whatsapp.png';
import pbPoster from '../../assets/collateral/playbook-poster.png';
import { num } from '../../data/format';
import {
  ASSET_STATUS_LABEL, BASE_ASSET_STATUS, CLAIM_STATUS_LABEL, CLAIMS, IMAGE_LABEL, REVIEW_ITEMS, REVIEW_STATUS_LABEL, REWRITES, SEED_VERSIONS, SOURCE_INPUTS,
  TEMPLATES, versionChanges, type AssetStatus, type CollateralVersion, type ImageKey, type ReviewStatus, type TemplateId,
} from '../../data/zm';
import { Z } from '../../routes';
import { useBhStore } from '../../store/bhStore';
import { useZmStore, type DraftSetup } from '../../store/zmStore';
import { DataTable } from '../../ui/DataTable';
import { Button, Card, KpiCard, PanelFooter, SegmentedControl, Select, StatusChip, type Tone } from '../../ui/core';
import { Drawer, Modal } from '../../ui/overlay';
import { opt, useGo } from '../common';
import { CollateralSteps, StudioTabs, ZmPage, ZM_SECTION } from './frame';
import { EditBar, Field, LeaveGuard, List, Notes } from './parts';

const TEMPLATE_IMG: Record<TemplateId, string> = { detailer: imgDetailer, leaflet: imgLeaflet, whatsapp: imgWhatsapp, poster: imgPoster };
const PLAYBOOK_IMG: Record<TemplateId, string> = { detailer: pbDetailer, leaflet: pbLeaflet, whatsapp: pbWhatsapp, poster: pbPoster };
export const IMAGES: Record<ImageKey, string> = { 'onion-bulbs': imgBulbs, 'onion-field': imgField, 'onion-rows': imgRows, 'onion-harvest': imgHarvest };
const REVIEW_TONE: Record<ReviewStatus, Tone> = { under_review: 'warn', evidence_pending: 'warn', not_validated: 'risk', review_pending: 'neutral', approved: 'ok' };
const ASSET_TONE: Record<AssetStatus, Tone> = { approved: 'ok', technical_review: 'warn', approval_pending: 'warn', not_selected: 'neutral' };
const CAMPAIGN = 'C1 · Retailer-led Croptek conversion';
const ICON_ROW = ['Supports healthy growth', 'Promotes stronger roots', 'Aids in bulb development'];
const DEFAULT_SETUP: DraftSetup = {
  audience: 'Retailer', language: 'English', objective: 'Approved product education and eligible first-purchase support.',
  sources: [...SOURCE_INPUTS], style: 'Mahadhan · clean and professional', format: 'Presentation (PPT)', regional: 'English (primary)',
};

/** Version history of one template (seeded detailer history plus versions saved in this session). */
function useVersions(template?: TemplateId) {
  const zm = useZmStore();
  const t = template ?? zm.template;
  const all = zm.versions ?? SEED_VERSIONS;
  const versions = all.filter((v) => v.template === t);
  return {
    template: t, versions, current: versions[versions.length - 1] as CollateralVersion | undefined,
    add: (v: CollateralVersion) => zm.setVersions([...all, v]),
  };
}
const nextId = (versions: CollateralVersion[]) => { const last = versions[versions.length - 1]; if (!last) return 'v0.1'; const [, minor] = last.id.slice(1).split('.'); return `v0.${Number(minor) + 1}`; };
const stamp = () => new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Review item status: saved decision, else the base status. */
function useReviews() {
  const zm = useZmStore();
  const statusOf = (id: string): ReviewStatus => zm.reviews[id] ?? REVIEW_ITEMS.find((r) => r.id === id)!.status;
  const approved = REVIEW_ITEMS.filter((r) => statusOf(r.id) === 'approved').length;
  return { statusOf, approved, allApproved: approved === REVIEW_ITEMS.length };
}
/** Asset status for the playbook (the detailer follows its review items once released to the playbook). */
function useAssetStatus() {
  const zm = useZmStore();
  return (t: TemplateId): AssetStatus => zm.assetStatus[t] ?? BASE_ASSET_STATUS[t];
}

/** The collateral page rendered from a version (page 1: headline, copy, image, claim icons; page 2: discussion points). */
export function CollateralPage({ v, page = 1, marks = [], scale, lang = 'English' }: { v: CollateralVersion; page?: number; marks?: string[]; scale?: number; lang?: string }) {
  const m = (k: string) => (marks.includes(k) ? ' marked' : '');
  const headline = lang === 'Marathi' && v.marathi ? v.marathi : v.headline;
  return (
    <div className={`cpage${scale ? ' fixed' : ''} layout-${v.layout}`} style={scale ? { zoom: scale } : undefined}>
      <div className="cpage-brand"><small>Mahadhan</small><b>Croptek</b></div>
      {page === 1 ? (
        <>
          <div className="cpage-main">
            <div className="cpage-text">
              <h4 className={`cpage-headline${m('headline')}${marks.includes('marathi') && lang === 'Marathi' ? ' marked' : ''}`}>{headline}</h4>
              <p className={`cpage-body${m('body')}`}>{v.body}</p>
              <img className="cpage-pack" src={imgPack} alt="Croptek pack" />
            </div>
            <img className={`cpage-img${m('image')}`} src={IMAGES[v.image]} alt={IMAGE_LABEL[v.image]} />
          </div>
          <div className={`cpage-icons${m('layout')}`}>{ICON_ROW.map((t) => <span key={t}><Sprout size={16} />{t}</span>)}</div>
        </>
      ) : (
        <div className="cpage-main">
          <div className="cpage-text">
            <h4 className="cpage-headline">Key discussion points</h4>
            <ul className="cpage-points">{v.points.map((p) => <li key={p}>{p}</li>)}</ul>
          </div>
          <img className="cpage-img" src={IMAGES['onion-rows']} alt={IMAGE_LABEL['onion-rows']} />
        </div>
      )}
    </div>
  );
}

// ================================================================ 10 Collateral Templates and Draft Setup
export function CollateralTemplates() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const { versions, add } = useVersions();
  const [preview, setPreview] = useState<TemplateId | null>(null);
  const [setup, setSetup] = useState<DraftSetup>(zm.draftSetup ?? DEFAULT_SETUP);
  const [tried, setTried] = useState(false);
  const t = TEMPLATES.find((x) => x.id === zm.template)!;
  const claims = CLAIMS.map((c) => ({ ...c, ...zm.claims[c.id] }));
  const errors = { audience: setup.audience ? '' : 'Select an audience', objective: setup.objective.trim().length >= 10 ? '' : 'Enter the communication objective', sources: setup.sources.length ? '' : 'Select at least one source input' };
  const generate = () => {
    setTried(true);
    if (errors.audience || errors.objective || errors.sources) { bh.toast('Complete the draft configuration'); return; }
    zm.setDraftSetup(setup);
    const base = versions[versions.length - 1];
    const id = nextId(versions);
    const v: CollateralVersion = base
      ? { ...base, id, date: stamp(), description: 'Regenerated draft', source: 'Draft generator' }
      : { ...SEED_VERSIONS[0], id, template: t.id, date: stamp(), description: 'Initial draft', source: 'Draft generator', headline: t.headline, marathi: '' };
    add(v);
    bh.toast(`${t.name} ${id} drafted`);
    go(Z.editor);
  };
  const sourcesOn = (s: string) => setup.sources.includes(s);
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Retailer-led Croptek conversion" title="Collateral Templates and Draft Setup" back={Z.proposition} next={generate} nextLabel="Generate draft and open editor"
      right={<StatusChip tone="neutral">Draft · not approved</StatusChip>}>
      <StudioTabs active={2} />
      <CollateralSteps active={1} />
      <div className="kpis">
        <KpiCard label="Templates available" value={num(TEMPLATES.length)} />
        <KpiCard label="Source inputs selected" value={`${setup.sources.length} of ${SOURCE_INPUTS.length}`} />
        <KpiCard label="Draft claims validated" value={`${claims.filter((c) => c.status === 'validated').length} of ${claims.length}`} />
        <KpiCard label="Draft versions" value={num(versions.length)} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <Card title={`Collateral template gallery (${TEMPLATES.length} templates)`} icon={LayoutTemplate}>
          <div className="grid g2" style={{ flex: 1, gridAutoRows: '1fr' }}>
            {TEMPLATES.map((x) => (
              <div key={x.id} className={`tpl${x.id === zm.template ? ' on' : ''}`}>
                <img src={TEMPLATE_IMG[x.id]} alt={x.name} />
                <div className="stack" style={{ gap: 6 }}>
                  <b>{x.name}</b>
                  <List items={[{ label: 'Format', value: x.format }, { label: 'Audience', value: x.audience }, { label: 'Language', value: x.language }]} />
                  <div className="row">
                    <Button small icon={Eye} onClick={() => setPreview(x.id)}>Preview</Button>
                    <Button small primary={x.id === zm.template} icon={x.id === zm.template ? CircleCheck : undefined} onClick={() => zm.setTemplate(x.id)}>{x.id === zm.template ? 'Selected' : 'Select'}</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Draft configuration" icon={PenLine} right={<Button small icon={Save} onClick={() => { zm.setDraftSetup(setup); bh.toast('Draft setup saved'); }}>Save draft setup</Button>}>
          <div className="row"><img className="tpl-thumb" src={TEMPLATE_IMG[t.id]} alt="" /><span className="stack" style={{ gap: 0 }}><small className="muted">Chosen template</small><b>{t.name}</b></span></div>
          <Field label="Audience *" error={tried ? errors.audience : ''}><Select label="Audience" value={setup.audience} onChange={(v) => setSetup({ ...setup, audience: v })} options={[opt('', 'Select audience'), ...['Retailer', 'Farmer', 'Retailer / Farmer'].map((x) => opt(x, x))]} /></Field>
          <Field label="Language *"><SegmentedControl value={setup.language} onChange={(v) => setSetup({ ...setup, language: v })} options={[opt('English', 'English'), opt('Marathi', 'Marathi')]} /></Field>
          <Field label="Communication objective *" error={tried ? errors.objective : ''}><textarea className="input" rows={2} aria-label="Communication objective" value={setup.objective} onChange={(e) => setSetup({ ...setup, objective: e.target.value })} /></Field>
          <div className="calc-label">Source inputs</div>
          <div className="pick">
            {SOURCE_INPUTS.map((s) => <button key={s} type="button" className={sourcesOn(s) ? 'on' : undefined} aria-pressed={sourcesOn(s)} onClick={() => setSetup({ ...setup, sources: sourcesOn(s) ? setup.sources.filter((x) => x !== s) : [...setup.sources, s] })}>{sourcesOn(s) && <CircleCheck size={13} />}{s}</button>)}
          </div>
          {tried && errors.sources && <small className="err">{errors.sources}</small>}
          <div className="calc-label">Draft claims used</div>
          <List items={claims.map((c) => ({ label: c.text, value: <StatusChip tone={c.status === 'validated' ? 'ok' : c.status === 'unvalidated' ? 'risk' : 'warn'}>{CLAIM_STATUS_LABEL[c.status]}</StatusChip> }))} />
          <div className="calc-label">Draft generation settings</div>
          <Field label="Design style"><Select label="Design style" value={setup.style} onChange={(v) => setSetup({ ...setup, style: v })} options={['Mahadhan · clean and professional', 'Mahadhan · field bold'].map((x) => opt(x, x))} /></Field>
          <div className="form-grid">
            <Field label="Output format"><Select label="Output format" value={setup.format} onChange={(v) => setSetup({ ...setup, format: v })} options={['Presentation (PPT)', 'PDF', 'Image (PNG)'].map((x) => opt(x, x))} /></Field>
            <Field label="Regional language"><Select label="Regional language" value={setup.regional} onChange={(v) => setSetup({ ...setup, regional: v })} options={['English (primary)', 'Marathi (primary)'].map((x) => opt(x, x))} /></Field>
          </div>
        </Card>
      </div>
      {preview && (
        <Modal title={`Template preview: ${TEMPLATES.find((x) => x.id === preview)!.name}`} onClose={() => setPreview(null)}
          footer={<><Button onClick={() => setPreview(null)}>Back</Button><span className="sp" /><Button primary icon={CircleCheck} onClick={() => { zm.setTemplate(preview); setPreview(null); }}>Select template</Button></>}>
          <img className="tpl-large" src={TEMPLATE_IMG[preview]} alt="" />
          <List items={TEMPLATES.find((x) => x.id === preview)!.highlights.map((h) => ({ icon: CircleCheck, label: h }))} />
        </Modal>
      )}
    </ZmPage>
  );
}

// ================================================================ 11 Collateral Designer and Approval
export function CollateralEditor() {
  const bh = useBhStore();
  const zm = useZmStore();
  const sel = useVersions();
  const det = useVersions('detailer');
  const { versions, add } = sel.current ? sel : det;
  const current = (sel.current ?? det.current)!;
  const tpl = TEMPLATES.find((x) => x.id === current.template)!;
  const reviews = useReviews();
  const [draft, setDraft] = useState<CollateralVersion>(current);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rewrite, setRewrite] = useState(0);
  const [picker, setPicker] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const keys: (keyof CollateralVersion)[] = ['headline', 'body', 'image', 'layout', 'marathi'];
  const changed = keys.filter((k) => draft[k] !== current[k]);
  const saveVersion = () => {
    const id = nextId(versions);
    add({ ...draft, id, date: stamp(), description: 'Edit · content and visual update', source: 'Zonal Manager workspace' });
    bh.toast(`Saved as ${id}`);
    setDraft((d) => ({ ...d, id }));
  };
  const doRewrite = () => { const r = REWRITES[rewrite % REWRITES.length]; setDraft({ ...draft, headline: r.headline, body: r.body }); setRewrite(rewrite + 1); };
  const shown = viewing ? versions.find((v) => v.id === viewing)! : draft;
  const claims = CLAIMS.map((c) => ({ ...c, ...zm.claims[c.id] }));
  return (
    <ZmPage {...ZM_SECTION.studio} trail={tpl.name} title="Collateral Designer and Approval" back={Z.collateral} next={Z.versions} nextLabel="Compare versions"
      right={<StatusChip tone="warn">{`Asset ${current.id} · draft, not approved`}</StatusChip>}>
      <StudioTabs active={2} />
      <CollateralSteps active={3} />
      <div className="kpis">
        <KpiCard label="Current version" value={current.id} />
        <KpiCard label="Versions saved" value={num(versions.length)} />
        <KpiCard label="Claims validated" value={`${claims.filter((c) => c.status === 'validated').length} of ${claims.length}`} />
        <KpiCard label="Review items approved" value={`${reviews.approved} of ${REVIEW_ITEMS.length}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: '150px minmax(0, 1fr) 330px' }}>
        <Card title="Pages (2)" icon={Layers}>
          {[1, 2].map((p) => (
            <button key={p} type="button" className={`page-thumb${page === p ? ' on' : ''}`} onClick={() => setPage(p)} aria-label={`Page ${p}`}>
              <CollateralPage v={shown} page={p} scale={0.19} />
              <small>{p}</small>
            </button>
          ))}
        </Card>
        <Card title={viewing ? `Viewing ${viewing} (read only)` : `Page ${page} · ${draft.id}${changed.length ? ' · edited' : ''}`} icon={PenLine} right={<>
          <Button small icon={Minus} title="Zoom out" onClick={() => setZoom(Math.max(70, zoom - 10))}>{''}</Button>
          <span className="muted" style={{ fontSize: 12 }}>{zoom}%</span>
          <Button small icon={Plus} title="Zoom in" onClick={() => setZoom(Math.min(130, zoom + 10))}>{''}</Button>
          {viewing && <Button small onClick={() => setViewing(null)}>Back to draft</Button>}
        </>}>
          <div className="canvas"><div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}><CollateralPage v={shown} page={page} marks={viewing ? [] : changed} /></div></div>
          <EditBar count={changed.length} impact={`Saves as ${nextId(versions)}`} onCancel={() => setDraft(current)} onSave={saveVersion} />
        </Card>
        <div className="stack">
          <Card title="Design panel" icon={LayoutTemplate}>
            <Field label="Headline"><input className={`input${changed.includes('headline') ? ' chg' : ''}`} aria-label="Headline" value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} /></Field>
            <Field label="Body text"><textarea className={`input${changed.includes('body') ? ' chg' : ''}`} rows={3} aria-label="Body text" value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} /></Field>
            <Field label="Marathi headline"><input className={`input${changed.includes('marathi') ? ' chg' : ''}`} aria-label="Marathi headline" value={draft.marathi} onChange={(e) => setDraft({ ...draft, marathi: e.target.value })} /></Field>
            <Field label="Layout"><SegmentedControl value={String(draft.layout)} onChange={(v) => setDraft({ ...draft, layout: Number(v) })} options={[opt('0', 'Image right'), opt('1', 'Image left'), opt('2', 'Image top')]} /></Field>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <Button small icon={ImageIcon} onClick={() => setPicker(true)}>Replace image</Button>
              <Button small icon={RefreshCw} onClick={doRewrite}>Rewrite text</Button>
            </div>
            <List items={[
              { label: 'Product master reference', value: 'Croptek product information' },
              { label: 'Claims validation', value: <StatusChip tone={claims.every((c) => c.status === 'validated') ? 'ok' : 'warn'}>{claims.every((c) => c.status === 'validated') ? 'Validated' : 'Pending'}</StatusChip> },
            ]} />
          </Card>
          <Card title="Version history" icon={History} flush>
            <DataTable rows={[...versions].reverse()} rowKey={(v) => v.id} selected={viewing ?? current.id} onRowClick={(v) => setViewing(v.id === current.id ? null : v.id)}
              columns={[
                { key: 'v', header: 'Version', render: (v) => <b>{v.id}</b> },
                { key: 'd', header: 'Description', render: (v) => (v.id === current.id ? 'Current draft' : v.description) },
                { key: 't', header: 'Saved', render: (v) => <small>{v.date}</small> },
              ]} />
          </Card>
        </div>
      </div>
      {picker && (
        <Modal title="Replace image" onClose={() => setPicker(false)} footer={<Button onClick={() => setPicker(false)}>Back</Button>}>
          <div className="grid g2">
            {(Object.keys(IMAGES) as ImageKey[]).map((k) => (
              <button key={k} type="button" className={`img-pick${draft.image === k ? ' on' : ''}`} onClick={() => { setDraft({ ...draft, image: k }); setPicker(false); }}>
                <img src={IMAGES[k]} alt={IMAGE_LABEL[k]} /><span>{IMAGE_LABEL[k]}</span>
              </button>
            ))}
          </div>
        </Modal>
      )}
      <LeaveGuard dirty={changed.length > 0} count={changed.length} onSave={saveVersion} onDiscard={() => setDraft(current)} />
    </ZmPage>
  );
}

// ================================================================ 12 Collateral Version Comparison
export function VersionComparison() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const sel = useVersions();
  const det = useVersions('detailer');
  const { versions, add } = sel.current ? sel : det;
  const current = (sel.current ?? det.current)!;
  const tpl = TEMPLATES.find((x) => x.id === current.template)!;
  const [prevId, setPrevId] = useState(versions[versions.length - 2]?.id ?? versions[0].id);
  const [curId, setCurId] = useState(current.id);
  const [lang, setLang] = useState('English');
  const [mode, setMode] = useState<'side' | 'overlay'>('side');
  const [confirm, setConfirm] = useState(false);
  const a = versions.find((v) => v.id === prevId) ?? versions[0];
  const b = versions.find((v) => v.id === curId) ?? current;
  const changes = versionChanges(a, b);
  const marks = (['headline', 'body', 'image', 'layout', 'marathi'] as const).filter((k) => a[k] !== b[k]);
  const restore = () => {
    const id = nextId(versions);
    add({ ...a, id, date: stamp(), description: `Restored from ${a.id}`, source: 'Zonal Manager workspace' });
    bh.toast(`${a.id} restored as ${id}`);
    setConfirm(false); setCurId(id);
  };
  const submit = () => { zm.submitForReview(); bh.toast(`${current.id} submitted for technical review`); go(Z.collateralApprovals); };
  const opts = versions.map((v) => opt(v.id, v.id));
  return (
    <ZmPage {...ZM_SECTION.studio} trail={tpl.name} title="Collateral Version Comparison" back={Z.editor} next={submit} nextLabel="Submit for technical review"
      right={<StatusChip tone={zm.submittedForReview ? 'warn' : 'neutral'}>{zm.submittedForReview ? 'Submitted · technical review pending' : 'Draft · not submitted'}</StatusChip>}>
      <StudioTabs active={2} />
      <CollateralSteps active={3} />
      <div className="row" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <SegmentedControl value={mode} onChange={(v) => setMode(v as 'side' | 'overlay')} options={[opt('side', 'Side-by-side'), opt('overlay', 'Overlay')]} />
        <div className="row" style={{ gap: 12 }}>
          <label className="row" style={{ gap: 6 }}><span className="seg-label">Language</span><Select label="Language" value={lang} onChange={setLang} options={[opt('English', 'English'), opt('Marathi', 'Marathi')]} /></label>
          <label className="row" style={{ gap: 6 }}><span className="seg-label">Previous version</span><Select label="Previous version" value={a.id} onChange={setPrevId} options={opts} /></label>
          <label className="row" style={{ gap: 6 }}><span className="seg-label">Current version</span><Select label="Current version" value={b.id} onChange={setCurId} options={opts} /></label>
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 360px' }}>
        <Card title={mode === 'side' ? `${a.id} vs ${b.id}` : `${b.id} with changes marked`} icon={Layers} right={<>
          <Button small icon={RotateCcw} disabled={a.id === b.id} onClick={() => setConfirm(true)}>Restore previous</Button>
          <Button small icon={PenLine} onClick={() => go(Z.editor)}>Edit current version</Button>
          <Button small icon={Save} onClick={() => bh.toast('Version comparison saved')}>Save comparison</Button>
        </>}>
          <div className={mode === 'side' ? 'grid g2' : ''}>
            {mode === 'side' && (
              <div className="stack" style={{ gap: 6 }}>
                <div className="row"><b>Previous · {a.id}</b><StatusChip tone="neutral">Draft</StatusChip></div>
                <CollateralPage v={a} lang={lang} marks={marks} />
              </div>
            )}
            <div className="stack" style={{ gap: 6 }}>
              <div className="row"><b>Current · {b.id}</b><StatusChip tone="neutral">Draft</StatusChip><StatusChip tone="warn">Not technically approved</StatusChip></div>
              <CollateralPage v={b} lang={lang} marks={marks} />
            </div>
          </div>
          <div className="row" style={{ flexWrap: 'wrap' }}>{marks.length ? marks.map((k) => <StatusChip key={k} tone="warn">{`${k === 'marathi' ? 'Marathi variant' : k[0].toUpperCase() + k.slice(1)} · changed`}</StatusChip>) : <StatusChip tone="ok">No differences</StatusChip>}</div>
        </Card>
        <div className="stack">
          <Card title="Changes and validation" icon={ListChecks} flush>
            <DataTable rows={changes.map((c, i) => ({ ...c, n: i + 1 }))} rowKey={(c) => c.item}
              columns={[
                { key: 'n', header: '#', render: (c) => c.n },
                { key: 'i', header: 'Change item', render: (c) => <b>{c.item}</b> },
                { key: 'c', header: 'Change', render: (c) => c.change },
                { key: 'v', header: 'Validation status', align: 'center', render: (c) => <StatusChip tone="warn">{c.validation}</StatusChip> },
              ]} />
          </Card>
          <Card title="Version history" icon={History} flush>
            <DataTable rows={versions} rowKey={(v) => v.id}
              columns={[
                { key: 'v', header: 'Version', render: (v) => <b>{v.id}</b> },
                { key: 'd', header: 'Description', render: (v) => v.description },
                { key: 's', header: 'Source', render: (v) => v.source },
              ]} />
          </Card>
          <Notes title="Comparison notes" items={[
            `${changes.length} change${changes.length === 1 ? '' : 's'} between ${a.id} and ${b.id}.`,
            `${versions.length} versions on record; ${current.id} is the current draft.`,
            zm.submittedForReview ? 'Submitted for technical review.' : 'Not yet submitted for technical review.',
          ]} />
        </div>
      </div>
      {confirm && (
        <Modal title={`Restore ${a.id}?`} onClose={() => setConfirm(false)}
          footer={<><Button onClick={() => setConfirm(false)}>Back</Button><span className="sp" /><Button primary icon={RotateCcw} onClick={restore}>{`Restore as ${nextId(versions)}`}</Button></>}>
          <p style={{ margin: 0 }}>{a.id} becomes a new version ({nextId(versions)}); {b.id} stays in the history.</p>
        </Modal>
      )}
    </ZmPage>
  );
}

// ================================================================ 13 Collateral Review and Approval Tracker
export function CollateralApprovals() {
  const go = useGo();
  const bh = useBhStore();
  const zm = useZmStore();
  const current = useVersions('detailer').current!;
  const reviews = useReviews();
  const [sel, setSel] = useState(REVIEW_ITEMS[1].id);
  const [notes, setNotes] = useState(false);
  const item = REVIEW_ITEMS.find((r) => r.id === sel)!;
  const st = reviews.statusOf(sel);
  const release = () => {
    zm.setAssetStatus('detailer', 'approved');
    if (!zm.playbookIncluded.includes('detailer')) zm.setPlaybookIncluded([...zm.playbookIncluded, 'detailer']);
    bh.toast(`Retailer product detailer ${current.id} released to the campaign playbook`);
    go(Z.playbook);
  };
  const count = (s: ReviewStatus) => REVIEW_ITEMS.filter((r) => reviews.statusOf(r.id) === s).length;
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Retailer product detailer" title="Collateral Review and Approval Tracker" back={Z.versions} next={Z.playbook} nextLabel="Open playbook release"
      right={<StatusChip tone={reviews.allApproved ? 'ok' : zm.submittedForReview ? 'warn' : 'neutral'}>{reviews.allApproved ? 'All items approved' : zm.submittedForReview ? 'Submitted · technical review pending' : 'Draft · not submitted'}</StatusChip>}>
      <StudioTabs active={2} />
      <div className="kpis">
        <KpiCard label="Review items" value={num(REVIEW_ITEMS.length)} />
        <KpiCard label="Approved" value={`${reviews.approved} of ${REVIEW_ITEMS.length}`} />
        <KpiCard label="Under review or pending" value={num(count('under_review') + count('evidence_pending') + count('review_pending'))} />
        <KpiCard label="Not validated" value={num(count('not_validated'))} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <Card title={`Review items: Retailer product detailer ${current.id}`} icon={ShieldCheck} flush right={<>
          <Button small icon={FileSearch} onClick={() => setNotes(true)}>View reviewer notes</Button>
          <Button small icon={PenLine} onClick={() => go(Z.editor)}>Open in editor</Button>
          <Button small primary icon={Lock} disabled={!reviews.allApproved} onClick={release}>Release approved asset to playbook</Button>
        </>}>
          <DataTable selectable rows={REVIEW_ITEMS} rowKey={(r) => r.id} selected={sel} onRowClick={(r) => setSel(r.id)}
            columns={[
              { key: 'e', header: 'Content / claim element', render: (r) => <span className="stack" style={{ gap: 2, alignItems: 'center' }}><b>{r.element}</b><StatusChip tone="neutral">{r.kind}</StatusChip></span> },
              { key: 'v', header: 'Evidence requirement', render: (r) => r.evidence },
              { key: 'o', header: 'Review owner', render: (r) => r.owner },
              { key: 's', header: 'Review stage', align: 'center', render: (r) => <StatusChip tone="warn">{r.stage}</StatusChip> },
              { key: 'b', header: 'Observation', render: (r) => (reviews.statusOf(r.id) === 'approved' ? 'Reviewer approved' : r.observation) },
              { key: 't', header: 'Status', align: 'center', render: (r) => <StatusChip tone={REVIEW_TONE[reviews.statusOf(r.id)]}>{REVIEW_STATUS_LABEL[reviews.statusOf(r.id)]}</StatusChip> },
            ]} />
        </Card>
        <div className="stack">
          <Card title={`Asset preview: ${current.id}`} icon={Eye}>
            <CollateralPage v={current} scale={0.52} />
            <List items={[{ label: 'Version', value: current.id }, { label: 'Language', value: 'English' }, { label: 'Submitted for review', value: zm.submittedForReview ? 'Yes' : 'Not yet' }]} />
          </Card>
          <Card title="Selected item details" icon={ListChecks}>
            <List items={[
              { label: 'Content / claim', value: item.element },
              { label: 'Review owner', value: item.owner },
              { label: 'Current status', value: <StatusChip tone={REVIEW_TONE[st]}>{REVIEW_STATUS_LABEL[st]}</StatusChip> },
              { label: 'Reviewer observation', value: st === 'approved' ? 'Reviewer approved' : item.observation },
            ]} />
            <div className="row" style={{ flexWrap: 'wrap' }}>
              <Button small primary icon={CircleCheck} disabled={st === 'approved'} onClick={() => { zm.setReview(sel, 'approved'); bh.toast(`Reviewer approval recorded: ${item.element}`); }}>Record reviewer approval</Button>
              <Button small icon={Send} disabled={st === 'approved'} onClick={() => bh.toast(`Clarification requested from ${item.owner}`)}>Request clarification</Button>
            </div>
          </Card>
        </div>
      </div>
      {notes && (
        <Drawer title="Reviewer notes" width={560} onClose={() => setNotes(false)} footer={<PanelFooter onBack={() => setNotes(false)} />}>
          <List items={REVIEW_ITEMS.map((r) => ({ label: <span className="stack" style={{ gap: 0 }}><b>{r.element}</b><small className="muted">{r.owner} · {r.stage}</small></span>, value: reviews.statusOf(r.id) === 'approved' ? 'Reviewer approved' : r.observation }))} />
        </Drawer>
      )}
    </ZmPage>
  );
}

// ================================================================ 14 Campaign Playbook Release
export function PlaybookRelease() {
  const bh = useBhStore();
  const zm = useZmStore();
  const reviews = useReviews();
  const assetStatus = useAssetStatus();
  const current = useVersions('detailer').current!;
  const [preview, setPreview] = useState<TemplateId | null>(null);
  const included = zm.playbookIncluded;
  const toggle = (t: TemplateId) => zm.setPlaybookIncluded(included.includes(t) ? included.filter((x) => x !== t) : [...included, t]);
  const claimsOk = REVIEW_ITEMS.filter((r) => r.kind === 'Claim').every((r) => reviews.statusOf(r.id) === 'approved');
  const statusOf = (id: string) => reviews.statusOf(id) === 'approved';
  const checklist: { label: string; ok: boolean; info?: string }[] = [
    { label: 'Product claims · technical validation', ok: claimsOk },
    { label: 'Authorised asset versions', ok: included.length > 0 && included.every((t) => assetStatus(t) === 'approved') },
    { label: 'Brand and content compliance', ok: statusOf('r-imagery') },
    { label: 'Language review (Marathi / English)', ok: statusOf('r-marathi') },
    { label: 'Eligible Field Sales Manager mapping', ok: true },
  ];
  const ready = checklist.every((c) => c.ok);
  const publish = () => { zm.release(); bh.toast(`${included.length} asset${included.length === 1 ? '' : 's'} released to eligible Field Sales Managers`); };
  const versionOf = (t: TemplateId) => (t === 'detailer' ? current.id : TEMPLATES.find((x) => x.id === t)!.version);
  return (
    <ZmPage {...ZM_SECTION.studio} trail="Retailer-led Croptek conversion" title="Campaign Playbook Release" back={Z.collateralApprovals} next={Z.businessCase} nextLabel="Review business case"
      right={<StatusChip tone={zm.released ? 'ok' : 'neutral'}>{zm.released ? 'Released to eligible Field Sales Managers' : 'Playbook release · draft'}</StatusChip>}>
      <StudioTabs active={2} />
      <div className="kpis">
        <KpiCard label="Assets in library" value={num(TEMPLATES.length)} />
        <KpiCard label="Included in playbook" value={num(included.length)} />
        <KpiCard label="Approved versions" value={num(TEMPLATES.filter((t) => assetStatus(t.id) === 'approved').length)} />
        <KpiCard label="Release checklist ready" value={`${checklist.filter((c) => c.ok).length} of ${checklist.length}`} />
      </div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(0, 1fr) 340px' }}>
        <div className="stack">
          <Card title="Approved collateral library and playbook assembly" icon={Layers}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
              {TEMPLATES.map((t) => (
                <label key={t.id} className={`asset-card${included.includes(t.id) ? ' on' : ''}`}>
                  <input type="checkbox" checked={included.includes(t.id)} onChange={() => toggle(t.id)} aria-label={`Include ${t.name}`} />
                  <img src={PLAYBOOK_IMG[t.id]} alt={t.name} />
                  <b>{t.name}</b>
                  <small className="muted">{versionOf(t.id)} · {t.languages}</small>
                  <StatusChip tone={ASSET_TONE[assetStatus(t.id)]}>{ASSET_STATUS_LABEL[assetStatus(t.id)]}</StatusChip>
                </label>
              ))}
            </div>
          </Card>
          <Card title="Playbook assets" icon={ListChecks} flush right={<Button small icon={Save} onClick={() => bh.toast('Playbook draft saved')}>Save playbook draft</Button>}>
            <DataTable rows={TEMPLATES} rowKey={(t) => t.id}
              columns={[
                { key: 'a', header: 'Asset', render: (t) => <b>{t.name}</b> },
                { key: 'v', header: 'Latest version', render: (t) => versionOf(t.id) },
                { key: 'l', header: 'Languages', render: (t) => t.languages },
                { key: 's', header: 'Review status', align: 'center', render: (t) => <StatusChip tone={ASSET_TONE[assetStatus(t.id)]}>{ASSET_STATUS_LABEL[assetStatus(t.id)]}</StatusChip> },
                { key: 'i', header: 'Playbook inclusion', align: 'center', render: (t) => <button type="button" role="switch" aria-checked={included.includes(t.id)} aria-label={`Include ${t.name} in playbook`} className={`switch${included.includes(t.id) ? ' on' : ''}`} onClick={() => toggle(t.id)}><span /></button> },
                { key: 'p', header: 'View', align: 'center', render: (t) => <Button small icon={Eye} onClick={() => setPreview(t.id)}>View</Button> },
              ]} />
          </Card>
        </div>
        <div className="stack">
          <Card title="Release readiness" icon={ShieldCheck}>
            <List items={[{ label: 'Scope', value: 'Maharashtra · Onion' }, { label: 'Campaign', value: CAMPAIGN }]} />
            <div className="calc-label">Release checklist</div>
            <List items={checklist.map((c) => ({ label: c.label, value: <StatusChip tone={c.ok ? 'ok' : 'warn'}>{c.ok ? 'Ready' : 'Pending'}</StatusChip> }))} />
            <Button primary icon={Send} disabled={!ready || zm.released} onClick={publish}>{zm.released ? 'Released' : 'Publish to Field Sales Managers'}</Button>
          </Card>
          <Card title="Role and ownership" icon={Users}>
            <List items={[
              { label: 'Zonal Manager', value: 'Maintains approved content versions' },
              { label: 'Marketing Head', value: 'Authorises campaign rollout' },
              { label: 'Field Sales Manager', value: 'Uses released material in My Campaigns' },
            ]} />
          </Card>
        </div>
      </div>
      {preview && (
        <Modal title={`Authorised version: ${TEMPLATES.find((t) => t.id === preview)!.name}`} onClose={() => setPreview(null)} footer={<Button onClick={() => setPreview(null)}>Back</Button>}>
          {preview === 'detailer' ? <CollateralPage v={current} /> : <img className="tpl-large" src={TEMPLATE_IMG[preview]} alt="" />}
        </Modal>
      )}
    </ZmPage>
  );
}

