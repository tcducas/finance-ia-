import { useEffect, useState, type FormEvent } from 'react';
import type { Goal, GoalInput, GoalKind } from '../../types/planning';
import { Modal } from '../ui/Modal';

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-gold';

const KINDS: Array<{ id: GoalKind; label: string }> = [
  { id: 'reserva', label: 'Reserva de emergência' },
  { id: 'compra', label: 'Compra planejada' },
  { id: 'aposentadoria', label: 'Aposentadoria' },
  { id: 'geral', label: 'Geral' },
];

interface GoalFormProps {
  open: boolean;
  /** Preenchido = edição; null = criação. */
  goal: Goal | null;
  onClose(): void;
  onSave(input: GoalInput): Promise<void>;
}

/** Converte valor digitado em pt-BR ou en-US para número; vazio vira 0. */
function parseAmount(text: string): number {
  const clean = text.trim().replace(/\./g, '').replace(',', '.');
  if (clean === '') return 0;
  return Number(clean);
}

export function GoalForm({ open, goal, onClose, onSave }: GoalFormProps) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<GoalKind>('geral');
  const [target, setTarget] = useState('');
  const [current, setCurrent] = useState('');
  const [contribution, setContribution] = useState('');
  // Percentual na UI (10,5), decimal no contrato (0.105).
  const [ratePercent, setRatePercent] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [priority, setPriority] = useState('2');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Recarrega os campos a cada abertura — evita editar meta A com valor de B.
  useEffect(() => {
    if (!open) return;
    setFormError(null);
    setName(goal?.name ?? '');
    setKind(goal?.kind ?? 'geral');
    setTarget(goal ? String(goal.target_amount) : '');
    setCurrent(goal ? String(goal.current_amount) : '');
    setContribution(goal ? String(goal.monthly_contribution) : '');
    setRatePercent(goal ? String(Math.round(goal.annual_rate * 1000) / 10) : '');
    setTargetDate(goal?.target_date ?? '');
    setPriority(String(goal?.priority ?? 2));
  }, [open, goal]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const targetAmount = parseAmount(target);
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      setFormError('Informe um valor-alvo maior que zero.');
      return;
    }
    const rate = parseAmount(ratePercent) / 100;
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      setFormError('Rendimento esperado deve ficar entre 0% e 100% ao ano.');
      return;
    }
    const currentAmount = parseAmount(current);
    const monthly = parseAmount(contribution);
    if (currentAmount < 0 || monthly < 0) {
      setFormError('Valores não podem ser negativos.');
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        kind,
        target_amount: targetAmount,
        current_amount: currentAmount,
        monthly_contribution: monthly,
        annual_rate: Math.round(rate * 10000) / 10000,
        target_date: targetDate === '' ? null : targetDate,
        priority: Number(priority),
      });
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={goal ? 'Editar meta' : 'Nova meta'} onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">Nome</span>
          <input
            required
            maxLength={80}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Reserva de emergência"
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as GoalKind)}
              className={inputClass}
            >
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Prioridade</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className={inputClass}
            >
              <option value="1">1 — alta</option>
              <option value="2">2 — média</option>
              <option value="3">3 — baixa</option>
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Valor-alvo (R$)</span>
            <input
              required
              inputMode="decimal"
              placeholder="30.000,00"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Já guardado (R$)</span>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Aporte mensal (R$)</span>
            <input
              inputMode="decimal"
              placeholder="0,00"
              value={contribution}
              onChange={(e) => setContribution(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Rendimento (% a.a.)</span>
            <input
              inputMode="decimal"
              placeholder="10,5"
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">
            Prazo <span className="font-normal text-ink-muted">(opcional)</span>
          </span>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-ink-muted">
            Com prazo definido, mostramos o aporte necessário para chegar a tempo.
          </span>
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
          {submitting ? 'Salvando…' : goal ? 'Salvar alterações' : 'Criar meta'}
        </button>
      </form>
    </Modal>
  );
}
