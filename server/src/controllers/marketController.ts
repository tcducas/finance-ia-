import type { Request, Response } from 'express';
import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
import { allowedIntervals, allowsMarket } from '../lib/entitlements.js';
import { getEntitlements, getPlan } from '../middlewares/attachPlan.js';
import { adapterFor, parsePrefixed, resolveMarket } from '../services/markets/registry.js';
import type { MarketId } from '../services/markets/types.js';
import {
  boardQuerySchema,
  marketQuerySchema,
  searchQuerySchema,
  tickerParamSchema,
} from '../schemas/market.js';
import * as boardService from '../services/boardService.js';
import * as assetLookupService from '../services/assetLookupService.js';
import * as marketService from '../services/marketService.js';

const quotesQuerySchema = z.object({
  tickers: z.string().min(1, 'Informe os tickers separados por vírgula'),
});

const assetQuerySchema = marketQuerySchema.extend({ range: z.string().optional() });

export async function quotes(req: Request, res: Response) {
  const { tickers } = quotesQuerySchema.parse(req.query);
  const list = tickers.split(',');
  for (const raw of list) {
    const hint = marketHint(raw);
    if (hint) assertMarket(req, hint);
  }
  const data = await marketService.getQuotes(list);
  res.json({ data });
}

export async function movers(_req: Request, res: Response) {
  const data = await marketService.getMovers();
  res.json({ data });
}

export async function asset(req: Request, res: Response) {
  const { ticker } = tickerParamSchema.parse(req.params);
  const { range, market } = assetQuerySchema.parse(req.query);
  const resolved = await resolveMarket(ticker, market);
  assertMarket(req, resolved.market);
  const data = await marketService.getAssetDetail(`${resolved.market}:${resolved.ticker}`, range ?? '3mo');
  res.json({ data });
}

/** GET /api/market/search?q=&market=&limit= — usado pela watchlist e pelo copiloto. */
export async function search(req: Request, res: Response) {
  const { q, market, limit } = searchQuerySchema.parse(req.query);
  if (market) assertMarket(req, market);
  const data = await assetLookupService.searchAssets(q, market, limit);
  // Sem `market` explícito a busca varre todos; o plano filtra o resultado.
  const allowed = getEntitlements(req).markets;
  res.json({ data: { ...data, results: data.results.filter((r) => allowed.includes(r.market)) } });
}

/** GET /api/market/validate/:ticker?market= — o "esse ativo existe?" de verdade. */
export async function validate(req: Request, res: Response) {
  const { ticker } = tickerParamSchema.parse(req.params);
  const { market } = marketQuerySchema.parse(req.query);
  if (market) assertMarket(req, market);
  const result = await assetLookupService.validateTicker(ticker, market);
  if (result) assertMarket(req, result.asset.market);
  if (!result) {
    throw new AppError('Ativo não encontrado.', 'ASSET_NOT_FOUND', 404);
  }
  res.json({ data: { valid: true, ...result } });
}

/**
 * GET /api/market/board/:ticker?market=&interval= — board de trade de qualquer
 * mercado (B3, cripto, EUA). Público como o resto de /api/market: não expõe dado
 * de usuário e a chave da fonte fica no backend.
 * SOMENTE LEITURA — não existe, e não deve passar a existir, rota de ordem.
 */
export async function board(req: Request, res: Response) {
  const { ticker } = tickerParamSchema.parse(req.params);
  const { interval, market } = boardQuerySchema.parse(req.query);

  const resolved = await resolveMarket(ticker, market);
  assertMarket(req, resolved.market);

  const plan = getPlan(req);
  const entitlements = getEntitlements(req);

  // Recorta o período ANTES de buscar: sem isto, o free pediria candle de 15m,
  // pagaria a chamada e só então veria a resposta cair para diário.
  const sourceIntervals = adapterFor(resolved.market).board?.intervals ?? [];
  const intervals = allowedIntervals(plan, resolved.market, sourceIntervals);
  const safeInterval =
    interval && intervals.includes(interval) ? interval : (intervals[0] ?? interval);

  const board = await boardService.getBoard(resolved.ticker, safeInterval, resolved.market);

  // O plano também recorta os painéis: fora do Pro, livro de ofertas e tape saem
  // da RESPOSTA, não só da UI — gating de verdade acontece no servidor.
  const showBook = entitlements.book && board.support.book;
  const showTrades = entitlements.book && board.support.trades;

  res.json({
    data: {
      ...board,
      support: { intervals, book: showBook, trades: showTrades },
      book: showBook ? board.book : null,
      trades: showTrades ? board.trades : null,
      plan,
    },
  });
}

// --- Gating por plano --------------------------------------------------------

/**
 * Bloqueia mercado fora do plano com 402 PLAN_REQUIRED — status próprio para o
 * client abrir a tela de planos em vez de tratar como erro de permissão.
 */
function assertMarket(req: Request, market: MarketId): void {
  if (!allowsMarket(getPlan(req), market)) {
    throw new AppError(
      'O mercado internacional faz parte do plano Pro.',
      'PLAN_REQUIRED',
      402,
    );
  }
}

/** Mercado de um ticker sem pagar o custo do lookup de catálogo. */
function marketHint(raw: string, param?: MarketId): MarketId | null {
  return param ?? parsePrefixed(raw).market;
}
