import { useEffect, useRef, useState, type ReactNode } from 'react';
import './ai.css';
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Info,
  Layers,
  Leaf,
  Link2,
  MapPin,
  MessageSquare,
  MessagesSquare,
  History,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  User,
  Users,
  Zap,
} from 'lucide-react';
import { useNav, type ScreenId } from '../nav';
import { Breadcrumbs, Btn, COLORS, PageHeader, Panel, Pill, cx, type Tone } from '../ui';
import { askCopilot, getCopilotStatus, type CopilotAnswer, type CopilotStatus } from '../data/copilot';

type AnswerId = 'dhanora' | 'underperforming' | 'priorities' | 'jalna' | 'strongest' | 'supply' | 'retailer' | 'fallback';
type Level = 'High' | 'Medium' | 'Low';

type Answer = {
  question: string;
  title: string;
  summary: string;
  table: { columns: string[]; rows: ReactNode[][]; highlight?: number };
  chart: { title: string; axis: string; max: number; bars: { label: string; value: number; display: string; low?: boolean }[] };
  factors: string[];
  confidence: { level: Level; text: string };
  sources: { label: string; to: ScreenId }[];
  actions: string[];
  primary: { label: string; to: ScreenId };
  secondary: { label: string; to: ScreenId };
};

const status = (label: string, tone: Tone) => <Pill tone={tone}>{label}</Pill>;

