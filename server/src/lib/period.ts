import { z } from 'zod';

export const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Formato esperado: YYYY-MM');

export interface DateRange {
  from: string;
  to: string;
}

/** Mês corrente no formato YYYY-MM (UTC). */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

/** Intervalo [primeiro dia, último dia] do mês, como datas YYYY-MM-DD. */
export function monthRange(month: string): DateRange {
  const [yearStr = '', monthStr = ''] = month.split('-');
  const year = Number(yearStr);
  const monthNum = Number(monthStr);
  const lastDay = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}
