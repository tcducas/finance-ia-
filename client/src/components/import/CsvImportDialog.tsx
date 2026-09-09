import { Download, FileUp } from 'lucide-react';
import { type ChangeEvent, useMemo, useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  type ImportParse,
  parseAssetsCsv,
  parseTransactionsCsv,
} from '../../lib/importCsv';
import { formatCurrency } from '../../lib/format';
import type { AssetInput, TransactionInput } from '../../types/finance';
import { Modal } from '../ui/Modal';

type Kind = 'transactions' | 'assets';

interface CsvImportDialogProps {
  open: boolean;
  onClose(): void;
  kind: Kind;
}

const TEMPLATES: Record<Kind, { title: string; headers: string; sample: string; hint: string }> = {
  transactions: {
    title: 'Importar movimentações',
    headers: 'data,tipo,categoria,valor,descricao,recorrente',
    sample: [
      'data,tipo,categoria,valor,descricao,recorrente',
      '2026-09-01,receita,salario,7200,Salário mensal,sim',
      '05/09/2026,despesa,moradia,"1.850,00",Aluguel,sim',
      '06/09/2026,despesa,mercado,432.9,Compra do mês,nao',
      '10/09/2026,despesa,transporte,-89,Combustível,nao',
    ].join('\n'),
    hint: 'Colunas aceitas: data (AAAA-MM-DD ou DD/MM/AAAA), tipo (receita/despesa — ou deduzido do sinal do valor), categoria, valor (com R$, ponto de milhar e vírgula decimal), descricao, recorrente (sim/nao).',
  },
  assets: {
    title: 'Importar carteira / patrimônio',
    headers: 'tipo,nome,valor,passivo',
    sample: [
      'tipo,nome,valor,passivo',
      'Investimentos,Tesouro Selic 2029,"12.500,00",nao',
      'Investimentos,PETR4 (100 cotas),"3.820,00",nao',
      'Conta corrente,Banco X,"4.300,00",nao',
      'Dívida,Financiamento do carro,"18.000,00",sim',
    ].join('\n'),
    hint: 'Colunas aceitas: tipo (classe do ativo — texto livre), nome, valor (posição em R$), passivo (sim/nao para dívidas).',
  },
};

export function CsvImportDialog({ open, onClose, kind }: CsvImportDialogProps) {
  const { importTransactions, importAssets } = useFinance();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const template = TEMPLATES[kind];

  const parsed = useMemo<ImportParse<TransactionInput | AssetInput> | null>(() => {
    if (!text.trim()) return null;
    return kind === 'transactions' ? parseTransactionsCsv(text) : parseAssetsCsv(text);
  }, [text, kind]);

  function reset() {
    setText('');
    setDone(null);
    setError(null);
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  function handleClose() {
    reset();
    onClose();
  }

  function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setText(typeof reader.result === 'string' ? reader.result : '');
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([template.sample], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura-modelo-${kind}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const result =
        kind === 'transactions'
          ? await importTransactions(parsed.rows as TransactionInput[])
          : await importAssets(parsed.rows as AssetInput[]);
      setDone(result.inserted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} title={template.title} onClose={handleClose}>
      {done !== null ? (
        <div className="space-y-4">
          <p className="text-sm">
            <span className="font-semibold text-[color:var(--status-good)]">{done}</span>{' '}
            {kind === 'transactions' ? 'movimentações importadas' : 'itens importados'}.
          </p>
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white hover:bg-gold-strong"
          >
            Concluir
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-3 py-1.5 text-sm font-medium hover:border-gold hover:text-gold"
            >
              <FileUp className="size-4" aria-hidden />
              Escolher arquivo .csv
            </button>
            <button
              type="button"
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs text-ink-muted hover:text-gold"
            >
              <Download className="size-3.5" aria-hidden />
              baixar modelo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="hidden"
            />
          </div>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Ou cole o conteúdo do CSV</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={template.headers}
              className="w-full rounded-xl border border-line bg-canvas px-3 py-2 font-mono text-xs outline-none focus:border-gold"
            />
          </label>

          <p className="text-xs text-ink-muted">{template.hint}</p>

          {parsed && <Preview kind={kind} parsed={parsed} />}

          {error && (
            <p role="alert" className="text-sm" style={{ color: 'var(--status-bad)' }}>
              {error}
            </p>
          )}

          <button
            type="button"
            disabled={busy || !parsed || parsed.rows.length === 0}
            onClick={() => void handleImport()}
            className="w-full rounded-xl bg-gold px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-gold-strong disabled:opacity-60"
          >
            {busy
              ? 'Importando…'
              : parsed && parsed.rows.length > 0
                ? `Importar ${parsed.rows.length} ${parsed.rows.length === 1 ? 'linha' : 'linhas'}`
                : 'Importar'}
          </button>
        </div>
      )}
    </Modal>
  );
}

function Preview({
  kind,
  parsed,
}: {
  kind: Kind;
  parsed: ImportParse<TransactionInput | AssetInput>;
}) {
  const preview = parsed.rows.slice(0, 6);

  return (
    <div className="space-y-2 rounded-xl border border-line bg-canvas p-3">
      <p className="text-xs text-ink-muted">
        {parsed.rows.length} de {parsed.total} linhas prontas
        {parsed.issues.length > 0 && (
          <span style={{ color: 'var(--status-bad)' }}> · {parsed.issues.length} ignoradas</span>
        )}
      </p>

      {preview.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-t border-line/60">
                  {kind === 'transactions' ? (
                    <TxRow row={row as TransactionInput} />
                  ) : (
                    <AssetRow row={row as AssetInput} />
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {parsed.issues.length > 0 && (
        <ul className="text-xs text-ink-muted">
          {parsed.issues.slice(0, 4).map((issue) => (
            <li key={issue.line}>
              linha {issue.line}: {issue.message}
            </li>
          ))}
          {parsed.issues.length > 4 && <li>…</li>}
        </ul>
      )}
    </div>
  );
}

function TxRow({ row }: { row: TransactionInput }) {
  return (
    <>
      <td className="py-1 pr-2 tabular-nums">{row.occurred_on}</td>
      <td className="py-1 pr-2">{row.type}</td>
      <td className="py-1 pr-2">{row.category}</td>
      <td className="py-1 pr-2 text-right tabular-nums">{formatCurrency(row.amount)}</td>
    </>
  );
}

function AssetRow({ row }: { row: AssetInput }) {
  return (
    <>
      <td className="py-1 pr-2">{row.kind}</td>
      <td className="py-1 pr-2">{row.name}</td>
      <td className="py-1 pr-2">{row.is_liability ? 'passivo' : 'ativo'}</td>
      <td className="py-1 pr-2 text-right tabular-nums">{formatCurrency(row.value)}</td>
    </>
  );
}
