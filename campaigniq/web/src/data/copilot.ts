/**
 * AI Co-pilot client.
 *
 * 1. Backend first: POST /api/copilot/ask (structured AI.1 answers) and /api/copilot/chat (persona copilots) ground
 *    the question in the tool's data and call the configured LLM (default: a free keyless endpoint).
 * 2. No backend (e.g. the GitHub Pages site) or backend error: the browser calls the same free, keyless
 *    OpenAI-compatible endpoint directly, with the same prompts and the facts shown on the current screen.
 * 3. If both fail, callers fall back to their built-in illustrative answers.
 *
 * Questions and the (illustrative) screen context are sent to that third-party LLM service.
 */
import { API_ENABLED, api } from '../api';
import type { Scope } from './reference';
import chatPrompt from '../../../server/data/prompts/copilot_chat.md?raw';
import askPrompt from '../../../server/data/prompts/copilot_system.md?raw';

export interface CopilotStatus { provider: string; model: string | null; configured: boolean; mode: 'llm' | 'demo' }

export interface CopilotAnswer {
  question: string;
  title: string;
  summary: string;
  table: { columns: string[]; rows: (string | number | null)[][]; highlight?: number | null };
  chart: { title: string; axis: string; max: number; bars: { label: string; value: number; display: string; low?: boolean }[] };
  factors: string[];
  confidence: { level: 'High' | 'Medium' | 'Low'; text: string };
  sources: { label: string; to: string }[];
  actions: string[];
  primary: { label: string; to: string };
  secondary: { label: string; to: string };
}

export interface AskResponse { mode: 'llm' | 'demo'; provider: string; model?: string | null; answer?: CopilotAnswer | null; grounded_on: string[]; message?: string | null }

export interface ChatTurn { role: 'user' | 'assistant'; content: string }
export interface ChatReply { answer: string; model: string; via: 'backend' | 'browser'; groundedOn: string[] }

/** Keyless, CORS-enabled endpoints tried in order; both serve the open-weight gpt-oss-20b model. */
const FREE_ENDPOINTS = [
  { label: 'LLM7', url: 'https://api.llm7.io/v1/chat/completions', model: 'default' },
  { label: 'Pollinations', url: 'https://text.pollinations.ai/openai', model: 'openai' },
];
const FREE_MODEL_LABEL = 'gpt-oss-20b (free endpoint)';
const BROWSER_STATUS: CopilotStatus = { provider: 'free (browser)', model: FREE_MODEL_LABEL, configured: true, mode: 'llm' };
const MAX_RETRY_WAIT_S = 12;
const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/** Direct browser call to the free keyless endpoints. Honours short rate-limit waits, then tries the next endpoint. */
async function freeLlm(messages: { role: string; content: string }[], json: boolean, maxTokens = 1200): Promise<{ text: string; model: string }> {
  const problems: string[] = [];
  for (const endpoint of FREE_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      let response: Response;
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 90_000);
      try {
        response = await fetch(endpoint.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            model: endpoint.model, messages, temperature: 0.3, max_tokens: maxTokens,
            ...(endpoint.label === 'Pollinations' ? { referrer: 'mahadhan-campaigniq' } : {}),
            ...(json ? { response_format: { type: 'json_object' } } : {}),
          }),
        });
      } catch (error) {
        problems.push(`${endpoint.label}: ${(error as Error).message}`);
        break;
      } finally {
        window.clearTimeout(timer);
      }
      const payload = await response.json().catch(() => null);
      if (response.ok) {
        const text: string | undefined = payload?.choices?.[0]?.message?.content;
        if (text && text.trim()) return { text: text.trim(), model: `${payload?.model ?? 'gpt-oss-20b'} via ${endpoint.label} (free)` };
        problems.push(`${endpoint.label}: empty answer`);
        break;
      }
      const retryAfter = Number(response.headers.get('Retry-After') ?? payload?.error?.retry_after ?? 0);
      if ((response.status === 429 || response.status === 402) && retryAfter > 0 && retryAfter <= MAX_RETRY_WAIT_S) {
        await wait(retryAfter * 1000);
        continue;
      }
      problems.push(`${endpoint.label}: HTTP ${response.status}${retryAfter ? ` (retry in ${retryAfter}s)` : ''}`);
      break;
    }
  }
  throw new Error(`free AI endpoints are busy — ${problems.join('; ')}`);
}

/** Pull the JSON object out of a model reply (tolerates code fences or leading text). */
function parseJson<T>(text: string): T {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  return JSON.parse(start >= 0 && end > start ? text.slice(start, end + 1) : text) as T;
}

/** Status: the backend's provider when connected; otherwise the browser-side free LLM. */
export async function getCopilotStatus(): Promise<CopilotStatus> {
  if (!API_ENABLED) return BROWSER_STATUS;
  try {
    const status = await api<CopilotStatus>('/copilot/status');
    return status.mode === 'llm' ? status : BROWSER_STATUS;
  } catch {
    return BROWSER_STATUS;
  }
}

/** Structured answer for the AI.1 screen. */
export async function askCopilot(question: string, scope: Scope, screen: string, history: ChatTurn[] = []): Promise<AskResponse> {
  if (API_ENABLED) {
    try {
      const response = await api<AskResponse>('/copilot/ask', { method: 'POST', body: JSON.stringify({ question, scope, screen, history }) });
      if (response.mode === 'llm' && response.answer) return response;
    } catch { /* fall through to the browser LLM */ }
  }
  const context = { scope, current_screen: screen, datasets: [], documents: [], data_available: false,
    note: 'No backend connected: answer from general CampaignIQ knowledge, say that live data is not connected, set confidence Low.' };
  const reply = await freeLlm([
    { role: 'system', content: askPrompt },
    ...history.slice(-6),
    { role: 'user', content: JSON.stringify({ question, context }) },
  ], true, 1500);
  const answer = parseJson<CopilotAnswer>(reply.text);
  answer.question = question;
  return { mode: 'llm', provider: 'free (browser)', model: reply.model, answer, grounded_on: [] };
}

/** Conversational answer for the persona copilots (Markdown text). */
export async function chatCopilot({ question, persona, screen, pageContext, scope, history = [] }: {
  question: string; persona: string; screen: string; pageContext: string; scope?: Scope; history?: ChatTurn[];
}): Promise<ChatReply> {
  const recent = history.slice(-8).map((turn) => ({ role: turn.role, content: turn.content.slice(0, 2000) }));
  if (API_ENABLED) {
    try {
      const response = await api<{ mode: string; model?: string | null; answer?: string | null; grounded_on: string[] }>('/copilot/chat', {
        method: 'POST',
        body: JSON.stringify({ question, persona, screen, page_context: pageContext.slice(0, 6000), scope: scope ?? {}, history: recent }),
      });
      if (response.mode === 'llm' && response.answer) {
        return { answer: response.answer, model: response.model ?? 'LLM', via: 'backend', groundedOn: response.grounded_on ?? [] };
      }
    } catch { /* fall through to the browser LLM */ }
  }
  const reply = await freeLlm([
    { role: 'system', content: chatPrompt.replace('{persona}', persona) },
    ...recent,
    { role: 'user', content: JSON.stringify({ question, context: { persona, screen, page: pageContext, datasets: [], backend_kpis: 'not connected' } }) },
  ], false, 900);
  return { answer: reply.text, model: reply.model, via: 'browser', groundedOn: [] };
}
