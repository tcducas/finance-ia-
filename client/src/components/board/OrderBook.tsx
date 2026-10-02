import { formatMoney } from '../../lib/format';
import type { DepthLevel, OrderBookSnapshot } from '../../types/board';

interface OrderBookProps {
  book: OrderBookSnapshot;
  base: string;
  quote: string;
  price: number;
}

const BID = 'var(--status-good)';
const ASK = 'var(--status-bad)';

/** Uma linha do livro, com barra de profundidade ao fundo. */
function Row({ level, color, align }: { level: DepthLevel; color: string; align: 'left' | 'right' }) {
  return (
    <li className="relative flex items-center justify-between gap-2 px-2 py-0.5 text-xs tabular-nums">
      <span
        aria-hidden
        className="absolute inset-y-0 rounded-sm"
        style={{
          width: `${level.depthRatio * 100}%`,
          backgroundColor: color,
          opacity: 0.12,
          [align]: 0,
        }}
      />
      <span className="relative font-medium" style={{ color }}>
        {level.price.toLocaleString('pt-BR', { maximumFractionDigits: 8 })}
      </span>
      <span className="relative text-ink-muted">
        {level.qty.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
      </span>
    </li>
  );
}

/**
 * Livro de ofertas: vendas (asks) em cima, compras (bids) embaixo, preço atual
 * no meio — a convenção de qualquer terminal de trade. SOMENTE LEITURA: não há
 * como enviar ordem daqui, por decisão de produto.
 */
export function OrderBook({ book, base, quote, price }: OrderBookProps) {
  const asks = [...book.asks].reverse();

  return (
    <div className="rounded-2xl border border-line bg-elevated p-3">
      <div className="mb-2 flex items-baseline justify-between px-2">
        <h4 className="text-sm font-semibold">Livro de ofertas</h4>
        <p className="text-[11px] text-ink-muted">
          spread {formatMoney(book.spread, quote)} ({book.spreadPercent.toFixed(3)}%)
        </p>
      </div>

      <div className="flex justify-between px-2 pb-1 text-[10px] font-medium text-ink-muted uppercase tracking-wide">
        <span>Preço ({quote})</span>
        <span>Qtd ({base})</span>
      </div>

      <ul aria-label="Ofertas de venda">
        {asks.map((level) => (
          <Row key={`a${level.price}`} level={level} color={ASK} align="right" />
        ))}
      </ul>

      <p className="my-1.5 border-y border-line px-2 py-1 text-sm font-bold tabular-nums">
        {formatMoney(price, quote)}
      </p>

      <ul aria-label="Ofertas de compra">
        {book.bids.map((level) => (
          <Row key={`b${level.price}`} level={level} color={BID} align="right" />
        ))}
      </ul>

      <div className="mt-3 px-2">
        <div className="flex items-baseline justify-between text-[11px]">
          <span style={{ color: BID }}>compra {Math.round(book.buyPressure * 100)}%</span>
          <span style={{ color: ASK }}>venda {Math.round((1 - book.buyPressure) * 100)}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={Math.round(book.buyPressure * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Pressão de compra no livro"
          className="mt-1 flex h-1.5 overflow-hidden rounded-full"
        >
          <div style={{ width: `${book.buyPressure * 100}%`, backgroundColor: BID }} />
          <div style={{ width: `${(1 - book.buyPressure) * 100}%`, backgroundColor: ASK }} />
        </div>
        <p className="mt-1.5 text-[11px] text-ink-muted">
          Proporção do volume do livro em ofertas de compra. É uma foto do momento — não prevê
          preço.
        </p>
      </div>
    </div>
  );
}
