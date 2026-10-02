import { Camera, TrendingDown, TrendingUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency } from '../../lib/format';
import {
  evolutionAvailable,
  fetchEvolution,
  saveSnapshot,
  type Evolution,
} from '../../services/evolution';
import { Skeleton } from '../ui/Skeleton';

const WINDOWS = [
  { months: 6, label: '6M' },
  { months: 12, label: '12M' },
  { months: 24, label: '24M' },
];

/** "2026-09" → "set/26". */
function monthLabel(yearMonth: string): string {
  const [y = '', m = ''] = yearMonth.split('-');
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, 1));
  const label = new Intl.DateTimeFormat('pt-BR', {
    month: 'short',
    year: '2-digit',
    timeZone: 'UTC',
  }).format(date);
  return label.replace('.', '').replace(' de ', '/');
}

function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

/**
 * Evolução do patrimônio — área com gradiente, no espírito do extrato de
 * corretora. A série combina snapshots mensais (valor medido) com o fluxo de
 * caixa acumulado que preenche o passado; cada ponto sabe sua origem, e o
 * rodapé avisa quando tudo ainda é derivado.
 */
export function PatrimonioEvolution() {
  const { profile } = useAuth();
  const available = evolutionAvailable();
  // Teto do plano: pedir mais que isso o backend recorta de volta.
  const maxMonths = profile?.entitlements.evolutionMonths ?? 6;
  const windows = WINDOWS.filter((w) => w.months <= maxMonths);
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<Evolution | null>(null);
  const [loading, setLoading] = useState(available);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedNote, setSavedNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!available) return;
    setLoading(true);
    try {
      setData(await fetchEvolution(months));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar a evolução.');
    } finally {
      setLoading(false);
    }
  }, [available, months]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleSnapshot() {
    setSaving(true);
    setSavedNote(null);
    try {
      const result = await saveSnapshot();
      setSavedNote(`Foto de ${monthLabel(result.month)} salva (${formatCurrency(result.total)}).`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar a foto do mês.');
    } finally {
      setSaving(false);
    }
  }

  if (!available) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-elevated/60 px-6 py-10 text-center">
        <p className="text-sm text-ink-muted">
          A evolução do patrimônio é calculada no servidor com os seus dados.{' '}
          <Link to="/login" className="text-gold underline">
            Entre na sua conta
          </Link>{' '}
          para ver o gráfico.
        </p>
      </div>
    );
  }

  const rows =
    data?.points.map((p) => ({ ...p, label: monthLabel(p.month) })) ?? [];
  const positive = (data?.change ?? 0) >= 0;
  const color = positive ? 'var(--status-good)' : 'var(--status-bad)';
  const TrendIcon = positive ? TrendingUp : TrendingDown;
  // Primeiro mês medido: antes dele a linha é derivada do fluxo de caixa.
  const firstSnapshot = rows.find((r) => r.source === 'snapshot');

  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Patrimônio líquido
          </p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums">
            {formatCurrency(data?.current ?? 0)}
          </p>
          {data && (
            <p
              className="mt-0.5 flex items-center gap-1 text-sm font-medium tabular-nums"
              style={{ color }}
            >
              <TrendIcon className="size-4" aria-hidden />
              {positive ? '+' : ''}
              {formatCurrency(data.change)}
              {data.changePercent !== null && ` (${positive ? '+' : ''}${data.changePercent}%)`}
              <span className="font-normal text-ink-muted">em {months} meses</span>
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <div
            className="flex rounded-full border border-line p-1 text-xs"
            role="radiogroup"
            aria-label="Janela do gráfico"
          >
            {windows.map((w) => (
              <button
                key={w.months}
                type="button"
                role="radio"
                aria-checked={months === w.months}
                onClick={() => setMonths(w.months)}
                className={`rounded-full px-3 py-1 font-medium transition-colors ${
                  months === w.months ? 'bg-gold text-white' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleSnapshot()}
            disabled={saving}
            title="Guarda o patrimônio de hoje como a foto deste mês"
            className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs font-medium transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
          >
            <Camera className="size-3.5" aria-hidden />
            {saving ? 'Salvando…' : 'Salvar foto do mês'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}
      {savedNote && (
        <p role="status" className="mb-3 text-xs text-ink-muted">
          {savedNote}
        </p>
      )}

      {loading && !data ? (
        <Skeleton className="h-56" />
      ) : rows.length === 0 ? (
        <p className="grid h-56 place-items-center text-sm text-ink-muted">
          Sem histórico suficiente ainda.
        </p>
      ) : (
        <div className="h-56" role="img" aria-label="Evolução do patrimônio líquido">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={rows} margin={{ top: 4, right: 8, bottom: 0, left: 4 }}>
              <defs>
                <linearGradient id="patrimonioFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
                minTickGap={24}
              />
              <YAxis
                domain={['auto', 'auto']}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
                width={52}
                tickFormatter={compact}
              />
              {firstSnapshot && (
                <ReferenceLine
                  x={firstSnapshot.label}
                  stroke="var(--gold)"
                  strokeDasharray="3 3"
                  label={{
                    value: 'medido',
                    position: 'insideTopLeft',
                    fill: 'var(--gold)',
                    fontSize: 10,
                  }}
                />
              )}
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload as (typeof rows)[number] | undefined;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
                      <p className="font-medium">{row.label}</p>
                      <p className="mt-1 font-semibold tabular-nums">
                        {formatCurrency(row.value)}
                      </p>
                      <p className="text-ink-muted tabular-nums">
                        fluxo do mês: {row.flow >= 0 ? '+' : ''}
                        {formatCurrency(row.flow)}
                      </p>
                      <p className="mt-1 text-ink-muted">
                        {row.source === 'snapshot' ? 'valor medido' : 'estimado pelo fluxo'}
                      </p>
                    </div>
                  );
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                fill="url(#patrimonioFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {profile?.plan === 'free' && (
        <p className="mt-2 text-[11px] text-ink-muted">
          O plano Free mostra até {maxMonths} meses.{' '}
          <Link to="/app/plano" className="text-gold underline">
            O Pro vai a 24
          </Link>
          .
        </p>
      )}

      {data?.derivedOnly && (
        <p className="mt-2 text-[11px] text-ink-muted">
          Toda a série está <strong>estimada pelo fluxo de caixa</strong> — ela retroage do
          patrimônio de hoje descontando as movimentações de cada mês, então não inclui valorização
          de ativo. Salve a foto do mês para começar a registrar o valor medido.
        </p>
      )}
    </div>
  );
}
