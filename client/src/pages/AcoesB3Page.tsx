import { Building2 } from 'lucide-react';
import { MarketBoardView } from '../components/board/MarketBoardView';

/**
 * Tela: Ações B3 — rota `/app/acoes`
 * Menu: grupo "Mercados" → "Ações B3"
 * Board de ações e FIIs brasileiros (brapi): candles OHLC e estatísticas do dia.
 * Sem livro de ofertas — a fonte gratuita da B3 não expõe book.
 */
export function AcoesB3Page() {
  return (
    <section aria-labelledby="acoes-titulo" className="mx-auto max-w-7xl">
      <h2
        id="acoes-titulo"
        className="mb-1 flex items-center gap-2 font-display text-2xl font-bold tracking-tight"
      >
        <Building2 className="size-6 text-gold" aria-hidden />
        Ações B3
      </h2>
      <p className="mb-5 text-sm text-ink-muted">
        Ações e FIIs brasileiros, no mesmo board do Cripto — candle diário, semanal e mensal.
      </p>

      <MarketBoardView
        market="BR"
        copilotScreen="acoes-b3"
        placeholderNote={
          <>
            <strong>Dados de exemplo</strong> — a brapi.dev não está acessível neste ambiente. Os
            valores são fictícios; configure <code className="mx-1">BRAPI_TOKEN</code>no .env para
            limites melhores.
          </>
        }
        disclaimer={
          <>
            Cotação da B3 no plano gratuito vem com atraso de ~15 minutos — não use para decisão de
            curto prazo. Este board é <strong>somente leitura</strong>: o Aura direciona e explica,
            nunca envia ordem. Conteúdo educativo:{' '}
            <strong>não é recomendação de investimento</strong>.
          </>
        }
      />
    </section>
  );
}
