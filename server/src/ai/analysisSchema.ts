import { z } from 'zod';

/**
 * Contrato da análise de carteira — compartilhado pelos provedores de análise
 * (Groq/Llama e Claude). O JSON Schema vai para o tool calling; o Zod valida a
 * saída de modelos sem `strict` garantido.
 */

export const TOOL_NAME = 'entregar_analise';
export const TOOL_DESCRIPTION = 'Entrega a análise educativa estruturada de alocação.';

export const analysisOutputSchema = z.object({
  resumo: z.string().min(1),
  atual: z.string().min(1),
  sugerido: z
    .array(
      z.object({
        classe: z.string().min(1),
        pct: z.coerce.number().int().min(0).max(100),
        justificativa: z.string().min(1),
      }),
    )
    .min(1),
  riscos: z.array(z.string()),
  passo_educativo: z.string().min(1),
});

export type AnalysisOutput = z.infer<typeof analysisOutputSchema>;
export type AllocationSuggestion = AnalysisOutput['sugerido'][number];
export type PortfolioAnalysis = AnalysisOutput & { disclaimer: string };

export const ANALYSIS_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['resumo', 'atual', 'sugerido', 'riscos', 'passo_educativo'],
  properties: {
    resumo: { type: 'string', description: 'Resumo da análise em 1–2 frases.' },
    atual: {
      type: 'string',
      description: 'Leitura da situação atual do usuário (percentuais/faixas).',
    },
    sugerido: {
      type: 'array',
      description: 'Alocação sugerida; os pct devem somar 100.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['classe', 'pct', 'justificativa'],
        properties: {
          classe: { type: 'string' },
          pct: { type: 'integer' },
          justificativa: { type: 'string' },
        },
      },
    },
    riscos: { type: 'array', items: { type: 'string' } },
    passo_educativo: {
      type: 'string',
      description: 'Explicação didática do porquê da alocação.',
    },
  },
} as const;
