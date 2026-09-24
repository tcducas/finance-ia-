import * as registry from './markets/registry.js';

/**
 * Verificação de ativos — usada pela watchlist, pelo copiloto ("vale a pena
 * comprar X?") e pela busca de mercado. Delega ao registry (BR via brapi,
 * CRYPTO via Binance); ver services/markets/registry.ts para o roteamento.
 */
export const searchAssets = registry.searchAssets;
export const validateTicker = registry.validateTicker;

export type { SearchResult, ValidateResult } from './markets/registry.js';
export type { MarketId } from './markets/types.js';