const ANSWERS: Record<AnswerId, Answer> = {
  dhanora: {
    question: 'Why is Croptek adoption low in Dhanora?',
    title: 'AI Analysis: Cluster Performance & Contributing Factors',
    summary: "Dhanora's trial-to-adoption conversion (32%) is significantly lower than Wadi Gaon (68%) and Ambad HQ (69%). Observed timing and stock issues likely contributed to weaker conversion; causal attribution not yet verified.",
    table: {
      columns: ['Cluster', 'Trials', 'Adopters', 'Trial-to-Adoption Conversion'],
      rows: [['Dhanora', 72, 23, '32%'], ['Wadi Gaon', 126, 86, '68%'], ['Ambad HQ', 108, 75, '69%']],
      highlight: 0,
    },
    chart: {
      title: 'Trial-to-Adoption Conversion by Cluster',
      axis: 'Conversion Rate',
      max: 80,
      bars: [{ label: 'Dhanora', value: 32, display: '32%', low: true }, { label: 'Wadi Gaon', value: 68, display: '68%' }, { label: 'Ambad HQ', value: 69, display: '69%' }],
    },
    factors: ['Pending stock receipt in Dhanora.', 'Delayed demonstration plot activity.'],
    confidence: { level: 'Medium', text: 'Observed timing and stock issues likely contributed to weaker conversion; causal attribution not yet verified.' },
    sources: [{ label: 'From S5.2 Stock Readiness', to: 's5.2' }, { label: 'From S6.2 Activity Execution', to: 's6.2' }, { label: 'From S7.1 Impact Dashboard', to: 's7.1' }],
    actions: [
      'Prioritize stock validation for Croptek in Dhanora and confirm receipt timeline.',
      'Complete the delayed demonstration plot activity in Dhanora at the earliest.',
      'Assign targeted trial-user follow-up in Dhanora to drive adoption.',
    ],
    primary: { label: 'Create Corrective Action → S6.2', to: 's6.2' },
    secondary: { label: 'View Diagnostics → S7.2', to: 's7.2' },
  },
  underperforming: {
    question: 'Which campaigns are underperforming?',
    title: 'AI Analysis: Campaign Performance vs Plan',
    summary: 'Two of the four active Croptek onion workstreams in Ambad are behind plan. Conversion in Dhanora is at 58% of target (32% vs 55% planned) and retailer nutrition awareness has reached 41% of active retailers against a 60% plan. Wadi Gaon and Ambad HQ follow-up are ahead of plan.',
    table: {
      columns: ['Campaign / Cluster', 'Planned', 'Actual', 'Status'],
      rows: [
        ['Croptek Onion Conversion — Dhanora', '55% conversion', '32%', status('Underperforming', 'red')],
        ['Retailer Nutrition Awareness — Ambad', '60% of retailers', '41% (30 of 74)', status('Watch', 'amber')],
        ['Trial Follow-up — Wadi Gaon', '55% conversion', '68%', status('On track', 'green')],
        ['Trial Follow-up — Ambad HQ', '55% conversion', '69%', status('On track', 'green')],
      ],
      highlight: 0,
    },
    chart: {
      title: 'Attainment vs Plan',
      axis: 'Attainment %',
      max: 140,
      bars: [
        { label: 'Dhanora', value: 58, display: '58%', low: true },
        { label: 'Retailer Aw.', value: 68, display: '68%', low: true },
        { label: 'Wadi Gaon', value: 124, display: '124%' },
        { label: 'Ambad HQ', value: 125, display: '125%' },
      ],
    },
    factors: ['Croptek stock receipt pending in Dhanora (update Jan 12).', 'Retailer meetings delayed in Pimpalgaon and Other Villages.'],
    confidence: { level: 'Medium', text: 'Plan attainment is measured; drivers of the gap are inferred from execution logs and not yet verified.' },
    sources: [{ label: 'From S1.2 Portfolio Dashboard', to: 's1.2' }, { label: 'From S6.1 Control Tower', to: 's6.1' }, { label: 'From S7.1 Impact Dashboard', to: 's7.1' }],
    actions: [
      'Open a recovery plan for the Dhanora conversion workstream.',
      'Re-sequence retailer meetings, starting with the 18 high-influence retailers.',
      'Keep the Wadi Gaon and Ambad HQ follow-up cadence unchanged.',
    ],
    primary: { label: 'Open Recovery & Replanning → S1.5', to: 's1.5' },
    secondary: { label: 'View Diagnostics → S7.2', to: 's7.2' },
  },
  priorities: {
    question: 'What should I prioritize this week?',
    title: 'AI Analysis: Weekly Priorities — Ambad / Jalna',
    summary: 'Four actions carry the most adoption risk this week. Onion bulb initiation is ~6–9 days away (S3.1), so stock validation and the delayed demo plots in Dhanora should be resolved first, followed by trial-user follow-up and retailer briefings.',
    table: {
      columns: ['#', 'Priority Action', 'Owner', 'Due'],
      rows: [
        [1, 'Validate Croptek stock receipt in Dhanora', 'Channel Manager', 'Mon'],
        [2, 'Complete delayed demonstration plot activity', 'R. Jadhav', 'Wed'],
        [3, 'Follow up ~49 trial farmers in Dhanora', 'Field Team', 'Thu'],
        [4, 'Brief 18 high-influence retailers before bulb initiation', 'Area Sales', 'Fri'],
      ],
      highlight: 0,
    },
    chart: {
      title: 'Farmers Influenced by Action (est.)',
      axis: 'Farmers',
      max: 160,
      bars: [
        { label: 'Stock', value: 72, display: '72' },
        { label: 'Demo plots', value: 60, display: '60' },
        { label: 'Follow-up', value: 49, display: '49' },
        { label: 'Retailers', value: 140, display: '140' },
      ],
    },
    factors: ['Bulb-initiation window opens ~Feb 21 (illustrative).', 'Demonstration plot activity is ~7 days behind plan.'],
    confidence: { level: 'High', text: 'Priorities follow recorded plan delays and the crop-stage calendar; impact estimates are illustrative.' },
    sources: [{ label: 'From S3.1 Crop Calendar', to: 's3.1' }, { label: 'From S6.2 Activity Execution', to: 's6.2' }, { label: 'From S5.2 Stock Readiness', to: 's5.2' }],
    actions: [
      'Confirm stock receipt with the channel manager by Monday.',
      'Reschedule demonstration plot activity with R. Jadhav.',
      'Assign trial-user follow-up (~49 farmers) to the field team.',
    ],
    primary: { label: 'Create Corrective Action → S6.2', to: 's6.2' },
    secondary: { label: 'Open Control Tower → S6.1', to: 's6.1' },
  },
  jalna: {
    question: 'Create an onion nutrition awareness campaign for Jalna',
    title: 'AI Draft: Onion Nutrition Awareness Campaign — Jalna',
    summary: 'Draft outline aligned to the bulb-initiation window (21 Feb – 4 Mar 2027). It targets conventional NPK onion farmers in Ambad/Jalna through farmer meetings, demo plots and retailer-led education. Product content stays subject to agronomy approval (S3.3); nothing is published automatically.',
    table: {
      columns: ['Element', 'Draft Recommendation'],
      rows: [
        ['Audience', '1,832 target farmers (conventional NPK onion growers)'],
        ['Activation window', 'Late Feb 2027 — bulb initiation (illustrative)'],
        ['Channels', 'Farmer meetings, demo plots, 18 high-influence retailers, WhatsApp advisory (consent required)'],
        ['Budget', '₹8.0 Lakh (illustrative)'],
        ['Programme', 'Croptek Onion Nutrition Programme — pending agronomy validation'],
      ],
    },
    chart: {
      title: 'Proposed Budget Split (₹ Lakh)',
      axis: '₹ Lakh',
      max: 3,
      bars: [
        { label: 'Meetings', value: 2.4, display: '₹2.4L' },
        { label: 'Demo plots', value: 2.2, display: '₹2.2L' },
        { label: 'Retailers', value: 2.0, display: '₹2.0L' },
        { label: 'Digital', value: 1.4, display: '₹1.4L' },
      ],
    },
    factors: ['Market opportunity of ~₹52 Lakh in Ambad (illustrative).', '43 MT supply gap should be closed before activation.'],
    confidence: { level: 'Medium', text: 'Audience and window are well supported; channel mix is a starting point and should be tested in the S4.4 Scenario Simulator.' },
    sources: [{ label: 'From S3.4 Trigger Engine', to: 's3.4' }, { label: 'From S2.5 Prioritization', to: 's2.5' }, { label: 'From S5.2 Stock Readiness', to: 's5.2' }],
    actions: [
      'Review the draft in the Campaign Creation Wizard.',
      'Confirm advisory content with agronomy before launch.',
      'Check stock coverage against 209 MT projected demand.',
    ],
    primary: { label: 'Open Campaign Wizard → S4.2', to: 's4.2' },
    secondary: { label: 'Simulate Scenario → S4.4', to: 's4.4' },
  },
  strongest: {
    question: 'Which activities delivered the strongest conversion?',
    title: 'AI Analysis: Activity Effectiveness — Croptek Onion Conversion',
    summary: 'Demonstration plots delivered the strongest conversion (47%), followed by retailer-led counselling (30%) and farmer meetings (28%). Digital advisory reached many farmers but converted least (22%). Attribution uses first recorded touchpoint and is indicative only.',
    table: {
      columns: ['Activity', 'Farmers Reached', 'Adopters', 'Conversion'],
      rows: [
        ['Demonstration plots', 210, 98, '47%'],
        ['Retailer-led counselling', 520, 158, '30%'],
        ['Farmer meetings', 640, 176, '28%'],
        ['Digital advisory', 462, 100, '22%'],
        [<strong key="t">Total</strong>, <strong key="r">1,832</strong>, <strong key="a">532</strong>, <strong key="c">29%</strong>],
      ],
      highlight: 0,
    },
    chart: {
      title: 'Conversion by Activity',
      axis: 'Conversion Rate',
      max: 60,
      bars: [
        { label: 'Demo plots', value: 47, display: '47%' },
        { label: 'Retailer-led', value: 30, display: '30%' },
        { label: 'Meetings', value: 28, display: '28%' },
        { label: 'Digital', value: 22, display: '22%', low: true },
      ],
    },
    factors: ['Demo plots concentrated in Wadi Gaon and Ambad HQ.', 'Digital advisory lacked follow-up field visits.'],
    confidence: { level: 'Medium', text: 'Single-touch attribution; farmers often see multiple activities, so effects overlap.' },
    sources: [{ label: 'From S7.1 Impact Dashboard', to: 's7.1' }, { label: 'From S7.2 Diagnostics', to: 's7.2' }, { label: 'From S4.3 Activity Mix', to: 's4.3' }],
    actions: [
      'Shift part of the digital budget to demo plots in Dhanora.',
      'Pair digital advisory with retailer follow-up.',
      'Capture multi-touch data for the next review.',
    ],
    primary: { label: 'View Diagnostics → S7.2', to: 's7.2' },
    secondary: { label: 'Adjust Activity Mix → S4.3', to: 's4.3' },
  },
  supply: {
    question: 'What is the Croptek supply gap in Ambad?',
    title: 'AI Analysis: Demand vs Supply — Croptek, Ambad',
    summary: 'Projected Croptek demand for the campaign is 209 MT against 166 MT of confirmed supply — a gap of 43 MT (~21%). Dhanora is most exposed because its stock receipt is still pending (Jan 12 update).',
    table: {
      columns: ['Metric', 'Value', 'Note'],
      rows: [
        ['Projected demand', '209 MT', 'From 532 projected adopters'],
        ['Confirmed supply', '166 MT', 'Dhanora receipt pending'],
        ['Supply gap', '43 MT', status('~21% of demand', 'red')],
        ['Active retailers', '74', '18 high-influence'],
      ],
      highlight: 2,
    },
    chart: {
      title: 'Demand vs Supply (MT)',
      axis: 'MT',
      max: 240,
      bars: [
        { label: 'Demand', value: 209, display: '209' },
        { label: 'Supply', value: 166, display: '166' },
        { label: 'Gap', value: 43, display: '43', low: true },
      ],
    },
    factors: ['Stock receipt pending in Dhanora.', 'Replenishment lead time not yet confirmed.'],
    confidence: { level: 'High', text: 'Demand and stock positions come from S5.1/S5.2; the timing of replenishment remains uncertain.' },
    sources: [{ label: 'From S5.1 Demand Projection', to: 's5.1' }, { label: 'From S5.2 Stock Readiness', to: 's5.2' }, { label: 'From S5.4 Replenishment', to: 's5.4' }],
    actions: [
      'Raise a replenishment request for 43 MT.',
      'Prioritize allocation to Dhanora retailers.',
      'Confirm dispatch dates before bulb initiation.',
    ],
    primary: { label: 'Plan Replenishment → S5.4', to: 's5.4' },
    secondary: { label: 'Stock Readiness → S5.2', to: 's5.2' },
  },
  retailer: {
    question: 'How ready are retailers for the Croptek campaign?',
    title: 'AI Analysis: Retailer Readiness — Ambad',
    summary: 'Of 74 active retailers, 18 are high-influence and 14 of them (78%) are campaign-ready. Readiness across the other 56 retailers is lower at 55% (31 of 56), mainly due to stock and POS material gaps.',
    table: {
      columns: ['Segment', 'Retailers', 'Ready', 'Readiness'],
      rows: [
        ['High-influence retailers', 18, 14, '78%'],
        ['Other active retailers', 56, 31, '55%'],
        [<strong key="t">Total</strong>, <strong key="r">74</strong>, <strong key="a">45</strong>, <strong key="c">61%</strong>],
      ],
      highlight: 1,
    },
    chart: {
      title: 'Retailer Readiness (%)',
      axis: 'Readiness',
      max: 100,
      bars: [
        { label: 'High-influence', value: 78, display: '78%' },
        { label: 'Other active', value: 55, display: '55%', low: true },
        { label: 'Overall', value: 61, display: '61%' },
      ],
    },
    factors: ['POS material not yet delivered to 11 retailers.', 'Stock receipt pending at Dhanora retailers.'],
    confidence: { level: 'Medium', text: 'Readiness is self-reported in field visits; stock positions are verified only for high-influence retailers.' },
    sources: [{ label: 'From S5.3 Dealer Readiness', to: 's5.3' }, { label: 'From S2.4 Channel Intelligence', to: 's2.4' }, { label: 'From S5.2 Stock Readiness', to: 's5.2' }],
    actions: [
      'Dispatch POS kits to the 11 pending retailers.',
      'Confirm stock with Dhanora retailers.',
      'Schedule briefings for the 4 unready high-influence retailers.',
    ],
    primary: { label: 'Open Dealer Readiness → S5.3', to: 's5.3' },
    secondary: { label: 'Create Corrective Action → S6.2', to: 's6.2' },
  },
  fallback: {
    question: '',
    title: 'AI Response: Where to Look',
    summary: "This demo copilot couldn't match your question to a prepared analysis. Based on the current campaign context (Croptek Onion Conversion — Ambad, Jalna), these screens hold the most relevant evidence. Try asking about underperforming campaigns, weekly priorities, supply gap, retailer readiness or activity conversion.",
    table: {
      columns: ['Topic', 'Best Screen', 'Current Signal'],
      rows: [
        ['Campaign health', 'S1.1 Command Centre', status('In progress', 'green')],
        ['Crop timing', 'S3.1 Crop Nutrition Calendar', status('Bulb initiation in 6–9 days', 'amber')],
        ['Demand & stock', 'S5.2 Stock Readiness', status('43 MT gap', 'red')],
        ['Execution', 'S6.1 Control Tower', status('Demo plots delayed', 'amber')],
        ['Impact', 'S7.1 Impact Dashboard', status('532 adopters', 'green')],
      ],
    },
    chart: {
      title: 'Trial-to-Adoption Conversion by Cluster',
      axis: 'Conversion Rate',
      max: 80,
      bars: [{ label: 'Dhanora', value: 32, display: '32%', low: true }, { label: 'Wadi Gaon', value: 68, display: '68%' }, { label: 'Ambad HQ', value: 69, display: '69%' }],
    },
    factors: ['No prepared analysis matched the question keywords.'],
    confidence: { level: 'Low', text: 'Response is a navigation suggestion only, not an analysis.' },
    sources: [{ label: 'S1.1 Command Centre', to: 's1.1' }, { label: 'S5.2 Stock Readiness', to: 's5.2' }, { label: 'S7.1 Impact Dashboard', to: 's7.1' }],
    actions: ['Rephrase the question using a campaign, cluster or activity name.', 'Open the most relevant screen from the evidence sources above.'],
    primary: { label: 'Open Command Centre → S1.1', to: 's1.1' },
    secondary: { label: 'View Diagnostics → S7.2', to: 's7.2' },
  },
};

