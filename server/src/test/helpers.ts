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
