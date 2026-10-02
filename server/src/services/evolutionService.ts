import { fromPostgrest } from '../errors/postgrest.js';
import { round2 } from '../lib/projection.js';
import type { UserClient } from '../lib/supabase.js';

/**
 * Evolução do patrimônio — a série do gráfico da Minha Carteira.
 *
 * Duas fontes combinadas, por decisão de produto:
 *  1. `patrimonio_snapshots`: foto mensal real (inclui valorização de ativo).
 *     É a verdade quando existe, mas só cobre os meses já registrados.
 *  2. Fluxo de caixa das `transactions`: preenche o passado retroagindo a partir
 *     do patrimônio de hoje (W_anterior = W_atual − fluxo do mês).
 *
 * Cada ponto diz de onde veio (`source`), então a UI nunca apresenta número
 * derivado como se fosse medido.
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
  /** Patrimônio líquido de hoje (ativos − passivos), âncora da série. */
  current: number;
  /** Variação absoluta e percentual entre o primeiro e o último ponto. */
  change: number;
  changePercent: number | null;
  /** true quando nenhum snapshot existe ainda — a série é toda derivada. */
  derivedOnly: boolean;
}

/** Lista os últimos `count` meses terminando em `endMonth`, em ordem crescente. */
export function monthSeries(endMonth: string, count: number): string[] {
  const [yearStr = '', monthStr = ''] = endMonth.split('-');
  const end = new Date(Date.UTC(Number(yearStr), Number(monthStr) - 1, 1));
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - i, 1));
    out.push(d.toISOString().slice(0, 7));
  }
  return out;
}

export async function getEvolution(
  db: UserClient,
  endMonth: string,
  months: number,
): Promise<Evolution> {
  const series = monthSeries(endMonth, months);
  const first = series[0] ?? endMonth;

  const [assets, snapshots, flows] = await Promise.all([
    fetchAssets(db),
    fetchSnapshots(db, first, endMonth),
    fetchMonthlyFlows(db, first, endMonth),
  ]);

  const current = round2(
    assets.reduce((sum, a) => sum + (a.is_liability ? -a.value : a.value), 0),
  );

  const snapshotByMonth = new Map(snapshots.map((s) => [s.month, s.value]));
  const flowByMonth = new Map(flows.map((f) => [f.month, f.net]));

  // Retroage do mês final para o início: cada passo desconta o fluxo do mês
  // seguinte. Um snapshot no caminho reancora a série no valor medido.
  const values = new Map<string, { value: number; source: PointSource }>();
  let running = snapshotByMonth.get(endMonth) ?? current;
  values.set(endMonth, {
    value: round2(running),
    source: snapshotByMonth.has(endMonth) ? 'snapshot' : 'derivado',
  });

  for (let i = series.length - 2; i >= 0; i -= 1) {
    const month = series[i] as string;
    const nextMonth = series[i + 1] as string;
    running -= flowByMonth.get(nextMonth) ?? 0;
    const snapshot = snapshotByMonth.get(month);
    if (snapshot !== undefined) running = snapshot;
    values.set(month, {
      value: round2(running),
      source: snapshot !== undefined ? 'snapshot' : 'derivado',
    });
  }

  const points: EvolutionPoint[] = series.map((month) => {
    const entry = values.get(month);
    return {
      month,
      value: entry?.value ?? 0,
      flow: round2(flowByMonth.get(month) ?? 0),
      source: entry?.source ?? 'derivado',
    };
  });

  const firstValue = points[0]?.value ?? 0;
  const lastValue = points.at(-1)?.value ?? 0;
  const change = round2(lastValue - firstValue);

  return {
    points,
    current,
    change,
    // Percentual não faz sentido partindo de zero ou de patrimônio negativo.
    changePercent: firstValue > 0 ? Math.round((change / firstValue) * 1000) / 10 : null,
    derivedOnly: snapshots.length === 0,
  };
}

/**
 * Grava a foto do mês: total líquido + uma linha por classe de ativo.
 * Idempotente (upsert por usuário+mês+classe), então chamar duas vezes no mesmo
 * mês atualiza em vez de duplicar.
 */
export async function saveSnapshot(
  db: UserClient,
  userId: string,
  month: string,
): Promise<{ month: string; total: number; classes: number }> {
  const assets = await fetchAssets(db);

  const byClass = new Map<string, number>();
  let total = 0;
  for (const asset of assets) {
    const signed = asset.is_liability ? -asset.value : asset.value;
    total += signed;
    byClass.set(asset.kind, (byClass.get(asset.kind) ?? 0) + signed);
  }

  const rows = [
    { user_id: userId, month, asset_class: 'total', value: round2(total) },
    ...[...byClass.entries()].map(([asset_class, value]) => ({
      user_id: userId,
      month,
      asset_class,
      value: round2(value),
    })),
  ];

  const { error } = await db
    .from('patrimonio_snapshots')
    .upsert(rows, { onConflict: 'user_id,month,asset_class' });
  if (error) throw fromPostgrest(error);

  return { month, total: round2(total), classes: byClass.size };
}

async function fetchAssets(db: UserClient) {
  const { data, error } = await db.from('assets').select('kind, value, is_liability');
  if (error) throw fromPostgrest(error);
  return data;
}

async function fetchSnapshots(db: UserClient, from: string, to: string) {
  const { data, error } = await db
    .from('patrimonio_snapshots')
    .select('month, value')
    .eq('asset_class', 'total')
    .gte('month', from)
    .lte('month', to)
    .order('month');
  if (error) throw fromPostgrest(error);
  return data;
}

/** Fluxo líquido por mês, no intervalo pedido. */
async function fetchMonthlyFlows(db: UserClient, from: string, to: string) {
  const { data, error } = await db
    .from('transactions')
    .select('type, amount, occurred_on')
    .gte('occurred_on', `${from}-01`)
    .lte('occurred_on', `${to}-31`);
  if (error) throw fromPostgrest(error);

  const byMonth = new Map<string, number>();
  for (const row of data) {
    const month = row.occurred_on.slice(0, 7);
    const signed = row.type === 'receita' ? row.amount : -row.amount;
    byMonth.set(month, (byMonth.get(month) ?? 0) + signed);
  }
  return [...byMonth.entries()].map(([month, net]) => ({ month, net: round2(net) }));
}
