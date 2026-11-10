/**
 * AI Co-pilot client. The backend (POST /api/copilot/ask) grounds the question in reference data and
 * uploaded datasets and calls the configured LLM (COPILOT_PROVIDER). When no LLM is configured or the
 * call fails, the AI.1 screen falls back to its built-in illustrative answers.
 */
import { api } from '../api';
import type { Scope } from './reference';

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

export const getCopilotStatus = () => api<CopilotStatus>('/copilot/status');

export const askCopilot = (question: string, scope: Scope, screen: string, history: { role: 'user' | 'assistant'; content: string }[] = []) =>
  api<AskResponse>('/copilot/ask', { method: 'POST', body: JSON.stringify({ question, scope, screen, history }) });
