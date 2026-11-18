/**
 * Live LLM chat used by the persona copilots (TM.AI1, PM.AI1, MH.AI1, BH.AI1).
 * Answers come from the backend copilot when connected, otherwise from the free keyless LLM called by the browser.
 */
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { Bot, Loader2, Send, Sparkles, UserRound } from 'lucide-react';
import { chatCopilot, type ChatTurn } from '../data/copilot';
import { useNav } from '../nav';
import './live-copilot.css';

/** Minimal, safe Markdown: **bold**, "- " / "1. " lists, paragraphs. No HTML injection. */
function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <b key={i}>{part.slice(2, -2)}</b> : <Fragment key={i}>{part}</Fragment>);
}

export function Markdown({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  const flush = () => {
    if (!list) return;
    const items = list.items.map((item, i) => <li key={i}>{inline(item)}</li>);
    blocks.push(list.ordered ? <ol key={blocks.length}>{items}</ol> : <ul key={blocks.length}>{items}</ul>);
    list = null;
  };
  for (const raw of text.replace(/\r/g, '').split('\n')) {
    const line = raw.trim();
    const bullet = /^[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (bullet || numbered) {
      const ordered = Boolean(numbered);
      if (!list || list.ordered !== ordered) { flush(); list = { ordered, items: [] }; }
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }
    flush();
    if (!line) continue;
    blocks.push(<p key={blocks.length}>{inline(line.replace(/^#+\s*/, ''))}</p>);
  }
  flush();
  return <div className="lc-md">{blocks}</div>;
}

interface Message { role: 'user' | 'assistant'; content: string; meta?: string; error?: boolean }

export function LiveCopilot({ persona, screen, pageContext, suggestions, intro, title = 'Ask the Copilot · live AI' }: {
  persona: string;
  screen: string;
  /** Facts shown on the current screen; the LLM answers from these (plus backend data when connected). */
  pageContext: string;
  suggestions: string[];
  intro?: string;
  title?: string;
}) {
  const { scope } = useNav();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => { end.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }, [messages, busy]);

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const history: ChatTurn[] = messages.filter((m) => !m.error).map((m) => ({ role: m.role, content: m.content }));
    setMessages((all) => [...all, { role: 'user', content: q }]);
    setDraft('');
    setBusy(true);
    try {
      const reply = await chatCopilot({ question: q, persona, screen, pageContext, scope, history });
      const grounded = reply.groundedOn.length ? ` · grounded on ${reply.groundedOn.length} dataset${reply.groundedOn.length > 1 ? 's' : ''}` : '';
      setMessages((all) => [...all, { role: 'assistant', content: reply.answer, meta: `${reply.model} · via ${reply.via === 'backend' ? 'CampaignIQ backend' : 'browser'}${grounded}` }]);
    } catch (error) {
      setMessages((all) => [...all, { role: 'assistant', error: true, content: `The live AI could not answer right now (${(error as Error).message}). The free service limits how often it replies — please try again in about a minute.` }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="lc" aria-label={title}>
      <header className="lc-head">
        <h3><Sparkles size={15} /> {title}</h3>
        <span className="lc-badge">Live LLM · free open models · answers from this screen's data</span>
      </header>
      <div className="lc-thread">
        {messages.length === 0 && <p className="lc-intro">{intro ?? 'Ask anything about the figures on this screen. Pick a suggestion or type your own question.'}</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'lc-q' : m.error ? 'lc-a lc-err' : 'lc-a'}>
            {m.role === 'user' ? <UserRound size={14} /> : <Bot size={14} />}
            <div>
              {m.role === 'user' ? <span>{m.content}</span> : <Markdown text={m.content} />}
              {m.meta && <small className="lc-meta">{m.meta}</small>}
            </div>
          </div>
        ))}
        {busy && <div className="lc-a lc-busy"><Loader2 size={14} className="lc-spin" /><span>Thinking… the free model usually answers in 5–30 seconds.</span></div>}
        <div ref={end} />
      </div>
      <div className="lc-chips">
        {suggestions.map((s) => <button key={s} type="button" disabled={busy} onClick={() => ask(s)}>{s}</button>)}
      </div>
      <div className="lc-input">
        <input value={draft} disabled={busy} placeholder="Ask the copilot…" aria-label="Ask the copilot"
          onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(draft); }} />
        <button type="button" aria-label="Send" disabled={busy || !draft.trim()} onClick={() => ask(draft)}><Send size={15} /></button>
      </div>
      <small className="lc-foot">Illustrative data. Questions and on-screen figures are sent to a free third-party LLM service; do not enter personal or confidential information.</small>
    </section>
  );
}