const MATCHERS: [RegExp, AnswerId][] = [
  [/underperform|lagging|behind plan|off track|worst/, 'underperforming'],
  [/priorit|this week|focus|to-?do|today/, 'priorities'],
  [/awareness|create .*campaign|campaign plan|plan .*jalna|draft .*campaign|new campaign/, 'jalna'],
  [/strongest|best|most effective|activit|channel mix|which .*work/, 'strongest'],
  [/dhanora|adoption.*low|low adoption|why .*adoption|conversion.*low/, 'dhanora'],
  [/supply|stock|gap|inventory|demand|replenish/, 'supply'],
  [/retailer|dealer|channel readiness|pos\b/, 'retailer'],
];

const matchAnswer = (text: string): AnswerId => {
  const query = text.toLowerCase();
  return MATCHERS.find(([pattern]) => pattern.test(query))?.[1] ?? 'fallback';
};

const SUGGESTED: { text: string; id: AnswerId }[] = [
  { text: 'Which campaigns are underperforming?', id: 'underperforming' },
  { text: 'What should I prioritize this week?', id: 'priorities' },
  { text: 'Create an onion nutrition awareness campaign for Jalna', id: 'jalna' },
  { text: 'Which activities delivered the strongest conversion?', id: 'strongest' },
];

type HistoryItem = { key: number; label: string; time: string; id: AnswerId; question: string; llm?: Answer };

