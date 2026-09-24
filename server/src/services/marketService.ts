import { AppError } from '../errors/AppError.js';
import * as registry from './markets/registry.js';

/**
 * Fachada fina sobre o registry de mercados (BR via brapi, CRYPTO via
 * Binance — ver services/markets/). Mantida para não mexer nos poucos
 * consumidores existentes (marketController, aiService.buildMarketContext).
 */
export type { AssetDetail, Movers, Quote } from './markets/types.js';

export async function getQuotes(tickers: string[]) {
  const { quotes } = await registry.getQuotesMulti(tickers);
  if (quotes.length === 0) {
    throw new AppError('Nenhum ticker válido encontrado.', 'VALIDATION_ERROR', 400);
  }
  return quotes;
}

export const getMovers = registry.getMovers;

export async function getAssetDetail(ticker: string, range: string) {
  return registry.getAssetDetail(ticker, range);
}
