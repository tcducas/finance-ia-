import { aiRouter } from '../ai/AiRouter.js';
import {
  anonymizeContext,
  sanitizeUserText,
  type RawFinancialContext,
} from '../ai/anonymize.js';
import { DISCLAIMER, screenGuide } from '../ai/prompts.js';
import type { ChatTurn } from '../ai/providers/gemini.js';
import type { PortfolioAnalysis } from '../ai/analysisSchema.js';
import type { PortfolioReview } from '../ai/portfolioReviewSchema.js';
import type { Panorama } from './portfolioService.js';
import { ANALYZE_KEY, env } from '../env.js';
import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { UserClient } from '../lib/supabase.js';
import { currentMonth, monthRange } from '../lib/period.js';
import * as marketService from './marketService.js';
import { getPeriodSummary, getSpendingByCategory } from './summaryService.js';

/** Janela de contexto do chat: reenviamos só as últimas N mensagens. */
const MAX_HISTORY_TURNS = 20;

const supabaseConfigured = () => Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY);

export interface ChatResult {
  conversationId: string | null;
  reply: string;
  disclaimer: string;
}

interface ChatParams {
  db: UserClient | null;
  userId: string;
  message: string;
  screen?: string;
  conversationId?: string;
  /** Histórico enviado pelo cliente quando não há memória no banco. */
  history?: ChatTurn[];
}

export async function chat(params: ChatParams): Promise<ChatResult> {
  // Falha rápido, antes de tocar banco/mercado, se o provedor não está configurado.
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      'IA não configurada no servidor (GEMINI_API_KEY ausente).',
      'AI_NOT_CONFIGURED',
      503,
    );
  }

  const message = sanitizeUserText(params.message);
  const useDb = supabaseConfigured() && params.db !== null;

  let conversationId = params.conversationId ?? null;
  let history: ChatTurn[] = [];

  if (useDb && params.db) {
    if (!conversationId) {
      const { data, error } = await params.db
        .from('ai_conversations')
        .insert({ user_id: params.userId, context: params.screen ?? null })
        .select('id')
        .single();
      if (error) throw fromPostgrest(error);
      conversationId = data.id;
    } else {
      const { data, error } = await params.db
        .from('ai_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
      if (error) throw fromPostgrest(error);
      history = data.map((m) => ({ role: m.role, content: m.content }));
    }
  } else {
    history = (params.history ?? []).map((turn) => ({
      role: turn.role,
      content: sanitizeUserText(turn.content),
    }));
  }

  // Limite de janela: mantém as últimas N mensagens e resume a existência do resto.
  if (history.length > MAX_HISTORY_TURNS) {
    const dropped = history.length - MAX_HISTORY_TURNS;
    history = [
      {
        role: 'user',
        content: `(resumo: ${dropped} mensagens anteriores desta conversa foram omitidas por limite de janela)`,
      },
      ...history.slice(-MAX_HISTORY_TURNS),
    ];
  }

  // Contexto anonimizado da tela vai junto da mensagem (modelos são stateless).
  const screenContext = params.db ? await buildAnonymizedContext(params.db, params.screen) : {};
  const contextLine = `[contexto anonimizado da tela: ${JSON.stringify(screenContext)}]`;
  // O guia da tela dá ao modelo o vocabulário do que o usuário está vendo —
  // sem ele, uma pergunta como "o que é esse livro?" vira resposta genérica.
  const guide = screenGuide(params.screen);
  const guideLine = guide ? `[guia da tela]\n${guide}\n\n` : '';
  const reply = await aiRouter.chat(history, `${contextLine}\n\n${guideLine}${message}`);

  if (useDb && params.db && conversationId) {
    const { error } = await params.db.from('ai_messages').insert([
      { conversation_id: conversationId, role: 'user', content: message },
      { conversation_id: conversationId, role: 'assistant', content: reply },
    ]);
    if (error) throw fromPostgrest(error);
  }

  return { conversationId, reply, disclaimer: DISCLAIMER };
}

export interface AnalyzeParams {
  db: UserClient | null;
  profile?: string;
  /** Valor do aporte é convertido em faixa antes de ir ao modelo. */
  aporte?: number;
  screen?: string;
  assetTicker?: string;
}

export async function analyze(params: AnalyzeParams): Promise<PortfolioAnalysis> {
  // Falha cedo, antes de montar contexto e buscar mercado.
  if (!env[ANALYZE_KEY]) {
    throw new AppError(
      `IA não configurada no servidor (${ANALYZE_KEY} ausente).`,
      'AI_NOT_CONFIGURED',
      503,
    );
  }

  const context = params.db ? await buildAnonymizedContext(params.db, params.screen) : {};
  if (params.profile) context.perfil = params.profile;
  if (params.assetTicker) context.ticker_em_foco = params.assetTicker.toUpperCase();

  const market = await buildMarketContext();

  const lines = [
    `Contexto anonimizado do usuário: ${JSON.stringify(context)}`,
    `Cenário de mercado (cotações com atraso ~15 min): ${JSON.stringify(market)}`,
  ];
  if (params.aporte !== undefined) {
    lines.push(`Aporte do mês informado: faixa ${aporteBand(params.aporte)}.`);
  }

  return aiRouter.analyze(lines.join('\n'));
}

