/** Field Sales Manager - My Plan: TM.1 Performance & ABP -> TM.2 Network -> TM.3 Outlet plan -> TM.4 Crop plan -> TM.5 Review. */
import { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronRight, Download, RefreshCw, Save, Upload } from 'lucide-react';
import { useNav } from '../nav';
import { Btn, cx } from '../ui';
import {
  ABP_LAKH, ACHIEVEMENT, CROP_PLAN, DEALER_PLAN, ELIGIBLE_ACRES_DHANORA, ONION_VILLAGES, OUTLETS, PLANNED_REALISATION,
  PREVIOUS_REALISATION, TERRITORIES, TOTAL_ABP, TOTAL_LY, VILLAGES,
} from './data';
import { AiPanel, Context, Footer, HBars, Metrics, Note, Panel, PlanTabs, Status, TmPage, crore, lakh, pct } from './ui';
import { Donut, MAP_COLORS, Ring, TmMap, VILLAGE_PLACE } from './viz';

const growth = (ly: number, target: number) => ((target - ly) / ly) * 100;

/* ------------------------------------------------------------------ TM.1 */
export function Tm1() {
  const { go } = useNav();
  return (
    <TmPage crumbs={[{ label: 'My Plan' }, { label: 'My Performance' }]} code="TM.1" title="My Performance & ABP"
      subtitle="Jalna Cluster · FY 2025–26 · Review last year and plan this year's growth, territory by territory.">
      <PlanTabs active="tm.1" />
      <Metrics items={[
        { label: 'Last Year Liquidation', value: crore(TOTAL_LY, 1), sub: 'FY 2024–25 liquidation' },
        { label: 'Current-year ABP target', value: crore(TOTAL_ABP, 1), sub: 'Assigned annual business plan' },
        { label: 'Required growth', value: pct(growth(TOTAL_LY, TOTAL_ABP), 0), sub: '+₹2.0 Cr over last year', tone: 'amber' },
      ]} />
      <Panel title="Territory planning table" actions={<span className="tm-muted">₹ Cr · illustrative</span>}>
        <div className="table-wrap">
          <table className="dt pm-table tm-table">
            <thead><tr><th>Territory</th><th className="r">Last Year Liquidation</th><th className="r">Current-year ABP target</th><th className="r">Required growth</th><th className="r">Absolute uplift</th><th>Plan status</th><th /></tr></thead>
            <tbody>
              {TERRITORIES.map((t) => (
                <tr key={t.name} className={cx(t.name === 'Ambad' && 'row-highlight')}>
                  <td><b>{t.name}</b></td>
                  <td className="r">{crore(t.ly, 1)}</td>
                  <td className="r">{crore(t.abp, 1)}</td>
                  <td className="r">{pct(growth(t.ly, t.abp))}</td>
                  <td className="r">+{crore(t.abp - t.ly, 1)}</td>
                  <td><Status>{t.name === 'Ambad' ? 'Planning not started' : 'Not started'}</Status></td>
                  <td className="r">
                    {t.name === 'Ambad'
                      ? <Btn small variant="primary" to="tm.2">Plan Territory</Btn>
                      : <Btn small onClick={() => go('tm.2')}>Plan</Btn>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td>Total</td><td className="r">{crore(TOTAL_LY, 1)}</td><td className="r">{crore(TOTAL_ABP, 1)}</td><td className="r">{pct(growth(TOTAL_LY, TOTAL_ABP))}</td><td className="r">+{crore(TOTAL_ABP - TOTAL_LY, 1)}</td><td /><td /></tr></tfoot>
          </table>
        </div>
      </Panel>
      <div className="tm-map-row">
        <TmMap title="Jalna Cluster — where must growth come from?" label="Jalna cluster territories shaded by required growth"
          talukas={{
            Ambad: { tone: 4, info: <><b>Ambad</b><br />₹3.2 Cr → ₹4.2 Cr · +31.3% (+₹1.0 Cr)</>, onSelect: () => go('tm.2') },
            Ghansawangi: { tone: 3, info: <><b>Ghansawangi</b><br />₹2.8 Cr → ₹3.4 Cr · +21.4%</> },
            Badnapur: { tone: 2, info: <><b>Badnapur</b><br />₹2.0 Cr → ₹2.4 Cr · +20.0%</> },
          }}
          markers={[
            { id: 't-ambad', label: 'Ambad', color: MAP_COLORS.green, info: 'Largest uplift: +₹1.0 Cr', action: { label: 'Plan Territory', run: () => go('tm.2') } },
            { id: 't-ghansawangi', label: 'Ghansawangi', color: MAP_COLORS.grey, info: '+₹0.6 Cr required' },
            { id: 't-badnapur', label: 'Badnapur', color: MAP_COLORS.grey, info: '+₹0.4 Cr required' },
          ]}
          selected="t-ambad"
          scale={{ title: 'Required growth', items: [{ label: '+20%', tone: 2 }, { label: '+21%', tone: 3 }, { label: '+31%', tone: 4 }] }} height={300} />
        <div className="pm-stack">
          <Panel title="Last-year achievement" className="tm-achievement">
            <div className="tm-achieve-row">
              {ACHIEVEMENT.map((a) => (
                <div key={a.label}><span>{a.label}</span><b>{a.value}</b><small>{a.note}</small></div>
              ))}
            </div>
          </Panel>
          <Panel title="Growth required by territory">
            <HBars unit=" Cr" digits={1} max={1.2} rows={TERRITORIES.map((t) => ({ label: t.name, value: t.abp - t.ly, tone: t.name === 'Ambad' ? 'green' : 'grey' }))} />
          </Panel>
          <AiPanel title="AI Planning Insight">
            <p className="tm-ai-text">Ambad needs the <b>largest absolute uplift (+₹1.0 Cr, +31.3%)</b>, well above the cluster's +25%. Start planning with Ambad's network and outlet potential.</p>
          </AiPanel>
        </div>
      </div>
      <Footer
        primary={{ label: 'Plan Territory: Ambad', to: 'tm.2' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.2 */
export function Tm2() {
  const [village, setVillage] = useState('Dhanora');
  const [open, setOpen] = useState(true);
  const { toast } = useNav();
  const outlets = OUTLETS[village] ?? [];
  const selected = VILLAGES.find((v) => v.name === village)!;
  const missing = outlets.filter((o) => /missing|inactive|pending/i.test(o.status));
  return (
    <TmPage crumbs={[{ label: 'My Plan', to: 'tm.1' }, { label: 'My Performance', to: 'tm.1' }, { label: 'Ambad' }, { label: 'Territory Network' }]}
      code="TM.2" title="Territory Network" subtitle="Explore Ambad's villages, dealers and linked retailers before setting outlet targets.">
      <PlanTabs active="tm.2" />
      <Context items={[
        { label: 'Territory', value: 'Ambad', sub: 'Jalna district' },
        { label: 'Last Year Liquidation', value: '₹3.2 Cr' },
        { label: 'Current-year ABP target', value: '₹4.2 Cr' },
        { label: 'Required growth', value: '+31.3%' },
        { label: 'Network (illustrative)', value: '8 dealers · 74 retailers' },
      ]} />
      <div className="tm-explorer">
        <Panel title="Geography → channel explorer" className="tm-tree-panel">
          <div className="tm-tree">
            <div className="tm-tree-node tm-tree-root">Jalna</div>
            <button type="button" className="tm-tree-node tm-tree-l1" onClick={() => setOpen((o) => !o)}>
              {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Ambad <small>8 dealers · 74 retailers</small>
            </button>
            {open && VILLAGES.map((v) => (
              <button key={v.name} type="button" className={cx('tm-tree-node tm-tree-l2', v.name === village && 'active')} onClick={() => setVillage(v.name)}>
                {v.name}<small>{v.dealers} dealer{v.dealers > 1 ? 's' : ''} · {v.retailers} retailers</small>
              </button>
            ))}
          </div>
        </Panel>
        <TmMap title="Ambad channel network map" label="Ambad villages with dealer and retailer counts" height={320}
          selected={VILLAGE_PLACE[village]}
          markers={VILLAGES.map((v) => {
            const issues = (OUTLETS[v.name] ?? []).filter((o) => /missing|inactive|pending/i.test(o.status)).length;
            return {
              id: VILLAGE_PLACE[v.name], label: v.name === 'Other villages' ? 'Other villages (e.g. Shahagad)' : v.name,
              color: issues ? MAP_COLORS.amber : MAP_COLORS.green,
              info: <><b>{v.name}</b><br />{v.dealers} dealer{v.dealers > 1 ? 's' : ''} · {v.retailers} retailers{issues ? ` · ${issues} mapping issue${issues > 1 ? 's' : ''}` : ''}</>,
              onSelect: () => setVillage(v.name),
            };
          })}
          markerLegend={[{ label: 'Network mapped', color: MAP_COLORS.green }, { label: 'Mapping issues', color: MAP_COLORS.amber }]} />
      </div>
      <div className="tm-explorer-table">
        <Panel title={`${village} — mapped outlets`} actions={<Btn small icon={<RefreshCw size={12} />} onClick={() => toast('Master-data refresh requested from the dealer/retailer Excel master (illustrative).')}>Refresh master data</Btn>}>
          <div className="tm-village-summary">
            <span><b>{selected.dealers}</b> dealer{selected.dealers > 1 ? 's' : ''}</span>
            <span><b>{selected.retailers}</b> linked retailers</span>
            <span><b>{missing.length}</b> mapping issue{missing.length === 1 ? '' : 's'}</span>
          </div>
          <div className="table-wrap">
            <table className="dt pm-table tm-table">
              <thead><tr><th>Outlet name</th><th>Type</th><th>Linked dealer</th><th>Village</th><th>Previous-year sales</th><th>Status</th><th /></tr></thead>
              <tbody>
                {outlets.map((o) => (
                  <tr key={o.name}>
                    <td><b>{o.name}</b></td>
                    <td><span className={cx('tm-type', o.type === 'Dealer' ? 'tm-type-dealer' : 'tm-type-retailer')}>{o.type}</span></td>
                    <td>{o.dealer}</td>
                    <td>{o.village}</td>
                    <td className={cx(/No sales/.test(o.prev) && 'tm-muted')}>{o.prev}</td>
                    <td><Status>{o.status}</Status></td>
                    <td className="r"><Btn small onClick={() => toast(`${o.name}: outlet profile (illustrative)`)}>View</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Note>Dealer values are <b>primary</b> sales; retailer values are <b>secondary</b> estimates. They are shown separately and never added together. Showing a sample of {selected.retailers} retailers.</Note>
        </Panel>
      </div>
      <AiPanel title="AI Network Insight">
        <ul className="tm-ai-list">
          <li><b>Dhanora:</b> Sai Krushi Bhandar has no dealer link — map it before outlet planning.</li>
          <li><b>Dhanora:</b> Kisan Seva Kendra has no billing for two seasons — confirm whether it is still active.</li>
          <li><b>Wadi Gaon / Pimpalgaon:</b> 2 retailers await master-data verification.</li>
        </ul>
      </AiPanel>
      <Footer back={{ label: 'Back to My Performance', to: 'tm.1' }}
        primary={{ label: 'Proceed to Outlet Planning', to: 'tm.3' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.3 */
export function Tm3() {
  const { toast } = useNav();
  const [targets, setTargets] = useState(() => DEALER_PLAN.map((d) => d.target));
  const [expanded, setExpanded] = useState<string | null>('Dhanora Agro Inputs');
  const ly = DEALER_PLAN.reduce((sum, d) => sum + d.ly, 0);
  const proposed = targets.reduce((sum, t) => sum + (Number.isFinite(t) ? t : 0), 0);
  const gap = ABP_LAKH - proposed;
  const allocated = (proposed / ABP_LAKH) * 100;
  return (
    <TmPage crumbs={[{ label: 'My Plan', to: 'tm.1' }, { label: 'Territory Network', to: 'tm.2' }, { label: 'Ambad' }, { label: 'Outlet Planning' }]}
      code="TM.3" title="Outlet Targets" subtitle="Allocate Ambad's ABP across dealers. Retailer demand is shown for context only."
      actions={<>
        <Btn icon={<Upload size={13} />} onClick={() => toast('Import Excel Plan: choose a filled template (illustrative).')}>Import Excel Plan</Btn>
        <Btn icon={<Download size={13} />} onClick={() => toast('Template downloaded: Ambad_outlet_plan_template.xlsx (illustrative)')}>Download Template</Btn>
        <Btn icon={<Save size={13} />} onClick={() => toast('Outlet plan saved as draft.')}>Save Draft</Btn>
      </>}>
      <PlanTabs active="tm.3" />
      <Context items={[
        { label: 'Territory', value: 'Ambad, Jalna' },
        { label: 'Last Year Liquidation', value: '₹3.2 Cr' },
        { label: 'ABP target', value: '₹4.2 Cr' },
        { label: 'Dealers in plan', value: '8' },
      ]} />
      <Panel title="Dealer-wise business plan" actions={<span className="tm-muted">₹ lakh · targets are editable</span>}>
        <div className="table-wrap">
          <table className="dt pm-table tm-table">
            <thead><tr><th>Dealer / outlet</th><th className="r">Last-year liquidation</th><th className="r">Proposed target</th><th className="r">Growth %</th><th>Planning status</th><th>Details</th></tr></thead>
            <tbody>
              {DEALER_PLAN.map((d, index) => {
                const isOpen = expanded === d.name;
                const canExpand = Boolean(d.retailers || d.group);
                return (
                  <Fragment key={d.name}>
                    <tr className={cx(isOpen && 'row-highlight')}>
                      <td><b>{d.name}</b><small className="tm-sub">{d.village}</small></td>
                      <td className="r">{lakh(d.ly)}</td>
                      <td className="r">
                        <span className="tm-input-money">₹<input type="number" min={0} step={1} aria-label={`Proposed target for ${d.name}`} value={targets[index]}
                          onChange={(e) => setTargets((all) => all.map((v, i) => (i === index ? Number(e.target.value) : v)))} /> L</span>
                      </td>
                      <td className="r">{pct(growth(d.ly, targets[index]))}</td>
                      <td><Status>{d.status}</Status></td>
                      <td>{canExpand && <Btn small onClick={() => setExpanded(isOpen ? null : d.name)}>{isOpen ? 'Hide' : d.group ? 'Show dealers' : 'Linked retailers'}</Btn>}</td>
                    </tr>
                    {isOpen && d.retailers && (
                      <tr className="tm-expand"><td colSpan={6}>
                        <div className="tm-expand-box">
                          <b>Linked retailers — secondary demand estimates (not added to the dealer's primary target)</b>
                          <ul>{d.retailers.map((r) => <li key={r.name}><span>{r.name}</span><span className="tm-muted">{r.secondary}</span></li>)}</ul>
                        </div>
                      </td></tr>
                    )}
                    {isOpen && d.group && (
                      <tr className="tm-expand"><td colSpan={6}><div className="tm-expand-box"><b>Dealers in this group</b><ul>{d.group.map((g) => <li key={g}><span>{g}</span></li>)}</ul></div></td></tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot><tr><td>Total (8 dealers)</td><td className="r">{lakh(ly)}</td><td className="r">{lakh(proposed)}</td><td className="r">{pct(growth(ly, proposed))}</td><td /><td /></tr></tfoot>
          </table>
        </div>
        <Note tone="warn"><AlertTriangle size={12} /> Last import check: 2 outlet IDs did not match the master and 1 duplicate row was skipped. Fix them in the template before re-importing.</Note>
      </Panel>
      <div className="pm-two">
        <Panel title="Reconciliation">
          <div className="tm-recon">
            <div><span>Assigned ABP</span><b>{crore(ABP_LAKH / 100)}</b></div>
            <div><span>Proposed allocation</span><b>{crore(proposed / 100)}</b></div>
            <div className={cx(gap > 0 && 'tm-recon-gap')}><span>{gap >= 0 ? 'Unallocated gap' : 'Over-allocated'}</span><b>{crore(Math.abs(gap) / 100)}</b></div>
            <div><span>Allocated</span><b>{allocated.toFixed(1)}%</b></div>
          </div>
          <div className="tm-progress"><i style={{ width: `${Math.min(100, allocated)}%` }} /></div>
        </Panel>
        <AiPanel title="AI Planning Insight">
          <p className="tm-ai-text">{gap > 0
            ? <>₹{gap.toFixed(0)} L of the ABP is still unallocated. Review outlet potential (Shiv Krushi Kendra is flagged for review) before finalising — no confirmed outlet data supports a higher target yet.</>
            : <>The plan now covers the full ABP. Confirm stretch targets are backed by outlet potential before moving on.</>}
          </p>
        </AiPanel>
      </div>
      <Footer back={{ label: 'Back to Territory Network', to: 'tm.2' }}
        primary={{ label: 'Proceed to Crop & Product Planning', to: 'tm.4' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.4 */
export function Tm4() {
  const { toast } = useNav();
  const [selected, setSelected] = useState('Dhanora');
  const [rate, setRate] = useState(20);
  const [targetMt, setTargetMt] = useState(15);
  const [retention, setRetention] = useState(80);
  const [conv, setConv] = useState(60);
  const [infoOpen, setInfoOpen] = useState(false);
  const calc = useMemo(() => {
    const effective = (targetMt * 1000) / rate;
    const retained = 500 * (retention / 100);
    const newAcres = Math.max(effective - retained, 0);
    const eligible = conv > 0 ? newAcres / (conv / 100) : 0;
    return { effective, retained, newAcres, eligible };
  }, [rate, targetMt, retention, conv]);
  const onionTotal = ONION_VILLAGES.reduce((sum, v) => sum + v.tgtRev, 0);
  return (
    <TmPage crumbs={[{ label: 'My Plan', to: 'tm.1' }, { label: 'Outlet Planning', to: 'tm.3' }, { label: 'Ambad' }, { label: 'Crop & Product Plan' }]}
      code="TM.4" title="Village Crop Plan" subtitle="Turn the onion business target into village volumes and the crop area that must be covered.">
      <PlanTabs active="tm.4" />
      <Context items={[
        { label: 'Territory', value: 'Ambad, Jalna', sub: 'FY 2025–26' },
        { label: 'ABP', value: '₹4.20 Cr' },
        { label: 'Proposed outlet plan', value: '₹3.80 Cr' },
        { label: 'Remaining gap', value: '₹0.40 Cr' },
        { label: 'Crop in focus', value: 'Onion', sub: 'Maize · Other crops next' },
      ]} />
      <div className="tm-split">
        <div className="pm-stack">
        <Panel title="Onion — village-wise business & coverage plan" actions={<span className="tm-muted">Revenue ₹ lakh · volume MT · area acres</span>}>
          <div className="table-wrap">
            <table className="dt pm-table tm-table">
              <thead><tr><th>Village</th><th>Last-year revenue / volume</th><th className="r">Previous covered acres</th><th>Target revenue / volume</th><th className="r">Required covered acres</th><th className="r">Coverage growth</th><th /></tr></thead>
              <tbody>
                {ONION_VILLAGES.map((v) => {
                  const mt = v.tgtMt ?? (v.tgtRev * 1e5) / (PLANNED_REALISATION * 1000);
                  const acres = (mt * 1000) / rate;
                  return (
                    <tr key={v.village} className={cx(v.village === selected && 'row-highlight', 'row-click')} onClick={() => setSelected(v.village)}>
                      <td><b>{v.village}</b></td>
                      <td>{v.verified ? `${lakh(v.lyRev!)} / ${v.lyMt} MT` : <button type="button" className="tm-link" onClick={(e) => { e.stopPropagation(); toast(`${v.village}: historical sales records are unverified — open the source records.`); }}>View records</button>}</td>
                      <td className="r">{v.prevAcres ? v.prevAcres.toLocaleString('en-IN') : '—'}</td>
                      <td>{lakh(v.tgtRev)} / {v.verified ? `${mt} MT` : `~${mt.toFixed(0)} MT est.`}</td>
                      <td className="r">{v.verified ? Math.round(acres).toLocaleString('en-IN') : `~${Math.round(acres).toLocaleString('en-IN')} est.`}</td>
                      <td className="r">{v.prevAcres ? `+${Math.round(acres - v.prevAcres)} net` : 'Records needed'}</td>
                      <td className="r"><Btn small onClick={() => setSelected(v.village)}>{v.verified ? 'Calculate' : 'Plan'}</Btn></td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot><tr><td>Onion total</td><td /><td /><td>{lakh(onionTotal)} = {crore(onionTotal / 100)}</td><td /><td /><td /></tr></tfoot>
            </table>
          </div>
          <Note>Village targets reconcile to the Onion crop plan (₹1.65 Cr). They are a crop view of the same allocation as the dealer plan — not additional business. Estimates assume {rate} kg/acre and ₹{PLANNED_REALISATION}/kg.</Note>
          <div className="tm-row-actions">
            <Btn onClick={() => toast('Assumptions sent for validation: application rate, realisation, retention, conversion.')}>Validate Assumptions</Btn>
            <Btn onClick={() => toast('Linked outlet plan updated with the onion village volumes (draft).')}>Update Linked Outlet Plan</Btn>
          </div>
        </Panel>
        <TmMap title="Onion target by village" label="Ambad onion revenue targets by village" height={280} selected={VILLAGE_PLACE[selected]}
          markers={ONION_VILLAGES.map((v) => ({
            id: VILLAGE_PLACE[v.village],
            label: `${v.village === 'Other villages' ? 'Other villages' : v.village} · ${lakh(v.tgtRev)}`,
            color: v.verified ? MAP_COLORS.green : MAP_COLORS.amber,
            info: <><b>{v.village}</b><br />Target {lakh(v.tgtRev)}{v.verified ? ' · 750 acres required (+250)' : ' · history unverified'}</>,
            onSelect: () => setSelected(v.village),
          }))}
          markerLegend={[{ label: 'Verified history', color: MAP_COLORS.green }, { label: 'Records to verify', color: MAP_COLORS.amber }]} />
        </div>
        <div className="pm-stack">
          <Panel title={`${selected === 'Dhanora' ? 'Dhanora' : selected} coverage & volume calculator`} tone="soft">
            {selected !== 'Dhanora' && <Note tone="warn">{selected} has no verified history; the calculator shows Dhanora until records are validated.</Note>}
            <div className="tm-calc">
              <label>Assumed product rate <span><input type="number" value={rate} min={1} onChange={(e) => setRate(Math.max(1, Number(e.target.value)))} /> kg/acre</span></label>
              <label>Volume target <span><input type="number" value={targetMt} min={0} onChange={(e) => setTargetMt(Number(e.target.value))} /> MT</span></label>
              <div className="tm-calc-out"><span>Effective coverage needed</span><b>{Math.round(calc.effective).toLocaleString('en-IN')} acres</b></div>
              <label>Historical retention <span><input type="number" value={retention} min={0} max={100} onChange={(e) => setRetention(Number(e.target.value))} /> %</span></label>
              <div className="tm-calc-out"><span>Retained acres (of 500)</span><b>{Math.round(calc.retained)} acres</b></div>
              <div className="tm-calc-out"><span>New acres to convert</span><b>{Math.round(calc.newAcres)} acres</b></div>
              <label>Expected conversion <span><input type="number" value={conv} min={1} max={100} onChange={(e) => setConv(Math.max(1, Number(e.target.value)))} /> %</span></label>
              <div className="tm-calc-out tm-calc-key"><span>Eligible new acres to reach</span><b>≈ {Math.ceil(calc.eligible)} acres</b></div>
            </div>
            <small className="tm-muted">All values are planning assumptions, not verified field data.</small>
          </Panel>
          <Panel title={<button type="button" className="tm-collapse" onClick={() => setInfoOpen((o) => !o)}>{infoOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />} Approved product & growth-stage info</button>}>
            {infoOpen
              ? <ul className="tm-plain-list"><li>Croptek (onion) — approved for basal / early vegetative application.</li><li>Stage window: transplanting → bulb initiation.</li><li>Doses are not prescribed here; use the agronomy-approved recommendation.</li></ul>
              : <small className="tm-muted">Product suitability and stage windows from the approved product master.</small>}
          </Panel>
          <AiPanel title="AI Feasibility Insight">
            <ul className="tm-ai-list">
              <li><b>Realisation drops 20%:</b> ₹{PREVIOUS_REALISATION}/kg last year vs ₹{PLANNED_REALISATION}/kg planned. Validate pricing or product mix.</li>
              <li><b>Coverage:</b> {Math.round(calc.effective)} of ~{ELIGIBLE_ACRES_DHANORA.toLocaleString('en-IN')} eligible onion acres in Dhanora = {((calc.effective / ELIGIBLE_ACRES_DHANORA) * 100).toFixed(1)}% (illustrative village area).</li>
            </ul>
          </AiPanel>
        </div>
      </div>
      <Footer back={{ label: 'Back to Outlet Planning', to: 'tm.3' }}
        primary={{ label: 'Review Business & Crop Plan', to: 'tm.5' }} />
    </TmPage>
  );
}

/* ------------------------------------------------------------------ TM.5 */
export function Tm5() {
  const { toast, go } = useNav();
  const [note, setNote] = useState('Onion +₹25 L and Maize +₹15 L opportunities identified; outlet allocation pending field validation.');
  const cropTotal = CROP_PLAN.reduce((sum, c) => sum + c.value, 0);
  return (
    <TmPage crumbs={[{ label: 'My Plan', to: 'tm.1' }, { label: 'Ambad' }, { label: 'Crop & Product Plan', to: 'tm.4' }, { label: 'Review & Approval' }]}
      code="TM.5" title="Plan Review & Approval" status="Draft — Reconciliation Required"
      subtitle="Check that the outlet and crop views reconcile, resolve the ABP gap, then submit for leadership approval.">
      <PlanTabs active="tm.5" />
      <Context items={[
        { label: 'ABP target', value: '₹4.20 Cr' },
        { label: 'Proposed plan', value: '₹3.80 Cr' },
        { label: 'Unallocated gap', value: '₹0.40 Cr', sub: '90.5% allocated' },
      ]} tone="cream" />
      <div className="tm-viz-row">
        <Panel title="ABP coverage">
          <Donut center="90.5%" sub="allocated" segments={[{ label: 'Allocated to dealers', value: 380, color: MAP_COLORS.green }, { label: 'Unallocated gap', value: 40, color: MAP_COLORS.amber }]} />
        </Panel>
        <Panel title="Crop mix of the proposed plan">
          <Donut center="₹3.80 Cr" sub="crop view" segments={CROP_PLAN.map((c, i) => ({ label: c.crop, value: c.value, color: ['#2f8a3b', '#d7a62f', '#7fa3cc'][i] }))} />
        </Panel>
        <Panel title="Readiness to submit">
          <div className="tm-ring-row">
            <Ring value={33} label="1 / 3" sub="validation checks passed" tone="amber" />
            <Ring value={0} label="0 / 4" sub="approvals completed" tone="blue" />
          </div>
        </Panel>
      </div>
      <Panel title="Consolidated business & crop plan review">
        <div className="pm-two-even">
          <div className="tm-review-col">
            <h4>Dealer / outlet business plan</h4>
            <div className="tm-review-total"><span>8 dealers · primary sales target</span><b>₹3.80 Cr</b></div>
            <ul className="tm-plain-list">
              {DEALER_PLAN.map((d) => <li key={d.name}><span>{d.name}</span><b>{lakh(d.target)}</b></li>)}
            </ul>
          </div>
          <div className="tm-review-col">
            <h4>Crop / product plan</h4>
            <div className="tm-review-total"><span>3 crop groups</span><b>{crore(cropTotal)}</b></div>
            <ul className="tm-plain-list">
              {CROP_PLAN.map((c) => <li key={c.crop}><span>{c.crop}</span><b>{crore(c.value)}</b></li>)}
            </ul>
          </div>
        </div>
        <Note>The outlet-wise and crop-wise totals are <b>two views of the same ₹3.80 Cr allocation</b> and must not be added together.</Note>
      </Panel>
      <div className="pm-two">
        <Panel title="Plan validation" tone="warn">
          <ul className="tm-checks">
            <li className="ok"><span>Outlet and crop aggregates reconciled</span><Status>Reconciled · ₹3.80 Cr</Status></li>
            <li className="risk"><span>ABP gap of ₹40 L</span><Status>Unresolved</Status></li>
            <li className="warn"><span>Onion +₹25 L and Maize +₹15 L opportunities</span><Status>Uncommitted — validate & allocate</Status></li>
          </ul>
          <div className="tm-row-actions">
            <Btn variant="primary" onClick={() => go('tm.3')}>Resolve Planning Gap (Outlet Plan)</Btn>
            <Btn onClick={() => go('tm.4')}>Open Crop Plan</Btn>
            <Btn icon={<Save size={13} />} onClick={() => toast('Plan saved as draft v2.')}>Save Draft</Btn>
          </div>
        </Panel>
        <Panel title="Review notes">
          <textarea className="tm-textarea" rows={4} value={note} onChange={(e) => setNote(e.target.value)} aria-label="Review notes" />
          <small className="tm-muted">Version history: v1 imported 02 Apr · v2 draft saved today · comments visible to reviewers.</small>
        </Panel>
      </div>
      <Footer back={{ label: 'Back to Crop & Product Plan', to: 'tm.4' }}
        secondary={<Btn to="tm.c1">Showcase: continue with approved plan v3</Btn>} />
    </TmPage>
  );
}
