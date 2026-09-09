import type {
  Asset,
  AssetInput,
  Budget,
  BudgetInput,
  Transaction,
  TransactionInput,
} from '../types/finance';

/**
 * Fonte de dados da UI. Duas implementações:
 * - HttpProvider: chama a API (/api/*) com o token da sessão — caminho real.
 * - LocalProvider: localStorage, para demonstração enquanto o login/Supabase
 *   não está configurado. PLACEHOLDER — sem dados financeiros reais.
 */
export interface DataProvider {
  listTransactions(month: string): Promise<Transaction[]>;
  createTransaction(input: TransactionInput): Promise<Transaction>;
  deleteTransaction(id: string): Promise<void>;
  listBudgets(): Promise<Budget[]>;
  upsertBudget(input: BudgetInput): Promise<Budget>;
  deleteBudget(id: string): Promise<void>;
  listAssets(): Promise<Asset[]>;
  createAsset(input: AssetInput): Promise<Asset>;
  updateAsset(id: string, input: Partial<AssetInput>): Promise<Asset>;
  deleteAsset(id: string): Promise<void>;
}

const TOKEN_KEY = 'aura-token';

export function getSessionToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/** Modo demonstração: sem sessão, os dados vivem só neste navegador. */
export function isDemoMode(): boolean {
  return getSessionToken() === null;
}

// ---------------------------------------------------------------------------
// HttpProvider
// ---------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });
  const body = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { message: string; code: string } }
    | null;
  if (!res.ok || body === null || 'error' in body) {
    const error = body && 'error' in body ? body.error : undefined;
    throw new ApiError(
      error?.message ?? 'Erro de comunicação com o servidor.',
      error?.code ?? 'NETWORK_ERROR',
      res.status,
    );
  }
  return body.data;
}

const httpProvider: DataProvider = {
  listTransactions: (month) => http(`/api/transactions?month=${month}`),
  createTransaction: (input) =>
    http('/api/transactions', { method: 'POST', body: JSON.stringify(input) }),
  deleteTransaction: async (id) => {
    await http(`/api/transactions/${id}`, { method: 'DELETE' });
  },
  listBudgets: () => http('/api/budgets'),
  upsertBudget: (input) => http('/api/budgets', { method: 'POST', body: JSON.stringify(input) }),
  deleteBudget: async (id) => {
    await http(`/api/budgets/${id}`, { method: 'DELETE' });
  },
  listAssets: () => http('/api/assets'),
  createAsset: (input) => http('/api/assets', { method: 'POST', body: JSON.stringify(input) }),
  updateAsset: (id, input) =>
    http(`/api/assets/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  deleteAsset: async (id) => {
    await http(`/api/assets/${id}`, { method: 'DELETE' });
  },
};

// ---------------------------------------------------------------------------
// LocalProvider (demonstração)
// ---------------------------------------------------------------------------

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, rows: T[]): void {
  localStorage.setItem(key, JSON.stringify(rows));
}

const K = {
  transactions: 'aura-demo-transactions',
  budgets: 'aura-demo-budgets',
  assets: 'aura-demo-assets',
} as const;

const localProvider: DataProvider = {
  async listTransactions(month) {
    return load<Transaction>(K.transactions)
      .filter((t) => t.occurred_on.startsWith(month))
      .sort((a, b) => b.occurred_on.localeCompare(a.occurred_on));
  },
  async createTransaction(input) {
    const rows = load<Transaction>(K.transactions);
    const row: Transaction = {
      id: crypto.randomUUID(),
      type: input.type,
      category: input.category,
      amount: Math.round(input.amount * 100) / 100,
      occurred_on: input.occurred_on,
      description: input.description ?? null,
      is_recurring: input.is_recurring ?? false,
      created_at: new Date().toISOString(),
    };
    save(K.transactions, [row, ...rows]);
    return row;
  },
  async deleteTransaction(id) {
    save(
      K.transactions,
      load<Transaction>(K.transactions).filter((t) => t.id !== id),
    );
  },
  async listBudgets() {
    return load<Budget>(K.budgets).sort((a, b) => a.category.localeCompare(b.category));
  },
  async upsertBudget(input) {
    const rows = load<Budget>(K.budgets);
    const existing = rows.find((b) => b.category === input.category);
    if (existing) {
      existing.monthly_limit = input.monthly_limit;
      save(K.budgets, rows);
      return existing;
    }
    const row: Budget = { id: crypto.randomUUID(), ...input };
    save(K.budgets, [...rows, row]);
    return row;
  },
  async deleteBudget(id) {
    save(
      K.budgets,
      load<Budget>(K.budgets).filter((b) => b.id !== id),
    );
  },
  async listAssets() {
    return load<Asset>(K.assets);
  },
  async createAsset(input) {
    const rows = load<Asset>(K.assets);
    const row: Asset = {
      id: crypto.randomUUID(),
      kind: input.kind,
      name: input.name,
      value: Math.round(input.value * 100) / 100,
      is_liability: input.is_liability ?? false,
    };
    save(K.assets, [...rows, row]);
    return row;
  },
  async updateAsset(id, input) {
    const rows = load<Asset>(K.assets);
    const row = rows.find((a) => a.id === id);
    if (!row) throw new Error('Item não encontrado.');
    Object.assign(row, input);
    save(K.assets, rows);
    return row;
  },
  async deleteAsset(id) {
    save(
      K.assets,
      load<Asset>(K.assets).filter((a) => a.id !== id),
    );
  },
};

export function getProvider(): DataProvider {
  return isDemoMode() ? localProvider : httpProvider;
}
