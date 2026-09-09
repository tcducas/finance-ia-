import { PiggyBank, Send, Sparkles, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { SuggestionBlock } from './SuggestionBlock';
import { useCopilot } from '../../context/CopilotContext';
import { useFinance } from '../../context/FinanceContext';
import { buildInsight } from '../../lib/insights';
import {
  copilotAnalyze,
  copilotChat,
  type ChatTurn,
  type PortfolioAnalysis,
  type ScreenSnapshot,
} from '../../services/ai';

interface Entry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  analysis?: PortfolioAnalysis;
  demo?: boolean;
}

const SCREEN_LABEL: Record<string, string> = {
  carteira: 'Minha Carteira',
  gastos: 'Gastos',
  investimentos: 'Investimentos',
  ativo: 'Detalhe do ativo',
  planejamento: 'Planejamento',
};

/**
 * Copiloto — drawer persistente, com contexto da tela:
 * proativo (abre com insight/alerta) e reativo (chat + consultor de aporte).
 */
export function CopilotDrawer() {
  const { open, target, closeCopilot } = useCopilot();
  const { summary, spending, budgets } = useFinance();

  const [entries, setEntries] = useState<Entry[]>([]);
  const [input, setInput] = useState('');
  const [aporte, setAporte] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const kickoffDone = useRef<string | null>(null);

  const snapshot: ScreenSnapshot = {
    screen: target.screen,
    summary,
    spending,
    budgets,
    ticker: target.ticker,
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeCopilot();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, closeCopilot]);

  // Kickoff (ex.: "explicar este ativo") dispara uma única vez por abertura.
  useEffect(() => {
    if (!open || !target.kickoff || kickoffDone.current === target.kickoff) return;
    kickoffDone.current = target.kickoff;
    void send(target.kickoff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, target.kickoff]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [entries, open]);

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy) return;
    setBusy(true);
    setEntries((prev) => [...prev, { id: crypto.randomUUID(), role: 'user', content: message }]);
    try {
      const history: ChatTurn[] = entries.map((e) => ({ role: e.role, content: e.content }));
      const { reply, demo } = await copilotChat(message, history, snapshot);
      setEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: reply, demo },
      ]);
    } catch {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Não consegui responder agora — tente de novo em instantes.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input;
    setInput('');
    await send(text);
  }

  async function handleAporte(event: FormEvent) {
    event.preventDefault();
    const value = Number(aporte.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0 || busy) return;
    setBusy(true);
    setEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: 'user',
        content: `Quero aportar ${value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} neste mês. Onde alocar?`,
      },
    ]);
    try {
      const { analysis, demo } = await copilotAnalyze(value, snapshot);
      setEntries((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: '', analysis, demo },
      ]);
      setAporte('');
    } catch {
      setEntries((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'A análise não está disponível agora — tente de novo em instantes.',
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  const insight = buildInsight(summary, spending, budgets);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeCopilot} />
      )}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Copiloto Aura"
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-elevated shadow-2xl transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <header className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <Sparkles className="size-5 text-gold" aria-hidden />
            <div>
              <h2 className="text-base font-semibold leading-tight">Copiloto Aura</h2>
              <p className="text-xs text-ink-muted">
                contexto: {SCREEN_LABEL[target.screen] ?? target.screen}
                {target.ticker ? ` · ${target.ticker}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCopilot}
            aria-label="Fechar copiloto"
            className="grid size-8 place-items-center rounded-full text-ink-muted transition-colors hover:text-ink"
          >
            <X className="size-5" />
          </button>
        </header>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {/* Proativo: insight da tela ao abrir. */}
          <div className="flex items-start gap-2 rounded-2xl border border-gold/40 bg-gold/5 px-3 py-2.5">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-gold" aria-hidden />
            <p className="text-sm">{insight}</p>
          </div>

          {entries.map((entry) =>
            entry.analysis ? (
              <SuggestionEntry key={entry.id} entry={entry} />
            ) : (
              <div
                key={entry.id}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  entry.role === 'user'
                    ? 'ml-auto bg-gold text-white'
                    : 'border border-line bg-canvas'
                }`}
              >
                {entry.content}
                {entry.demo && (
                  <p className="mt-1 text-[10px] uppercase tracking-wide opacity-70">
                    modo demonstração
                  </p>
                )}
              </div>
            ),
          )}

          {busy && (
            <p className="text-xs text-ink-muted" role="status">
              Copiloto pensando…
            </p>
          )}
        </div>

        {/* Consultor de aporte do dia. */}
        <form
          onSubmit={(e) => void handleAporte(e)}
          className="flex items-center gap-2 border-t border-line px-5 py-2.5"
        >
          <PiggyBank className="size-4 shrink-0 text-gold" aria-hidden />
          <input
            value={aporte}
            onChange={(e) => setAporte(e.target.value)}
            inputMode="decimal"
            placeholder="Aporte do mês (R$) — onde alocar?"
            aria-label="Valor do aporte do mês"
            className="w-full rounded-xl border border-line bg-canvas px-3 py-1.5 text-sm outline-none transition-colors focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy}
            className="rounded-xl bg-gold px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-gold-strong disabled:opacity-60"
          >
            Sugerir
          </button>
        </form>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="flex items-center gap-2 border-t border-line px-5 py-3"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte sobre seu mês, gastos, um ativo…"
            aria-label="Mensagem para o copiloto"
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-gold"
          />
          <button
            type="submit"
            disabled={busy || input.trim().length === 0}
            aria-label="Enviar mensagem"
            className="grid size-9 shrink-0 place-items-center rounded-xl bg-gold text-white transition-colors hover:bg-gold-strong disabled:opacity-60"
          >
            <Send className="size-4" />
          </button>
        </form>

        <footer className="border-t border-line px-5 py-2">
          <p className="text-[11px] text-ink-muted">
            Conteúdo educativo — <strong>não é recomendação de investimento</strong>.
          </p>
        </footer>
      </aside>
    </>
  );
}

function SuggestionEntry({ entry }: { entry: Entry }) {
  return (
    <div className="space-y-1">
      {entry.demo && (
        <p className="text-[10px] uppercase tracking-wide text-ink-muted">modo demonstração</p>
      )}
      {entry.analysis && <SuggestionBlock analysis={entry.analysis} />}
    </div>
  );
}
