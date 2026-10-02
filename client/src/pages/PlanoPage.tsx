import { Check, Crown, Minus, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PLAN_FEATURES } from '../lib/plans';
import type { Plan } from '../services/account';

/**
 * Tela: Planos — rota `/app/plano`
 * Menu: rodapé
 * Comparativo free × Pro e o plano atual do usuário. O Aura não cobra dentro do
 * app: o plano é concedido pelo painel Admin, então aqui não há checkout.
 */

export function PlanoPage() {
  const { profile } = useAuth();
  const current: Plan = profile?.plan ?? 'free';

  return (
    <section aria-labelledby="plano-titulo" className="mx-auto max-w-6xl space-y-6">
      <h2
        id="plano-titulo"
        className="mb-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight"
      >
        <Crown className="size-6 text-gold" aria-hidden />
        Planos
      </h2>
      <p className="mb-6 text-sm text-ink-muted">
        O que cada plano libera. Seu plano atual é{' '}
        <strong className="text-ink">{current === 'pro' ? 'Pro' : 'Free'}</strong>
        {profile?.plan_updated_at &&
          ` desde ${new Date(profile.plan_updated_at).toLocaleDateString('pt-BR')}`}
        .
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <PlanCard
          plan="free"
          current={current}
          title="Free"
          price="Grátis"
          pitch="A vida financeira completa: movimentações, orçamento, metas e os mercados nacionais."
        />
        <PlanCard
          plan="pro"
          current={current}
          title="Pro"
          price="—"
          pitch="Mercado internacional, board completo com livro de ofertas e copiloto sem limite."
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-line bg-elevated">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Comparativo de recursos entre os planos Free e Pro</caption>
          <thead>
            <tr className="border-b border-line text-xs text-ink-muted uppercase tracking-wide">
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Recurso
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Free
              </th>
              <th scope="col" className="px-4 py-3 text-left font-medium">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURES.map((feature) => (
              <tr key={feature.label} className="border-b border-line last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-medium">
                  {feature.label}
                </th>
                <td className="px-4 py-3">
                  {feature.free === false ? (
                    <span className="flex items-center gap-1.5 text-ink-muted">
                      <Minus className="size-3.5" aria-hidden />
                      não incluído
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5">
                      <Check
                        className="size-3.5"
                        style={{ color: 'var(--status-good)' }}
                        aria-hidden
                      />
                      {feature.free}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <Check
                      className="size-3.5"
                      style={{ color: 'var(--status-good)' }}
                      aria-hidden
                    />
                    {feature.pro}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-5 rounded-2xl border border-line bg-elevated px-4 py-3 text-xs text-ink-muted">
        <strong className="text-ink">Sem cobrança dentro do app.</strong> O Aura não processa
        pagamento: o plano é concedido pelo painel Admin.{' '}
        {profile?.is_admin ? (
          <>
            Como você é admin, conceda pela{' '}
            <Link to="/app/admin" className="text-gold underline">
              tela Admin
            </Link>
            .
          </>
        ) : (
          'Fale com o administrador para mudar de plano.'
        )}
      </p>
    </section>
  );
}

function PlanCard({
  plan,
  current,
  title,
  price,
  pitch,
}: {
  plan: Plan;
  current: Plan;
  title: string;
  price: string;
  pitch: string;
}) {
  const active = plan === current;
  return (
    <div
      className={`rounded-2xl border bg-elevated p-5 ${active ? 'border-gold' : 'border-line'}`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-lg font-semibold">
          {plan === 'pro' && <Sparkles className="size-4 text-gold" aria-hidden />}
          {title}
        </h3>
        {active && (
          <span className="rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-gold">
            seu plano
          </span>
        )}
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{price}</p>
      <p className="mt-2 text-sm text-ink-muted">{pitch}</p>
    </div>
  );
}