/** Monta o contexto anonimizado a partir dos dados reais do usuário (via RLS). */
async function buildAnonymizedContext(db: UserClient, screen?: string) {
  const range = monthRange(currentMonth());
  const raw: RawFinancialContext = { screen };

  try {
    const [summary, spending, budgetsRes, assetsRes, watchlistRes] = await Promise.all([
      getPeriodSummary(db, range),
      getSpendingByCategory(db, range),
      db.from('budgets').select('category, monthly_limit'),
      db.from('assets').select('value, is_liability'),
      db.from('watchlist').select('ticker'),
    ]);

    raw.summary = summary;
    raw.spending = spending;
    if (budgetsRes.data) {
      const spentByCategory = new Map(spending.map((s) => [s.category, s.total]));
      raw.budgets = budgetsRes.data.map((b) => ({
        category: b.category,
        monthly_limit: b.monthly_limit,
        spent: spentByCategory.get(b.category) ?? 0,
      }));
    }
    if (assetsRes.data) {
      raw.netWorth = assetsRes.data.reduce(
        (sum, a) => sum + (a.is_liability ? -a.value : a.value),
        0,
      );
    }
    if (watchlistRes.data) raw.watchlist = watchlistRes.data.map((w) => w.ticker);
  } catch {
    // Sem dados (ou sem banco): o contexto segue mínimo — nunca bloqueia o chat.
  }

  return anonymizeContext(raw);
}

/** Cenário de mercado best-effort — indisponibilidade não bloqueia a análise. */
async function buildMarketContext() {
  try {
    const movers = await marketService.getMovers();
    const lite = (q: { ticker: string; changePercent: number }) => ({
      ticker: q.ticker,
      variacao_pct: Math.round(q.changePercent * 100) / 100,
    });
    return {
      maiores_altas: movers.gainers.slice(0, 5).map(lite),
      maiores_quedas: movers.losers.slice(0, 5).map(lite),
    };
  } catch {
    return { indisponivel: true };
  }
}

/** O valor do aporte nunca vai absoluto ao modelo — vira faixa. */
export function aporteBand(value: number): string {
  if (value < 100) return 'até R$ 100';
  if (value < 500) return 'R$ 100 – R$ 500';
  if (value < 1_000) return 'R$ 500 – R$ 1 mil';
  if (value < 5_000) return 'R$ 1 mil – R$ 5 mil';
  if (value < 20_000) return 'R$ 5 mil – R$ 20 mil';
  return 'acima de R$ 20 mil';
}

export interface ReviewParams {
  panorama: Panorama;
  /** O que o usuário quer resolver, nas palavras dele. */
  objetivo: string;
}

/**
 * Avaliação da carteira importada.
 *
 * CONTRATO DE ANONIMIZAÇÃO: ao prompt vão tickers, classes, percentuais, as
 * métricas calculadas e FAIXA de patrimônio. NÃO vai o valor absoluto da
 * carteira, nem nome, e-mail ou qualquer identificador — por isso montamos o
 * payload campo a campo em vez de serializar o panorama inteiro.
 */
export async function reviewPortfolio(params: ReviewParams): Promise<PortfolioReview> {
  if (!env[ANALYZE_KEY]) {
    throw new AppError(
      `IA não configurada no servidor (${ANALYZE_KEY} ausente).`,
      'AI_NOT_CONFIGURED',
      503,
    );
  }

  const p = params.panorama;
  const payload = {
    perfil: p.profile,
    faixa_de_carteira: aporteBand(p.currentValue),
    rentabilidade: {
      retorno_total_pct: p.profitPercent,
      tir_anual_pct: p.irr === null ? null : Math.round(p.irr * 1000) / 10,
      vpl_sinal: p.npv === 0 ? 'indisponivel' : p.npv > 0 ? 'positivo' : 'negativo',
      taxa_de_atratividade_pct: Math.round(p.attractivenessRate * 1000) / 10,
      payback_meses: p.paybackMonths,
      proventos_sobre_carteira_pct:
        p.currentValue > 0 ? Math.round((p.totalDividends / p.currentValue) * 1000) / 10 : null,
    },
    risco: {
      hhi: p.hhi,
      posicoes_efetivas: p.effectivePositions,
      concentracao: p.concentration,
      volatilidade_anual_pct:
        p.portfolioVolatility === null ? null : Math.round(p.portfolioVolatility * 1000) / 10,
      observacao_volatilidade: 'ponderada pelo peso, ignora correlação entre ativos',
    },
    liquidez: contarPor(p.positions.map((pos) => pos.liquidity)),
    alinhamento: {
      score: p.alignmentScore,
      maiores_desvios: p.gaps
        .slice(0, 4)
        .map((g) => ({ classe: g.assetClass, atual_pct: g.actual, alvo_pct: g.target })),
    },
    alocacao_atual_pct: p.allocation,
    posicoes: p.positions.map((pos) => ({
      ticker: pos.ticker,
      classe: pos.assetClass,
      peso_pct: pos.weight,
      retorno_pct: pos.profitPercent,
      meses_em_carteira: pos.monthsHeld,
      liquidez: pos.liquidity,
      volatilidade_anual_pct:
        pos.volatility === null ? null : Math.round(pos.volatility * 1000) / 10,
    })),
    dados_faltando: {
      posicoes_sem_cotacao: p.stalePositions,
      posicoes_sem_data_de_aporte: p.positions.filter((pos) => pos.monthsHeld === null).length,
    },
  };

  const content = [
    `Panorama calculado da carteira: ${JSON.stringify(payload)}`,
    `Objetivo declarado pelo usuário: "${sanitizeUserText(params.objetivo)}"`,
  ].join('\n');

  return aiRouter.reviewPortfolio(content);
}

function contarPor(values: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const value of values) out[value] = (out[value] ?? 0) + 1;
  return out;
}
