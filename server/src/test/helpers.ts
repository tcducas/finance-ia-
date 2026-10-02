import { SignJWT } from 'jose';

export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

/** Gera um JWT no formato do Supabase Auth, assinado com o segredo de teste. */
export async function makeToken(userId: string = TEST_USER_ID): Promise<string> {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  return new SignJWT({ role: 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setAudience('authenticated')
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);
}

/**
 * Duplo encadeável do client Supabase. O attachPlan lê `profiles.plan` em toda
 * rota com plano, então os testes de rota precisam de um `from(...)` que aceite
 * qualquer cadeia (`select().eq().eq().maybeSingle()`, `upsert()`, etc.) sem
 * tocar a rede — senão a suíte trava esperando um Supabase que não existe.
 */
export function stubDb(row: Record<string, unknown> | null = { plan: 'free' }) {
  const result = { data: row, error: null };
  const chain: Record<string, unknown> = {
    then: (resolve: (value: { data: unknown; error: null }) => unknown) =>
      resolve({ data: row === null ? [] : [row], error: null }),
  };
  for (const method of [
    'select',
    'eq',
    'neq',
    'gte',
    'lte',
    'or',
    'order',
    'limit',
    'insert',
    'update',
    'upsert',
    'delete',
  ]) {
    chain[method] = () => chain;
  }
  chain.maybeSingle = async () => result;
  chain.single = async () => result;

  return { from: () => chain } as never;
}
