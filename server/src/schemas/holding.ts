import { z } from 'zod';
import { ASSET_CLASSES } from '../lib/portfolioAnalysis.js';
import { marketIdSchema } from './market.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida');

export const holdingCreateSchema = z.object({
  ticker: z
    .string()
    .trim()
    .min(1, 'Ticker obrigatório')
    .max(20)
    .regex(/^[A-Za-z0-9^.]{1,20}$/, 'Ticker inválido'),
  market: marketIdSchema.optional().default('BR'),
  asset_class: z.enum(ASSET_CLASSES).optional().default('acao'),
  quantity: z.number().finite().positive('A quantidade deve ser maior que zero'),
  avg_price: z.number().finite().nonnegative('O preço médio não pode ser negativo'),
  acquired_on: dateSchema.nullable().optional(),
  dividends_received: z.number().finite().nonnegative().optional().default(0),
});

export const holdingUpdateSchema = holdingCreateSchema.partial();

const MAX_ROWS = 500;

export const holdingImportSchema = z.object({
  rows: z
    .array(holdingCreateSchema)
    .min(1, 'Nenhuma posição para importar')
    .max(MAX_ROWS, `Máximo de ${MAX_ROWS} posições por importação`),
});

/**
 * Taxa de atratividade do VPL. Decimal ao ano, teto de 100% — o mesmo cuidado
 * das metas: evita digitar "10" achando que é 10%.
 */
export const panoramaQuerySchema = z.object({
  rate: z.coerce.number().finite().min(0).max(1).optional(),
});

export type HoldingCreateInput = z.infer<typeof holdingCreateSchema>;
export type HoldingUpdateInput = z.infer<typeof holdingUpdateSchema>;
export type HoldingImportInput = z.infer<typeof holdingImportSchema>;
