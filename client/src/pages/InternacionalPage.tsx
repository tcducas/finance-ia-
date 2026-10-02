import { Globe } from 'lucide-react';
import { MarketBoardView } from '../components/board/MarketBoardView';
import { PlanGate } from '../components/ui/PlanGate';
import { useAuth } from '../context/AuthContext';

/**
 * Tela: Internacional — rota `/app/internacional`
 * Menu: grupo "Mercados" → "Internacional"
 * Board de ações e ETFs dos EUA (finnhub) — o recorte que uma Nomad/Avenue
 * oferece ao investidor brasileiro. Exige FINNHUB_API_KEY no servidor.
 */
export function InternacionalPage() {
  const { profile } = useAuth();
  // Sem perfil carregado (modo demo) tratamos como free: o backend recusa igual.
  const allowed = profile?.entitlements.markets.includes('US') ?? false;

  return (
    <section aria-labelledby="internacional-titulo" className="mx-auto max-w-7xl">
      <h2
        id="internacional-titulo"
        className="mb-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight"
      >
        <Globe className="size-6 text-gold" aria-hidden />
        Internacional
      </h2>
      <p className="mb-5 text-sm text-ink-muted">
        Ações e ETFs dos EUA cotados em dólar — o mercado das contas globais (Nomad, Avenue).
      </p>

      {!allowed ? (
        <PlanGate
          title="Mercado internacional é do plano Pro"
          description={
            <>
              Ações e ETFs dos EUA ficam no Pro — é o único mercado cuja fonte de dados tem custo
              por requisição. Seu plano atual cobre B3 e cripto.
            </>
          }
        />
      ) : (
      <MarketBoardView
        market="US"
        copilotScreen="internacional"
        placeholderNote={
          <>
            <strong>Dados de exemplo</strong> — o mercado internacional precisa de
            <code className="mx-1">FINNHUB_API_KEY</code>no .env (chave gratuita em finnhub.io). Os
            valores exibidos são fictícios até a chave existir.
          </>
        }
        disclaimer={
          <>
            Preços em dólar: seu retorno em real depende também do câmbio, que pode andar contra
            você. Investimento no exterior tem tributação própria (carnê-leão sobre ganho de
            capital) e IOF na remessa. Este board é <strong>somente leitura</strong> — o Aura
            direciona e explica, nunca executa. Conteúdo educativo:{' '}
            <strong>não é recomendação de investimento</strong>.
          </>
        }
      />
      )}
    </section>
  );
}
