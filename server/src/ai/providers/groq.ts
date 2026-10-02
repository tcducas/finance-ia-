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
 * Groq (Llama) — análise de carteira via tool calling no formato OpenAI.
 * Plano gratuito; a saída é validada com Zod porque o modelo não garante
 * `strict`. Recebe SOMENTE contexto anonimizado.
 */
/** Saída estruturada genérica via tool calling. Revalida com o Zod do ToolSpec. */
export async function groqStructured<T>(
  systemPrompt: string,
  userContent: string,
  tool: ToolSpec<T>,
): Promise<T> {
  if (!env.GROQ_API_KEY) {
    throw new AppError(
      'IA não configurada no servidor (GROQ_API_KEY ausente).',
      'AI_NOT_CONFIGURED',
      503,
    );
  }

  let res: Response;
  try {
    res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GROQ_MODEL,
        temperature: 0.3,
        max_tokens: 4096,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: tool.name,
              description: tool.description,
              parameters: tool.jsonSchema,
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: tool.name } },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new AppError('Provedor de IA indisponível no momento.', 'AI_UNAVAILABLE', 502);
  }

  if (!res.ok) {
    logger.error({ provider: 'groq', status: res.status }, '[ai] provedor indisponível');
    throw new AppError('Provedor de IA indisponível no momento.', 'AI_UNAVAILABLE', 502);
  }

  const body = (await res.json()) as {
    choices?: Array<{
      message?: { tool_calls?: Array<{ function?: { name?: string; arguments?: string } }> };
    }>;
  };
  const args = body.choices?.[0]?.message?.tool_calls?.find(
    (call) => call.function?.name === tool.name,
  )?.function?.arguments;
  if (!args) {
    throw new AppError('Resposta estruturada ausente do provedor.', 'AI_UNAVAILABLE', 502);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(args);
  } catch {
    throw new AppError('Resposta estruturada inválida do provedor.', 'AI_UNAVAILABLE', 502);
  }

  const parsed = tool.schema.safeParse(raw);
  if (!parsed.success) {
    logger.warn({ provider: 'groq', issues: parsed.error.issues.length }, '[ai] saída fora do contrato');
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

export function groqAnalyze(
  systemPrompt: string,
  userContent: string,
): Promise<PortfolioAnalysis> {
  return groqStructured(systemPrompt, userContent, ANALYSIS_TOOL);
}
