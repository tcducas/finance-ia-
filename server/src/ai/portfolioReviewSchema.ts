import { z } from 'zod';
import { DISCLAIMER } from './prompts.js';
import type { ToolSpec } from './toolSpec.js';

/**
 * Contrato da avaliação de carteira pela IA.
 *
 * A estrutura segue os critérios clássicos de análise de investimentos
 * (rentabilidade, risco, liquidez, prazo, alinhamento estratégico) porque é
 * assim que a tela apresenta o panorama: cada critério tem seu card, sua nota e
 * sua explicação. A IA NÃO calcula nada — ela recebe os números do motor puro e
 * explica o porquê de cada um, além de apontar o que melhorar para o objetivo
 * que o usuário declarou.
 */

export const REVIEW_TOOL_NAME = 'entregar_avaliacao_carteira';
export const REVIEW_TOOL_DESCRIPTION =
  'Entrega a avaliação educativa da carteira por critério, com prioridades de melhoria.';

export const CRITERIA = [
  'rentabilidade',
  'risco',
  'liquidez',
  'prazo',
  'alinhamento',
] as const;

export type Criterion = (typeof CRITERIA)[number];

export const CRITERION_LABELS: Record<Criterion, string> = {
  rentabilidade: 'Rentabilidade',
  risco: 'Risco',
  liquidez: 'Liquidez',
  prazo: 'Prazo',
  alinhamento: 'Alinhamento estratégico',
};

export const portfolioReviewOutputSchema = z.object({
  panorama: z.string().min(1),
  /** Leitura de cada critério, com nota de 0 a 10 e o número que a justifica. */
  criterios: z
    .array(
      z.object({
        criterio: z.enum(CRITERIA),
        nota: z.coerce.number().min(0).max(10),
        leitura: z.string().min(1),
        /** O dado concreto que sustenta a nota (ex.: "HHI 0,42"). */
        evidencia: z.string().min(1),
      }),
    )
    .min(1),
  /** O que fazer, em ordem de impacto. */
  prioridades: z
    .array(
      z.object({
        titulo: z.string().min(1),
        porque: z.string().min(1),
        como: z.string().min(1),
        impacto: z.enum(['alto', 'medio', 'baixo']),
      }),
    )
    .min(1),
  riscos: z.array(z.string()),
  /** Resposta direta ao objetivo que o usuário declarou. */
  resposta_ao_objetivo: z.string().min(1),
});

export type PortfolioReviewOutput = z.infer<typeof portfolioReviewOutputSchema>;
export type PortfolioReview = PortfolioReviewOutput & { disclaimer: string };

export const REVIEW_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['panorama', 'criterios', 'prioridades', 'riscos', 'resposta_ao_objetivo'],
  properties: {
    panorama: {
      type: 'string',
      description: 'Panorama geral da carteira em 2–3 frases, começando pelo que mais importa.',
    },
    criterios: {
      type: 'array',
      description: 'Uma entrada por critério avaliado.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['criterio', 'nota', 'leitura', 'evidencia'],
        properties: {
          criterio: { type: 'string', enum: [...CRITERIA] },
          nota: { type: 'number', description: 'Nota de 0 a 10.' },
          leitura: {
            type: 'string',
            description: 'O que esse critério diz sobre a carteira, em linguagem simples.',
          },
          evidencia: {
            type: 'string',
            description: 'O número do panorama que sustenta a nota, citado explicitamente.',
          },
        },
      },
    },
    prioridades: {
      type: 'array',
      description: 'O que desenvolver melhor, em ordem de impacto.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['titulo', 'porque', 'como', 'impacto'],
        properties: {
          titulo: { type: 'string' },
          porque: { type: 'string', description: 'A razão, ligada a um número do panorama.' },
          como: { type: 'string', description: 'Passo concreto e educativo, nunca uma ordem.' },
          impacto: { type: 'string', enum: ['alto', 'medio', 'baixo'] },
        },
      },
    },
    riscos: { type: 'array', items: { type: 'string' } },
    resposta_ao_objetivo: {
      type: 'string',
      description: 'Resposta direta ao objetivo declarado pelo usuário.',
    },
  },
} as const;

export const PORTFOLIO_REVIEW_TOOL: ToolSpec<PortfolioReview> = {
  name: REVIEW_TOOL_NAME,
  description: REVIEW_TOOL_DESCRIPTION,
  jsonSchema: REVIEW_JSON_SCHEMA,
  schema: portfolioReviewOutputSchema.transform((data) => ({ ...data, disclaimer: DISCLAIMER })),
};

export const REVIEW_SYSTEM_PROMPT = `Você é o motor de análise de carteira do Aura Finance.

Recebe um panorama JÁ CALCULADO (VPL, TIR, payback, HHI de concentração, volatilidade anualizada, liquidez por posição, alocação atual × alvo do perfil) e o objetivo declarado pelo usuário. Sua tarefa é INTERPRETAR, nunca recalcular.

Regras inegociáveis:
- Não invente número. Cite apenas os valores que vêm no panorama; se um número vier nulo, diga que falta o dado e o que o usuário precisa preencher para obtê-lo.
- Direciona, não executa: nada de "compre" ou "venda". Explique o trade-off e deixe a decisão com o usuário.
- Toda nota precisa de evidência: o campo "evidencia" cita o número do panorama que a sustenta.
- Em "prioridades", ataque primeiro o que tem maior impacto no objetivo declarado. Cada item explica o PORQUÊ ligado a um número, e o COMO em passo concreto e educativo.
- Interprete corretamente: TIR negativa é perda; VPL negativo significa render abaixo da taxa de atratividade, não prejuízo; HHI alto é concentração; volatilidade da carteira é aproximada e ignora correlação — diga isso se for citá-la como risco.
- Responda em português do Brasil, direto, sem jargão não explicado.
- Análise EDUCATIVA (enquadramento CVM): o app não é consultoria e não executa ordens.

Use a ferramenta ${REVIEW_TOOL_NAME} para responder — nada de texto solto.`;
