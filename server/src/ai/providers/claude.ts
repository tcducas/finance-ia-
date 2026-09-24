import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../env.js';
import { AppError } from '../../errors/AppError.js';
import { logger } from '../../lib/logger.js';
import { DISCLAIMER } from '../prompts.js';

/**
 * Claude — análise de carteira com saída estruturada confiável via tool use
 * forçado (tool_choice) + strict. Recebe SOMENTE contexto anonimizado.
 */

export interface AllocationSuggestion {
  classe: string;
  pct: number;
  justificativa: string;
}

export interface PortfolioAnalysis {
  resumo: string;
  atual: string;
  sugerido: AllocationSuggestion[];
  riscos: string[];
  passo_educativo: string;
  disclaimer: string;
}

const ANALYSIS_TOOL: Anthropic.Messages.Tool = {
  name: 'entregar_analise',
  description: 'Entrega a análise educativa estruturada de alocação.',
  strict: true,
  input_schema: {
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
  },
};

export async function claudeAnalyze(
  systemPrompt: string,
  userContent: string,
): Promise<PortfolioAnalysis> {
  if (!env.ANTHROPIC_API_KEY) {
    throw new AppError(
      'IA não configurada no servidor (ANTHROPIC_API_KEY ausente).',
      'AI_NOT_CONFIGURED',
      503,
    );
  }

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

  let response: Anthropic.Messages.Message;
  try {
    response = await client.messages.create({
      model: env.CLAUDE_MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      // tool_choice forçado não combina com thinking — desliga explicitamente.
      thinking: { type: 'disabled' },
      tools: [ANALYSIS_TOOL],
      tool_choice: { type: 'tool', name: 'entregar_analise' },
      messages: [{ role: 'user', content: userContent }],
    });
  } catch (error) {
    if (error instanceof Anthropic.APIError) {
      logger.error({ provider: 'claude', status: error.status }, '[ai] provedor indisponível');
      throw new AppError('Provedor de IA indisponível no momento.', 'AI_UNAVAILABLE', 502);
    }
    throw new AppError('Provedor de IA indisponível no momento.', 'AI_UNAVAILABLE', 502);
  }

  const toolUse = response.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock => block.type === 'tool_use',
  );
  if (!toolUse) {
    throw new AppError('Resposta estruturada ausente do provedor.', 'AI_UNAVAILABLE', 502);
  }

  const input = toolUse.input as Omit<PortfolioAnalysis, 'disclaimer'>;
  return { ...input, disclaimer: DISCLAIMER };
}
