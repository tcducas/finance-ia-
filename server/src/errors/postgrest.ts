import type { PostgrestError } from '@supabase/supabase-js';
import { AppError } from './AppError.js';
import { logger } from '../lib/logger.js';

/** Converte erro do PostgREST em AppError sem vazar detalhes (nem PII) na resposta. */
export function fromPostgrest(error: PostgrestError): AppError {
  // Log mínimo: só o código SQLSTATE — a mensagem pode conter valores do usuário.
  logger.error({ dbErrorCode: error.code }, '[db] erro');

  switch (error.code) {
    case '23505':
      return new AppError('Já existe um registro com esses dados.', 'DUPLICATE', 409);
    case '23514':
      return new AppError('Valor não permitido pelas regras do banco.', 'CHECK_VIOLATION', 400);
    case '23503':
      return new AppError('Referência inexistente.', 'FOREIGN_KEY_VIOLATION', 400);
    default:
      return new AppError('Erro ao acessar o banco de dados.', 'DATABASE_ERROR', 500);
  }
}
