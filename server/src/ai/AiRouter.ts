import { ANALYZE_SYSTEM_PROMPT, CHAT_SYSTEM_PROMPT } from './prompts.js';
import { claudeAnalyze, type PortfolioAnalysis } from './providers/claude.js';
import { geminiChat, type ChatTurn } from './providers/gemini.js';

/**
 * AiRouter — decide o provedor por tarefa (doc v0.4 §6.1):
 *   chat / explicações  -> Gemini (alto volume, menor custo)
 *   análise / rebalance / aporte -> Claude (tool use, JSON confiável)
 * Ambos recebem SOMENTE dados já anonimizados (ai/anonymize.ts).
 */
export type AiTask = 'chat' | 'explain' | 'analyze' | 'rebalance' | 'aporte';

export function providerFor(task: AiTask): 'gemini' | 'claude' {
  return task === 'chat' || task === 'explain' ? 'gemini' : 'claude';
}

export const aiRouter = {
  chat(history: ChatTurn[], message: string): Promise<string> {
    return geminiChat(CHAT_SYSTEM_PROMPT, history, message);
  },

  analyze(anonymizedContent: string): Promise<PortfolioAnalysis> {
    return claudeAnalyze(ANALYZE_SYSTEM_PROMPT, anonymizedContent);
  },
};
