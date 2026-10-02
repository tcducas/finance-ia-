import { z } from 'zod';

export const marketIdSchema = z.enum(['BR', 'CRYPTO', 'US']);

export const searchQuerySchema = z.object({
  q: z.string().trim().min(1, 'Informe ao menos 1 caractere').max(20),
  market: marketIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(8).default(8),
});

// Aceita prefixo opcional de mercado (BR:PETR4, CRYPTO:BTCUSDT).
export const tickerParamSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1)
    .max(20)
    .regex(/^(?:(?:BR|CRYPTO|US):)?[A-Za-z0-9^.]{1,20}$/, 'Ticker inválido'),
});

export const marketQuerySchema = z.object({
  market: marketIdSchema.optional(),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type TickerParam = z.infer<typeof tickerParamSchema>;

/**
 * Query do board de trade. `interval` é validado contra os períodos que o
 * mercado suporta (BoardSupport.intervals) — aqui só limitamos o formato.
 */
export const boardQuerySchema = marketQuerySchema.extend({
  interval: z
    .string()
    .trim()
    .max(5)
    .regex(/^[0-9a-zA-Z]{1,5}$/, 'Período inválido')
    .optional(),
});
