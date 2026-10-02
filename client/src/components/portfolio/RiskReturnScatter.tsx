import { useMemo } from 'react';
import {
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import {
  ASSET_CLASS_COLORS,
  ASSET_CLASS_LABELS,
  type PositionMetrics,
} from '../../services/portfolio';
import { formatCurrency } from '../../lib/format';

interface RiskReturnScatterProps {
  positions: PositionMetrics[];
}

interface Point {
  ticker: string;
  risco: number;
  retorno: number;
  peso: number;
  valor: number;
  assetClass: PositionMetrics['assetClass'];
}

/**
 * Risco × retorno por posição. É o gráfico que responde "o que está me pagando
 * pelo risco que corro": acima da linha zero você ganha, à direita você oscila
 * mais. O tamanho da bolha é o peso na carteira, porque um ativo ótimo com 1% de
 * peso não muda o resultado.
 *
 * Só entram posições com volatilidade calculável — sem histórico não há eixo X,
 * e inventar um ponto em zero sugeriria risco nulo.
 */
export function RiskReturnScatter({ positions }: RiskReturnScatterProps) {
  const points = useMemo<Point[]>(
    () =>
      positions
        .filter((p) => p.volatility !== null && p.profitPercent !== null)
        .map((p) => ({
          ticker: p.ticker,
          risco: Math.round((p.volatility as number) * 1000) / 10,
          retorno: p.profitPercent as number,
          peso: Math.max(p.weight, 1),
          valor: p.currentValue,
          assetClass: p.assetClass,
        })),
    [positions],
  );

  const excluded = positions.length - points.length;

  if (points.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-elevated p-4">
        <h4 className="text-sm font-semibold">Risco × retorno</h4>
        <p className="mt-6 mb-6 text-center text-sm text-ink-muted">
          Nenhuma posição tem histórico de preço suficiente para calcular a volatilidade.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-elevated p-4">
      <h4 className="text-sm font-semibold">Risco × retorno</h4>
      <p className="mb-2 text-xs text-ink-muted">
        Cada bolha é uma posição; o tamanho é o peso na carteira. Acima da linha, lucro.
      </p>

      <div className="h-64" role="img" aria-label="Dispersão de risco contra retorno por posição">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 12, bottom: 18, left: 4 }}>
            <CartesianGrid stroke="var(--line)" strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="risco"
              name="Volatilidade"
              unit="%"
              tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
              stroke="var(--line)"
              label={{
                value: 'volatilidade anual (%)',
                position: 'insideBottom',
                offset: -10,
                fontSize: 11,
                fill: 'var(--ink-muted)',
              }}
            />
            <YAxis
              type="number"
              dataKey="retorno"
              name="Retorno"
              unit="%"
              tick={{ fontSize: 11, fill: 'var(--ink-muted)' }}
              stroke="var(--line)"
              width={48}
            />
            <ZAxis type="number" dataKey="peso" range={[60, 600]} />
            <ReferenceLine y={0} stroke="var(--ink-muted)" strokeDasharray="4 4" />
            <Tooltip
              content={({ active, payload }) => {
                const point = payload?.[0]?.payload as Point | undefined;
                if (!active || !point) return null;
                return (
                  <div className="rounded-xl border border-line bg-elevated px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold">{point.ticker}</p>
                    <p className="text-ink-muted">{ASSET_CLASS_LABELS[point.assetClass]}</p>
                    <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-3 tabular-nums">
                      <dt className="text-ink-muted">Retorno</dt>
                      <dd className="text-right">{point.retorno.toFixed(1)}%</dd>
                      <dt className="text-ink-muted">Volatilidade</dt>
                      <dd className="text-right">{point.risco.toFixed(1)}%</dd>
                      <dt className="text-ink-muted">Peso</dt>
                      <dd className="text-right">{point.peso.toFixed(1)}%</dd>
                      <dt className="text-ink-muted">Valor</dt>
                      <dd className="text-right">{formatCurrency(point.valor)}</dd>
                    </dl>
                  </div>
                );
              }}
            />
            <Scatter data={points} isAnimationActive={false}>
              {points.map((point) => (
                <Cell
                  key={point.ticker}
                  fill={ASSET_CLASS_COLORS[point.assetClass]}
                  fillOpacity={0.7}
                  stroke={ASSET_CLASS_COLORS[point.assetClass]}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {excluded > 0 && (
        <p className="mt-2 text-[11px] text-ink-muted">
          {excluded} {excluded === 1 ? 'posição' : 'posições'} fora do gráfico por falta de
          histórico de preço ou de preço médio.
        </p>
      )}
    </div>
  );
}
