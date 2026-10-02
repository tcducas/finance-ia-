/**
 * Smoke test das rotas da API contra o Supabase real.
 *
 *   npm run smoke -w server            # usa http://localhost:3000
 *   BASE_URL=... npm run smoke -w server
 *
 * Faz login com AURA_SMOKE_EMAIL/AURA_SMOKE_PASSWORD (defaults abaixo). Se o
 * usuário não existir, cria-o já confirmado via service role — necessário
 * porque o projeto exige confirmação de e-mail no signup normal.
 * Uso exclusivo de desenvolvimento: nunca roda em produção.
 */
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
const EMAIL = process.env.AURA_SMOKE_EMAIL ?? 'smoke@aura.test';
const PASSWORD = process.env.AURA_SMOKE_PASSWORD ?? 'aura-smoke-123456';

if (!SUPABASE_URL || !ANON) {
  console.error('SUPABASE_URL / SUPABASE_ANON_KEY ausentes no .env.');
  process.exit(1);
}

const month = new Date().toISOString().slice(0, 7);
let failures = 0;

function line(label: string, status: number, expected: number[], extra = '') {
  const ok = expected.includes(status);
  if (!ok) failures += 1;
  console.log(
    `${ok ? '  ok ' : ' FAIL'} ${String(status).padEnd(3)} ${label}${extra ? ` — ${extra}` : ''}`,
  );
}

async function signIn(): Promise<string | null> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: ANON as string, 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { access_token?: string };
  return body.access_token ?? null;
}