const INITIAL_HISTORY: HistoryItem[] = [
  { key: 1, label: 'Supply gap in Ambad', time: 'Yesterday, 4:32 PM', id: 'supply', question: ANSWERS.supply.question },
  { key: 2, label: 'Low adoption in Dhanora', time: 'Jan 12, 10:17 AM', id: 'dhanora', question: ANSWERS.dhanora.question },
  { key: 3, label: 'Retailer readiness review', time: 'Jan 10, 3:20 PM', id: 'retailer', question: ANSWERS.retailer.question },
  { key: 4, label: 'Onion campaign plan for Jalna', time: 'Jan 8, 11:05 AM', id: 'jalna', question: ANSWERS.jalna.question },
];

const LEVEL_TONE: Record<Level, Tone> = { High: 'green', Medium: 'amber', Low: 'red' };

/** LLM answers arrive with string screen ids; the backend has already restricted them to real screens. */
const fromLlm = (answer: CopilotAnswer): Answer => ({
  ...answer,
  table: { columns: answer.table.columns, rows: answer.table.rows.map((row) => row.map((cell) => cell ?? '—')), highlight: answer.table.highlight ?? undefined },
  sources: answer.sources.map((source) => ({ label: source.label, to: source.to as ScreenId })),
  primary: { label: answer.primary.label, to: answer.primary.to as ScreenId },
  secondary: { label: answer.secondary.label, to: answer.secondary.to as ScreenId },
});

