import { ArrowRight, Clock, Lock, ShieldCheck } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { BentoGrid } from '../components/landing/BentoGrid';
import { HeroProductPanel } from '../components/landing/HeroProductPanel';
import {
  BoundarySection,
  Faq,
  FinalCta,
  HowItWorks,
  PlanCompare,
  TrustSection,
} from '../components/landing/Sections';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../context/AuthContext';

/**
 * Tela: Landing — rota `/` (pública)
 * Menu: — (fora do app autenticado)
 * Página de marketing; redireciona para /app se já houver sessão.
 *
 * Estrutura segue as referências do banco do usuário: herói com o produto real
 * (não ilustração genérica) e recursos em bento grid. Nenhuma prova social
 * inventada — a credibilidade vem de afirmações verificáveis no código.
 */

/** Tickers da faixa: os mesmos mercados que o app realmente cobre. */
const TICKERS = [
  { symbol: 'PETR4', change: '+1,24%', up: true },
  { symbol: 'VALE3', change: '−0,82%', up: false },
  { symbol: 'ITUB4', change: '+0,41%', up: true },
  { symbol: 'BTC/BRL', change: '+2,81%', up: true },
  { symbol: 'ETH/BRL', change: '+1,90%', up: true },
  { symbol: 'AAPL', change: '+0,67%', up: true },
  { symbol: 'VOO', change: '+0,33%', up: true },
  { symbol: 'IBOV', change: '+0,58%', up: true },
];

export function LandingPage() {
  const { session, configured } = useAuth();
  if (configured && session) return <Navigate to="/app" replace />;

  return (
    <div className="relative">
      <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <span className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gold font-extrabold text-white">
              A
            </span>
            <span className="font-display text-lg font-bold tracking-tight">Aura Finance</span>
          </span>
          <nav className="flex items-center gap-2" aria-label="Acesso">
            <ThemeToggle />
            <Link
              to="/login"
              className="rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              Entrar
            </Link>
            <Link
              to="/login"
              className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gold-strong"
            >
              Criar conta
            </Link>
          </nav>
        </div>
      </header>

      {/* ---- Herói: copy à esquerda, produto à direita ---- */}
      <section className="relative overflow-hidden">
        <div className="aurora" aria-hidden />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:px-6 md:py-24 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <p
              className="enter text-sm font-medium tracking-widest text-gold uppercase"
              style={{ ['--enter-step' as string]: 0 }}
            >
              Copiloto financeiro inteligente
            </p>
            <h1
              className="enter mt-4 font-display text-[2.6rem] leading-[1.02] font-extrabold tracking-[-0.03em] text-balance md:text-6xl"
              style={{ ['--enter-step' as string]: 1 }}
            >
              Saiba onde investir — e por quê.
            </h1>
            <p
              className="enter mt-5 max-w-xl text-base text-ink-muted md:text-lg"
              style={{ ['--enter-step' as string]: 2 }}
            >
              O Aura reúne movimentações, orçamento, patrimônio e mercado num só lugar, calcula a
              análise da sua carteira com os métodos clássicos — VPL, TIR, payback, concentração — e
              usa IA para explicar cada número. Quem aplica é você, na sua corretora.
            </p>

            <div
              className="enter mt-8 flex flex-wrap gap-3"
              style={{ ['--enter-step' as string]: 3 }}
            >
              <Link
                to="/login"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-strong"
              >
                Criar conta grátis
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a
                href="#recursos"
                className="inline-flex items-center gap-2 rounded-full border border-line px-6 py-3.5 text-sm font-semibold transition-colors hover:border-gold hover:text-gold"
              >
                Ver o que ele faz
              </a>
            </div>

            <ul
              className="enter mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-ink-muted"
              style={{ ['--enter-step' as string]: 4 }}
            >
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-gold" aria-hidden />
                Não executa ordens
              </li>
              <li className="flex items-center gap-1.5">
                <Lock className="size-3.5 text-gold" aria-hidden />
                Dados anonimizados antes da IA
              </li>
              <li className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-gold" aria-hidden />
                Atraso de cotação sempre rotulado
              </li>
            </ul>
          </div>

          <div className="flex justify-center lg:justify-end">
            <HeroProductPanel />
          </div>
        </div>
      </section>

      {/* ---- Faixa de tickers ---- */}
      <div
        className="overflow-hidden border-y border-line bg-elevated/60 py-3"
        role="img"
        aria-label="Exemplo de variação dos mercados cobertos: B3, cripto e Estados Unidos"
      >
        <div className="marquee-track gap-8">
          {/* Duplicado para o loop não deixar vazio no meio do caminho. */}
          {[...TICKERS, ...TICKERS].map((ticker, index) => (
            <span
              key={`${ticker.symbol}-${index}`}
              className="flex shrink-0 items-center gap-2 text-xs"
            >
              <span className="font-semibold tracking-wide">{ticker.symbol}</span>
              <span
                className="tabular-nums"
                style={{ color: ticker.up ? 'var(--status-good)' : 'var(--status-bad)' }}
              >
                {ticker.change}
              </span>
            </span>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl space-y-24 px-4 py-20 md:px-6 md:py-28">
        <HowItWorks />

        <section aria-labelledby="recursos" id="recursos" className="scroll-mt-20">
          <div className="reveal">
            <p className="text-sm font-medium tracking-widest text-gold uppercase">Recursos</p>
            <h2
              id="recursos"
              className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl"
            >
              Tudo o que você precisa, com o método à mostra
            </h2>
            <p className="mt-3 max-w-2xl text-base text-ink-muted">
              Cada número do app vem com o cálculo por trás dele. Nada de caixa-preta pedindo
              confiança.
            </p>
          </div>
          <div className="mt-8">
            <BentoGrid />
          </div>
        </section>

        <BoundarySection />
        <TrustSection />
        <PlanCompare />
        <Faq />
        <FinalCta />
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-xs text-ink-muted md:flex-row md:items-center md:justify-between md:px-6">
          <span className="flex items-center gap-2">
            <span className="grid size-7 place-items-center rounded-lg bg-gold text-[11px] font-extrabold text-white">
              A
            </span>
            <span className="font-display font-bold text-ink">Aura Finance</span>
          </span>
          <p className="max-w-2xl">
            Conteúdo educativo — não é recomendação de investimento (enquadramento CVM: análise
            educativa, não consultoria). O Aura não executa ordens nem custodia recursos. Os números
            exibidos nesta página são exemplos.
          </p>
        </div>
      </footer>
    </div>
  );
}
