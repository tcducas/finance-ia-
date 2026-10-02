import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../env.js';
import { AppError } from '../../errors/AppError.js';
import { logger } from '../../lib/logger.js';
import {
  ANALYSIS_JSON_SCHEMA,
  analysisOutputSchema,
  TOOL_DESCRIPTION,
  TOOL_NAME,
  type PortfolioAnalysis,
} from '../analysisSchema.js';
import { DISCLAIMER } from '../prompts.js';
import type { ToolSpec } from '../toolSpec.js';

/**
 * Claude — análise de carteira com saída estruturada confiável via tool use
 * forçado (tool_choice) + strict. Recebe SOMENTE contexto anonimizado.
 */

/** Saída estruturada genérica via tool use forçado + strict. */
export async function claudeStructured<T>(
  systemPrompt: string,
  userContent: string,
  tool: ToolSpec<T>,
): Promise<T> {
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
      tools: [
        {
          name: tool.name,
          description: tool.description,
          strict: true,
          input_schema: tool.jsonSchema as Anthropic.Messages.Tool.InputSchema,
        },
      ],
      tool_choice: { type: 'tool', name: tool.name },
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

  // Mesmo com strict, revalidamos: o contrato do app não depende do provedor.
  const parsed = tool.schema.safeParse(toolUse.input);
  if (!parsed.success) {
    logger.warn(
      { provider: 'claude', issues: parsed.error.issues.length },
      '[ai] saída fora do contrato',
    );
    throw new AppError('Resposta estruturada inválida do provedor.', 'AI_UNAVAILABLE', 502);
  }
  return parsed.data;
}

const ANALYSIS_TOOL: ToolSpec<PortfolioAnalysis> = {
  name: TOOL_NAME,
  description: TOOL_DESCRIPTION,
  jsonSchema: ANALYSIS_JSON_SCHEMA,
  schema: analysisOutputSchema.transform((data) => ({ ...data, disclaimer: DISCLAIMER })),
};

export function claudeAnalyze(
  systemPrompt: string,
  userContent: string,
): Promise<PortfolioAnalysis> {
  return claudeStructured(systemPrompt, userContent, ANALYSIS_TOOL);
}
