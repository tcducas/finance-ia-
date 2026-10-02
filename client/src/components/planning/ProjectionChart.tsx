import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCurrency } from '../../lib/format';
import type { GoalProjection } from '../../types/planning';

interface ProjectionChartProps {
  projection: GoalProjection;
}

interface Row {
  month: number;
  aportado: number;
  juros: number;
  balance: number;
}

/** Abrevia no eixo: 120000 → "120k". */
function compact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1000) return `${Math.round(value / 1000)}k`;
  return String(Math.round(value));
}

/**
 * Área empilhada aportado × juros: mostra de onde vem o saldo projetado, que é
 * o ponto pedagógico dos juros compostos. Linha tracejada = valor-alvo.
 */
export function ProjectionChart({ projection }: ProjectionChartProps) {
  const rows = useMemo<Row[]>(
    () =>
      projection.series.map((p) => ({
        month: p.month,
        // O saldo inicial entra junto do aportado: é dinheiro do usuário, não juros.
        aportado: p.balance - p.interest,
        juros: p.interest,
        balance: p.balance,
      })),
    [projection.series],
  );

  const target = projection.goal.target_amount;

  return (
    <div className="h-72" role="img" aria-label={`Projeção da meta ${projection.goal.name}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={(m: number) => (m % 12 === 0 ? `${m / 12}a` : '')}
            tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
            stroke="var(--line)"
          />
          <YAxis
            tickFormatter={compact}
            tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
            stroke="var(--line)"
            width={44}
          />
          <ReferenceLine
            y={target}
            stroke="var(--gold)"
            strokeDasharray="4 4"
            label={{
              value: 'meta',
              position: 'insideTopRight',
              fill: 'var(--gold)',
              fontSize: 11,
            }}
          />
          <Area
            type="monotone"
            dataKey="aportado"
            name="Aportado"
            stackId="1"
            stroke="var(--chart-1)"
            fill="var(--chart-1)"
            fillOpacity={0.25}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="juros"
            name="Juros"
            stackId="1"
            stroke="var(--chart-4)"
            fill="var(--chart-4)"
            fillOpacity={0.35}
            isAnimationActive={false}
          />
          <Legend
            verticalAlign="top"
            height={28}
            wrapperStyle={{ fontSize: 12, color: 'var(--ink-muted)' }}
          />
          <Tooltip
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as Row | undefined;
              if (!active || !row) return null;
              return (
                <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
                  <p className="font-medium">
                    Mês {row.month}
                    {row.month >= 12 && ` · ${(row.month / 12).toFixed(1)} anos`}
                  </p>
                  <p className="mt-1 text-ink-muted tabular-nums">
                    Aportado: {formatCurrency(row.aportado)}
                  </p>
                  <p className="text-ink-muted tabular-nums">Juros: {formatCurrency(row.juros)}</p>
                  <p className="mt-1 font-semibold tabular-nums">
                    Saldo: {formatCurrency(row.balance)}
                  </p>
                </div>
              );
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
