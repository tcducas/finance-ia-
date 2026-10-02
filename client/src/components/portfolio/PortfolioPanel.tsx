import { Briefcase, RefreshCw, Trash2, TriangleAlert, Upload } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../lib/format';
import { parseHoldingsCsv, type ImportIssue } from '../../lib/importCsv';
import {
  ASSET_CLASS_COLORS,
  ASSET_CLASS_LABELS,
  deleteHolding,
  fetchPanorama,
  importHoldings,
  portfolioAvailable,
  type Panorama,
} from '../../services/portfolio';
import { EmptyState } from '../ui/EmptyState';
import { AiReviewPanel } from './AiReviewPanel';
import { AllocationCompare } from './AllocationCompare';
import { MetricCard } from './MetricCard';
import { RiskReturnScatter } from './RiskReturnScatter';
import { Skeleton } from '../ui/Skeleton';

const LIQUIDITY_LABEL: Record<string, string> = {
  alta: 'alta',
  media: 'média',
  baixa: 'baixa',
  desconhecida: '—',
};

function pct(value: number | null, digits = 1): string {
  return value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`;
}

function months(value: number | null): string {
  if (value === null) return '—';
  if (value === 0) return 'agora';
  const years = Math.floor(value / 12);
  const rest = value % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}a`);
  if (rest > 0) parts.push(`${rest}m`);
  return parts.join(' ');
}

/**
 * Carteira de investimentos: importação, panorama analítico e avaliação da IA.
 *
 * Todos os números vêm do backend (motor puro em portfolioAnalysis.ts). Aqui só
 * se desenha — e cada card carrega o método por trás do número, porque o
 * propósito do app é o usuário entender, não só ver.
 */
