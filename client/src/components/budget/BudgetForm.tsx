import { useEffect, useState, type FormEvent } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  CUSTOM_CATEGORY_MAX,
  EXPENSE_CATEGORIES,
  OTHER_ID,
  resolveCategory,
} from '../../lib/categories';
import { Modal } from '../ui/Modal';

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-gold';

interface BudgetFormProps {
  open: boolean;
  onClose(): void;
}

export function BudgetForm({ open, onClose }: BudgetFormProps) {
  const { budgets, saveBudget } = useFinance();
  const [category, setCategory] = useState('mercado');
  const [customCategory, setCustomCategory] = useState('');
  const [limit, setLimit] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (open) setFormError(null);
  }, [open]);

  // Categoria de verdade: em "Outros" quem manda é o texto livre.
  const resolved = resolveCategory(category, customCategory);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(limit.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Informe um limite maior que zero.');
      return;
    }
    setSubmitting(true);
    try {
      await saveBudget({ category: resolved, monthly_limit: value });
      setLimit('');
      setCustomCategory('');
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  const existing = budgets.find((b) => b.category === resolved);

  return (
    <Modal open={open} title="Definir orçamento" onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Categoria</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>

        {category === OTHER_ID && (
          <label className="block text-sm">
            <span className="mb-1 block font-medium">
              Qual categoria? <span className="font-normal text-ink-muted">(opcional)</span>
            </span>
            <input
              value={customCategory}
              maxLength={CUSTOM_CATEGORY_MAX}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Ex.: Pet, Academia, Presentes…"
              className={inputClass}
            />
            <span className="mt-1 block text-xs text-ink-muted">
              Em branco, o orçamento fica em “Outros”.
            </span>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Limite mensal (R$)</span>
          <input
            required
            inputMode="decimal"
            placeholder="0,00"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className={inputClass}
          />
        </label>

        {existing && (
          <p className="text-xs text-ink-muted">
            Esta categoria já tem limite definido — salvar substitui o valor atual.
          </p>
        )}

        {formError && (
          <p role="alert" className="text-sm" style={{ color: 'var(--status-bad)' }}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-on-gold transition-colors hover:bg-gold-strong disabled:opacity-60"
        >
          {submitting ? 'Salvando…' : 'Salvar orçamento'}
        </button>
      </form>
    </Modal>
  );
}
