import pino from 'pino';
import { env } from '../env.js';

/**
 * Logger central — nunca logar PII (regra do CLAUDE.md). `redact` cobre os
 * campos previsíveis; além disso, ninguém deve passar `req.body`/dado de
 * usuário direto para o logger — só ids, códigos e contagens.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body',
      'res.headers["set-cookie"]',
    ],
    censor: '[redacted]',
  },
  // Em teste, silêncio total — não polui o output do vitest.
  enabled: env.NODE_ENV !== 'test',
});
