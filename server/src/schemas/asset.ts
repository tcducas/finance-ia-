import { z } from 'zod';

export const assetCreateSchema = z.object({
  kind: z.string().trim().min(1, 'Tipo obrigatório').max(60),
  name: z.string().trim().min(1, 'Nome obrigatório').max(120),
  value: z.number().finite().nonnegative('O valor não pode ser negativo'),
  is_liability: z.boolean().optional().default(false),
});

export const assetUpdateSchema = assetCreateSchema.partial();

export type AssetCreateInput = z.infer<typeof assetCreateSchema>;
export type AssetUpdateInput = z.infer<typeof assetUpdateSchema>;
