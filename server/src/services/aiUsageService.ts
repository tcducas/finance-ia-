import { fromPostgrest } from '../errors/postgrest.js';
import {
  aiLimitFor,
  aiQuotaExceeded,
  usagePeriod,
  type AiKind,
  type Plan,
} from '../lib/entitlements.js';
import { createServiceClient } from '../lib/supabase.js';
import { env } from '../env.js';

/**
 * Cota de IA do plano free.
 *
 * O contador vive em `ai_usage`, que o usuário só LÊ (RLS select-own). O
 * incremento passa pela service role: se o cliente pudesse escrever, zeraria a
 * própria cota. Por isso tudo aqui usa createServiceClient.
 */

export interface QuotaStatus {
  kind: AiKind;
  used: number;
  /** null = ilimitado (plano pro). */
  limit: number | null;
  remaining: number | null;
  exceeded: boolean;
}

const configured = () => Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE);

export async function getUsage(userId: string, kind: AiKind, now = new Date()): Promise<number> {
  if (!configured()) return 0;
  const db = createServiceClient();
  const { data, error } = await db
    .from('ai_usage')
    .select('count')
    .eq('user_id', userId)
    .eq('kind', kind)
    .eq('period', usagePeriod(kind, now))
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  return data?.count ?? 0;
}

export async function quotaStatus(
  userId: string,
  plan: Plan,
  kind: AiKind,
  now = new Date(),
): Promise<QuotaStatus> {
  const limit = aiLimitFor(plan, kind);
  // Pro não tem cota: nem consultamos o contador.
  if (limit === null) {
    return { kind, used: 0, limit: null, remaining: null, exceeded: false };
  }
  const used = await getUsage(userId, kind, now);
  return {
    kind,
    used,
    limit,
    remaining: Math.max(0, limit - used),
    exceeded: aiQuotaExceeded(plan, kind, used),
  };
}

/**
 * Soma 1 ao consumo do período. Chamado DEPOIS da resposta da IA: cobrar antes e
 * falhar a chamada gastaria a cota do usuário sem entregar nada.
 */
export async function increment(userId: string, kind: AiKind, now = new Date()): Promise<void> {
  if (!configured()) return;
  const db = createServiceClient();
  const period = usagePeriod(kind, now);

  const current = await getUsage(userId, kind, now);
  const { error } = await db.from('ai_usage').upsert(
    { user_id: userId, period, kind, count: current + 1, updated_at: now.toISOString() },
    { onConflict: 'user_id,period,kind' },
  );
  if (error) throw fromPostgrest(error);
}
