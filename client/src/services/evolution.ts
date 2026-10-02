import { getSessionToken, isDemoMode } from './data';

/**
 * Evolução do patrimônio — série do gráfico da Minha Carteira.
 *
 * Vem sempre da API: a combinação de snapshots com fluxo de caixa vive no
 * backend (server/src/services/evolutionService.ts) e não é duplicada aqui. Em
 * modo demonstração o gráfico mostra o estado vazio com convite a entrar, em vez
 * de números inventados.
 */

export type PointSource = 'snapshot' | 'derivado';

export interface EvolutionPoint {
  /** YYYY-MM */
  month: string;
  value: number;
  /** Fluxo líquido do mês (receitas − despesas). */
  flow: number;
  source: PointSource;
}

export interface Evolution {
  points: EvolutionPoint[];
  current: number;
  change: number;
  changePercent: number | null;
  /** true quando nenhum snapshot existe ainda — série toda derivada do fluxo. */
  derivedOnly: boolean;
}

export interface SnapshotResult {
  month: string;
  total: number;
  classes: number;
}

export function evolutionAvailable(): boolean {
  return !isDemoMode();
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${getSessionToken()}`,
    },
  });
  const body = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { message: string } }
    | null;
  if (!res.ok || body === null || 'error' in body) {
    throw new Error(
      body && 'error' in body ? body.error.message : 'Erro ao carregar a evolução.',
    );
  }
  return body.data;
}

export function fetchEvolution(months: number): Promise<Evolution> {
  return api<Evolution>(`/api/summary/evolution?months=${months}`);
}

/** Grava a foto do patrimônio do mês corrente (idempotente no backend). */
export function saveSnapshot(): Promise<SnapshotResult> {
  return api<SnapshotResult>('/api/summary/snapshot', { method: 'POST', body: '{}' });
}
