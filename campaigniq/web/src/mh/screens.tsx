import type { ReactNode } from 'react';
import { useNav, type ScreenId } from '../nav';
import { MhPage } from './ui';
import { MH_SCREENS } from './nav';
import { ActionButton } from '../ui/index';
import { MH_CHARTS } from './charts';
import { Activity, ArrowLeft, ArrowRight, BarChart3, CalendarDays, CheckCircle2, CircleHelp, Clock3, Database, FileText, Info, Layers3, Link2, Map, MapPin, Megaphone, MessageCircle, PencilLine, Send, Sparkles, Sprout, Store, Target, TrendingUp, Users } from 'lucide-react';
type Spec = {
  code: string;
  title: string;
  subtitle: string;
  crumbs: { label: string; to?: ScreenId }[];
  metrics: [string, string, string?][];
  insight: [string, string][];
  next?: { label: string; to: ScreenId };
  /** Extra content rendered after the charts (e.g. the live copilot on MH.AI1). */
  extra?: ReactNode;
};
function Workspace(spec: Spec) {
  const { go, goBack } = useNav();
  const insightTitle = spec.code === 'MH.2' ? 'AI Strategic Opportunity Insight' : spec.code.startsWith('MH.9') ? 'AI Performance Insight' : 'AI Marketing Insight';
  const summaryIcons = spec.code === 'MH.1' ? [Layers3, TrendingUp, Target] : spec.code === 'MH.3A' ? [Layers3, Sprout, Target] : spec.code === 'MH.9' ? [Target, Users, CircleHelp] : [Activity, TrendingUp, CircleHelp, CheckCircle2];
  const insightIcons = [Target, Activity, Info];
  const summaryNotes = spec.code === 'MH.1' ? ['(Illustrative, market-sizing view)', '(Illustrative YoY range)', '(Illustrative incremental sales range)'] : spec.code === 'MH.9' ? ['', '(Adopters, illustrative)', ''] : [];
  return (
    <MhPage
      crumbs={spec.crumbs}
      code={spec.code}
      title={spec.title}
      subtitle={spec.subtitle}
    >
      {(spec.code === 'MH.3A' || spec.code === 'MH.3B') && <div className="mh-review-context"><span><MapPin/><b>Region</b><strong>West</strong></span><span><Map/><b>State</b><strong>Maharashtra</strong></span><span><Sprout/><b>Crop</b><strong>Onion</strong></span><span><Layers3/><b>Priority Product</b><strong>Croptek</strong></span><span><Users/><b>Zonal Manager Review</b><strong className="mh-status-good"><CheckCircle2/>Reviewed</strong></span><span><Target/><b>Marketing Assessment</b><strong className="mh-status-review"><Clock3/>Pending</strong></span></div>}
      {spec.code === 'MH.4A' && <div className="mh-diagnosis-context"><span><MapPin/><b>Region</b>West</span><span><Map/><b>State</b>Maharashtra</span><span><Sprout/><b>Crop</b>Onion</span><span><Layers3/><b>Product</b>Croptek</span><span><Database/><b>Data Scope</b>Market, Sales, Campaigns, Business Plan</span><span><CalendarDays/><b>Assessment Period</b>FY 2024–25 (Historical)</span></div>}
      {spec.code !== 'MH.AI1' && spec.code !== 'MH.3B' && <div className={`mh-summary-row mh-summary-count-${spec.metrics.length} ${spec.code === 'MH.3A' ? 'mh-3a-summary' : ''}`} style={{ gridTemplateColumns: `repeat(${spec.code === 'MH.3A' ? 4 : spec.metrics.length}, minmax(0, 1fr))` }}>{spec.metrics.map(([label, value, tone], i) => { const Icon = summaryIcons[i % summaryIcons.length]; const displayValue = spec.code === 'MH.1' ? [value.replace('INR ', '₹').replace('-', '–'), value, value][i] : value; return <div key={label} className={`mh-summary-card mh-summary-card-${i} ${tone ? `mh-summary-${tone}` : ''}`}><span className="mh-summary-icon"><Icon aria-hidden="true" /></span><div className="mh-summary-copy"><span>{label}</span><strong>{displayValue}</strong>{summaryNotes[i] && <small>{summaryNotes[i]}</small>}{spec.code === 'MH.9' && i === 0 && <span className="mh-summary-progress"><i/></span>}</div></div>; })}{spec.code === 'MH.3A' && <div className="mh-summary-note"><Info/><span>₹1.90 Cr is the approved all-product Onion allocation for Ambad, not a Croptek-specific committed revenue.</span></div>}</div>}
      <div className={`mh-workspace-grid ${spec.code === 'MH.3A' ? 'mh-workspace-review-detail' : ''} ${spec.code === 'MH.3B' ? 'mh-workspace-review-region' : ''}`}>
        <main className="mh-workspace-main">
          {MH_CHARTS[spec.code]}
          {spec.extra}
        </main>
        <aside className="mh-insight-rail">
          {!['MH.3A','MH.3B','MH.9','MH.9A','MH.9B'].includes(spec.code) && <section className={`mh-section mh-insight-card ${spec.code === 'MH.1' ? 'mh-national-insight' : ''} ${spec.code === 'MH.2' ? 'mh-opportunity-insight' : ''}`}><h2><Sparkles aria-hidden="true" />{spec.code === 'MH.1' ? 'AI Strategic Insight' : insightTitle}</h2>{spec.code === 'MH.1' ? <><p className="mh-rail-intro">Based on market opportunity, product sales underperformance and past campaign learnings, recommended national/regional marketing focus areas are:</p><div className="mh-recommendations"><article><span className="mh-recommend-icon mh-icon-green"><Activity /></span><div><b>Conversion Campaign Theme</b><p>Accelerate uptake of high-opportunity products (e.g., Croptek in Onion, Maize).</p></div></article><article><span className="mh-recommend-icon mh-icon-olive"><Store /></span><div><b>Retailer Activation Theme</b><p>Strengthen product pull and availability in high-opportunity regions (e.g., West, South).</p></div></article><article><span className="mh-recommend-icon mh-icon-green"><Megaphone /></span><div><b>Awareness &amp; Consideration Theme</b><p>Build salience and consideration for Croptek portfolio in emerging and under-indexed regions (e.g., East).</p></div></article></div><div className="mh-approval-note"><Info />Recommendations only — not yet approved.</div></> : spec.code === 'MH.2' ? <><div className="mh-opportunity-recommendation"><TrendingUp /><p>Positive sales momentum (Q1–Q4: ₹40L → ₹48L) can still coexist with low product penetration (indicative 14–18%) in a large, addressable onion market (indicative ₹7–10 Cr) in Maharashtra.</p></div><div className="mh-opportunity-recommendation"><Target /><p><b>Recommendation:</b> Evaluate retailer-led conversion for Croptek in high-potential onion markets in Maharashtra, subject to business-plan and channel validation.</p></div><div className="mh-approval-note"><Info /><span>Recommendation is <b>NOT YET APPROVED.</b></span></div></> : <><p className="mh-rail-intro">Recommendations are decision support and require review.</p><ul className="pm-ai-list">{spec.insight.map(([label, value], index) => { const Icon = insightIcons[index % insightIcons.length]; return <li key={label} className={index === 0 ? 'pm-ai-green' : 'pm-ai-amber'}><span className="mh-insight-marker"><Icon aria-hidden="true" /></span><span className="mh-insight-copy"><b>{label}</b><span>{value}</span></span></li>; })}</ul></>}</section>}
          {spec.code === 'MH.1' && <section className="mh-section mh-investment-card"><h2><Layers3 aria-hidden="true" />Marketing Investment Status</h2><div className="mh-investment-grid"><div className="mh-investment-item"><div className="mh-investment-label"><CheckCircle2 /><b>Approved Budget</b></div><span className="mh-state-good">Partially Committed</span></div><div className="mh-investment-item"><div className="mh-investment-label mh-review-label"><TrendingUp /><b>Proposed Allocations</b></div><span className="mh-state-review"><Clock3 />Under Review</span></div></div><p><Info />Illustrative allocation view (not a confirmed financial plan).</p></section>}
          {spec.code === 'MH.3A' && <><section className="mh-section mh-detail-observations"><h2><Activity />Dhanora – Plan Detail &amp; Key Observations <span className="mh-selected-tag">Selected Village</span></h2><div className="mh-village-stats"><div><b><Activity/>Product Volume</b><strong>+50%</strong><span>(10 MT → 15 MT)</span></div><div><b><Sprout/>Effective Area</b><strong>+250 acres</strong><span>(500 → 750 acres)</span></div><div><b><Layers3/>Implied Realization</b><strong>₹100/kg → ₹80/kg</strong><span>(-20%)</span></div></div><p className="mh-inline-note"><Info />Observation: Planned volume rises by 50% with higher area coverage, while implied realization declines by 20%. Pricing / product mix assumptions require validation.</p></section><section className="mh-section mh-pm-review-notes"><h2><Users />Zonal Manager Review Notes <span className="mh-status-good"><CheckCircle2/>Reviewed (Partially Validated)</span></h2><ul className="mh-plain-list"><li>Product applicability: Suitable for Onion in this market. <span className="mh-status-good"><CheckCircle2/>Reviewed</span></li><li>Application rate: 20 kg/acre assumed – to be validated with Agronomy. <span className="mh-status-review"><Clock3/>Pending</span></li><li>Financial assumptions: Realization change (₹100/kg → ₹80/kg) needs commercial validation. <span className="mh-status-review"><Clock3/>Pending</span></li></ul></section><section className="mh-section mh-ai-marketing-detail"><h2><Sparkles />AI Marketing Insight</h2><p>The Ambad plan indicates a meaningful conversion opportunity for Croptek in Onion, aligned with the regional opportunity (indicative penetration: 14–18%).</p><b>Key checks before confirming a campaign theme:</b><ul className="mh-plain-list"><li>Validate farmer acquisition / conversion approach.</li><li>Confirm retailer reach and their expected role.</li><li>Review pricing / product mix and application assumptions.</li></ul><div className="mh-approval-note"><Info/>This is a recommendation, not yet approved.</div></section></>}
          {spec.code === 'MH.3B' && <><section className="mh-section mh-ai-marketing-detail"><h2><Sparkles />AI Marketing Intervention Insight</h2><p>A West Region Croptek conversion theme for Onion is a relevant candidate, given the illustrative high market potential, current penetration (14–18%) and the conversion growth objective in the PM-reviewed plans.</p></section><section className="mh-section mh-validation-needs"><h2><Info />Key Considerations &amp; Validation Needs</h2><ul className="mh-plain-list"><li>Confirm consolidated business plans for remaining Maharashtra territories.</li><li>Validate channel readiness and retailer participation.</li><li>Align on target audience coverage and content support.</li><li>Assess if this can be aggregated as a West Region campaign theme.</li></ul></section><section className="mh-section mh-ai-recommend-card"><h2><CheckCircle2 />Recommendation</h2><p>Evaluate a West Region Croptek Conversion &amp; Education theme.</p><small>Not yet approved. Subject to business, product and channel validation.</small></section></>}
          {spec.code === 'MH.9' && <><section className="mh-section mh-insight-card mh-portfolio-ai"><h2><Sparkles/>AI Portfolio Insight</h2><ul><li>Review lower progress in farmer follow-up.</li><li>Assess territory readiness and stock alignment.</li><li>Compare intervention performance before scale-up.</li></ul></section><section className="mh-section mh-learning-card"><h2><Activity/>Campaign Effectiveness &amp; Learning</h2><table><thead><tr><th>Intervention</th><th>Adoption <small>(Illustrative)</small></th></tr></thead><tbody><tr><td>Retailer-led activation</td><td className="mh-learning-green">35%</td></tr><tr><td>Farmer follow-up</td><td className="mh-learning-amber">28%</td></tr><tr><td>Awareness</td><td className="mh-learning-red">12%</td></tr></tbody></table></section></>}
          {spec.code === 'MH.9A' && <><section className="mh-section mh-progress-side"><h2><Activity/>Programme Progress</h2><div className="mh-side-legend"><span><i className="planned"/>Observed</span><span><i className="observed"/>Planned</span></div><div className="mh-progress-compare"><b>Campaign<br/>Execution</b><div><span className="mh-observed-bar" style={{width:'72%'}}>72%</span><span className="mh-planned-bar" style={{width:'80%'}}>80%</span></div></div></section><section className="mh-section mh-playbook-side"><h2><CheckCircle2/>Approved Campaign Playbook</h2><dl><dt>Campaign</dt><dd>Retailer-Led Croptek Conversion</dd><dt>PM Owner</dt><dd>Crop Nutrition Zonal Manager</dd><dt>Region Scope</dt><dd>West Region (Maharashtra – Onion)</dd><dt>Guardrails</dt><dd>Implement within approved playbook and regional scope</dd></dl></section><section className="mh-section mh-ai-recommend-card"><h2><Sparkles/>AI Management Insight</h2><p>Programme is 8 pp behind plan. Review execution progress across territories for gaps and alignment.</p></section></>}
          {spec.code === 'MH.9B' && <><section className="mh-section mh-performance-actions"><h2><Sparkles/>AI Performance Insight</h2><ol><li>Investigate slow plan-to-activation transitions using approved campaign records.</li><li>Check retailer / field completion and CRM follow-up data.</li><li>Request PM campaign optimization only if evidence warrants it.</li></ol></section><section className="mh-section mh-playbook-side"><h2><Layers3/>Source &amp; References</h2><ul className="mh-source-links"><li>Regional Programme</li><li>Approved Campaign Playbook</li><li>Territory Campaign Impact</li><li>Territory Diagnostics</li></ul></section></>}
          {!['MH.1', 'MH.2', 'MH.3A', 'MH.3B', 'MH.9', 'MH.9A', 'MH.9B'].includes(spec.code) && <section className="mh-section mh-guidance-card"><h2><TrendingUp />Recommended next</h2><p>{spec.next?.label || 'Review the evidence with the AI Copilot.'}</p>{spec.next && <ActionButton kind="primary" label={spec.next.label} onClick={() => go(spec.next!.to)} />}</section>}
        </aside>
      </div>
      {spec.code === 'MH.9' ? <div className="mh-portfolio-actions"><button onClick={()=>go('mh.8a')}>▤ &nbsp;View Regional Programme</button><button onClick={()=>go('mh.9b')}><Activity/>Investigate Drivers</button><button onClick={()=>go('mh.9c')}>⌖ &nbsp;View Territory Impact</button><button className="primary" onClick={()=>go('mh.ai1')}>✧ &nbsp;Ask Strategic Marketing Copilot</button></div> : spec.code === 'MH.9A' ? <div className="mh-portfolio-actions"><button onClick={()=>go('mh.9')}><ArrowLeft/>Back to Portfolio</button><button onClick={()=>go('mh.9b')}>▥ &nbsp;Investigate Performance Drivers</button><button onClick={()=>go('mh.9c')}>⌖ &nbsp;View Territory Impact</button><button onClick={()=>go('mh.8a')}>▤ &nbsp;View Approved Playbook</button></div> : spec.code === 'MH.9B' ? <div className="mh-portfolio-actions"><button onClick={()=>go('mh.9a')}>← &nbsp;Back to Regional Programme</button><button onClick={()=>go('mh.9c')}>⌖ &nbsp;View Territory Impact</button><button onClick={()=>go('mh.8a')}>▤ &nbsp;View Source Evidence</button><button className="primary" onClick={()=>go('mh.9d')}><TrendingUp/>Request Campaign Optimization Review</button></div> : null}
      <div className="mh-next-footer"><button type="button" onClick={() => goBack(spec.code === 'MH.1' ? 'bh.1' : [...spec.crumbs].reverse().find((crumb) => crumb.to)?.to ?? 'mh.1')}><ArrowLeft size={14}/>Back</button></div>
    </MhPage>
  );
}
function S(spec: Spec) { return <Workspace {...spec} />; }
const C = {
  m1: [{ label: 'Marketing Overview' }],
  m2: [{ label: 'Market Opportunities' }],
  m3: [{ label: 'National Marketing Overview', to: 'mh.1' as ScreenId }, { label: 'West Region Opportunity', to: 'mh.2' as ScreenId }, { label: 'Business & Crop Plan Reviews' }],
  m3a: [{ label: 'Plan Reviews' }, { label: 'Regional Plan Detail' }],
  m3b: [{ label: 'Plan Reviews' }, { label: 'Territory Plan Detail' }],
  m4: [{ label: 'Campaign Planning' }],
  m4a: [{ label: 'Campaign Planning' }, { label: 'Why Farmers Are Not Converting' }],
  m4i2: [{ label: 'Campaign Planning' }, { label: 'Farmer Conversion Investigation' }, { label: 'Farmer Conversion Results' }],
  m4i3: [{ label: 'Campaign Planning' }, { label: 'Farmer Conversion Investigation' }, { label: 'Evidence Tracking' }],
  m4i4: [{ label: 'Campaign Planning' }, { label: 'Updated Findings' }],
  m4b: [{ label: 'Campaign Planning' }, { label: 'Shortlist Campaigns' }],
  m5: [{ label: 'Campaign Planning' }, { label: 'Campaign Brief' }],
  m6: [{ label: 'Campaign Planning' }, { label: 'Mix, Budget & Calendar' }],
  m7: [{ label: 'Campaign Planning' }, { label: 'Campaign Portfolio Review' }],
  m7a: [{ label: 'Campaign Planning' }, { label: 'Proposal & Business Case' }],
  m7b: [{ label: 'Campaign Planning' }, { label: 'Exceptions & Conditional Approval' }],
  m8: [{ label: 'Approvals & Rollout' }],
  m8a: [{ label: 'Approvals & Rollout' }, { label: 'Release to Territories' }],
  m9: [{ label: 'Performance & Learnings' }],
  m9a: [{ label: 'Performance & Learnings' }, { label: 'Regional Performance' }],
  m9b: [{ label: 'Performance & Learnings' }, { label: 'What Is Driving Results' }],
  m9c: [{ label: 'Performance & Learnings' }, { label: 'Territory Results' }],
  m9d: [{ label: 'Performance & Learnings' }, { label: 'Request Campaign Changes' }],
  ai: [{ label: 'AI Copilot' }],
};
const CORE_ROWS: [string, string][] = [
  ['Where to look first', 'West Region is 6 pp behind its execution plan.'],
  ['Before approving', 'Check stock readiness and consent conditions on each campaign.'],
  ['Reading the results', 'Figures are observed results; causes are not yet verified.'],
];
const SCREEN_METRICS: Record<string, [string, string, string?][]> = {
  'MH.1': [['Addressable market opportunity', 'INR 1,250-1,450 Cr'], ['Sales momentum in priority markets', '+12-16%'], ['Historical campaign effectiveness', '+1.8-2.6x']],
  'MH.2': [['Addressable crop market','INR 7-10 Cr'],['Relative penetration','14-18%'],['Quarterly sales momentum','+14%'],['Data confidence','Moderate','amber']],
  'MH.3': [['Plans for review','12'],['Regional plans submitted','8'],['Awaiting decision','4','amber']],
  'MH.3A': [['Territory ABP (All Products)','₹4.20 Cr'],['Approved Onion Allocation (All Products)','₹1.90 Cr'],['Onion Conversion Growth Objective','₹25 L']],
  'MH.3B': [['Region','West'],['Crop','Onion'],['Product','Croptek'],['Review status','Pending','amber']],
  'MH.4': [['Eligible farmers','1,200'],['Farmers reached','780'],['Trial to purchase','36%']],
  'MH.4A': [['Addressable market','INR 7-10 Cr'],['Penetration','14-18%'],['Sales momentum','+14%'],['Evidence confidence','Mixed','amber']],
  'MH.4A-I2': [['Eligible farmers','1,200'],['Reached','780'],['Trials','150'],['Purchases','Not measurable','amber']],
  'MH.4A-I3': [['Evidence requests','3'],['Validated','0'],['Awaiting response','2','amber'],['Partially received','1','amber']],
  'MH.4A-I4': [['Eligible farmers','1,200'],['Reached','780'],['Purchases','54'],['Trial to purchase','36%']],
  'MH.4B': [['Campaign recommendations','3'],['Priority theme','Croptek Conversion'],['Evidence confidence','Medium','amber']],
  'MH.5': [['Strategic theme','Croptek Conversion'],['Priority market','Maharashtra / Onion'],['Assignment status','Ready to assign']],
  'MH.6': [['Themes assigned','3'],['PM assessments','1'],['Proposals received','0','amber']],
  'MH.7': [['Proposals received','2'],['Preferred proposal','Retailer-led conversion'],['Marketing review','Pending','amber']],
  'MH.7A': [['Proposed investment','INR 12 L'],['Forecast sales','INR 48 L'],['Margin assumption','35%'],['Net ROI','+0.40x','amber']],
  'MH.7B': [['Conditions open','3','amber'],['Validation owner','Zonal Manager'],['Decision','Pending','amber']],
  'MH.8': [['Campaign budget','INR 12 L'],['Forecast contribution','INR 16.8 L'],['Approval status','Pre-approval','amber'],['Rollout','Locked','amber']],
  'MH.8A': [['Recommendations published','12'],['Local plans submitted','8'],['Plans approved','6'],['Campaigns running','4']],
  'MH.9': [['Programme Rollout Progress','72%'],['Verified Engagement / Adoption','532'],['Commercial Effectiveness','Pending Attribution','amber']],
  'MH.9A': [['Programme Execution (Observed)','72%'],['Planned at Checkpoint','80%'],['Variance','-8 pp','amber']],
  'MH.9B': [['Planned execution','80%'],['Observed execution','72%'],['Variance','-8 pp','amber']],
  'MH.9C': [['Selected territory','Ambad, Jalna'],['Execution','72% / 80%'],['Impact evidence','Partial','amber']],
  'MH.9D': [['Request status','Draft / Not Sent','amber'],['Review owner','Zonal Manager'],['Evidence links','3']],
};
const SCREEN_INSIGHTS: Record<string, [string, string][]> = {
  'MH.2': [['Opportunity insight','Positive sales momentum with low indicative penetration suggests headroom; root causes remain unconfirmed.'],['Priority focus','Validate Croptek in Onion for Maharashtra before expanding to other crop-region pairs.'],['Decision state','Recommendations only - not yet approved.']],
  'MH.3': [['Plan review priority','Check crop-plan fit, source evidence and requested interventions together.'],['Open validation','Regional and territory assumptions remain under review.'],['Next decision','Resolve plan gaps before assigning new themes.']],
  'MH.3A': [['Marketing opportunity','Ambad and Dhanora contribute the visible Jalna opportunity in the submitted plan.'],['Key validation','Demo stock and retailer readiness still need confirmation.'],['Review status','Plan alignment review is in progress.']],
  'MH.3B': [['Intervention insight','The regional intervention mix should reflect crop plan and territory evidence.'],['Key questions','Validate local readiness, intervention feasibility and owner assignment.'],['Recommendation','Proceed to strategy planning after pending evidence checks.']],
  'MH.4': [['Investigation signal','The farmer funnel narrows from 1,200 eligible farmers to 54 recorded purchases.'],['Evidence gap','Retailer recommendation and stock records are not fully validated.'],['Recommended next','Request missing evidence before selecting a campaign theme.']],
  'MH.4A': [['Diagnostic insight','Positive sales momentum alongside low indicative penetration suggests growth headroom.'],['Cause confidence','Awareness, conversion and channel barriers remain hypotheses.'],['Recommended next','Request further analysis and validate source evidence.']],
  'MH.4A-I2': [['Investigation finding','Available outreach and trial records support partial funnel analysis; reliable purchase linkage is missing.'],['Cause confidence','Awareness and channel evidence are incomplete; the primary cause remains unconfirmed.'],['Recommended next','Request missing evidence before updating campaign recommendations.']],
  'MH.4A-I3': [['Request status','Evidence requests are staged with owner and due-date details.'],['Validation rule','Keep submitted, partial and verified evidence distinct.'],['Recommended next','Review accepted evidence and update the investigation.']],
  'MH.4A-I4': [['Updated diagnosis','Validated counts narrow uncertainty; remaining channel causes are not established.'],['Growth assessment','Keep awareness, retailer advocacy and stock as separate hypotheses.'],['Recommended next','Use these findings to assess campaign recommendations.']],
  'MH.4B': [['Conversion campaign theme','Prioritize high-opportunity, under-indexed products with an evidence-backed farmer funnel.'],['Retailer advocacy','Improve recommendation and availability where channel evidence supports it.'],['Approval status','These recommendations are not yet approved.']],
  'MH.5': [['Strategic theme','Croptek Conversion for Maharashtra Onion.'],['PM deliverables','Campaign proposal, business case, validation plan and local execution controls.'],['Handoff','Marketing Head assigns the theme; Zonal Manager develops the proposal.']],
  'MH.6': [['Current assignment','Croptek Conversion is assigned to the Crop Nutrition Zonal Manager.'],['Development state','Assessment and proposal work are tracked separately.'],['Management action','Track owner, due date and validation blockers.']],
  'MH.7': [['Comparison focus','Compare audience, intervention, forecast assumptions and evidence coverage.'],['Submission state','Both proposals are submitted for Marketing Head review.'],['Decision','Review proposal detail before recording a decision.']],
  'MH.7A': [['Business case','Forecast ROI is sensitive to sales attribution and conversion assumptions.'],['Validation needed','Product applicability, claims, retailer participation and forecasts require review.'],['Decision state','Submitted by PM; not approved.']],
  'MH.7B': [['Approval conditions','Stock confirmation and consent logs remain open controls.'],['Owner action','Record an owner and evidence for every condition.'],['Governance','Conditional approval does not bypass outstanding checks.']],
  'MH.8': [['Approval gate','Commercial and technical validation must be completed before authorization.'],['Current state','Approval cannot be completed yet.'],['Next action','Resolve checks or return the proposal to the PM.']],
  'MH.8A': [['Rollout readiness','Recommendations move to territories after plan eligibility and local validation.'],['Execution control','Field Sales Managers own local plans and field execution.'],['Approved playbook','Use agreed audience, activity and evidence controls.']],
  'MH.9': [['Portfolio insight','Retailer-led activation is ahead of the other displayed intervention themes.'],['Attribution','Commercial impact is still pending attribution.'],['Recommended next','Inspect the regional programme and its driver evidence.']],
  'MH.9A': [['Programme rollout','Eight local plans are submitted, six approved and four running.'],['Observed gap','Execution is 72% against an 80% planned checkpoint.'],['Recommended next','Investigate workflow drivers before requesting changes.']],
  'MH.9B': [['Performance diagnosis','Local activation is an observed workflow gap; causal drivers remain incomplete.'],['Evidence needed','Retailer participation, field follow-up and stock records.'],['Recommended next','Request optimization only when evidence warrants it.']],
  'MH.9C': [['Territory owner','Marketing Head inspects results; Field Sales Manager owns local corrective action.'],['Evidence','Execution is below plan and attribution is partial.'],['Available actions','Open campaign impact or request territory clarification.']],
  'MH.9D': [['Optimization request','The observed execution gap is linked to regional and territory evidence.'],['PM deliverable','Revised campaign proposal and business case if assumptions materially change.'],['Status','Draft only - no request has been sent.']],
};
function make(code: string, title: string, subtitle: string, crumbs: { label: string; to?: ScreenId }[], next: { label: string; to: ScreenId } | undefined, metric3: string) {
  title = MH_SCREENS.find((screen) => screen.code === code)?.title ?? title;
  return {
    code,
    title,
    subtitle,
    crumbs,
    next,
    metrics: SCREEN_METRICS[code] ?? [['Region / scope', code.startsWith('MH.9') ? 'West Region' : 'West Region'], ['Workflow status', 'In review'], ['Attention required', metric3, 'amber']],
    insight: SCREEN_INSIGHTS[code] ?? CORE_ROWS,
  } as Spec;
}
export function Mh1() {
  const spec = make('MH.1', 'Marketing Overview', 'A strategic national view of market opportunity, product sales performance and past campaign impact to shape high-impact marketing for FY 2025-26.', C.m1, { label: 'Explore Regional Opportunity & Sales Trends', to: 'mh.2' }, '3 regional watchouts');
  spec.insight = [['Conversion Campaign Theme', 'Accelerate uptake of high-opportunity products such as Croptek in Onion and Maize.'], ['Retailer Activation Theme', 'Strengthen product pull and availability in high-opportunity regions.'], ['Awareness & Consideration Theme', 'Build salience in emerging and under-indexed regions.']];
  return S(spec);
}
export function Mh2() { return S(make('MH.2', 'Market Opportunities by Region', 'West region opportunity stack with product-cluster context', C.m2, { label: 'Proceed to Plan Reviews', to: 'mh.3' }, 'High-priority pockets: 3')); }
export function Mh3() { return S(make('MH.3', 'Business & Crop Plan Alignment Review', 'Assess regional business and crop plans, Zonal Manager reviews and marketing intervention needs against the identified market opportunity.', C.m3, { label: 'Identify Campaign Opportunities', to: 'mh.4' }, 'Conditional plans: 4')); }
export function Mh3a() { return S(make('MH.3A', 'Regional Plan Detail', 'Regional intervention quality and business-case consistency', C.m3a, { label: 'Open Territory Contribution', to: 'mh.3b' }, 'Conditional interventions: 2')); }
export function Mh3b() { return S(make('MH.3B', 'Territory Plan Detail', 'Ambad/Ghansawangi/Badnapur contribution audit', C.m3b, { label: 'Move to Campaign Planning', to: 'mh.4' }, 'Critical assumptions: 5')); }
export function Mh4() { return S(make('MH.4', 'Campaign Ideas', 'Candidate campaign themes ranked by strategic fit', C.m4, { label: 'Investigate Barriers', to: 'mh.4a' }, 'Top recommendations: 3')); }
export function Mh4a() { return S(make('MH.4A', 'Why Farmers Are Not Converting', 'Layered diagnostics for conversion frictions', C.m4a, { label: 'Open Regional Barrier Lens', to: 'mh.4a-i2' }, 'Unverified barriers: 2')); }
export function Mh4aI2() { return S(make('MH.4A-I2', 'Farmer Conversion Investigation Results', 'Maharashtra / Onion / Croptek · illustrative pilot subset', C.m4i2, { label: 'Request Missing Evidence', to: 'mh.4a-i3' }, 'Evidence incomplete')); }
export function Mh4aI3() { return S(make('MH.4A-I3', 'Evidence Request Tracking & Validation', 'Maharashtra / Onion / Croptek · hypothetical future workflow', C.m4i3, { label: 'Updated Investigation Results', to: 'mh.4a-i4' }, 'Evidence items: 3')); }
export function Mh4aI4() { return S(make('MH.4A-I4', 'Conversion Barriers: Updated Findings', 'Consolidated evidence after territory validation', C.m4i4, { label: 'Refresh Recommendations', to: 'mh.4b' }, 'Outstanding unknowns: 1')); }
export function Mh4b() { return S(make('MH.4B', 'Shortlist Campaigns', 'Prioritized campaign set with revised evidence', C.m4b, { label: 'Build Strategy Brief', to: 'mh.5' }, 'Selected campaigns: 3')); }
export function Mh5() { return S(make('MH.5', 'Campaign Brief', 'Formal strategy brief with governance thresholds', C.m5, { label: 'Open Mix & Budget', to: 'mh.6' }, 'Open strategy questions: 2')); }
export function Mh6() { return S(make('MH.6', 'Campaign Mix, Budget & Calendar', 'Resource phasing by campaign theme and readiness', C.m6, { label: 'Review Portfolio', to: 'mh.7' }, 'Unallocated buffer: ₹0.3 Cr')); }
export function Mh7() { return S(make('MH.7', 'Campaign Portfolio Review', 'Final strategic quality gate before sign-off', C.m7, { label: 'Open Proposal Detail', to: 'mh.7a' }, 'Refinement items: 3')); }
export function Mh7a() { return S(make('MH.7A', 'Proposal & Business Case', 'Evidence-linked proposal assessment', C.m7a, { label: 'Open Exception Review', to: 'mh.7b' }, 'Open concerns: 2')); }
export function Mh7b() { return S(make('MH.7B', 'Exceptions & Conditional Approval', 'Resolve conditions and define control gates', C.m7b, { label: 'Move to Approvals Inbox', to: 'mh.8' }, 'Pending authorization: 2')); }
export function Mh8() { return S(make('MH.8', 'Approvals & Rollout', 'Finalize approvals and release sequencing', C.m8, { label: 'Release Approved Recommendations', to: 'mh.8a' }, 'Conditional requests: 4')); }
export function Mh8a() { return S(make('MH.8A', 'Release to Territories', 'Controlled release to Field Sales Managers', C.m8a, { label: 'Open Portfolio Performance', to: 'mh.9' }, 'Conditional releases: 3')); }
export function Mh9() { return S(make('MH.9', 'National & Regional Campaign Portfolio Performance', 'Portfolio rollout, verified adoption and commercial effectiveness across active campaigns', C.m9, { label: 'View Regional Programme', to: 'mh.9a' }, 'At-risk programmes: 2')); }
export function Mh9a() { return S(make('MH.9A', 'Regional Performance', 'West region programme performance with source references', C.m9a, { label: 'Investigate Drivers', to: 'mh.9b' }, 'Regional execution gap: 8 pp')); }
export function Mh9b() { return S(make('MH.9B', 'What Is Driving Results', 'Observed workflow gaps vs unverified causal hypotheses', C.m9b, { label: 'View Territory Impact', to: 'mh.9c' }, 'Unverified drivers: 3')); }
export function Mh9c() {
  const { go } = useNav();
  return <MhPage crumbs={C.m9c} code="MH.9C" title="Territory Campaign Impact Explorer" subtitle="Inspect local execution, adoption evidence and commercial impact for the selected territory">
    <div className="mh-territory-impact-layout">
      <main className="mh-territory-impact-main">
        <div className="mh-brief-meta"><span><MapPin/>Selected Territory<b>Ambad, Jalna</b></span><span><Sprout/>Campaign Theme<b>Croptek Conversion</b></span><span><Megaphone/>Programme<b>Retailer-Led Activation</b></span><span><CalendarDays/>Period<b>FY 2025?26</b></span></div>
        <div className="mh-plan-kpis"><span><Activity/><small>Execution</small><b>72%</b></span><span><Target/><small>Planned checkpoint</small><b>80%</b></span><span><TrendingUp/><small>Variance</small><b className="pending">?8 pp</b></span><span><Users/><small>Verified engagement</small><b>532 farmers</b></span></div>
        <section className="mh-section"><h2><BarChart3/>Territory Execution &amp; Outcome Signals</h2><div className="mh-impact-bars">{[['Plan completion',80,72],['Farmer follow-up',70,48],['Retailer activation',75,67],['Documented trials',65,54]].map(([label,plan,actual])=><div key={String(label)}><b>{label}</b><span><i style={{width:`${plan}%`}}/><em style={{width:`${actual}%`}}/></span><small>{actual}% / {plan}%</small></div>)}</div></section>
        <section className="mh-section"><h2><Layers3/>Local Campaign Impact</h2><div className="mh-report-table-wrap"><table className="mh-report-table"><thead><tr><th>Village / Cluster</th><th>Eligible Farmers</th><th>Reached</th><th>Trials</th><th>Adoption Evidence</th><th>Signal</th></tr></thead><tbody>{[['Dhanora','420','310','74','Partial farmer linkage','Follow-up gap'],['Wadi Gaon','280','190','38','Awaiting validation','Coverage gap'],['Ambad HQ','310','205','24','Retailer records only','Evidence incomplete'],['Other villages','190','75','14','Not available','Needs review']].map(r=><tr key={r[0]}><td><b>{r[0]}</b></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td>{r[4]}</td><td><span className="mh-plan-status pending">{r[5]}</span></td></tr>)}</tbody></table></div><p className="mh-inline-note"><Info/>Territory figures are illustrative; they show execution and evidence coverage and do not establish causal sales attribution.</p></section>
      </main>
      <aside className="mh-territory-impact-rail"><section className="mh-section"><h2><Sparkles/>Territory Impact Insight</h2><p>Execution is below the checkpoint, with the largest visible gap in farmer follow-up. Available attribution is incomplete, so local sales impact remains unconfirmed.</p><h3>Recommended review</h3><ul><li>Validate reach and follow-up records.</li><li>Confirm retailer participation and stock continuity.</li><li>Compare purchases only after farmer-level linkage.</li></ul><button className="mh-explore" onClick={()=>go('mh.9d')}>Request Optimization Review <ArrowRight/></button></section><section className="mh-section"><h2><Database/>Source &amp; Governance</h2><p>Approved campaign playbook ? local territory records ? illustrative pilot evidence.</p><p>Marketing Head reviews performance; Field Sales Manager owns local corrective action.</p></section></aside>
    </div>
    <div className="mh-custom-actions"><button onClick={()=>go('mh.9b')}>Back to Performance Drivers</button><button onClick={()=>go('mh.8a')}>Open Approved Playbook</button><button className="primary" onClick={()=>go('mh.9d')}>Request Campaign Optimization Review <ArrowRight/></button></div>
  </MhPage>;
}
export function Mh9d() {
  const { go } = useNav();
  return <MhPage crumbs={C.m9d} code="MH.9D" title="Regional Campaign Performance Driver Diagnostics" subtitle="Croptek Conversion ? Retailer-Led Croptek Conversion ? West Region">
    <div className="mh-optimization-overlay-layout">
      <main className="mh-optimization-background">
        <div className="mh-plan-kpis"><span><CalendarDays/><small>Planned Execution</small><b>80%</b></span><span><Target/><small>Observed Execution</small><b>72%</b></span><span><Activity/><small>Variance</small><b className="pending">?8 pp</b></span></div>
        <section className="mh-section"><h2><Layers3/>Programme Stage Progress</h2><div className="mh-stage-track"><div className="mh-stage-step green"><Megaphone/><div><b>Recommendations Published</b><strong>12</strong></div></div><div className="mh-stage-step lime"><FileText/><div><b>Local Plans Submitted</b><strong>8</strong></div></div><div className="mh-stage-step amber"><CheckCircle2/><div><b>Local Plans Approved</b><strong>6</strong></div></div></div></section>
        <section className="mh-section"><h2><Activity/>Performance Driver Assessment</h2><div className="mh-barrier-line"><b>Local activation (plan ? run)</b><span>Workflow gap observed</span><em>Slower activation</em></div><div className="mh-barrier-line"><b>Retailer engagement</b><span>Evidence incomplete</span><em>Validate</em></div><div className="mh-barrier-line"><b>Field follow-up</b><span>Evidence incomplete</span><em>Validate</em></div><div className="mh-barrier-line"><b>Stock availability</b><span>Not verified</span><em>Check source</em></div></section>
        <div className="mh-custom-actions"><button onClick={()=>go('mh.9a')}>Back to Regional Programme</button><button onClick={()=>go('mh.9c')}>View Territory Impact</button></div>
      </main>
      <aside className="mh-optimization-drawer"><button className="mh-drawer-close" onClick={()=>go('mh.9b')}>?</button><h2><PencilLine/>Campaign Optimization Review Request</h2><div className="mh-brief-meta"><span><MapPin/>Scope<b>West Region</b></span><span><Sprout/>Theme<b>Croptek Conversion</b></span><span><Megaphone/>Campaign<b>Retailer-Led Croptek Conversion</b></span></div><div className="mh-workflow-note"><Info/>Execution is 72% versus planned 80%. Cause is not verified; submit an evidence-linked request for review.</div><label>Optimization Objective<textarea placeholder="Enter the strategic objective for campaign optimization"/></label><label>Linked Evidence<div className="mh-evidence-chips"><span><Link2/>MH.9B ? Regional Programme Diagnostics</span><span><Link2/>TM.IM2 ? Territory Diagnostics</span></div></label><fieldset><legend>Review Areas</legend>{['Audience','Intervention Mix','Timing','Channel Readiness','Resource Assumptions'].map(x=><label key={x}><input type="checkbox"/>{x}</label>)}</fieldset><label>Responsible Owner<select defaultValue="Crop Nutrition Zonal Manager"><option>Crop Nutrition Zonal Manager</option><option>Regional Marketing Manager</option></select></label><label>Due Date<input type="date"/></label><label>Comments<textarea placeholder="Add any additional context, focus or business considerations"/></label><div className="mh-request-deliverable"><FileText/><span>Requested Deliverable<b>Revised campaign proposal and updated business case if materially affected</b></span></div><div className="mh-handoff"><b>1 ? Draft</b><ArrowRight/>2 ? PM Revision<ArrowRight/>3 ? MH Reapproval<ArrowRight/>4 ? Controlled Release</div><div className="mh-custom-actions"><button onClick={()=>go('mh.9b')}>Back</button><button className="primary" onClick={()=>go('mh.9b')}>Save Draft Request</button></div></aside>
    </div>
  </MhPage>;
}
export function MhAi1() {
  const { go, toast } = useNav();
  return <MhPage crumbs={C.ai} code="MH.AI1" title="Strategic Marketing Copilot" subtitle="Decision support for campaign performance and regional execution">
    <div className="mh-ai-layout">
      <main className="mh-ai-conversation">
        <div className="mh-ai-question"><span className="mh-ai-user-icon"><Users/></span><strong>Why is farmer follow-up lagging retailer-led activation in West Region, and what should we change?</strong></div>
        <section className="mh-ai-answer">
          <div className="mh-ai-answer-title"><span><Sparkles/></span><div><strong>Farmer follow-up is further behind plan.</strong><p>Retailer-led is 8 pp behind plan, while farmer follow-up is 22 pp behind.</p></div></div>
          <div className="mh-ai-legend"><span><i className="mh-observed"/>Observed</span><span><i className="mh-planned"/>Planned</span></div>
          <div className="mh-ai-bars">
            <b>Retailer-led activation</b><div className="mh-ai-bar-pair"><div className="mh-ai-bar mh-observed" style={{width:'72%'}}><span>72%</span></div><div className="mh-ai-bar mh-planned" style={{width:'80%'}}><span>80%</span></div></div><em className="mh-gap-good">−8 pp</em>
            <b>Farmer follow-up</b><div className="mh-ai-bar-pair"><div className="mh-ai-bar mh-observed" style={{width:'48%'}}><span>48%</span></div><div className="mh-ai-bar mh-planned" style={{width:'70%'}}><span>70%</span></div></div><em className="mh-gap-bad">−22 pp</em>
          </div>
          <div className="mh-ai-warning"><Info/>Follow-up completion and farmer contact evidence are incomplete, limiting a clear root-cause diagnosis.</div>
        </section>
        <div className="mh-ai-suggest-label">Suggested questions</div>
        <div className="mh-ai-suggestions">{['Which themes should we scale?', 'Where are regional gaps?', 'What requires intervention?'].map(q=><button key={q} onClick={()=>toast(`Copilot question: ${q}`)}><MessageCircle/>{q}</button>)}</div>
        <button className="mh-ai-followup" onClick={()=>toast('Follow-up question input is ready')}><Sparkles/>Ask a follow-up question... <span><Send/></span></button>
      </main>
      <aside className="mh-ai-context">
        <section><h2><Target/>Context</h2><dl><dt>Theme</dt><dd>Croptek Conversion</dd><dt>Region</dt><dd>West</dd><dt>Reporting period</dt><dd>Jan – Mar 2026 (Illustrative)</dd></dl></section>
        <section><h2><CheckCircle2/>Next-Best Actions</h2><ol><li>Verify follow-up completion and field-owner coverage.</li><li>Validate trial cohort CRM contact records.</li><li>Request Zonal Manager campaign optimization proposal, if warranted.</li></ol></section>
        <section><h2><Layers3/>Source &amp; Evidence</h2><ul><li><Link2/>Portfolio Performance</li><li><Link2/>Territory Diagnostics</li><li><Link2/>Approved Campaign Playbook</li></ul></section>
      </aside>
    </div>
    <div className="mh-ai-footer"><button onClick={()=>go('mh.9')}><ArrowLeft/>Back to Portfolio</button><button onClick={()=>go('mh.9b')}><Activity/>Investigate Drivers</button><button onClick={()=>go('mh.9d')}><TrendingUp/>Request Campaign Optimization Review</button></div>
  </MhPage>;
}
