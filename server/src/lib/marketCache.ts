/**
 * Cache curto em memória para cotações: N usuários vendo o mesmo ativo
 * geram UMA consulta externa dentro da janela do TTL.
 */
interface Entry<T> {
  expiresAt: number;
  value: T;
  /** Promessa em voo para deduplicar chamadas concorrentes. */
  pending?: Promise<T>;
}

const DEFAULT_TTL_MS = 60_000;

export class MarketCache {
  private entries = new Map<string, Entry<unknown>>();

  constructor(private readonly ttlMs: number = DEFAULT_TTL_MS) {}

  async getOrFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const entry = this.entries.get(key) as Entry<T> | undefined;

    if (entry && entry.expiresAt > now) return entry.value;
    if (entry?.pending) return entry.pending;

    const pending = fetcher().then(
      (value) => {
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        return value;
      },
      (error: unknown) => {
        this.entries.delete(key);
        throw error;
      },
    );

    this.entries.set(key, {
      value: entry?.value as T,
      expiresAt: 0,
      pending,
    });
    return pending;
  }

  clear(): void {
    this.entries.clear();
  }
}

export const marketCache = new MarketCache();

// Catálogos (lista de tickers válidos por mercado) mudam pouco — TTL bem mais
// longo. O dedupe de promessa em voo é essencial aqui: exchangeInfo/available
// são chamadas caras; N requisições concorrentes no boot geram só UMA.
export const catalogCache = new MarketCache(12 * 60 * 60 * 1000);
