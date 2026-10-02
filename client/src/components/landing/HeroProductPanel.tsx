import { ArrowUpRight, Sparkles, Wallet } from 'lucide-react';

/**
 * Recorte do app no herói da landing.
 *
 * Desenhado em SVG inline + CSS de propósito: a landing é a primeira coisa que
 * carrega e não deve puxar o Recharts junto. Os números são EXEMPLO, rotulado
 * como tal — mas a composição espelha telas que existem de verdade (patrimônio
 * com sparkline, donut de gastos, pilares do score, candles do board).
 */

const SPARK = [28, 31, 30, 34, 33, 38, 36, 41, 44, 42, 47, 52];

const CATEGORIES = [
  { label: 'Moradia', pct: 34, color: 'var(--chart-1)' },
  { label: 'Mercado', pct: 22, color: 'var(--chart-2)' },
  { label: 'Transporte', pct: 16, color: 'var(--chart-3)' },
  { label: 'Lazer', pct: 13, color: 'var(--chart-4)' },
  { label: 'Saúde', pct: 9, color: 'var(--chart-5)' },
  { label: 'Outros', pct: 6, color: 'var(--chart-other)' },
];

const PILLARS = [
  { label: 'Poupança', value: 34, max: 40 },
  { label: 'Reserva', value: 26, max: 30 },
  { label: 'Fixos', value: 15, max: 20 },
  { label: 'Orçamento', value: 8, max: 10 },
];

/** Candles: [abertura, máxima, mínima, fechamento] numa escala 0–100. */
const CANDLES: Array<[number, number, number, number]> = [
  [40, 52, 36, 48],
  [48, 55, 44, 45],
  [45, 50, 38, 41],
  [41, 58, 40, 56],
  [56, 62, 52, 60],
  [60, 64, 50, 53],
  [53, 59, 48, 58],
  [58, 72, 56, 70],
  [70, 74, 64, 66],
  [66, 80, 64, 78],
];

/** Caminho da sparkline a partir dos valores, normalizado no viewBox 100×32. */
function sparkPath(values: number[]): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 30 - ((value - min) / span) * 26;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

/** Donut por arcos: cada fatia vira um traço do círculo via stroke-dasharray. */
function DonutGastos() {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <svg viewBox="0 0 100 100" className="size-28 shrink-0" role="img" aria-label="Exemplo de gastos por categoria">
      {CATEGORIES.map((category) => {
        const length = (category.pct / 100) * circumference;
        const dash = `${length - 1.5} ${circumference - length + 1.5}`;
        const element = (
          <circle
            key={category.label}
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={category.color}
            strokeWidth="13"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          />
        );
        offset += length;
        return element;
      })}
      <text
        x="50"
        y="47"
        textAnchor="middle"
        className="fill-[color:var(--ink-muted)]"
        style={{ fontSize: 8 }}
      >
        gastos
      </text>
      <text
        x="50"
        y="58"
        textAnchor="middle"
        className="fill-[color:var(--ink)]"
        style={{ fontSize: 11, fontWeight: 700 }}
      >
        4.280
      </text>
    </svg>
  );
}

function CandleStrip() {
  return (
    <svg
      viewBox="0 0 220 90"
      className="h-20 w-full"
      role="img"
      aria-label="Exemplo de candles do board de mercado"
      preserveAspectRatio="none"
    >
      {CANDLES.map((candle, index) => {
        const [open, high, low, close] = candle;
        const up = close >= open;
        const color = up ? 'var(--status-good)' : 'var(--status-bad)';
        const x = 10 + index * 21;
        const scale = (value: number) => 85 - (value / 100) * 78;
        return (
          <g key={index}>
            <line x1={x} x2={x} y1={scale(high)} y2={scale(low)} stroke={color} strokeWidth="1.5" />
            <rect
              x={x - 5}
              y={scale(Math.max(open, close))}
              width="10"
              height={Math.max(2, Math.abs(scale(open) - scale(close)))}
              fill={color}
              fillOpacity={up ? 0.85 : 1}
              rx="1"
            />
          </g>
        );
      })}
    </svg>
  );
}

