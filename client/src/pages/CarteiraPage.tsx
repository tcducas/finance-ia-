import {
  ArrowDownRight,
  ArrowUpRight,
  ChartPie,
  Landmark,
  PiggyBank,
  Repeat,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { PatrimonioEvolution } from '../components/charts/PatrimonioEvolution';
import { PortfolioPanel } from '../components/portfolio/PortfolioPanel';
import { SpendingDonut } from '../components/charts/SpendingDonut';
import { CopilotInsightCard } from '../components/copilot/CopilotInsightCard';
import { CsvImportDialog } from '../components/import/CsvImportDialog';
import { ActivationChecklist } from '../components/onboarding/ActivationChecklist';
import { TransactionList } from '../components/transactions/TransactionList';
import { StatCard } from '../components/ui/StatCard';
import { useCopilot } from '../context/CopilotContext';
import { useFinance } from '../context/FinanceContext';
import { AssetList } from '../components/assets/AssetList';
import { formatCurrency } from '../lib/format';

type Tab = 'fluxo' | 'patrimonio' | 'investimentos';

/**
 * Tela: Minha Carteira — rota `/app` (index, HOME pós-login)
 * Menu: "Minha Carteira" (1º item)
 * Fluxo de caixa do mês, aba Patrimônio e aba Investimentos (carteira importada
 * + panorama analítico: TIR, VPL, payback, risco, liquidez e alinhamento).
 */
export function CarteiraPage() {
  const { summary, spending, budgets, assets, loading, error } = useFinance();
  const { openWith } = useCopilot();
  const [tab, setTab] = useState<Tab>('fluxo');
  const [importOpen, setImportOpen] = useState(false);

  // 1.11 — cards ligados às fontes reais (sem mock nos números).
  const spentByCategory = new Map(spending.map((s) => [s.category, s.total]));
  const budgetLimit = budgets.reduce((sum, b) => sum + b.monthly_limit, 0);
  const budgetSpent = budgets.reduce(
    (sum, b) => sum + (spentByCategory.get(b.category) ?? 0),
    0,
  );
  const budgetPct = budgetLimit > 0 ? Math.round((budgetSpent / budgetLimit) * 100) : null;
  const patrimonio = assets.reduce(
    (sum, a) => sum + (a.is_liability ? -a.value : a.value),
    0,
  );
  const aporteDisponivel = Math.max(0, summary.saldo);

  return (
    <section aria-labelledby="carteira-titulo" className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="carteira-titulo" className="font-display text-2xl font-bold tracking-tight">
            Minha Carteira
          </h2>
          <p className="text-sm text-ink-muted">
            Entradas, saídas, patrimônio e a análise da sua carteira de investimentos.
          </p>
        </div>

        <div role="tablist" aria-label="Seções da carteira" className="flex rounded-full border border-line bg-elevated p-1">
          {(
            [
              { id: 'fluxo', label: 'Fluxo de caixa' },
              { id: 'patrimonio', label: 'Patrimônio' },
              { id: 'investimentos', label: 'Investimentos' },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                tab === id ? 'bg-gold text-on-gold' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-line bg-elevated px-4 py-3 text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}

      {tab === 'fluxo' ? (
        <>
          <ActivationChecklist />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={ArrowUpRight}
              label="Receitas"
              value={formatCurrency(summary.receitas)}
              loading={loading}
            />
            <StatCard
              icon={ArrowDownRight}
              label="Despesas"
              value={formatCurrency(summary.despesas)}
              loading={loading}
            />
            <StatCard
              icon={PiggyBank}
              label="Saldo do mês"
              value={formatCurrency(summary.saldo)}
              loading={loading}
            />
            <StatCard
              icon={Repeat}
              label="Fixos × variáveis"
              value={`${formatCurrency(summary.fixos)} × ${formatCurrency(summary.variaveis)}`}
              hint="despesas recorrentes × pontuais"
              loading={loading}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard
              icon={ChartPie}
              label="Orçamento usado"
              value={budgetPct !== null ? `${budgetPct}%` : '—'}
              hint={
                budgetPct !== null
                  ? `${formatCurrency(budgetSpent)} de ${formatCurrency(budgetLimit)} planejados`
                  : 'defina limites na tela Gastos'
              }
              loading={loading}
            />
            <StatCard
              icon={Landmark}
              label="Patrimônio líquido"
              value={formatCurrency(patrimonio)}
              hint={assets.length === 0 ? 'cadastre na aba Patrimônio' : 'ativos − passivos'}
              loading={loading}
            />
            <StatCard
              icon={Sparkles}
              label="Aporte do mês"
              value={formatCurrency(aporteDisponivel)}
              hint="saldo livre — toque para pedir direcionamento ao copiloto"
              loading={loading}
              onClick={() =>
                openWith({
                  screen: 'carteira',
                  kickoff:
                    aporteDisponivel > 0
                      ? `Tenho ${formatCurrency(aporteDisponivel)} de saldo livre neste mês. Onde vale a pena alocar?`
                      : 'Meu saldo do mês está zerado ou negativo. Como me organizo para conseguir aportar?',
                })
              }
            />
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
              Evolução do patrimônio
            </h3>
            <PatrimonioEvolution />
          </div>

          <CopilotInsightCard />

          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
                  Movimentações
                </h3>
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-xs font-medium transition-colors hover:border-gold hover:text-gold"
                >
                  <Upload className="size-3.5" aria-hidden />
                  Importar CSV
                </button>
              </div>
              <TransactionList />
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-ink-muted uppercase tracking-wide">
                Gastos por categoria
              </h3>
              <div className="rounded-2xl border border-line bg-elevated p-4">
                <SpendingDonut spending={spending} />
              </div>
            </div>
          </div>
        </>
      ) : tab === 'patrimonio' ? (
        <div className="space-y-6">
          <PatrimonioEvolution />
          <AssetList />
        </div>
      ) : (
        <PortfolioPanel />
      )}

      <CsvImportDialog
        kind="transactions"
        open={importOpen}
        onClose={() => setImportOpen(false)}
      />
    </section>
  );
}
