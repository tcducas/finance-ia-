import {
  Bitcoin,
  Building2,
  Globe,
  Sparkles,
  Target,
  Upload,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Bento grid dos recursos — segue a referência `Bento-Grid.md` do banco do
 * usuário: células de tamanhos diferentes encaixadas, uma ideia por bloco, raio
 * generoso com profundidade sutil (parece app, não site) e acento em apenas um
 * bloco. No mobile, coluna única.
 *
 * Cada bloco mostra um pedaço real da interface em SVG/CSS, nunca ícone solto
 * com texto abstrato — é o princípio que a referência de LP insiste.
 */

type Span = 'big' | 'wide' | 'tall' | 'unit';

const SPAN_CLASS: Record<Span, string> = {
  big: 'sm:col-span-2 sm:row-span-2',
  wide: 'sm:col-span-2',
  tall: 'sm:row-span-2',
  unit: '',
};

interface CellProps {
  span?: Span;
  icon: LucideIcon;
  title: string;
  text: string;
  /** Único bloco de acento da grade. */
  accent?: boolean;
  children?: ReactNode;
}

function Cell({ span = 'unit', icon: Icon, title, text, accent, children }: CellProps) {
  return (
    <article
      className={`bento-cell reveal flex flex-col rounded-3xl border p-5 ${SPAN_CLASS[span]} ${
        accent ? 'border-gold/45 bg-gold/[0.06]' : 'border-line bg-elevated'
      }`}
    >
      <span
        className={`mb-3 grid size-9 shrink-0 place-items-center rounded-xl ${
          accent ? 'bg-gold text-on-gold' : 'border border-line bg-canvas text-gold'
        }`}
      >
        <Icon className="size-4.5" aria-hidden />
      </span>
      <h3 className="font-display text-base font-bold tracking-tight">{title}</h3>
      <p className="mt-1 text-sm text-ink-muted">{text}</p>
      {children && <div className="mt-4 flex-1">{children}</div>}
    </article>
  );
}

// --- Visuais dos blocos ------------------------------------------------------

/** Dispersão risco × retorno, como a da análise de carteira. */
function ScatterMini() {
  const points = [
    { x: 18, y: 62, r: 9, c: 'var(--chart-1)' },
    { x: 34, y: 48, r: 6, c: 'var(--chart-2)' },
    { x: 52, y: 70, r: 12, c: 'var(--chart-4)' },
    { x: 68, y: 34, r: 7, c: 'var(--chart-3)' },
    { x: 84, y: 22, r: 5, c: 'var(--chart-5)' },
    { x: 44, y: 28, r: 8, c: 'var(--chart-7)' },
  ];
  return (
    <svg viewBox="0 0 100 80" className="h-full w-full" role="img" aria-label="Exemplo de risco contra retorno">
      {[20, 40, 60].map((y) => (
        <line key={y} x1="6" x2="98" y1={y} y2={y} stroke="var(--line)" strokeDasharray="2 3" />
      ))}
      <line x1="6" x2="98" y1="52" y2="52" stroke="var(--ink-muted)" strokeWidth="0.7" />
      {points.map((point) => (
        <circle
          key={`${point.x}-${point.y}`}
          cx={point.x}
          cy={point.y}
          r={point.r}
          fill={point.c}
          fillOpacity="0.55"
          stroke={point.c}
          strokeWidth="0.8"
        />
      ))}
    </svg>
  );
}

/** Métricas da análise de investimentos. */
function MetricsRow() {
  const metrics = [
    { label: 'TIR', value: '19,4%', tone: 'var(--status-good)' },
    { label: 'VPL', value: '+R$ 3,1k', tone: 'var(--status-good)' },
    { label: 'HHI', value: '0,31', tone: 'var(--status-warn)' },
    { label: 'Volat.', value: '24%', tone: undefined },
  ];
  return (
    <dl className="grid grid-cols-4 gap-2">
      {metrics.map((metric) => (
        <div key={metric.label} className="rounded-xl border border-line bg-canvas px-2 py-1.5">
          <dt className="text-[9px] tracking-wide text-ink-muted uppercase">{metric.label}</dt>
          <dd
            className="font-display text-sm font-bold tabular-nums"
            style={metric.tone ? { color: metric.tone } : undefined}
          >
            {metric.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Curva de projeção separando aportado de juros. */
function ProjectionMini() {
  return (
    <svg viewBox="0 0 100 70" className="h-full w-full" role="img" aria-label="Exemplo de projeção de meta">
      <defs>
        <linearGradient id="bentoJuros" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--chart-4)" stopOpacity="0.45" />
          <stop offset="100%" stopColor="var(--chart-4)" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <line x1="0" x2="100" y1="14" y2="14" stroke="var(--gold)" strokeDasharray="3 3" strokeWidth="0.8" />
      <path
        d="M0 66 L20 59 L40 51 L60 42 L80 32 L100 20 L100 70 L0 70 Z"
        fill="url(#bentoJuros)"
      />
      <path d="M0 66 L20 61 L40 56 L60 51 L80 46 L100 41 L100 70 L0 70 Z" fill="var(--chart-1)" fillOpacity="0.3" />
      <path
        d="M0 66 L20 59 L40 51 L60 42 L80 32 L100 20"
        fill="none"
        stroke="var(--chart-4)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Barra de orçamento estourando o limite. */
function BudgetMini() {
  const rows = [
    { label: 'Moradia', pct: 72, tone: 'var(--status-good)' },
    { label: 'Mercado', pct: 94, tone: 'var(--status-warn)' },
    { label: 'Lazer', pct: 118, tone: 'var(--status-bad)' },
  ];
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="flex justify-between text-[10px] text-ink-muted">
            <span>{row.label}</span>
            <span className="tabular-nums">{row.pct}%</span>
          </div>
          <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full"
              style={{ width: `${Math.min(row.pct, 100)}%`, backgroundColor: row.tone }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Os três mercados, cada um com seu selo e o que entrega. */
function MarketsMini() {
  const markets = [
    { icon: Building2, name: 'Ações B3', detail: 'atraso ~15 min', color: 'var(--chart-2)' },
    { icon: Bitcoin, name: 'Cripto', detail: 'tempo real + livro', color: 'var(--chart-1)' },
    { icon: Globe, name: 'Internacional', detail: 'ações e ETFs em US$', color: 'var(--chart-7)' },
  ];
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {markets.map((market) => (
        <div
          key={market.name}
          className="rounded-xl border border-line bg-canvas px-3 py-2.5"
        >
          <market.icon className="size-4" style={{ color: market.color }} aria-hidden />
          <p className="mt-1.5 text-xs font-semibold">{market.name}</p>
          <p className="text-[10px] text-ink-muted">{market.detail}</p>
        </div>
      ))}
    </div>
  );
}

/** Colunas do CSV que o import aceita. */
function CsvMini() {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-canvas">
      <div className="flex gap-2 border-b border-line px-2.5 py-1.5 text-[9px] font-semibold tracking-wide text-ink-muted uppercase">
        <span className="flex-1">ticker</span>
        <span className="w-10 text-right">qtd</span>
        <span className="w-12 text-right">pm</span>
      </div>
      {[
        ['PETR4', '100', '30,10'],
        ['HGLG11', '18', '158,40'],
        ['BTCBRL', '0,04', '598k'],
      ].map(([ticker, qty, price]) => (
        <div key={ticker} className="flex gap-2 px-2.5 py-1 font-mono text-[10px] tabular-nums">
          <span className="flex-1 font-semibold">{ticker}</span>
          <span className="w-10 text-right text-ink-muted">{qty}</span>
          <span className="w-12 text-right text-ink-muted">{price}</span>
        </div>
      ))}
    </div>
  );
}

export function BentoGrid() {
  return (
    <div className="grid auto-rows-auto gap-3 sm:grid-cols-4 sm:auto-rows-[11rem]">
      <Cell
        span="big"
        icon={Target}
        title="Carteira importada, analisada de verdade"
        text="Importe o CSV da corretora e veja TIR, VPL, payback, concentração e volatilidade — cada número com o método por trás dele."
      >
        <div className="flex h-full flex-col gap-3">
          <MetricsRow />
          <div className="min-h-28 flex-1 rounded-xl border border-line bg-canvas p-2">
            <ScatterMini />
          </div>
        </div>
      </Cell>

      <Cell
        span="tall"
        icon={Target}
        title="Metas com juros compostos"
        text="Projeção separando o que você aportou do que rendeu, com cenários de ±2 p.p."
      >
        <div className="h-full min-h-28 rounded-xl border border-line bg-canvas p-2">
          <ProjectionMini />
        </div>
      </Cell>

      <Cell
        icon={Building2}
        title="Orçamento que avisa"
        text="Limite por categoria, com alerta antes de estourar."
      >
        <BudgetMini />
      </Cell>

      <Cell
        icon={Sparkles}
        title="Copiloto que explica"
        text="Pergunte sobre qualquer tela. Ele conhece o vocabulário de cada uma — candle, spread, livro de ofertas."
        accent
      />

      <Cell
        span="wide"
        icon={Globe}
        title="Três mercados, um só board"
        text="Candles, estatísticas e — em cripto — livro de ofertas e negócios ao vivo."
      >
        <MarketsMini />
      </Cell>

      <Cell
        icon={Upload}
        title="Import tolerante"
        text="Aceita o CSV como a corretora exporta: ponto e vírgula, R$, data brasileira."
      >
        <CsvMini />
      </Cell>
    </div>
  );
}
