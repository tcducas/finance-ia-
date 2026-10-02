import { Bitcoin } from 'lucide-react';
import { MarketBoardView } from '../components/board/MarketBoardView';

/**
 * Tela: Cripto — rota `/app/cripto`
 * Menu: grupo "Mercados" → "Cripto"
 * Board de trade de cripto (Binance, somente leitura): candles OHLC, livro de
 * ofertas, negócios recentes e estatísticas 24h. O copiloto explica cada painel.
 */
export function CriptoPage() {
  return (
    <section aria-labelledby="cripto-titulo" className="mx-auto max-w-7xl">
      <h2
        id="cripto-titulo"
        className="mb-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight"
      >
        <Bitcoin className="size-6 text-gold" aria-hidden />
        Cripto
      </h2>
      <p className="mb-5 text-sm text-ink-muted">
        Board completo — o único mercado com livro de ofertas e negócios ao vivo.
      </p>

      <MarketBoardView
        market="CRYPTO"
        copilotScreen="cripto"
        placeholderNote={
          <>
            <strong>Dados de exemplo</strong> — a Binance pública não está acessível neste ambiente
            (bloqueio regional costuma responder 451). Os valores são fictícios; troque
            <code className="mx-1">BINANCE_BASE_URL</code>no .env para uma base liberada.
          </>
        }
        disclaimer={
          <>
            Cripto é ativo de altíssima volatilidade e não serve como reserva de emergência. Este
            board é <strong>somente leitura</strong> — o Aura direciona e explica, nunca executa
            ordens nem custodia seus valores. Conteúdo educativo:{' '}
            <strong>não é recomendação de investimento</strong>.
          </>
        }
      />
    </section>
  );
}
