import type { NextFunction, Request, Response } from 'express';
import { createRemoteJWKSet, decodeProtectedHeader, jwtVerify, type JWTPayload } from 'jose';
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
 * Projetos Supabase migrados para "JWT signing keys" assinam o access_token em
 * ES256/RS256 e publicam a chave pública no JWKS; os projetos legados ainda
 * usam HS256 com o JWT secret. O algoritmo do header decide qual caminho usar,
 * então o mesmo código serve os dois modos sem chamada de rede desnecessária.
 */
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  if (!env.SUPABASE_URL) return null;
  jwksCache ??= createRemoteJWKSet(new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`));
  return jwksCache;
}

async function verifyToken(token: string): Promise<JWTPayload> {
  const { alg } = decodeProtectedHeader(token);

  if (alg && alg !== 'HS256') {
    const jwks = getJwks();
    if (!jwks) throw new Error('JWKS indisponível: SUPABASE_URL não configurada.');
    const { payload } = await jwtVerify(token, jwks, {
      audience: 'authenticated',
      issuer: `${env.SUPABASE_URL}/auth/v1`,
    });
    return payload;
  }

  if (!env.JWT_SECRET) throw new Error('JWT_SECRET não configurado para tokens HS256.');
  const { payload } = await jwtVerify(token, new TextEncoder().encode(env.JWT_SECRET), {
    audience: 'authenticated',
  });
  return payload;
}

/**
 * Valida o JWT emitido pelo Supabase Auth e anexa { userId, token } à
 * requisição. O token segue com a requisição para o Supabase, mantendo a RLS
 * ativa (createUserClient).
 */
/**
 * Valida um bearer token e devolve o contexto de auth. Reaproveitado pelo
 * attachPlan, que autentica de forma OPCIONAL em rota pública — por isso lança
 * em vez de responder, deixando o chamador decidir entre 401 e seguir como free.
 */
export async function verifyBearer(token: string): Promise<AuthContext> {
  // Sem JWKS (SUPABASE_URL) nem segredo HS256 não há como validar token algum.
  if (!env.SUPABASE_URL && !env.JWT_SECRET) {
    throw new AppError('Autenticação não configurada no servidor.', 'AUTH_NOT_CONFIGURED', 503);
  }

  const payload = await verifyToken(token);
  if (typeof payload.sub !== 'string' || payload.sub.length === 0) {
    throw new Error('token sem sub');
  }
  return { userId: payload.sub, token };
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError('Autenticação necessária.', 'UNAUTHORIZED', 401);
  }
  if (!env.SUPABASE_URL && !env.JWT_SECRET) {
    throw new AppError('Autenticação não configurada no servidor.', 'AUTH_NOT_CONFIGURED', 503);
  }

  // Já autenticado pelo attachPlan? Não revalida o mesmo token duas vezes.
  if (req.auth) return next();

  try {
    req.auth = await verifyBearer(header.slice('Bearer '.length));
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Token inválido ou expirado.', 'UNAUTHORIZED', 401);
  }
  next();
}

/** Uso nos controllers: garante que o requireAuth rodou antes. */
export function getAuth(req: Request): AuthContext {
  if (!req.auth) {
    throw new AppError('Autenticação necessária.', 'UNAUTHORIZED', 401);
  }
  return req.auth;
}
