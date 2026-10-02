import { useState, type FormEvent } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  CUSTOM_CATEGORY_MAX,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  OTHER_ID,
  resolveCategory,
} from '../../lib/categories';
import { todayISO } from '../../lib/format';
import type { TransactionType } from '../../types/finance';
import { Modal } from '../ui/Modal';

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-gold';

/** Modal global de nova movimentação — aberto pelo “+” em qualquer tela. */
export function TransactionForm() {
  const { transactionFormOpen, closeTransactionForm, addTransaction } = useFinance();

  const [type, setType] = useState<TransactionType>('despesa');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('mercado');
  const [customCategory, setCustomCategory] = useState('');
  const [occurredOn, setOccurredOn] = useState(todayISO());
  const [description, setDescription] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function switchType(next: TransactionType) {
    setType(next);
    setCategory(next === 'receita' ? 'salario' : 'mercado');
    setCustomCategory('');
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const value = Number(amount.replace(',', '.'));
    if (!Number.isFinite(value) || value <= 0) {
      setFormError('Informe um valor maior que zero.');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await addTransaction({
        type,
        amount: value,
        category: resolveCategory(category, customCategory),
        occurred_on: occurredOn,
        description: description.trim() || undefined,
        is_recurring: isRecurring,
      });
      setAmount('');
      setDescription('');
      setCustomCategory('');
      setIsRecurring(false);
      closeTransactionForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={transactionFormOpen} title="Nova movimentação" onClose={closeTransactionForm}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo">
          {(['despesa', 'receita'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={type === option}
              onClick={() => switchType(option)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                type === option
                  ? 'border-gold bg-gold text-white'
                  : 'border-line bg-canvas text-ink-muted hover:text-ink'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Valor (R$)</span>
          <input
            required
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Categoria</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Data</span>
            <input
              required
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

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
              Em branco, a movimentação fica em “Outros”.
            </span>
          </label>
        )}

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Descrição (opcional)</span>
          <input
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex.: compras da semana"
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isRecurring}
            onChange={(e) => setIsRecurring(e.target.checked)}
            className="size-4 accent-[color:var(--gold)]"
          />
          Recorrente (fixo mensal — salário, aluguel, assinatura…)
        </label>

        {formError && (
          <p role="alert" className="text-sm" style={{ color: 'var(--status-bad)' }}>
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-strong disabled:opacity-60"
        >
          {submitting ? 'Salvando…' : 'Salvar movimentação'}
        </button>
      </form>
    </Modal>
  );
}
