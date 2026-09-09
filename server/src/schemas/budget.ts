import { z } from 'zod';

export const budgetCreateSchema = z.object({
  category: z.string().trim().min(1, 'Categoria obrigatória').max(60),
  monthly_limit: z.number().finite().positive('O limite deve ser maior que zero'),
});

export const budgetUpdateSchema = budgetCreateSchema.partial();

export type BudgetCreateInput = z.infer<typeof budgetCreateSchema>;
export type BudgetUpdateInput = z.infer<typeof budgetUpdateSchema>;
