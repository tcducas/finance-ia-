import { env } from '../env.js';
import type { PortfolioAnalysis } from './analysisSchema.js';
import { ANALYZE_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from './prompts.js';
import {
  PORTFOLIO_REVIEW_TOOL,
  REVIEW_SYSTEM_PROMPT,
  type PortfolioReview,
} from './portfolioReviewSchema.js';
import { claudeAnalyze, claudeStructured } from './providers/claude.js';
import { geminiChat, type ChatTurn } from './providers/gemini.js';
import { groqAnalyze, groqStructured } from './providers/groq.js';

/**
 * AiRouter — decide o provedor por tarefa (doc v0.4 §6.1):
 *   chat / explicações  -> Gemini (alto volume, menor custo)
 *   análise / rebalance / aporte -> ANALYZE_PROVIDER: Groq/Llama (grátis, default)
 *                                   ou Claude (tool use, JSON confiável)
 * Todos recebem SOMENTE dados já anonimizados (ai/anonymize.ts).
 */
export type AiTask = 'chat' | 'explain' | 'analyze' | 'rebalance' | 'aporte' | 'review';

export function providerFor(task: AiTask): 'gemini' | 'groq' | 'claude' {
  return task === 'chat' || task === 'explain' ? 'gemini' : env.ANALYZE_PROVIDER;
}

export const aiRouter = {
  chat(history: ChatTurn[], message: string): Promise<string> {
    return geminiChat(CHAT_SYSTEM_PROMPT, history, message);
  },

  analyze(anonymizedContent: string): Promise<PortfolioAnalysis> {
    const provider = providerFor('analyze') === 'claude' ? claudeAnalyze : groqAnalyze;
    return provider(ANALYZE_SYSTEM_PROMPT, anonymizedContent);
  },

  /** Avaliação da carteira importada: a IA interpreta números já calculados. */
  reviewPortfolio(anonymizedContent: string): Promise<PortfolioReview> {
    const structured = providerFor('review') === 'claude' ? claudeStructured : groqStructured;
    return structured(REVIEW_SYSTEM_PROMPT, anonymizedContent, PORTFOLIO_REVIEW_TOOL);
  },
};
