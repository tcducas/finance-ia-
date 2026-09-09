// Espelham as linhas do banco (server/src/lib/database.types.ts).

export type TransactionType = 'receita' | 'despesa';

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  occurred_on: string;
  description: string | null;
  is_recurring: boolean;
  created_at: string;
}

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  category: string;
  occurred_on: string;
  description?: string;
  is_recurring?: boolean;
}

export interface Budget {
  id: string;
  category: string;
  monthly_limit: number;
}

export interface BudgetInput {
  category: string;
  monthly_limit: number;
}

export interface Asset {
  id: string;
  kind: string;
  name: string;
  value: number;
  is_liability: boolean;
}

export interface AssetInput {
  kind: string;
  name: string;
  value: number;
  is_liability?: boolean;
}

export interface PeriodSummary {
  receitas: number;
  despesas: number;
  saldo: number;
  fixos: number;
  variaveis: number;
}

export interface CategorySpending {
  category: string;
  total: number;
}
