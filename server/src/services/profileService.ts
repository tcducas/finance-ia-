import { AppError } from '../errors/AppError.js';
import { fromPostgrest } from '../errors/postgrest.js';
import type { Json } from '../lib/database.types.js';
import { scoreRiskProfile, type OnboardingAnswers, type RiskProfile } from '../lib/riskScore.js';
import type { UserClient } from '../lib/supabase.js';

export interface Me {
  id: string;
  email: string | null;
  full_name: string | null;
  is_admin: boolean;
  onboarded_at: string | null;
  risk_profile: RiskProfile | null;
}

export async function getMe(db: UserClient, userId: string): Promise<Me> {
  const { data: profile, error } = await db
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw fromPostgrest(error);
  if (!profile) throw new AppError('Perfil não encontrado.', 'NOT_FOUND', 404);

  const { data: investor, error: investorError } = await db
    .from('investor_profiles')
    .select('risk_profile')
    .eq('user_id', userId)
    .maybeSingle();
  if (investorError) throw fromPostgrest(investorError);

  return {
    id: profile.id,
    email: profile.email,
    full_name: profile.full_name,
    is_admin: profile.is_admin,
    onboarded_at: profile.onboarded_at,
    risk_profile: investor?.risk_profile ?? null,
  };
}

export async function saveOnboarding(
  db: UserClient,
  userId: string,
  answers: OnboardingAnswers,
): Promise<Me> {
  const { risk } = scoreRiskProfile(answers);
  const now = new Date().toISOString();

  const { error: investorError } = await db.from('investor_profiles').upsert(
    {
      user_id: userId,
      risk_profile: risk,
      answers: answers as unknown as Json,
      computed_at: now,
    },
    { onConflict: 'user_id' },
  );
  if (investorError) throw fromPostgrest(investorError);

  const { error: profileError } = await db
    .from('profiles')
    .update({ onboarded_at: now })
    .eq('id', userId);
  if (profileError) throw fromPostgrest(profileError);

  return getMe(db, userId);
}
