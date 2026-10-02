/**
 * Promove uma conta JÁ CADASTRADA a admin (e, com --pro, ao plano Pro).
 *
 *   npm run grant-admin -w server -- <email> [--pro]
 *
 * O e-mail vem do argumento — nunca é cravado no código. Usa a service role,
 * porque is_admin/plan não são graváveis pelo cliente (ver migration
 * 20261002090000_lock_profile_privileged_columns). Uso de desenvolvimento.
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import type { Database } from '../src/lib/database.types.js';

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

const args = process.argv.slice(2);
const parsed = z.string().trim().toLowerCase().email().safeParse(args.find((a) => !a.startsWith('--')));
if (!parsed.success) {
  console.error('Uso: npm run grant-admin -w server -- <email> [--pro]');
  process.exit(1);
}
const email = parsed.data;
const withPro = args.includes('--pro');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('SUPABASE_URL / SUPABASE_SERVICE_ROLE ausentes no .env.');
  process.exit(1);
}

const db = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ilike sem curinga = comparação case-insensitive; escapa % e _ do e-mail.
const { data: found, error: findError } = await db
  .from('profiles')
  .select('id')
  .ilike('email', email.replace(/[%_]/g, (c) => `\${c}`))
  .maybeSingle();
if (findError) {
  console.error(`Falha ao buscar o perfil: ${findError.message}`);
  process.exit(1);
}
if (!found) {
  console.error('Nenhum perfil com esse e-mail. Cadastre-se no app (/login) primeiro.');
  process.exit(1);
}

const patch: Database['public']['Tables']['profiles']['Update'] = { is_admin: true };
if (withPro) {
  patch.plan = 'pro';
  patch.plan_updated_at = new Date().toISOString();
}

const { data: updated, error: updateError } = await db
  .from('profiles')
  .update(patch)
  .eq('id', found.id)
  .select('id, is_admin, plan')
  .single();
if (updateError) {
  console.error(`Falha ao atualizar: ${updateError.message}`);
  process.exit(1);
}

console.log(`ok — id ${updated.id} · is_admin: ${updated.is_admin} · plan: ${updated.plan}`);
console.log('Saia e entre de novo no app para o /api/me refletir a mudança.');
