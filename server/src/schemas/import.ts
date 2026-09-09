import { z } from 'zod';
import { assetCreateSchema } from './asset.js';
import { transactionCreateSchema } from './transaction.js';

// Import em lote: o client já parseia o CSV e normaliza as linhas; aqui o
// boundary revalida cada linha com o mesmo schema do cadastro individual.
const MAX_ROWS = 2000;

export const transactionImportSchema = z.object({
  rows: z
    .array(transactionCreateSchema)
    .min(1, 'Nenhuma linha para importar')
    .max(MAX_ROWS, `Máximo de ${MAX_ROWS} linhas por importação`),
});

export const assetImportSchema = z.object({
  rows: z
    .array(assetCreateSchema)
    .min(1, 'Nenhuma linha para importar')
    .max(MAX_ROWS, `Máximo de ${MAX_ROWS} linhas por importação`),
});

export type TransactionImportInput = z.infer<typeof transactionImportSchema>;
export type AssetImportInput = z.infer<typeof assetImportSchema>;
