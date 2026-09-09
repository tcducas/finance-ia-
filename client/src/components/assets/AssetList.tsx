import { Landmark, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../lib/format';
import type { Asset } from '../../types/finance';
import { EmptyState } from '../ui/EmptyState';
import { StatCard } from '../ui/StatCard';
import { AssetForm } from './AssetForm';

export function AssetList() {
  const { assets, loading, removeAsset } = useFinance();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);

  const ativos = assets.filter((a) => !a.is_liability);
  const passivos = assets.filter((a) => a.is_liability);
  const totalAtivos = ativos.reduce((sum, a) => sum + a.value, 0);
  const totalPassivos = passivos.reduce((sum, a) => sum + a.value, 0);
  const patrimonioLiquido = Math.round((totalAtivos - totalPassivos) * 100) / 100;

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditing(asset);
    setFormOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          icon={Landmark}
          label="Patrimônio líquido"
          value={formatCurrency(patrimonioLiquido)}
          hint="ativos − passivos"
          loading={loading}
        />
        <StatCard
          icon={Landmark}
          label="Ativos"
          value={formatCurrency(totalAtivos)}
          loading={loading}
        />
        <StatCard
          icon={Landmark}
          label="Passivos"
          value={formatCurrency(totalPassivos)}
          loading={loading}
        />
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-muted uppercase tracking-wide">
          Ativos e passivos
        </h3>
        <button
          type="button"
          onClick={openNew}
          className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold"
        >
          <Plus className="size-4" aria-hidden />
          Adicionar
        </button>
      </div>

      {!loading && assets.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Sem itens de patrimônio"
          description="Cadastre contas, investimentos, imóveis e dívidas para acompanhar seu patrimônio líquido."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            { titulo: 'Ativos', itens: ativos },
            { titulo: 'Passivos', itens: passivos },
          ].map(({ titulo, itens }) => (
            <section key={titulo} aria-label={titulo} className="space-y-2">
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                {titulo} ({itens.length})
              </h4>
              {itens.length === 0 && (
                <p className="rounded-xl border border-dashed border-line px-3 py-4 text-center text-xs text-ink-muted">
                  Nenhum item ainda.
                </p>
              )}
              <ul className="space-y-2">
                {itens.map((asset) => (
                  <li
                    key={asset.id}
                    className="group flex items-center gap-3 rounded-2xl border border-line bg-elevated px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{asset.name}</p>
                      <p className="text-xs text-ink-muted">{asset.kind}</p>
                    </div>
                    <p
                      className="text-sm font-semibold tabular-nums"
                      style={asset.is_liability ? { color: 'var(--status-bad)' } : undefined}
                    >
                      {asset.is_liability ? '−' : ''}
                      {formatCurrency(asset.value)}
                    </p>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => openEdit(asset)}
                        aria-label={`Editar ${asset.name}`}
                        className="grid size-8 place-items-center rounded-full text-ink-muted hover:text-gold"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeAsset(asset.id)}
                        aria-label={`Remover ${asset.name}`}
                        className="grid size-8 place-items-center rounded-full text-ink-muted hover:text-[color:var(--status-bad)]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <AssetForm open={formOpen} onClose={() => setFormOpen(false)} editing={editing} />
    </div>
  );
}
