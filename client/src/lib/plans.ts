/**
 * Comparativo free × Pro. Fonte única: a landing e a tela de Planos consomem
 * daqui, senão as duas listas divergem na primeira mudança de plano.
 *
 * Os limites refletem `server/src/lib/entitlements.ts` — ao mexer num, mexa no
 * outro. O servidor é quem manda; isto é só a descrição legível.
 */

export interface PlanFeature {
  label: string;
  /** `false` = não incluído no free. */
  free: string | false;
  pro: string;
  /** Marca o que de fato separa os planos, para a landing destacar. */
  highlight?: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { label: 'Movimentações, orçamento e categorias', free: 'completo', pro: 'completo' },
  { label: 'Metas, projeções e score', free: 'sem limite', pro: 'sem limite' },
  { label: 'Ações e FIIs da B3', free: 'candle diário', pro: 'diário, semanal e mensal' },
  { label: 'Cripto', free: 'candle diário', pro: 'todos os períodos' },
  {
    label: 'Livro de ofertas e negócios ao vivo',
    free: false,
    pro: 'incluído',
    highlight: true,
  },
  { label: 'Mercado internacional (EUA)', free: false, pro: 'ações e ETFs', highlight: true },
  { label: 'Evolução do patrimônio', free: '6 meses', pro: '24 meses' },
  { label: 'Conversas com o copiloto', free: '10 por dia', pro: 'sem limite', highlight: true },
  { label: 'Análises de carteira pela IA', free: '2 por mês', pro: 'sem limite', highlight: true },
];
