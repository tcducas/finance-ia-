import { formatCurrency } from '../../lib/format';
import type { Scenario, ScenarioName } from '../../types/planning';
import { formatMonths } from './GoalCard';

const LABEL: Record<ScenarioName, string> = {
  pessimista: 'Pessimista',
  base: 'Base',
  otimista: 'Otimista',
};

interface ScenarioTableProps {
  scenarios: Scenario[];
  horizon: number;
}

/** Cenários de rentabilidade (±2 p.p.) — o "e se" da projeção. */
export function ScenarioTable({ scenarios, horizon }: ScenarioTableProps) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">
        Cenários de rentabilidade no horizonte de {horizon} meses
      </caption>
      <thead>
        <tr className="text-xs text-ink-muted uppercase tracking-wide">
          <th scope="col" className="py-1.5 text-left font-medium">
            Cenário
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Taxa
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Saldo projetado
          </th>
          <th scope="col" className="py-1.5 text-right font-medium">
            Bate a meta em
          </th>
        </tr>
      </thead>
      <tbody>
        {scenarios.map((s) => (
          <tr key={s.name} className="border-t border-line">
            <th scope="row" className="py-2 text-left font-medium">
              {LABEL[s.name]}
            </th>
            <td className="py-2 text-right tabular-nums">{(s.annualRate * 100).toFixed(1)}%</td>
            <td className="py-2 text-right tabular-nums">{formatCurrency(s.balance)}</td>
            <td className="py-2 text-right tabular-nums">
              {s.monthsToTarget === null ? 'não chega' : formatMonths(s.monthsToTarget)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
