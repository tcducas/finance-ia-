import { ArrowRight, LineChart, Sparkles, Target, Wallet } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
  {
    icon: Wallet,
    title: 'Minha Carteira',
    text: 'Entradas, saídas e gastos por categoria do mês — recálculo na hora a cada lançamento.',
  },
  {
    icon: Target,
    title: 'Gastos e metas',
    text: 'Orçamento por categoria com alertas e planejamento de objetivos de curto a longo prazo.',
  },
  {
    icon: LineChart,
    title: 'Mercado ao vivo',
    text: 'Monitor de índices, watchlist e detalhe de ativos com cotação (atraso ~15 min).',
  },
  {
    icon: Sparkles,
    title: 'Copiloto de IA',
    text: 'Analisa sua carteira e direciona onde aportar — de forma educativa. Direciona, não executa.',
  },
];

export function LandingPage() {
  const { session, configured } = useAuth();
  if (configured && session) return <Navigate to="/app" replace />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 py-8">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gold font-extrabold text-white">
            A
          </span>
          <span className="text-lg font-bold tracking-tight">Aura Finance</span>
        </span>
        <Link
          to="/login"
          className="rounded-full border border-line px-4 py-2 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          Entrar
        </Link>
      </header>

      <main className="flex flex-1 flex-col justify-center py-16">
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-gold">
          Copiloto financeiro inteligente
        </p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          Acompanhe sua vida financeira e saiba onde investir.
        </h1>
        <p className="mt-5 max-w-xl text-base text-ink-muted">
          O Aura reúne movimentações, orçamento, patrimônio e mercado num só lugar e usa IA
          para direcionar seus aportes — sempre de forma educativa. Quem aplica é você, na
          sua corretora.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-strong"
          >
            Criar conta grátis
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
          >
            Já tenho conta
          </Link>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-elevated/60 p-5">
              <div className="mb-3 grid size-10 place-items-center rounded-xl border border-line bg-elevated text-gold">
                <Icon className="size-5" aria-hidden />
              </div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-line pt-6 text-xs text-ink-muted">
        Conteúdo educativo — não é recomendação de investimento (enquadramento CVM: análise
        educativa, não consultoria). O Aura não executa ordens nem custodia recursos.
      </footer>
    </div>
  );
}
