import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// O .env vive na raiz do monorepo, não em server/.
config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  // Obrigatórias a partir das tarefas 1.1/1.2/1.9 — na fundação apenas avisamos.
  JWT_SECRET: z.string().min(1).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Token do brapi.dev (opcional no plano gratuito; melhora limites).
  BRAPI_TOKEN: z.string().min(1).optional(),
  // Modelos de IA (defaults sensatos; sobrescreva se quiser).
  CLAUDE_MODEL: z.string().min(1).default('claude-sonnet-5'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
});

// Variável vazia (`CHAVE=` no .env) conta como não configurada — evita que uma
// linha em branco quebre o boot e mantém os testes offline mesmo com .env local.
const rawEnv = Object.fromEntries(
  Object.entries(process.env).filter(([, value]) => value !== undefined && value !== ''),
);

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

const pendentes = (
  [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE',
    'GEMINI_API_KEY',
    'ANTHROPIC_API_KEY',
  ] as const
).filter((key) => env[key] === undefined);

if (pendentes.length > 0 && env.NODE_ENV !== 'test') {
  console.warn(
    `[env] Variáveis ainda não configuradas (necessárias nas próximas tarefas): ${pendentes.join(', ')}`,
  );
}
