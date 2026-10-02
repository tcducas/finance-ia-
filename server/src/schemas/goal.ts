import { z } from 'zod';

export const GOAL_KINDS = ['reserva', 'compra', 'aposentadoria', 'geral'] as const;

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato esperado: YYYY-MM-DD')
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Data inválida');

export const goalCreateSchema = z.object({
  name: z.string().trim().min(1, 'Nome obrigatório').max(80),
  kind: z.enum(GOAL_KINDS).optional().default('geral'),
  target_amount: z.number().finite().positive('A meta deve ser maior que zero'),
  current_amount: z.number().finite().nonnegative().optional().default(0),
  monthly_contribution: z.number().finite().nonnegative().optional().default(0),
  // Decimal, não percentual: 0.105 = 10,5% a.a. Teto de 100% a.a. evita digitar
  // "10" achando que é 10% e projetar 1000% de rendimento.
  annual_rate: z.number().finite().min(0).max(1, 'Use decimal: 0.105 = 10,5% a.a.').optional().default(0),
  target_date: dateSchema.nullable().optional(),
  priority: z.number().int().min(1).max(3).optional().default(2),
});

export const goalUpdateSchema = goalCreateSchema.partial();

export const planningQuerySchema = z.object({
  /** Horizonte da projeção em meses (default 5 anos). */
  horizon: z.coerce.number().int().min(1).max(600).default(60),
});

export type GoalCreateInput = z.infer<typeof goalCreateSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
