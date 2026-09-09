import { useEffect, useState, type FormEvent } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ASSET_KINDS } from '../../lib/categories';
import type { Asset } from '../../types/finance';
import { Modal } from '../ui/Modal';

const inputClass =
  'w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm outline-none transition-colors focus:border-gold';

interface AssetFormProps {
  open: boolean;
  onClose(): void;
  /** Presente = edição; ausente = novo item. */
  editing?: Asset | null;
}

export function AssetForm({ open, onClose, editing }: AssetFormProps) {
  const { addAsset, updateAsset } = useFinance();

  const [kind, setKind] = useState(ASSET_KINDS[0] ?? 'Outro');
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [isLiability, setIsLiability] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setKind(editing?.kind ?? ASSET_KINDS[0] ?? 'Outro');
    setName(editing?.name ?? '');
    setValue(editing ? String(editing.value) : '');
    setIsLiability(editing?.is_liability ?? false);
    setFormError(null);
  }, [open, editing]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = Number(value.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed < 0) {
      setFormError('Informe um valor válido (zero ou mais).');
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      const input = { kind, name: name.trim(), value: parsed, is_liability: isLiability };
      if (editing) {
        await updateAsset(editing.id, input);
      } else {
        await addAsset(input);
      }
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} title={editing ? 'Editar item' : 'Novo item de patrimônio'} onClose={onClose}>
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Tipo</span>
            <select value={kind} onChange={(e) => setKind(e.target.value)} className={inputClass}>
              {ASSET_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Valor (R$)</span>
            <input
              required
              inputMode="decimal"
              placeholder="0,00"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Nome</span>
          <input
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: conta no banco X"
            className={inputClass}
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isLiability}
            onChange={(e) => setIsLiability(e.target.checked)}
            className="size-4 accent-[color:var(--gold)]"
          />
          É um passivo (dívida, financiamento…)
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
          {submitting ? 'Salvando…' : 'Salvar'}
        </button>
      </form>
    </Modal>
  );
}
