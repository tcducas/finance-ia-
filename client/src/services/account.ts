import { getSessionToken } from './data';

export type RiskProfile = 'conservador' | 'moderado' | 'arrojado';

export interface Me {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
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
