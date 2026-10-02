import { getSessionToken } from './data';

export type RiskProfile = 'conservador' | 'moderado' | 'arrojado';

export type Plan = 'free' | 'pro';

export type MarketId = 'BR' | 'CRYPTO' | 'US';

/** Espelha server/src/lib/entitlements.ts — a UI lê, nunca recalcula a regra. */
export interface Entitlements {
  markets: MarketId[];
  boardIntervals: Record<MarketId, string[]>;
  book: boolean;
  evolutionMonths: number;
  /** null = ilimitado. */
  aiChatPerDay: number | null;
  aiAnalyzePerMonth: number | null;
}

export interface Me {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  plan: Plan;
  plan_updated_at: string | null;
  entitlements: Entitlements;
  onboarded_at: string | null;
  risk_profile: RiskProfile | null;
}

export interface AdminStats {
  users: number;
  transactions: number;
  aiMessages: number;
  watchlistItems: number;
}

export type OnboardingAnswers = Record<string, number>;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionToken() ?? ''}`,
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { message: string; code: string } }
    | null;
  if (!res.ok || body === null || 'error' in body) {
    const error = body && 'error' in body ? body.error : undefined;
    throw Object.assign(new Error(error?.message ?? 'Erro de comunicação com o servidor.'), {
      code: error?.code ?? 'NETWORK_ERROR',
      status: res.status,
    });
  }
  return body.data;
}

export function fetchMe(): Promise<Me> {
  return api<Me>('/api/me');
}

export function submitOnboarding(answers: OnboardingAnswers): Promise<Me> {
  return api<Me>('/api/onboarding', { method: 'POST', body: JSON.stringify({ answers }) });
}

export function fetchAdminStats(): Promise<AdminStats> {
  return api<AdminStats>('/api/admin/stats');
}

export interface AdminUser {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: Plan;
  plan_updated_at: string | null;
  is_admin: boolean;
  created_at: string;
}

export function fetchAdminUsers(query?: string): Promise<AdminUser[]> {
  const qs = query ? `?q=${encodeURIComponent(query)}` : '';
  return api<AdminUser[]>(`/api/admin/users${qs}`);
}

export function setUserPlan(userId: string, plan: Plan): Promise<AdminUser> {
  return api<AdminUser>(`/api/admin/users/${userId}/plan`, {
    method: 'PATCH',
    body: JSON.stringify({ plan }),
  });
}

/** true quando o backend recusou por plano (402 PLAN_REQUIRED). */
export function isPlanRequired(err: unknown): boolean {
  return (err as { code?: string }).code === 'PLAN_REQUIRED';
}
