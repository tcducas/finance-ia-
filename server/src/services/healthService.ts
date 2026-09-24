import { env } from '../env.js';

export type DependencyStatus = 'up' | 'down' | 'not_configured';

export interface ReadyCheck {
  status: 'ok' | 'degraded';
  checks: {
    supabase: DependencyStatus;
    market: DependencyStatus;
    ai: DependencyStatus;
  };
}

async function withTimeout(url: string, ms: number): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(ms) });
    // Qualquer resposta HTTP (mesmo 4xx) prova que a dependência está no ar.
    return res.status < 500;
  } catch {
    return false;
  }
}

async function checkSupabase(): Promise<DependencyStatus> {
  if (!env.SUPABASE_URL) return 'not_configured';
  const ok = await withTimeout(`${env.SUPABASE_URL}/auth/v1/health`, 2000);
  return ok ? 'up' : 'down';
}

async function checkMarket(): Promise<DependencyStatus> {
  const ok = await withTimeout('https://brapi.dev/api/available?limit=1', 2000);
  return ok ? 'up' : 'down';
}

function checkAi(): DependencyStatus {
  const configured = env.AI_PROVIDER === 'gemini' ? env.GEMINI_API_KEY : env.ANTHROPIC_API_KEY;
  return configured ? 'up' : 'not_configured';
}

// Memoizado 10s: um endpoint público de readiness não pode virar amplificador
// de tráfego para o Supabase/brapi a cada poll de healthcheck externo.
let cached: { at: number; result: ReadyCheck } | null = null;
const TTL_MS = 10_000;

export async function getReadiness(): Promise<ReadyCheck> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.result;

  const [supabase, market] = await Promise.all([checkSupabase(), checkMarket()]);
  const ai = checkAi();
  const status: ReadyCheck['status'] = supabase === 'down' ? 'degraded' : 'ok';

  const result: ReadyCheck = { status, checks: { supabase, market, ai } };
  cached = { at: Date.now(), result };
  return result;
}