/** Cria o usuário de smoke já confirmado (service role). Idempotente. */
async function ensureUser(): Promise<void> {
  if (!SERVICE_ROLE) {
    throw new Error('SUPABASE_SERVICE_ROLE ausente: não dá para criar o usuário de smoke.');
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE,
      authorization: `Bearer ${SERVICE_ROLE}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: 'Smoke Test' },
    }),
  });
  if (!res.ok && res.status !== 422) {
    throw new Error(`Falha ao criar usuário de smoke (${res.status}): ${await res.text()}`);
  }
}

interface CallOptions {
  method?: string;
  body?: unknown;
  token?: string;
  expect?: number[];
}

async function call(label: string, path: string, opts: CallOptions = {}) {
  const { method = 'GET', body, token, expect = [200] } = opts;
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'content-type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = text.slice(0, 120);
  }
  const err = (parsed as { error?: { message?: string } })?.error?.message;
  line(
    `${method} ${path}`,
    res.status,
    expect,
    expect.includes(res.status) ? '' : (err ?? String(parsed).slice(0, 120)),
  );
  return (parsed as { data?: unknown })?.data;
}

async function main() {
  console.log(`\nBase: ${BASE_URL}`);
  console.log(`Supabase: ${SUPABASE_URL}\n`);

  console.log('— públicas —');
  await call('health', '/api/health');
  await call('ready', '/api/health/ready');
  await call('quotes B3', '/api/market/quotes?tickers=PETR4,VALE3');
  await call('quotes cripto', '/api/market/quotes?tickers=CRYPTO:BTCBRL,CRYPTO:ETHBRL');
  await call('search', '/api/market/search?q=PETR');
  await call('validate', '/api/market/validate/PETR4');
  await call('asset B3', '/api/market/asset/PETR4');
  await call('asset cripto', '/api/market/asset/BTCBRL?market=CRYPTO');
  await call('board B3', '/api/market/board/PETR4?market=BR');
  await call('board cripto', '/api/market/board/BTCBRL?market=CRYPTO&interval=1h');
  // Sem FINNHUB_API_KEY o mercado US responde 503 — é resultado esperado, não falha.
  // Mercado internacional é do plano Pro: sem token o esperado é 402 PLAN_REQUIRED.
  await call('board internacional sem plano', '/api/market/board/AAPL?market=US', {
    expect: [402],
  });

  console.log('\n— sem token (deve dar 401) —');
  await call('me sem token', '/api/me', { expect: [401] });

  console.log('\n— autenticando —');
  let token = await signIn();
  if (!token) {
    console.log(`  usuário ${EMAIL} não existe ou não está confirmado; criando via service role…`);
    await ensureUser();
    token = await signIn();
  }
  if (!token) {
    console.error('  FALHA: não consegui obter access_token.');
    process.exit(1);
  }
  const alg = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString()).alg as string;
  console.log(`  ok   access_token obtido (alg=${alg})`);

  console.log('\n— autenticadas —');
  await call('me', '/api/me', { token });
  await call('summary', `/api/summary?month=${month}`, { token });
  await call('spending', `/api/summary/spending?month=${month}`, { token });
  await call('transactions', `/api/transactions?month=${month}`, { token });
  await call('budgets', '/api/budgets', { token });
  await call('assets', '/api/assets', { token });
  await call('watchlist', '/api/watchlist', { token });
  await call('evolution', '/api/summary/evolution?months=12', { token });
  await call('carteira', '/api/portfolio', { token });
  await call('panorama', '/api/portfolio/panorama', { token });
  await call('goals', '/api/goals', { token });
  await call('planning', '/api/planning?horizon=60', { token });
  await call('admin stats (não-admin → 403)', '/api/admin/stats', { token, expect: [403] });
  await call('admin users (não-admin → 403)', '/api/admin/users', { token, expect: [403] });
  // O usuário de smoke nasce free: o internacional deve recusar com 402.
  await call('internacional no free', '/api/market/board/AAPL?market=US', {
    token,
    expect: [402],
  });

  console.log('\n— escrita (cria e apaga) —');
  const tx = (await call('cria transação', '/api/transactions', {
    token,
    method: 'POST',
    body: {
      type: 'despesa',
      amount: 12.34,
      category: 'Mercado',
      occurred_on: `${month}-01`,
      description: 'smoke test',
    },
    expect: [201],
  })) as { id?: string } | undefined;
  if (tx?.id) await call('apaga transação', `/api/transactions/${tx.id}`, { token, method: 'DELETE' });

  const budget = (await call('cria orçamento', '/api/budgets', {
    token,
    method: 'POST',
    body: { category: 'Mercado', monthly_limit: 500 },
    expect: [200, 201],
  })) as { id?: string } | undefined;
  if (budget?.id) await call('apaga orçamento', `/api/budgets/${budget.id}`, { token, method: 'DELETE' });

  const asset = (await call('cria ativo', '/api/assets', {
    token,
    method: 'POST',
    body: { kind: 'acao', name: 'PETR4', value: 1000 },
    expect: [201],
  })) as { id?: string } | undefined;
  if (asset?.id) await call('apaga ativo', `/api/assets/${asset.id}`, { token, method: 'DELETE' });

  const holding = (await call('cria posição', '/api/portfolio', {
    token,
    method: 'POST',
    body: {
      ticker: 'PETR4',
      asset_class: 'acao',
      quantity: 100,
      avg_price: 30,
      acquired_on: '2025-10-01',
    },
    expect: [201],
  })) as { id?: string } | undefined;
  if (holding?.id) {
    await call('apaga posição', `/api/portfolio/${holding.id}`, { token, method: 'DELETE' });
  }

  await call('snapshot do mês', '/api/summary/snapshot', {
    token,
    method: 'POST',
    body: {},
    expect: [201],
  });

  const goal = (await call('cria meta', '/api/goals', {
    token,
    method: 'POST',
    body: {
      name: `Smoke ${Date.now()}`,
      kind: 'reserva',
      target_amount: 30_000,
      current_amount: 5000,
      monthly_contribution: 1000,
      annual_rate: 0.1,
    },
    expect: [201],
  })) as { id?: string } | undefined;
  if (goal?.id) await call('apaga meta', `/api/goals/${goal.id}`, { token, method: 'DELETE' });

  const watch = (await call('add watchlist', '/api/watchlist', {
    token,
    method: 'POST',
    body: { ticker: 'PETR4' },
    expect: [201],
  })) as { id?: string } | undefined;
  if (watch?.id) await call('remove watchlist', `/api/watchlist/${watch.id}`, { token, method: 'DELETE' });

  console.log('\n— IA (503 = chave não configurada, também é resultado válido) —');
  await call('chat', '/api/ai/chat', {
    token,
    method: 'POST',
    body: { message: 'Resuma meu mês em uma frase.' },
    expect: [200, 503],
  });
  // Carteira vazia depois do ciclo acima: 400 EMPTY_PORTFOLIO é o esperado.
  await call('avaliação da carteira', '/api/ai/portfolio', {
    token,
    method: 'POST',
    body: { objetivo: 'quero viver de renda em 15 anos' },
    expect: [200, 400, 503],
  });
  await call('analyze', '/api/ai/analyze', {
    token,
    method: 'POST',
    body: { aporte: 1000 },
    expect: [200, 503],
  });

  console.log(failures === 0 ? '\n✅ smoke ok\n' : `\n❌ ${failures} rota(s) fora do esperado\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
