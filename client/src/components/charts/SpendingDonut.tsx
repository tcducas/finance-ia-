import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { categoryColor, categoryLabel } from '../../lib/categories';
import { formatCurrency } from '../../lib/format';
import type { CategorySpending } from '../../types/finance';

interface SpendingDonutProps {
  spending: CategorySpending[];
}

interface Slice {
  id: string;
  label: string;
  total: number;
  color: string;
}

const MAX_SLICES = 6;

/** Donut de gastos por categoria: cor fixa por categoria, excedente vira “Outros”. */
export function SpendingDonut({ spending }: SpendingDonutProps) {
  const { slices, total } = useMemo(() => {
    const top = spending.slice(0, MAX_SLICES);
    const rest = spending.slice(MAX_SLICES);
    const result: Slice[] = top.map((s) => ({
      id: s.category,
      label: categoryLabel(s.category),
      total: s.total,
      color: categoryColor(s.category),
    }));
    const restTotal = rest.reduce((sum, s) => sum + s.total, 0);
    if (restTotal > 0) {
      result.push({
        id: '__outros__',
        label: 'Outros',
        total: Math.round(restTotal * 100) / 100,
        color: 'var(--chart-other)',
      });
    }
    return { slices: result, total: spending.reduce((sum, s) => sum + s.total, 0) };
  }, [spending]);

  if (slices.length === 0) {
    return (
      <p className="grid h-56 place-items-center text-sm text-ink-muted">
        Sem gastos neste mês ainda.
      </p>
    );
  }

  return (
    <div>
      <div className="relative h-56" role="img" aria-label="Gastos por categoria">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="label"
              innerRadius="64%"
              outerRadius="88%"
              paddingAngle={1.5}
              stroke="var(--elevated)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {slices.map((slice) => (
                <Cell key={slice.id} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                const item = payload?.[0]?.payload as Slice | undefined;
                if (!active || !item) return null;
                return (
                  <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-ink-muted tabular-nums">
                      {formatCurrency(item.total)} · {Math.round((item.total / total) * 100)}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-ink-muted">Total gasto</p>
            <p className="text-lg font-bold tabular-nums">{formatCurrency(total)}</p>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5" aria-label="Legenda de categorias">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 text-sm">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="flex-1 truncate">{slice.label}</span>
            <span className="text-ink-muted tabular-nums">{formatCurrency(slice.total)}</span>
            <span className="w-10 text-right text-xs text-ink-muted tabular-nums">
              {Math.round((slice.total / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