function ClusterChart({ chart }: { chart: Answer['chart'] }) {
  const ticks = 5;
  const height = 150;
  return (
    <div>
      <div className="ai1-chart-title">{chart.title}</div>
      <div className="ai1-chart" style={{ height }}>
        <div className="ai1-axis">
          {Array.from({ length: ticks + 1 }, (_, index) => {
            const value = (chart.max * (ticks - index)) / ticks;
            return <span key={index}>{Number.isInteger(value) ? value : value.toFixed(1)}</span>;
          })}
        </div>
        <div className="ai1-plot" style={{ marginBottom: 18 }} title={chart.axis}>
          {chart.bars.map((bar) => (
            <div className="ai1-bar-col" key={bar.label}>
              <b>{bar.display}</b>
              <div className="ai1-bar" style={{ height: `${(bar.value / chart.max) * (height - 40)}px`, background: bar.low ? COLORS.yellow : COLORS.green }} />
            </div>
          ))}
        </div>
      </div>
      <div className="ai1-bar-labels" style={{ marginTop: -16 }}>
        {chart.bars.map((bar) => <span key={bar.label}>{bar.label}</span>)}
      </div>
    </div>
  );
}

const SIGNALS: { title: string; sub: string; level: Level; icon: ReactNode }[] = [
  { title: 'Stock readiness risk in Dhanora', sub: 'Croptek stock receipt pending.', level: 'High', icon: <AlertTriangle size={16} color={COLORS.amber} /> },
  { title: 'Demonstration activity delay', sub: 'Demo plot activity behind plan by ~7 days.', level: 'Medium', icon: <AlertTriangle size={16} color={COLORS.amber} /> },
  { title: 'Field follow-up pending', sub: 'Trial-user follow-up not yet completed for ~49 farmers.', level: 'Medium', icon: <Info size={16} color={COLORS.green} /> },
];

