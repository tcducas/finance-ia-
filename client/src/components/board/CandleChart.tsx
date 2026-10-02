import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney } from '../../lib/format';
import { intervalLabel, type OhlcCandle } from '../../types/board';

interface CandleChartProps {
  candles: OhlcCandle[];
  currency: string;
  interval: string;
}

interface Row {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number | null;
  /** [mínima, máxima] — o Bar desenha o range e a shape recorta o corpo. */
  range: [number, number];
  up: boolean;
}

const UP = 'var(--status-good)';
const DOWN = 'var(--status-bad)';

/**
 * Candlestick de verdade (corpo + sombras) em cima do <Bar> do Recharts: o Bar
 * reserva a faixa mínima→máxima e esta shape pinta a sombra como linha fina e o
 * corpo abertura→fechamento como retângulo. Recharts não tem candle nativo e
 * puxar uma lib de gráfico financeiro só para isto não se paga.
 */
function CandleShape(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: Row;
}) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  if (!payload) return null;

  const { open, close, high, low, up } = payload;
  const span = high - low;
  const color = up ? UP : DOWN;

  // Escala: a altura do Bar cobre [low, high]; posicionamos o corpo dentro dela.
  const toY = (value: number) => (span === 0 ? y : y + ((high - value) / span) * height);
  const bodyTop = toY(Math.max(open, close));
  const bodyBottom = toY(Math.min(open, close));
  const bodyHeight = Math.max(1, bodyBottom - bodyTop);
  const center = x + width / 2;
  const bodyWidth = Math.max(1, width * 0.7);

  return (
    <g>
      <line x1={center} x2={center} y1={y} y2={y + height} stroke={color} strokeWidth={1} />
      <rect
        x={center - bodyWidth / 2}
        y={bodyTop}
        width={bodyWidth}
        height={bodyHeight}
        fill={up ? color : color}
        fillOpacity={up ? 0.85 : 1}
        stroke={color}
      />
    </g>
  );
}

/** Períodos de um dia ou mais mostram data; intraday mostra hora. */
const DAILY_OR_LONGER = new Set(['1d', '1wk', '1mo', 'D', 'W']);

function formatTick(iso: string, interval: string): string {
  const d = new Date(iso);
  if (DAILY_OR_LONGER.has(interval)) {
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
      .format(d)
      .replace('.', '');
  }
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(d);
}

export function CandleChart({ candles, currency, interval }: CandleChartProps) {
  const rows = useMemo<Row[]>(
    () =>
      candles.map((c) => ({
        ...c,
        range: [c.low, c.high],
        up: c.close >= c.open,
      })),
    [candles],
  );

  const [min, max] = useMemo(() => {
    if (rows.length === 0) return [0, 1];
    const lows = rows.map((r) => r.low);
    const highs = rows.map((r) => r.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    const pad = (hi - lo) * 0.06 || hi * 0.01;
    return [lo - pad, hi + pad];
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="grid h-72 place-items-center text-sm text-ink-muted">
        Sem candles para este período.
      </p>
    );
  }

  return (
    <div
      className="h-72"
      role="img"
      aria-label={`Candles ${intervalLabel(interval)}: abertura, máxima, mínima e fechamento`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }} barCategoryGap={1}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="time"
            tickFormatter={(t: string) => formatTick(t, interval)}
            tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
            stroke="var(--line)"
            minTickGap={44}
          />
          <YAxis
            domain={[min, max]}
            tick={{ fontSize: 10, fill: 'var(--ink-muted)' }}
            stroke="var(--line)"
            width={64}
            tickFormatter={(v: number) => v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}
          />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              return (
                <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium">
                    {new Intl.DateTimeFormat('pt-BR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    }).format(new Date(row.time))}
                  </p>
                  <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 tabular-nums">
                    <dt className="text-ink-muted">Abertura</dt>
                    <dd className="text-right">{formatMoney(row.open, currency)}</dd>
                    <dt className="text-ink-muted">Máxima</dt>
                    <dd className="text-right">{formatMoney(row.high, currency)}</dd>
                    <dt className="text-ink-muted">Mínima</dt>
                    <dd className="text-right">{formatMoney(row.low, currency)}</dd>
                    <dt className="text-ink-muted">Fechamento</dt>
                    <dd className="text-right font-semibold" style={{ color: row.up ? UP : DOWN }}>
                      {formatMoney(row.close, currency)}
                    </dd>
                  </dl>
                </div>
              );
            }}
          />
          <Bar dataKey="range" shape={<CandleShape />} isAnimationActive={false}>
            {rows.map((row) => (
              <Cell key={row.time} fill={row.up ? UP : DOWN} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