export function HeroProductPanel() {
  return (
    <div
      className="enter relative w-full max-w-lg rounded-[1.75rem] border border-line bg-elevated p-3 shadow-[0_32px_80px_-24px_rgb(0_0_0/0.28)]"
      style={{ ['--enter-step' as string]: 3 }}
    >
      {/* Barra da "janela", para o painel ler como produto e não como ilustração. */}
      <div className="mb-3 flex items-center justify-between px-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-lg bg-gold text-[11px] font-extrabold text-white">
            A
          </span>
          <span className="text-xs font-semibold">Outubro de 2026</span>
          <span className="rounded-full bg-gold px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
            Pro
          </span>
        </div>
        <span className="text-[10px] text-ink-muted">exemplo</span>
      </div>

      <div className="grid gap-2.5">
        {/* Patrimônio + sparkline */}
        <div className="rounded-2xl border border-line bg-canvas p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-wide text-ink-muted uppercase">
                <Wallet className="size-3" aria-hidden />
                Patrimônio líquido
              </p>
              <p className="mt-0.5 font-display text-2xl font-bold tabular-nums">R$ 41.600</p>
              <p
                className="flex items-center gap-1 text-xs font-semibold tabular-nums"
                style={{ color: 'var(--status-good)' }}
              >
                <ArrowUpRight className="size-3" aria-hidden />
                +18,4% em 12 meses
              </p>
            </div>
            <svg
              viewBox="0 0 100 32"
              className="h-14 w-28 shrink-0"
              role="img"
              aria-label="Exemplo de evolução do patrimônio"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="heroSpark" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--status-good)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--status-good)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${sparkPath(SPARK)} L100 32 L0 32 Z`}
                fill="url(#heroSpark)"
                stroke="none"
              />
              <path
                d={sparkPath(SPARK)}
                fill="none"
                stroke="var(--status-good)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2">
          {/* Donut de gastos */}
          <div className="rounded-2xl border border-line bg-canvas p-3.5">
            <p className="mb-2 text-[10px] font-medium tracking-wide text-ink-muted uppercase">
              Gastos por categoria
            </p>
            <div className="flex items-center gap-3">
              <DonutGastos />
              <ul className="min-w-0 flex-1 space-y-1">
                {CATEGORIES.slice(0, 4).map((category) => (
                  <li key={category.label} className="flex items-center gap-1.5 text-[11px]">
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: category.color }}
                      aria-hidden
                    />
                    <span className="truncate text-ink-muted">{category.label}</span>
                    <span className="ml-auto tabular-nums">{category.pct}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Score por pilares */}
          <div className="rounded-2xl border border-line bg-canvas p-3.5">
            <div className="mb-2 flex items-baseline justify-between">
              <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
                Score financeiro
              </p>
              <p
                className="font-display text-lg font-bold tabular-nums"
                style={{ color: 'var(--status-good)' }}
              >
                83
              </p>
            </div>
            <ul className="space-y-1.5">
              {PILLARS.map((pillar) => (
                <li key={pillar.label}>
                  <div className="flex justify-between text-[10px] text-ink-muted">
                    <span>{pillar.label}</span>
                    <span className="tabular-nums">
                      {pillar.value}/{pillar.max}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(pillar.value / pillar.max) * 100}%`,
                        backgroundColor: 'var(--status-good)',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Board de mercado */}
        <div className="rounded-2xl border border-line bg-canvas p-3.5">
          <div className="flex items-baseline justify-between">
            <p className="text-[10px] font-medium tracking-wide text-ink-muted uppercase">
              BTC/BRL · 1 hora
            </p>
            <p className="text-xs font-semibold tabular-nums" style={{ color: 'var(--status-good)' }}>
              +2,81%
            </p>
          </div>
          <CandleStrip />
        </div>

        {/* Copiloto */}
        <div className="flex items-start gap-2.5 rounded-2xl border border-gold/40 bg-canvas p-3.5">
          <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-gold text-white">
            <Sparkles className="size-3.5" aria-hidden />
          </span>
          <p className="text-[11px] leading-relaxed text-ink-muted">
            <span className="font-medium text-ink">Copiloto: </span>
            sua carteira está concentrada — 4 posições efetivas e HHI 0,31. Antes de aumentar risco,
            a reserva cobre 5,2 meses.
          </p>
        </div>
      </div>
    </div>
  );
}
