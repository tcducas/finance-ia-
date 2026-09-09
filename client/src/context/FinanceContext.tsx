import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getProvider, type ImportResult } from '../services/data';
import type {
  Asset,
  AssetInput,
  Budget,
  BudgetInput,
  CategorySpending,
  PeriodSummary,
  Transaction,
  TransactionInput,
} from '../types/finance';

interface FinanceContextValue {
  month: string;
  transactions: Transaction[];
  budgets: Budget[];
  assets: Asset[];
  loading: boolean;
  error: string | null;
  summary: PeriodSummary;
  spending: CategorySpending[];
  addTransaction(input: TransactionInput): Promise<void>;
  removeTransaction(id: string): Promise<void>;
  saveBudget(input: BudgetInput): Promise<void>;
  removeBudget(id: string): Promise<void>;
  addAsset(input: AssetInput): Promise<void>;
  updateAsset(id: string, input: Partial<AssetInput>): Promise<void>;
  removeAsset(id: string): Promise<void>;
  importTransactions(rows: TransactionInput[]): Promise<ImportResult>;
  importAssets(rows: AssetInput[]): Promise<ImportResult>;
  transactionFormOpen: boolean;
  openTransactionForm(): void;
  closeTransactionForm(): void;
}

const FinanceContext = createContext<FinanceContextValue | null>(null);

function computeSummary(transactions: Transaction[]): PeriodSummary {
  let receitas = 0;
  let despesas = 0;
  let fixos = 0;
  for (const t of transactions) {
    if (t.type === 'receita') {
      receitas += t.amount;
    } else {
      despesas += t.amount;
      if (t.is_recurring) fixos += t.amount;
    }
  }
  const r2 = (v: number) => Math.round(v * 100) / 100;
  return {
    receitas: r2(receitas),
    despesas: r2(despesas),
    saldo: r2(receitas - despesas),
    fixos: r2(fixos),
    variaveis: r2(despesas - fixos),
  };
}

function computeSpending(transactions: Transaction[]): CategorySpending[] {
  const totals = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'despesa') continue;
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
  }
  return [...totals.entries()]
    .map(([category, total]) => ({ category, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => b.total - a.total);
}

export function FinanceProvider({ children }: { children: ReactNode }) {
  const month = new Date().toISOString().slice(0, 7);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);

  const refresh = useCallback(async () => {
    const provider = getProvider();
    try {
      const [tx, bd, as] = await Promise.all([
        provider.listTransactions(month),
        provider.listBudgets(),
        provider.listAssets(),
      ]);
      setTransactions(tx);
      setBudgets(bd);
      setAssets(as);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Toda mutação recarrega o estado — totais e gráficos recalculam na hora.
  const addTransaction = useCallback(
    async (input: TransactionInput) => {
      await getProvider().createTransaction(input);
      await refresh();
    },
    [refresh],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      await getProvider().deleteTransaction(id);
      await refresh();
    },
    [refresh],
  );

  const saveBudget = useCallback(
    async (input: BudgetInput) => {
      await getProvider().upsertBudget(input);
      await refresh();
    },
    [refresh],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      await getProvider().deleteBudget(id);
      await refresh();
    },
    [refresh],
  );

  const addAsset = useCallback(
    async (input: AssetInput) => {
      await getProvider().createAsset(input);
      await refresh();
    },
    [refresh],
  );

  const updateAsset = useCallback(
    async (id: string, input: Partial<AssetInput>) => {
      await getProvider().updateAsset(id, input);
      await refresh();
    },
    [refresh],
  );

  const removeAsset = useCallback(
    async (id: string) => {
      await getProvider().deleteAsset(id);
      await refresh();
    },
    [refresh],
  );

  const importTransactions = useCallback(
    async (rows: TransactionInput[]) => {
      const result = await getProvider().importTransactions(rows);
      await refresh();
      return result;
    },
    [refresh],
  );

  const importAssets = useCallback(
    async (rows: AssetInput[]) => {
      const result = await getProvider().importAssets(rows);
      await refresh();
      return result;
    },
    [refresh],
  );

  const summary = useMemo(() => computeSummary(transactions), [transactions]);
  const spending = useMemo(() => computeSpending(transactions), [transactions]);

  const value = useMemo<FinanceContextValue>(
    () => ({
      month,
      transactions,
      budgets,
      assets,
      loading,
      error,
      summary,
      spending,
      addTransaction,
      removeTransaction,
      saveBudget,
      removeBudget,
      addAsset,
      updateAsset,
      removeAsset,
      importTransactions,
      importAssets,
      transactionFormOpen,
      openTransactionForm: () => setTransactionFormOpen(true),
      closeTransactionForm: () => setTransactionFormOpen(false),
    }),
    [
      month,
      transactions,
      budgets,
      assets,
      loading,
      error,
      summary,
      spending,
      addTransaction,
      removeTransaction,
      saveBudget,
      removeBudget,
      addAsset,
      updateAsset,
      removeAsset,
      importTransactions,
      importAssets,
      transactionFormOpen,
    ],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance(): FinanceContextValue {
  const ctx = useContext(FinanceContext);
  if (!ctx) throw new Error('useFinance precisa do FinanceProvider.');
  return ctx;
}