export function PortfolioPanel() {
  const available = portfolioAvailable();
  const [panorama, setPanorama] = useState<Panorama | null>(null);
  const [loading, setLoading] = useState(available);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<ImportIssue[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    if (!available) return;
    setLoading(true);
    try {
      setPanorama(await fetchPanorama());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar a carteira.');
    } finally {
      setLoading(false);
    }
  }, [available]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleFile(file: File) {
    setError(null);
    setNotice(null);
    const text = await file.text();
    const parsed = parseHoldingsCsv(text);
    setIssues(parsed.issues);

    if (parsed.rows.length === 0) {
      setError(
        'Nenhuma posição válida no arquivo. O CSV precisa de ticker, quantidade e preço médio.',
      );
      return;
    }
    try {
      const result = await importHoldings(parsed.rows);
      setNotice(
        `${result.inserted} ${result.inserted === 1 ? 'posição importada' : 'posições importadas'}` +
          (parsed.issues.length > 0 ? ` · ${parsed.issues.length} linha(s) ignorada(s)` : ''),
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao importar.');
    }
  }

  async function handleRemove(id: string) {
    await deleteHolding(id);
    await refresh();
  }

  if (!available) {
    return (
      <div>
        <EmptyState
          icon={Briefcase}
          title="Entre para analisar sua carteira"
          description="A análise (TIR, VPL, payback, concentração, volatilidade) é calculada no servidor com os seus dados — não funciona no modo demonstração."
        />
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="text-gold underline">
            Entrar ou criar conta
          </Link>
        </p>
      </div>
    );
  }

  const empty = !loading && (panorama?.holdings.length ?? 0) === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          Importe a carteira exportada da sua corretora. Precisa de{' '}
          <code className="text-xs">ticker</code>, <code className="text-xs">quantidade</code> e{' '}
          <code className="text-xs">preço médio</code>; data de aporte e proventos melhoram a
          análise.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void refresh()}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-full border border-line bg-elevated px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold hover:text-gold disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Atualizar
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-gold-strong"
          >
            <Upload className="size-4" aria-hidden />
            Importar CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm" style={{ color: 'var(--status-bad)' }}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-ink-muted">
          {notice}
        </p>
      )}
      {issues.length > 0 && (
        <details className="rounded-2xl border border-line bg-elevated px-4 py-3 text-xs">
          <summary className="cursor-pointer font-medium">
            {issues.length} linha(s) ignorada(s) na importação
          </summary>
          <ul className="mt-2 space-y-0.5 text-ink-muted">
            {issues.slice(0, 20).map((issue) => (
              <li key={`${issue.line}-${issue.message}`}>
                linha {issue.line}: {issue.message}
              </li>
            ))}
          </ul>
        </details>
      )}

      {loading && !panorama ? (
        <div className="space-y-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-64" />
        </div>
      ) : empty ? (
        <EmptyState
          icon={Briefcase}
          title="Nenhuma posição ainda"
          description="Importe o CSV da sua corretora para ver rentabilidade, risco, liquidez e o alinhamento ao seu perfil — e pedir a avaliação do copiloto."
        />
      ) : panorama ? (
        <>
          {panorama.stalePositions.length > 0 && (
            <p
              role="status"
              className="flex items-start gap-2 rounded-2xl border border-line bg-elevated px-4 py-2.5 text-xs text-ink-muted"
            >
              <TriangleAlert
                className="mt-0.5 size-4 shrink-0"
                style={{ color: 'var(--status-warn)' }}
                aria-hidden
              />
              <span>
                Sem cotação para {panorama.stalePositions.join(', ')} — essas posições estão
                avaliadas pelo preço médio, então o lucro aparece como zero.
              </span>
            </p>
          )}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Valor da carteira"
              value={formatCurrency(panorama.currentValue)}
              reading={`${formatCurrency(panorama.invested)} investidos`}
              why="Soma da quantidade × cotação atual de cada posição. Quando o mercado não responde, a posição entra pelo preço médio e é sinalizada."
            />
            <MetricCard
              label="Resultado"
              value={formatCurrency(panorama.profit)}
              reading={pct(panorama.profitPercent)}
              tone={panorama.profit >= 0 ? 'good' : 'bad'}
              why="Valor atual menos o investido. É o retorno nominal acumulado, sem considerar quando cada aporte entrou — para isso existe a TIR."
            />
            <MetricCard
              label="TIR (ao ano)"
              value={panorama.irr === null ? '—' : pct(panorama.irr * 100)}
              reading={
                panorama.irr === null
                  ? 'falta data de aporte'
                  : 'rentabilidade ponderada pelo tempo'
              }
              tone={panorama.irr === null ? undefined : panorama.irr >= 0 ? 'good' : 'bad'}
              why="Taxa Interna de Retorno: a taxa que zera o Valor Presente Líquido do seu fluxo de caixa (aportes como saída, proventos como entrada, valor de hoje como valor final). Diferente do retorno simples, ela considera QUANDO o dinheiro entrou — R$ 1.000 que rendeu 10% em um mês vale muito mais que em cinco anos. Sem data de aporte não há como calcular."
            />
            <MetricCard
              label="VPL"
              value={panorama.npv === 0 ? '—' : formatCurrency(panorama.npv)}
              reading={`versus ${(panorama.attractivenessRate * 100).toFixed(1)}% a.a.`}
              tone={panorama.npv === 0 ? undefined : panorama.npv > 0 ? 'good' : 'warn'}
              why={`Valor Presente Líquido: traz todo o fluxo para hoje descontado pela taxa de atratividade (${(panorama.attractivenessRate * 100).toFixed(1)}% a.a., aproximação do CDI). VPL positivo significa render ACIMA dessa taxa; negativo significa que o mesmo dinheiro na renda fixa teria rendido mais. VPL negativo não é prejuízo — é custo de oportunidade.`}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Concentração"
              value={panorama.hhi.toFixed(2)}
              reading={`${panorama.concentration} · ${panorama.effectivePositions} posições efetivas`}
              tone={
                panorama.concentration === 'diversificada'
                  ? 'good'
                  : panorama.concentration === 'moderada'
                    ? 'warn'
                    : 'bad'
              }
              why="Índice de Herfindahl-Hirschman: soma dos quadrados dos pesos. 1,00 é tudo num só ativo; quanto menor, mais distribuída. "
            />
            <MetricCard
              label="Volatilidade"
              value={
                panorama.portfolioVolatility === null
                  ? '—'
                  : `${(panorama.portfolioVolatility * 100).toFixed(1)}%`
              }
              reading="ao ano, ponderada pelo peso"
              why="Desvio-padrão dos retornos diários anualizado (× √252). Mede o quanto o preço oscila, não o quanto você pode perder. Atenção: é a média ponderada das posições e ignora a correlação entre elas, então superestima o risco de uma carteira bem diversificada — não temos dados para estimar a matriz de covariância."
            />
            <MetricCard
              label="Payback"
              value={months(panorama.paybackMonths)}
              reading={
                panorama.paybackMonths === null
                  ? 'proventos ainda não cobrem o aporte'
                  : 'para o fluxo se pagar'
              }
              why="Tempo até as entradas acumuladas cobrirem o que você investiu. Payback curto reduz a exposição ao risco, porque o capital já voltou. Numa carteira de ações o payback só por proventos é longo — a maior parte do retorno vem da valorização, não da distribuição."
            />
            <MetricCard
              label="Proventos recebidos"
              value={formatCurrency(panorama.totalDividends)}
              reading={
                panorama.currentValue > 0
                  ? `${((panorama.totalDividends / panorama.currentValue) * 100).toFixed(1)}% da carteira`
                  : undefined
              }
              why="Soma dos proventos que você informou. Entram no fluxo de caixa do VPL e da TIR, e são a base do payback por dividendos. Se estiver zerado, preencha a coluna de proventos no CSV."
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <AllocationCompare
              gaps={panorama.gaps}
              profile={panorama.profile}
              alignmentScore={panorama.alignmentScore}
            />
            <RiskReturnScatter positions={panorama.positions} />
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-ink-muted uppercase tracking-wide">
              Posições
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-line bg-elevated">
              <table className="w-full min-w-[720px] text-sm">
                <caption className="sr-only">Posições da carteira com métricas por ativo</caption>
                <thead>
                  <tr className="border-b border-line text-xs text-ink-muted uppercase tracking-wide">
                    <th scope="col" className="px-4 py-3 text-left font-medium">Ativo</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Peso</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Valor</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Retorno</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Volat.</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Liquidez</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Tempo</th>
                    <th scope="col" className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {panorama.positions.map((position) => {
                    const holding = panorama.holdings.find((h) => h.ticker === position.ticker);
                    return (
                      <tr key={position.ticker} className="group border-b border-line last:border-0">
                        <th scope="row" className="px-4 py-3 text-left font-normal">
                          <span className="flex items-center gap-1.5 font-semibold">
                            <span
                              className="size-2.5 shrink-0 rounded-full"
                              style={{ backgroundColor: ASSET_CLASS_COLORS[position.assetClass] }}
                              aria-hidden
                            />
                            {position.ticker}
                          </span>
                          <span className="block text-xs text-ink-muted">
                            {ASSET_CLASS_LABELS[position.assetClass]}
                            {position.priceStale && ' · sem cotação'}
                          </span>
                        </th>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {position.weight.toFixed(1)}%
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(position.currentValue)}
                        </td>
                        <td
                          className="px-4 py-3 text-right font-medium tabular-nums"
                          style={{
                            color:
                              position.profitPercent === null
                                ? undefined
                                : position.profitPercent >= 0
                                  ? 'var(--status-good)'
                                  : 'var(--status-bad)',
                          }}
                        >
                          {pct(position.profitPercent)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                          {position.volatility === null
                            ? '—'
                            : `${(position.volatility * 100).toFixed(0)}%`}
                        </td>
                        <td className="px-4 py-3 text-right text-ink-muted">
                          {LIQUIDITY_LABEL[position.liquidity]}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-ink-muted">
                          {months(position.monthsHeld)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {holding && (
                            <button
                              type="button"
                              onClick={() => void handleRemove(holding.id)}
                              aria-label={`Remover ${position.ticker}`}
                              className="grid size-7 place-items-center rounded-full text-ink-muted opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-[color:var(--status-bad)]"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <AiReviewPanel />

          <p className="text-xs text-ink-muted">
            Análise educativa a partir dos dados que você informou —{' '}
            <strong>não é recomendação de investimento</strong>. O Aura direciona e explica; quem
            decide e executa é você, na sua corretora.
          </p>
        </>
      ) : null}
    </div>
  );
}
