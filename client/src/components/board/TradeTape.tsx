import type { BoardTrade } from '../../types/board';

interface TradeTapeProps {
  trades: BoardTrade[];
  base: string;
  quote: string;
}

const BUY = 'var(--status-good)';
const SELL = 'var(--status-bad)';

function time(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(iso));
}

/** Negócios recentes ("tape"): as últimas execuções e de que lado veio a agressão. */
export function TradeTape({ trades, base, quote }: TradeTapeProps) {
  return (
    <div className="rounded-2xl border border-line bg-elevated p-3">
      <h4 className="mb-2 px-2 text-sm font-semibold">Negócios recentes</h4>

      <div className="grid grid-cols-3 px-2 pb-1 text-[10px] font-medium text-ink-muted uppercase tracking-wide">
        <span>Preço ({quote})</span>
        <span className="text-right">Qtd ({base})</span>
        <span className="text-right">Hora</span>
      </div>

      {trades.length === 0 ? (
        <p className="px-2 py-6 text-center text-xs text-ink-muted">Nenhum negócio recente.</p>
      ) : (
        <ul aria-label="Negócios recentes" className="max-h-72 overflow-y-auto">
          {trades.map((t) => (
            <li
              key={t.id}
              className="grid grid-cols-3 px-2 py-0.5 text-xs tabular-nums"
              title={`Agressão de ${t.side}`}
            >
              <span style={{ color: t.side === 'compra' ? BUY : SELL }}>
                {t.price.toLocaleString('pt-BR', { maximumFractionDigits: 8 })}
              </span>
              <span className="text-right text-ink-muted">
                {t.qty.toLocaleString('pt-BR', { maximumFractionDigits: 6 })}
              </span>
              <span className="text-right text-ink-muted">{time(t.time)}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 px-2 text-[11px] text-ink-muted">
        Verde = quem comprou agrediu o livro; vermelho = quem vendeu. O Aura só observa: nenhuma
        ordem sai daqui.
      </p>
    </div>
  );
}
