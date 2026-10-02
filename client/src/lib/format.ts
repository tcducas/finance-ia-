const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatCurrency(value: number): string {
  return brl.format(value);
}

/** Ex.: "2026-07-10" → "10 jul". */
export function formatDayMonth(isoDate: string): string {
  const [y = 0, m = 1, d = 1] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
    .format(date)
    .replace('.', '');
}

/** Data de hoje em YYYY-MM-DD (fuso local). */
export function todayISO(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** Ex.: "julho de 2026" → "Julho de 2026". */
export function formatMonthYear(date: Date): string {
  const label = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/**
 * Cotação de cripto não é BRL: um par BTCUSDT está em dólar e um altcoin pode
 * valer R$ 0,000042. formatMoney respeita a moeda do ativo e dá casas decimais
 * suficientes para o preço não virar "R$ 0,00".
 */
const moneyCache = new Map<string, Intl.NumberFormat>();

function moneyFormatter(currency: string, digits: number): Intl.NumberFormat {
  const key = `${currency}:${digits}`;
  const cached = moneyCache.get(key);
  if (cached) return cached;
  // Moedas como USDT/BUSD não existem no ISO 4217 — Intl lançaria; caímos no
  // formato decimal com o código na frente.
  let formatter: Intl.NumberFormat;
  try {
    formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency,
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  } catch {
    formatter = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }
  moneyCache.set(key, formatter);
  return formatter;
}

/** Casas decimais úteis: 2 para preços normais, até 8 para cripto de centavo. */
function digitsFor(value: number): number {
  const abs = Math.abs(value);
  if (abs === 0 || abs >= 1) return 2;
  if (abs >= 0.01) return 4;
  if (abs >= 0.0001) return 6;
  return 8;
}

const ISO_CURRENCIES = new Set(['BRL', 'USD', 'EUR']);

export function formatMoney(value: number, currency = 'BRL'): string {
  const digits = digitsFor(value);
  const formatted = moneyFormatter(currency, digits).format(value);
  // Stablecoin/cripto como moeda de cotação: mostra o código explicitamente.
  return ISO_CURRENCIES.has(currency) ? formatted : `${formatted} ${currency}`;
}
