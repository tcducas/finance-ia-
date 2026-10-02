import { ArrowRight, Clock, Lock, Menu, ShieldCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
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

/** Âncoras das seções — header (desktop), menu mobile e rodapé usam a mesma lista. */
const SECTION_LINKS = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#planos', label: 'Planos' },
  { href: '#faq', label: 'Dúvidas' },
];

function LandingHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <a href="#topo" className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-gold font-extrabold text-on-gold">
            A
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Aura Finance</span>
        </a>

        <nav aria-label="Seções" className="hidden items-center gap-1 lg:flex">
          {SECTION_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink sm:block"
          >
            Entrar
          </Link>
          <Link
            to="/login?modo=cadastro"
            className="hidden rounded-full bg-gold px-4 py-2 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-strong sm:block"
          >
            Criar conta
          </Link>
          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            aria-expanded={open}
            aria-controls="menu-landing"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            className="grid size-10 place-items-center rounded-full border border-line bg-elevated text-ink-muted transition-colors hover:text-gold lg:hidden"
          >
            {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="menu-landing"
          aria-label="Seções (menu)"
          className="border-t border-line bg-canvas px-4 pt-2 pb-4 lg:hidden"
        >
          <ul className="flex flex-col">
            {SECTION_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-ink-muted transition-colors hover:bg-elevated hover:text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:hidden">
            <Link
              to="/login"
              className="flex min-h-11 items-center justify-center rounded-full border border-line text-sm font-semibold"
            >
              Entrar
            </Link>
            <Link
              to="/login?modo=cadastro"
              className="flex min-h-11 items-center justify-center rounded-full bg-gold text-sm font-semibold text-on-gold"
            >
              Criar conta
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

export function LandingPage() {
  const { session, configured } = useAuth();
  if (configured && session) return <Navigate to="/app" replace />;

  return (
    <div id="topo" className="relative">
      <LandingHeader />

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
                to="/login?modo=cadastro"
                className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-3.5 text-sm font-semibold text-on-gold shadow-sm transition-colors hover:bg-gold-strong"
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

        <section aria-labelledby="recursos">
          <div className="reveal">
            <p className="text-sm font-medium tracking-widest text-gold uppercase">Recursos</p>
            <h2
              id="recursos"
              className="mt-2 scroll-mt-24 font-display text-3xl font-bold tracking-tight md:text-4xl"
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
            <span className="grid size-7 place-items-center rounded-lg bg-gold text-[11px] font-extrabold text-on-gold">
              A
            </span>
            <span className="font-display font-bold text-ink">Aura Finance</span>
          </span>
          <nav aria-label="Seções (rodapé)" className="flex flex-wrap gap-x-4 gap-y-2">
            {SECTION_LINKS.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-ink">
                {link.label}
              </a>
            ))}
            <Link to="/login" className="transition-colors hover:text-ink">
              Entrar
            </Link>
          </nav>
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
