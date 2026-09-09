import type { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { env } from '../env.js';
import { AppError } from '../errors/AppError.js';

export interface AuthContext {
  userId: string;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Valida o JWT emitido pelo Supabase Auth (HS256, assinado com o JWT secret
 * do projeto) e anexa { userId, token } à requisição. O token segue com a
 * requisição para o Supabase, mantendo a RLS ativa (createUserClient).
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Autenticação necessária.', 'UNAUTHORIZED', 401);
  }
  if (!env.JWT_SECRET) {
    throw new AppError('Autenticação não configurada no servidor.', 'AUTH_NOT_CONFIGURED', 503);
  }

  const token = header.slice('Bearer '.length);
  let userId: string;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET), {
      audience: 'authenticated',
    });
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
      throw new Error('token sem sub');
    }
    userId = payload.sub;
  } catch {
    throw new AppError('Token inválido ou expirado.', 'UNAUTHORIZED', 401);
  }

  req.auth = { userId, token };
  next();
}

/** Uso nos controllers: garante que o requireAuth rodou antes. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new AppError('Autenticação necessária.', 'UNAUTHORIZED', 401);
  }
  return req.auth;
}
