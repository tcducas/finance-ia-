import { getSessionToken, isDemoMode } from './data';
import type { Budget, CategorySpending, PeriodSummary } from '../types/finance';
import { categoryLabel } from '../lib/categories';

export const DISCLAIMER =
  'Conteúdo educativo — não é recomendação de investimento. Quem decide e executa é você, na sua corretora.';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface PortfolioAnalysis {
  resumo: string;
  atual: string;
  sugerido: Array<{ classe: string; pct: number; justificativa: string }>;
  riscos: string[];
  passo_educativo: string;
  disclaimer: string;
}

export interface ScreenSnapshot {
  screen: string;
  summary: PeriodSummary;
  spending: CategorySpending[];
  budgets: Budget[];
  ticker?: string;
  /** Perfil de investidor (conservador|moderado|arrojado), quando definido. */
  profile?: string;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getSessionToken()}`,
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as
    | { data: T }
    | { error: { message: string; code: string } }
    | null;
  if (!res.ok || json === null || 'error' in json) {
    const code = json && 'error' in json ? json.error.code : 'NETWORK_ERROR';
    throw Object.assign(new Error(code), { code });
  }
  return json.data;
}

/**
 * Chat do copiloto. Em modo demo (sem login/chaves), responde localmente com
 * regras sobre os dados da tela — sempre marcado como demonstração.
 */
export async function copilotChat(
  message: string,
  history: ChatTurn[],
  snapshot: ScreenSnapshot,
): Promise<{ reply: string; demo: boolean }> {
  if (!isDemoMode()) {
    try {
      const data = await post<{ reply: string }>('/api/ai/chat', {
        message,
        history,
        screen: snapshot.screen,
      });
      return { reply: data.reply, demo: false };
    } catch (err) {
      if ((err as { code?: string }).code !== 'AI_NOT_CONFIGURED') throw err;
      // Sem chave no servidor: cai para o modo demo local.
    }
  }
  return { reply: demoReply(message, snapshot), demo: true };
}

export async function copilotAnalyze(
  aporte: number | undefined,
  snapshot: ScreenSnapshot,
): Promise<{ analysis: PortfolioAnalysis; demo: boolean }> {
  if (!isDemoMode()) {
    try {
      const analysis = await post<PortfolioAnalysis>('/api/ai/analyze', {
        aporte,
        screen: snapshot.screen,
        assetTicker: snapshot.ticker,
        profile: snapshot.profile,
      });
      return { analysis, demo: false };
    } catch (err) {
      if ((err as { code?: string }).code !== 'AI_NOT_CONFIGURED') throw err;
    }
  }
  return { analysis: demoAnalysis(snapshot), demo: true };
}

// ---------------------------------------------------------------------------
// Modo demonstração — respostas locais por regras, claramente marcadas.
// ---------------------------------------------------------------------------

function fmt(v: number): string {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function demoReply(message: string, s: ScreenSnapshot): string {
  const lower = message.toLowerCase();

  if (s.ticker) {
    return `Sobre ${s.ticker}: no modo demonstração eu explico apenas a estrutura — com as chaves de IA configuradas, trago fundamentos, riscos e o papel do ativo numa carteira. Em geral, avalie: o setor, o histórico de resultados, o P/L em relação aos pares e como o ativo se encaixa no SEU perfil.`;
  }

  if (lower.includes('saldo') || lower.includes('mês') || lower.includes('mes')) {
    return `Seu mês até aqui: receitas de ${fmt(s.summary.receitas)}, despesas de ${fmt(s.summary.despesas)} e saldo de ${fmt(s.summary.saldo)}. Fixos somam ${fmt(s.summary.fixos)} e variáveis ${fmt(s.summary.variaveis)}.`;
  }

  if (lower.includes('gast') || lower.includes('orçamento') || lower.includes('orcamento')) {
    const top = s.spending[0];
    const topLine = top
      ? ` A maior categoria é ${categoryLabel(top.category)} (${fmt(top.total)}).`
      : '';
    return `Suas despesas do mês somam ${fmt(s.summary.despesas)}.${topLine} Definir um limite por categoria na tela Gastos ajuda a transformar registro em controle.`;
  }

  if (lower.includes('aporte') || lower.includes('investir') || lower.includes('onde')) {
    return 'Use o consultor de aporte aqui embaixo: informe quanto pretende aportar no mês que eu monto uma sugestão educativa de alocação. Com as chaves de IA configuradas, a sugestão considera também o mercado do dia.';
  }

  return `Estou em modo demonstração (sem chaves de IA configuradas no servidor). Ainda assim acompanho seus números: saldo de ${fmt(s.summary.saldo)} neste mês. Pergunte sobre saldo, gastos ou use o consultor de aporte.`;
}

function demoAnalysis(s: ScreenSnapshot): PortfolioAnalysis {
  const comprometimento =
    s.summary.receitas > 0 ? Math.round((s.summary.despesas / s.summary.receitas) * 100) : null;
  return {
    resumo:
      'Sugestão educativa de alocação (EXEMPLO — modo demonstração, perfil moderado genérico).',
    atual:
      comprometimento !== null
        ? `Suas despesas comprometem ${comprometimento}% das receitas do mês.`
        : 'Sem receitas lançadas neste mês para calcular o comprometimento.',
    sugerido: [
      { classe: 'Reserva de emergência', pct: 30, justificativa: 'Liquidez para imprevistos antes de buscar retorno.' },
      { classe: 'Renda fixa (Tesouro/CDB)', pct: 40, justificativa: 'Base estável da carteira em juros brasileiros.' },
      { classe: 'Ações Brasil', pct: 15, justificativa: 'Exposição a crescimento local, com volatilidade.' },
      { classe: 'Internacional', pct: 10, justificativa: 'Diversificação cambial e geográfica.' },
      { classe: 'FIIs', pct: 5, justificativa: 'Renda recorrente com exposição imobiliária.' },
    ],
    riscos: [
      'Valores de exemplo: sem as chaves de IA, a sugestão não considera seu perfil real nem o mercado do dia.',
      'Renda variável oscila; nunca aloque a reserva de emergência em risco.',
    ],
    passo_educativo:
      'A divisão parte do princípio de proteger a base (reserva + renda fixa) antes de buscar retorno em renda variável. Configure GEMINI_API_KEY e ANTHROPIC_API_KEY no .env para a análise real com contexto de mercado.',
    disclaimer: DISCLAIMER,
  };
}
