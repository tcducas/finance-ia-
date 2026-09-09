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
