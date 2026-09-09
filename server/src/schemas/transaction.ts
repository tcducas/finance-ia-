import { z } from 'zod';
import { monthSchema } from '../lib/period.js';

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida');

export const transactionCreateSchema = z.object({
  type: z.enum(['receita', 'despesa']),
  amount: z.number().finite().positive('O valor deve ser maior que zero'),
  category: z.string().trim().min(1, 'Categoria obrigatória').max(60),
  occurred_on: dateSchema,
  description: z.string().trim().max(200).optional(),
  is_recurring: z.boolean().optional().default(false),
});

export const transactionUpdateSchema = transactionCreateSchema.partial();

export const idParamSchema = z.object({ id: z.string().uuid('id inválido') });

export const periodQuerySchema = z.object({ month: monthSchema.optional() });

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
