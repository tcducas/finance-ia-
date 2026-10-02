import { Clock, Sparkles, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useCopilot } from '../context/CopilotContext';
import { formatMoney } from '../lib/format';
import { addWatchlist, fetchAsset } from '../services/market';
import type { AssetDetail } from '../types/market';
import { Skeleton } from '../components/ui/Skeleton';

const RANGES = [
  { id: '1mo', label: '1M' },
  { id: '3mo', label: '3M' },
  { id: '6mo', label: '6M' },
  { id: '1y', label: '1A' },
] as const;

function Indicator({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-elevated p-3">
      <p className="text-[11px] font-medium text-ink-muted uppercase tracking-wide">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}

/**
 * Tela: Detalhe do ativo — rota `/app/investimentos/:ticker`
 * Menu: sub-rota de "Investimentos" (sem item próprio no menu)
 * Gráfico de preço, indicadores e "explicar este ativo" via copiloto.
 */
export function AtivoDetalhePage() {
  const { ticker = '' } = useParams();
  const { openWith } = useCopilot();
  const [asset, setAsset] = useState<AssetDetail | null>(null);
  const [placeholder, setPlaceholder] = useState(false);
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('3mo');
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchAsset(ticker, range).then((result) => {
      if (!active) return;
      setAsset(result.data);
      setPlaceholder(result.source === 'placeholder');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [ticker, range]);

  const positive = (asset?.changePercent ?? 0) >= 0;

  return (
    <section aria-labelledby="ativo-titulo" className="mx-auto max-w-6xl space-y-6">
      {placeholder && (
        <p role="status" className="rounded-2xl border border-line bg-elevated px-4 py-2.5 text-xs text-ink-muted">
          <strong>Dados de exemplo</strong> — valores fictícios para demonstração (API de mercado
          inacessível neste ambiente).
        </p>
      )}

      {loading || !asset ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 id="ativo-titulo" className="font-display text-2xl font-bold tracking-tight">
                {asset.ticker}
              </h2>
              <p className="text-sm text-ink-muted">{asset.name}</p>
              <div className="mt-2 flex items-baseline gap-3">
                <p className="text-3xl font-bold tabular-nums">
                  {formatMoney(asset.price, asset.currency)}
                </p>
                <span
                  className="text-base font-semibold tabular-nums"
                  style={{ color: positive ? 'var(--status-good)' : 'var(--status-bad)' }}
                >
                  {positive ? '+' : ''}
                  {asset.changePercent.toFixed(2)}%
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-muted">
                <Clock className="size-3" aria-hidden />
                {asset.delayed ? 'Cotação com atraso (~15 min)' : 'Cotação em tempo real'}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  void addWatchlist(asset.ticker).then(() => setAdded(true));
                }}
                disabled={added}
                className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
              >
                <Star className="size-4" aria-hidden />
                {added ? 'Na watchlist' : 'Acompanhar'}
              </button>
              <button
                type="button"
                onClick={() =>
                  openWith({
                    screen: 'ativo',
                    ticker: asset.ticker,
                    kickoff: `Explique o ativo ${asset.ticker} de forma didática: o que é, fundamentos e riscos.`,
                  })
                }
                className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-strong"
              >
                <Sparkles className="size-4" aria-hidden />
                Explicar este ativo
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-elevated p-4">
            <div className="mb-3 flex justify-end gap-1" role="tablist" aria-label="Período">
              {RANGES.map((r) => (
                <button
                  key={r.id}
                  role="tab"
                  aria-selected={range === r.id}
                  onClick={() => setRange(r.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    range === r.id ? 'bg-gold text-on-gold' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {asset.history.length === 0 ? (
              <p className="grid h-56 place-items-center text-sm text-ink-muted">
                Sem histórico disponível para este período.
              </p>
            ) : (
              <div className="h-56" role="img" aria-label={`Histórico de preço de ${asset.ticker}`}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={asset.history} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                    <defs>
                      <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
                      tickFormatter={(d: string) => d.slice(5)}
                      minTickGap={48}
                    />
                    <YAxis
                      domain={['auto', 'auto']}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'var(--ink-muted)', fontSize: 11 }}
                      width={56}
                      tickFormatter={(v: number) => v.toLocaleString('pt-BR')}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        const value = payload?.[0]?.value;
                        if (!active || typeof value !== 'number') return null;
                        return (
                          <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
                            <p className="font-medium">{String(label)}</p>
                            <p className="text-ink-muted tabular-nums">
                              {formatMoney(value, asset.currency)}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke="var(--gold)"
                      strokeWidth={2}
                      fill="url(#priceFill)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Indicator
              label="Mín 52 sem"
              value={asset.low52w !== null ? formatMoney(asset.low52w, asset.currency) : '—'}
            />
            <Indicator
              label="Máx 52 sem"
              value={asset.high52w !== null ? formatMoney(asset.high52w, asset.currency) : '—'}
            />
            <Indicator
              label="P/L"
              value={asset.priceEarnings !== null ? asset.priceEarnings.toFixed(1) : '—'}
            />
            <Indicator
              label="LPA"
              value={
                asset.earningsPerShare !== null
                  ? formatMoney(asset.earningsPerShare, asset.currency)
                  : '—'
              }
            />
            <Indicator
              label="Volume"
              value={asset.volume !== null ? asset.volume.toLocaleString('pt-BR') : '—'}
            />
          </div>
        </>
      )}
    </section>
  );
}