const RECOMMENDED: { text: string; owner: string; icon: ReactNode }[] = [
  { text: 'Validate stock with channel manager and confirm receipt date.', owner: 'Channel Manager', icon: <Target size={16} /> },
  { text: 'Reschedule demonstration plot activity with R. Jadhav.', owner: 'R. Jadhav', icon: <CalendarDays size={16} /> },
  { text: 'Trigger follow-up list for trial farmers in Dhanora (≈49) and assign to field team.', owner: 'Field Team', icon: <Users size={16} /> },
];

export function CopilotWorkspace() {
  const { go, toast, scope, screen } = useNav();
  const [activeId, setActiveId] = useState<AnswerId>('dhanora');
  const [llmAnswer, setLlmAnswer] = useState<Answer | null>(null);
  const [copilot, setCopilot] = useState<CopilotStatus | null>(null);
  const [question, setQuestion] = useState(ANSWERS.dhanora.question);
  const [historyKey, setHistoryKey] = useState<number | null>(2);
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [assigned, setAssigned] = useState<number[]>([]);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => { getCopilotStatus().then(setCopilot).catch(() => setCopilot(null)); }, []);

  const llmMode = copilot?.mode === 'llm';
  const answer = llmAnswer ?? ANSWERS[activeId];

  const show = (id: AnswerId, text: string, key: number | null = null, llm: Answer | null = null) => {
    window.clearTimeout(timer.current);
    setQuestion(text);
    setHistoryKey(key);
    setThinking(true);
    timer.current = window.setTimeout(() => {
      setActiveId(id);
      setLlmAnswer(llm);
      setThinking(false);
    }, llm ? 0 : 450);
  };

  const ask = async (preset?: string) => {
    const text = (preset ?? input).trim();
    if (!text) return;
    const id = matchAnswer(text);
    const key = Date.now();
    const label = text.length > 34 ? `${text.slice(0, 32)}…` : text;
    setInput('');
    let llm: Answer | null = null;
    if (llmMode) {
      window.clearTimeout(timer.current);
      setQuestion(text);
      setHistoryKey(key);
      setThinking(true);
      try {
        const turns = history.slice(0, 3).reverse().map((item) => ({ role: 'user' as const, content: item.question }));
        const response = await askCopilot(text, scope, screen, turns);
        if (response.mode === 'llm' && response.answer) llm = fromLlm(response.answer);
      } catch (error) {
        toast(`Copilot LLM unavailable (${(error as Error).message}) - showing illustrative answer`);
      }
    }
    setHistory((current) => [{ key, label, time: 'Just now', id, question: text, llm: llm ?? undefined }, ...current].slice(0, 6));
    show(id, text, key, llm);
  };

  return (
    <div className="stack">
      <Breadcrumbs items={[{ label: 'Strategy Command Centre', to: 's1.1' }, { label: 'AI Copilot' }, { label: 'AI.1 — Intelligent Copilot Workspace' }]} />
      <PageHeader
        title="AI.1 — Intelligent Copilot Workspace"
        badge={<Pill tone="amber">Product-detailer Version 1</Pill>}
        subtitle="AI-powered campaign decision workspace for product-detailers to diagnose, prioritize, and take action with evidence from across CampaignIQ."
        actions={llmMode
          ? <Pill tone="green"><Sparkles size={12} /> LLM connected · {copilot?.model ?? copilot?.provider}</Pill>
          : <Pill tone="grey"><Sparkles size={12} /> Illustrative AI output — demo data</Pill>}
      />

      <div className="ai1-grid">
        {/* Left column */}
        <div className="stack">
          <Panel title="Suggested Questions" icon={<MessageSquare size={16} />} info>
            {SUGGESTED.map((item) => (
              <button
                type="button"
                key={item.id}
                className={cx('ai1-qbtn', activeId === item.id && question === item.text && 'active')}
                onClick={() => (llmMode ? void ask(item.text) : show(item.id, item.text))}
              >
                <MessagesSquare size={18} />
                <span>{item.text}</span>
              </button>
            ))}
          </Panel>
          <Panel
            title="Conversation History"
            icon={<History size={16} />}
            actions={<button type="button" className="ai1-linkbtn" onClick={() => toast(`${history.length} conversations in this workspace (demo)`)}>View All</button>}
          >
            {history.map((item) => (
              <button
                type="button"
                key={item.key}
                className={cx('ai1-hist', historyKey === item.key && 'active')}
                onClick={() => show(item.id, item.question, item.key, item.llm ?? null)}
              >
                <MessageSquare size={17} color={COLORS.dark} />
                <span><strong>{item.label}</strong><small>{item.time}</small></span>
                <span className="ai1-more">···</span>
              </button>
            ))}
          </Panel>
        </div>

        {/* Centre column */}
        <div className="stack">
          <div className="ai1-question"><User size={18} /><span>{question}</span></div>

          <Panel>
            <div className="ai1-analysis-head">
              <Sparkles size={18} color={COLORS.yellow} />
              <h3>{thinking ? 'Analysing evidence across CampaignIQ…' : answer.title}</h3>
            </div>
            {thinking ? (
              <p className="ai1-thinking">Reading S5.2, S6.2 and S7.1 signals for Croptek Onion Conversion — Ambad, Jalna…</p>
            ) : (
              <>
                <p className="ai1-summary">{answer.summary}</p>
                <div className="ai1-split">
                  <div className="table-wrap">
                    <table className="dt dt-compact">
                      <thead>
                        <tr>{answer.table.columns.map((column, index) => <th key={column} style={{ textAlign: index === 0 || index === 1 && answer.table.columns.length === 2 ? 'left' : 'center' }}>{column}</th>)}</tr>
                      </thead>
                      <tbody>
                        {answer.table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex} className={cx(answer.table.highlight === rowIndex && 'row-highlight')}>
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} style={{ textAlign: cellIndex === 0 || answer.table.columns.length === 2 ? 'left' : 'center', fontWeight: cellIndex === 0 ? 600 : undefined }}>{cell}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <ClusterChart chart={answer.chart} />
                </div>
              </>
            )}
          </Panel>

          {!thinking && (
            <>
              <div className="ai1-split">
                <Panel title="Documented Factors" icon={<ClipboardList size={16} />}>
                  <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, display: 'grid', gap: 4 }}>
                    {answer.factors.map((factor, index) => <li key={index}>{factor}</li>)}
                  </ul>
                </Panel>
                <Panel title="Confidence & Uncertainty" icon={<Info size={16} />} actions={<Pill tone={LEVEL_TONE[answer.confidence.level]}>{answer.confidence.level}</Pill>}>
                  <div className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-start', fontSize: 12 }}>
                    <AlertTriangle size={16} color={COLORS.amber} style={{ flexShrink: 0 }} />
                    <span>{answer.confidence.text}</span>
                  </div>
                </Panel>
              </div>

              <Panel title="Evidence Sources (Cross-Module)" icon={<Link2 size={16} />}>
                <div className="ai1-sources">
                  {answer.sources.map((source, index) => (
                    <button type="button" key={index} className="ai1-source" onClick={() => go(source.to)}>
                      <Layers size={14} color={COLORS.green} />
                      {source.label}
                      <ExternalLink size={12} />
                    </button>
                  ))}
                </div>
              </Panel>

              <Panel title="Next-Best Actions" icon={<Target size={16} />}>
                <div className="ai1-nba">
                  {answer.actions.map((action, index) => (
                    <div key={index}><span className="num">{index + 1}</span><span>{action}</span></div>
                  ))}
                </div>
              </Panel>

              <div className="ai1-cta">
                <Btn variant="primary" to={answer.primary.to} icon={<Zap size={14} />}>{answer.primary.label}</Btn>
                <Btn variant="outline" to={answer.secondary.to} icon={<BarChart3 size={14} />}>{answer.secondary.label}</Btn>
              </div>
            </>
          )}

          <Panel>
            <form
              className="ai1-ask"
              onSubmit={(event) => {
                event.preventDefault();
                void ask();
              }}
            >
              <Sparkles size={16} color={COLORS.green} />
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the copilot about campaigns, clusters, stock, retailers or activities…"
                aria-label="Ask the copilot"
              />
              <Btn variant="primary" icon={<Send size={14} />} onClick={() => void ask()} disabled={!input.trim()}>Ask</Btn>
            </form>
            <p className="small muted" style={{ margin: '6px 0 0' }}>
              {llmMode
                ? 'Answers are generated by the configured LLM from CampaignIQ data in the current filter scope. Verify before acting.'
                : 'Illustrative demo: answers are pre-prepared and matched by keywords; all figures are illustrative. Connect an LLM in Data Sources & Integrations.'}
            </p>
          </Panel>
        </div>

        {/* Right column */}
        <div className="stack">
          <Panel title="Campaign Pulse" icon={<Leaf size={16} />}>
            <div className="small" style={{ fontWeight: 700, color: COLORS.dark, marginBottom: 8 }}>Croptek Onion Conversion — Ambad, Jalna</div>
            <div className="ai1-pulse">
              <Target size={14} /><span className="muted">Campaign Status</span><span><Pill tone="green">In Progress</Pill></span>
              <MapPin size={14} /><span className="muted">Affected Cluster</span><strong>Dhanora</strong>
              <AlertTriangle size={14} color={COLORS.amber} /><span className="muted">Current Issue</span><span><Pill tone="amber">Lower conversion (32%)</Pill></span>
              <CalendarDays size={14} /><span className="muted">Recent Update</span><strong>Stock receipt pending (Jan 12)</strong>
            </div>
          </Panel>

          <Panel title="Operational Signals" icon={<BarChart3 size={16} />}>
            {SIGNALS.map((signal) => (
              <div className="ai1-signal" key={signal.title}>
                {signal.icon}
                <span><strong>{signal.title}</strong><small>{signal.sub}</small></span>
                <Pill tone={signal.level === 'High' ? 'red' : 'amber'}>{signal.level}</Pill>
              </div>
            ))}
          </Panel>

          <Panel title="AI Recommended Actions" icon={<Sparkles size={16} />}>
            {RECOMMENDED.map((item, index) => {
              const done = assigned.includes(index);
              return (
                <div
                  key={item.text}
                  className={cx('ai1-action', done && 'done')}
                  onClick={() => {
                    setAssigned((current) => (done ? current.filter((value) => value !== index) : [...current, index]));
                    toast(done ? 'Action un-assigned' : `Action assigned to ${item.owner}`);
                  }}
                >
                  {done ? <CheckCircle2 size={16} /> : item.icon}
                  <span>{item.text}</span>
                  <small>Owner: {item.owner}</small>
                </div>
              );
            })}
          </Panel>

          <Panel>
            <div className="row-between">
              <span className="row" style={{ fontWeight: 700, fontSize: 13 }}><ShieldCheck size={16} color={COLORS.green} /> Evidence Confidence <Info size={13} className="muted-icon" /></span>
              <Pill tone={LEVEL_TONE[answer.confidence.level]}>{answer.confidence.level}</Pill>
            </div>
          </Panel>
        </div>
      </div>

      <div className="ai1-footer">
        <Layers size={16} color={COLORS.dark} />
        <span>Current: <strong>AI.1 Intelligent Copilot Workspace</strong></span>
        <span className="sep" />
        <span className="muted">Recommended actions:</span>
        <Btn small variant="outline" to={answer.primary.to} icon={<Zap size={12} />}>{answer.primary.label}</Btn>
        <Btn small variant="outline" to={answer.secondary.to} icon={<BarChart3 size={12} />}>{answer.secondary.label}</Btn>
      </div>
    </div>
  );
}
