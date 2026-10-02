import type { Goal, GoalInput, Planning } from '../types/planning';
import { getSessionToken, isDemoMode } from './data';

/**
 * Metas e projeções vêm SEMPRE da API: o motor de juros compostos vive no
 * backend (server/src/lib/projection.ts, função pura e testada) e não é
 * duplicado aqui. Por isso o Planejamento exige login — em modo demonstração a
 * tela mostra o estado vazio com convite a entrar, em vez de números inventados.
 */

export class PlanningUnavailableError extends Error {
  constructor() {
    super('Planejamento indisponível em modo demonstração.');
    this.name = 'PlanningUnavailableError';
  }
}

export function planningAvailable(): boolean {
  return !isDemoMode();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (isDemoMode()) throw new PlanningUnavailableError();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getSessionToken()}`,
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { message: string } }
    | null;
  if (!res.ok || body === null || 'error' in body) {
    throw new Error(
      body && 'error' in body ? body.error.message : 'Erro ao falar com o servidor.',
    );
  }
  return body.data;
}

export function fetchPlanning(horizon: number, month?: string): Promise<Planning> {
  const params = new URLSearchParams({ horizon: String(horizon) });
  if (month) params.set('month', month);
  return api<Planning>(`/api/planning?${params.toString()}`);
}

export function listGoals(): Promise<Goal[]> {
  return api<Goal[]>('/api/goals');
}

export function createGoal(input: GoalInput): Promise<Goal> {
  return api<Goal>('/api/goals', { method: 'POST', body: JSON.stringify(input) });
}

export function updateGoal(id: string, input: Partial<GoalInput>): Promise<Goal> {
  return api<Goal>(`/api/goals/${id}`, { method: 'PATCH', body: JSON.stringify(input) });
}

export function deleteGoal(id: string): Promise<void> {
  return api<{ id: string }>(`/api/goals/${id}`, { method: 'DELETE' }).then(() => undefined);
}
