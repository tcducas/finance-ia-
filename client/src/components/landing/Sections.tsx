import { Check, ChevronDown, Lock, ShieldCheck, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PLAN_FEATURES } from '../../lib/plans';

/**
 * Seções de apoio da landing. Separadas do `LandingPage` para a página ficar
 * legível como roteiro, e agrupadas num arquivo porque são blocos pequenos que
 * mudam juntos.
 *
 * Regra que vale para todas: **nenhuma prova social inventada**. Sem depoimento,
 * sem contagem de usuários, sem logo de parceiro. O projeto não tem usuários
 * reais e fabricar isso seria mentir na vitrine. A credibilidade aqui vem de
 * afirmações verificáveis no próprio código.
 */

// --- Como funciona -----------------------------------------------------------

const STEPS = [
  {
    title: 'Registre ou importe',
    text: 'Lance movimentações na mão ou importe o CSV do banco e da corretora. O parser aceita o formato que eles exportam.',
  },
  {
    title: 'Entenda onde você está',
    text: 'Orçamento, patrimônio, score de saúde financeira e a análise da carteira — com o método explicado em cada número.',
  },
  {
    title: 'Decida com direcionamento',
    text: 'O copiloto aponta o que melhorar para o seu objetivo. Quem aplica é você, na sua corretora.',
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona" className="reveal">
      <h2
        id="como-funciona"
        className="font-display text-3xl font-bold tracking-tight md:text-4xl"
      >
        Três passos, sem planilha
      </h2>
      {/* Numeração aqui é informação: a ordem dos passos importa de verdade. */}
      <ol className="mt-8 grid gap-4 md:grid-cols-3">
        {STEPS.map((step, index) => (
          <li
            key={step.title}
            className="relative rounded-3xl border border-line bg-elevated p-5 pt-12"
          >
            <span className="absolute top-5 left-5 font-display text-sm font-bold text-gold tabular-nums">
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="font-display text-lg font-bold tracking-tight">{step.title}</h3>
            <p className="mt-1.5 text-sm text-ink-muted">{step.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// --- Direciona, não executa --------------------------------------------------

const DOES = [
  'Lê sua carteira para raciocinar sobre ela',
  'Explica o porquê de cada número e de cada sugestão',
  'Aponta o que melhorar para o objetivo que você declarou',
  'Mostra o mercado com a fonte e o atraso sempre rotulados',
];

const DOES_NOT = [
  'Enviar ordem de compra ou venda',
  'Custodiar ou movimentar seu dinheiro',
  'Prometer retorno ou dar recomendação de investimento',
  'Mandar seu nome, CPF ou patrimônio absoluto para a IA',
];

export function BoundarySection() {
  return (
    <section aria-labelledby="limite" className="reveal">
      <p className="text-sm font-medium tracking-widest text-gold uppercase">O limite é o produto</p>
      <h2 id="limite" className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
        Direciona, não executa
      </h2>
      <p className="mt-3 max-w-2xl text-base text-ink-muted">
        Um copiloto que opera por você é um risco com cara de conveniência. O Aura foi desenhado
        para a decisão continuar sendo sua — e isso está no código, não só na promessa.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-line bg-elevated p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold">
            <Check className="size-4" style={{ color: 'var(--status-good)' }} aria-hidden />
            O que ele faz
          </h3>
          <ul className="mt-3 space-y-2.5">
            {DOES.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <Check
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: 'var(--status-good)' }}
                  aria-hidden
                />
                <span className="text-ink-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-line bg-elevated p-5">
          <h3 className="flex items-center gap-2 font-display text-base font-bold">
            <X className="size-4" style={{ color: 'var(--status-bad)' }} aria-hidden />
            O que ele nunca faz
          </h3>
          <ul className="mt-3 space-y-2.5">
            {DOES_NOT.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm">
                <X
                  className="mt-0.5 size-4 shrink-0"
                  style={{ color: 'var(--status-bad)' }}
                  aria-hidden
                />
                <span className="text-ink-muted">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

// --- Confiança e privacidade -------------------------------------------------

const GOES_TO_AI = ['Tickers e classes de ativo', 'Percentuais e faixas', 'Perfil de investidor', 'Categorias de gasto'];
const NEVER_GOES = ['Nome e e-mail', 'CPF', 'Valor absoluto do patrimônio', 'Qualquer identificador direto'];

export function TrustSection() {
  return (
    <section aria-labelledby="confianca" className="reveal">
      <h2 id="confianca" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Seus dados, com fronteira declarada
      </h2>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <ul className="space-y-3">
          {[
            {
              icon: ShieldCheck,
              title: 'Isolamento por usuário no banco',
              text: 'Toda tabela nasce com Row Level Security e política por operação. A regra é auth.uid() = user_id, aplicada pelo Postgres — não por um if no servidor.',
            },
            {
              icon: Lock,
              title: 'Chaves só no servidor',
              text: 'O navegador nunca fala com a API de mercado nem com a IA direto. Tudo passa por proxy, e a chave não sai do backend.',
            },
            {
              icon: Upload,
              title: 'Conta conectada é somente leitura',
              text: 'Import por CSV ou leitura via Open Finance. Não existe caminho de ordem no código, e não deve passar a existir.',
            },
          ].map((item) => (
            <li key={item.title} className="flex gap-3 rounded-3xl border border-line bg-elevated p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-line bg-canvas text-gold">
                <item.icon className="size-4.5" aria-hidden />
              </span>
              <div>
                <h3 className="font-display text-base font-bold tracking-tight">{item.title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{item.text}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-3xl border border-line bg-elevated p-5">
          <h3 className="font-display text-base font-bold tracking-tight">
            O contrato de anonimização
          </h3>
          <p className="mt-1 text-sm text-ink-muted">
            A IA precisa de contexto para ser útil, mas não precisa saber quem você é. A fronteira é
            explícita no código:
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--status-good)' }}>
              <p
                className="text-[11px] font-bold tracking-wide uppercase"
                style={{ color: 'var(--status-good)' }}
              >
                Vai ao prompt
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                {GOES_TO_AI.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--status-bad)' }}>
              <p
                className="text-[11px] font-bold tracking-wide uppercase"
                style={{ color: 'var(--status-bad)' }}
              >
                Nunca vai
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
                {NEVER_GOES.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Planos ------------------------------------------------------------------

export function PlanCompare() {
  return (
    <section aria-labelledby="planos" className="reveal">
      <h2 id="planos" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Comece no Free
      </h2>
      <p className="mt-3 max-w-2xl text-base text-ink-muted">
        O Free não é demonstração: dá conta da vida financeira inteira, com os mercados nacionais e
        metas sem limite. O Pro abre o internacional, o board completo e o copiloto sem cota.
      </p>

      <div className="mt-8 overflow-x-auto rounded-3xl border border-line bg-elevated">
        <table className="w-full min-w-[560px] text-sm">
          <caption className="sr-only">Comparativo de recursos entre os planos Free e Pro</caption>
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="px-5 py-4 text-left text-xs font-medium tracking-wide text-ink-muted uppercase">
                Recurso
              </th>
              <th scope="col" className="px-5 py-4 text-left font-display text-base font-bold">
                Free
              </th>
              <th scope="col" className="px-5 py-4 text-left font-display text-base font-bold text-gold">
                Pro
              </th>
            </tr>
          </thead>
          <tbody>
            {PLAN_FEATURES.map((feature) => (
              <tr key={feature.label} className="border-b border-line last:border-0">
                <th scope="row" className="px-5 py-3 text-left font-medium">
                  {feature.label}
                </th>
                <td className="px-5 py-3 text-ink-muted">
                  {feature.free === false ? (
                    <span className="opacity-50">—</span>
                  ) : (
                    feature.free
                  )}
                </td>
                <td
                  className="px-5 py-3"
                  style={feature.highlight ? { color: 'var(--gold)', fontWeight: 600 } : undefined}
                >
                  {feature.pro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-muted">
        Projeto de portfólio: não há cobrança dentro do app. O plano Pro é concedido pelo painel
        administrativo.
      </p>
    </section>
  );
}

// --- FAQ ---------------------------------------------------------------------

const QUESTIONS = [
  {
    q: 'O Aura investe por mim?',
    a: 'Não, e isso é decisão de projeto. Ele analisa, explica e sugere; quem executa é você, na sua corretora. Não existe rota de ordem no código.',
  },
  {
    q: 'De onde vêm as cotações?',
    a: 'Ações e FIIs da B3 pela brapi.dev, com atraso de cerca de 15 minutos no plano gratuito. Cripto pela API pública da Binance, em tempo real. Ações e ETFs dos EUA pelo finnhub. Em toda tela o atraso aparece rotulado por ativo.',
  },
  {
    q: 'A IA vê meus dados pessoais?',
    a: 'Não. Antes de qualquer chamada, o contexto passa por anonimização: vão tickers, percentuais, faixas e categorias; não vão nome, e-mail, CPF nem valor absoluto de patrimônio.',
  },
  {
    q: 'Preciso conectar minha conta bancária?',
    a: 'Não é obrigatório. Você pode lançar na mão ou importar CSV. Se conectar, a leitura é somente leitura — o app enxerga para raciocinar, nunca para movimentar.',
  },
  {
    q: 'É consultoria de investimento?',
    a: 'Não. É análise educativa, no enquadramento da CVM: o app explica o raciocínio e os riscos, sem recomendar ativo nem prometer retorno.',
  },
  {
    q: 'Como a análise da carteira é calculada?',
    a: 'Por funções puras e testadas no servidor: VPL, TIR por bisseção, payback, índice de concentração HHI, volatilidade anualizada e distância da alocação-alvo do seu perfil. A IA não calcula nada — ela recebe os números prontos e interpreta.',
  },
];

export function Faq() {
  return (
    <section aria-labelledby="faq" className="reveal">
      <h2 id="faq" className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Perguntas diretas
      </h2>
      <div className="mt-8 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-elevated">
        {QUESTIONS.map((item) => (
          <details key={item.q} className="group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold">
              {item.q}
              <ChevronDown
                className="size-4 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="px-5 pb-4 text-sm text-ink-muted">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

// --- CTA final ---------------------------------------------------------------

export function FinalCta() {
  return (
    <section className="reveal relative overflow-hidden rounded-[2rem] border border-line bg-elevated px-6 py-14 text-center">
      <div className="aurora" aria-hidden />
      <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Comece pelo mês que você está vivendo
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-base text-ink-muted">
        Lance as movimentações de outubro e veja o score, o orçamento e a análise da carteira
        tomarem forma na mesma sessão.
      </p>
      <Link
        to="/login"
        className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-strong"
      >
        Criar conta grátis
      </Link>
      <p className="mt-3 text-xs text-ink-muted">Sem cartão. Sem cobrança dentro do app.</p>
    </section>
  );
}
