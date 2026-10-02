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
  GROQ_API_KEY: z.string().min(1).optional(),
  // Token do brapi.dev (opcional no plano gratuito; melhora limites).
  BRAPI_TOKEN: z.string().min(1).optional(),
  // Mercado internacional (finnhub.io — plano gratuito). Sem chave, a aba
  // Internacional responde 503 em vez de inventar número.
  FINNHUB_API_KEY: z.string().min(1).optional(),
  // Modelos de IA (defaults sensatos; sobrescreva se quiser).
  CLAUDE_MODEL: z.string().min(1).default('claude-sonnet-5'),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  GROQ_MODEL: z.string().min(1).default('llama-3.3-70b-versatile'),
  // Provedor da análise de carteira: Groq/Llama (grátis) ou Claude — só trocar aqui.
  ANALYZE_PROVIDER: z.enum(['groq', 'claude']).default('groq'),
  // Mercado cripto (Binance), só leitura, sem API key. 451 por região? troque a base.
  BINANCE_BASE_URL: z.string().url().default('https://api.binance.com'),
  // Nº de proxies reversos na frente do server (exigido pelo express-rate-limit).
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
  // Origens de CORS separadas por vírgula; ausente = sem CORS (monorepo same-origin).
  CORS_ORIGINS: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  RATE_LIMIT_DISABLED: z.coerce.boolean().default(false),
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

const SEMPRE_OBRIGATORIAS = ['JWT_SECRET', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE'] as const;

export const ANALYZE_KEY = env.ANALYZE_PROVIDER === 'claude' ? 'ANTHROPIC_API_KEY' : 'GROQ_API_KEY';

const obrigatoriasEmProducao: string[] = [...SEMPRE_OBRIGATORIAS, 'GEMINI_API_KEY', ANALYZE_KEY];

const pendentes = (
  [
    'JWT_SECRET',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE',
    'GEMINI_API_KEY',
    ANALYZE_KEY,
  ] as const
).filter((key) => env[key] === undefined);

if (env.NODE_ENV === 'production') {
  // Em produção, faltar uma dessas quebra o boot com uma mensagem clara — em vez
  // de subir "funcionando" e devolver 503 silencioso a cada request autenticado.
  const faltando = obrigatoriasEmProducao.filter((key) => env[key as keyof typeof env] === undefined);
  if (faltando.length > 0) {
    console.error(`Variáveis obrigatórias em produção ausentes: ${faltando.join(', ')}`);
    process.exit(1);
  }
} else if (pendentes.length > 0 && env.NODE_ENV !== 'test') {
  console.warn(
    `[env] Variáveis ainda não configuradas (necessárias nas próximas tarefas): ${pendentes.join(', ')}`,
  );
}
