/**
 * Contrato de anonimização (LGPD) — roda ANTES de qualquer chamada a provedor.
 *
 * PODE ir ao prompt: tickers, classes e percentuais, FAIXAS de patrimônio,
 * perfil do investidor, categorias de gasto (com percentuais).
 * NUNCA vai: nome, CPF, e-mail, telefone, valor absoluto do patrimônio,
 * qualquer identificador direto (user_id, ids).
 */

export interface RawFinancialContext {
  screen?: string;
  profile?: string;
  summary?: { receitas: number; despesas: number; saldo: number };
  spending?: Array<{ category: string; total: number }>;
  budgets?: Array<{ category: string; monthly_limit: number; spent: number }>;
  netWorth?: number;
  watchlist?: string[];
  assetTicker?: string;
}

export interface AnonymizedContext {
  tela?: string;
  perfil?: string;
  /** Percentual das despesas sobre a receita (sem valores absolutos). */
  comprometimento_renda_pct?: number;
  saldo_positivo?: boolean;
  gastos_por_categoria_pct?: Array<{ categoria: string; pct: number }>;
  orcamentos?: Array<{ categoria: string; uso_pct: number }>;
  faixa_patrimonio?: string;
  tickers_acompanhados?: string[];
  ticker_em_foco?: string;
}

/** Converte valor absoluto em faixa — nunca expõe o número real. */
export function netWorthBand(value: number): string {
  if (value < 0) return 'patrimônio líquido negativo';
  if (value < 10_000) return 'até R$ 10 mil';
  if (value < 50_000) return 'R$ 10 mil – R$ 50 mil';
  if (value < 100_000) return 'R$ 50 mil – R$ 100 mil';
  if (value < 500_000) return 'R$ 100 mil – R$ 500 mil';
  if (value < 1_000_000) return 'R$ 500 mil – R$ 1 milhão';
  return 'acima de R$ 1 milhão';
}

const TICKER_RE = /^[A-Z0-9^.]{1,12}$/;

export function anonymizeContext(raw: RawFinancialContext): AnonymizedContext {
  const out: AnonymizedContext = {};

  if (raw.screen) out.tela = raw.screen.slice(0, 40);
  if (raw.profile) out.perfil = raw.profile.slice(0, 40);

  if (raw.summary) {
    out.saldo_positivo = raw.summary.saldo >= 0;
    if (raw.summary.receitas > 0) {
      out.comprometimento_renda_pct = Math.round(
        (raw.summary.despesas / raw.summary.receitas) * 100,
      );
    }
  }

  if (raw.spending && raw.spending.length > 0) {
    const total = raw.spending.reduce((sum, s) => sum + s.total, 0);
    if (total > 0) {
      out.gastos_por_categoria_pct = raw.spending.map((s) => ({
        categoria: s.category.slice(0, 40),
        pct: Math.round((s.total / total) * 100),
      }));
    }
  }

  if (raw.budgets && raw.budgets.length > 0) {
    out.orcamentos = raw.budgets.map((b) => ({
      categoria: b.category.slice(0, 40),
      uso_pct: b.monthly_limit > 0 ? Math.round((b.spent / b.monthly_limit) * 100) : 0,
    }));
  }

  if (raw.netWorth !== undefined) out.faixa_patrimonio = netWorthBand(raw.netWorth);

  if (raw.watchlist) {
    out.tickers_acompanhados = raw.watchlist
      .map((t) => t.toUpperCase())
      .filter((t) => TICKER_RE.test(t))
      .slice(0, 20);
  }

  if (raw.assetTicker && TICKER_RE.test(raw.assetTicker.toUpperCase())) {
    out.ticker_em_foco = raw.assetTicker.toUpperCase();
  }

  return out;
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
const CPF_RE = /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g;
const PHONE_RE = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?9?\d{4}[-\s]?\d{4}\b/g;
const LONG_DIGITS_RE = /\b\d{7,}\b/g;

/** Remove PII óbvia do texto livre do usuário antes de ir ao provedor. */
export function sanitizeUserText(text: string): string {
  return text
    .replace(EMAIL_RE, '[e-mail removido]')
    .replace(CPF_RE, '[documento removido]')
    .replace(PHONE_RE, '[telefone removido]')
    .replace(LONG_DIGITS_RE, '[número removido]')
    .slice(0, 4_000);
}
