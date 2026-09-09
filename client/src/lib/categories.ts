export interface CategoryDef {
  id: string;
  label: string;
  /** Slot fixo na paleta categórica (--chart-N). Identidade nunca muda com filtro. */
  chartVar: string;
}

/** Categorias de despesa — ordem fixa define a cor de cada uma. */
export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { id: 'moradia', label: 'Moradia', chartVar: 'var(--chart-1)' },
  { id: 'mercado', label: 'Mercado', chartVar: 'var(--chart-2)' },
  { id: 'transporte', label: 'Transporte', chartVar: 'var(--chart-3)' },
  { id: 'restaurantes', label: 'Restaurantes', chartVar: 'var(--chart-4)' },
  { id: 'lazer', label: 'Lazer', chartVar: 'var(--chart-5)' },
  { id: 'saude', label: 'Saúde', chartVar: 'var(--chart-6)' },
  { id: 'educacao', label: 'Educação', chartVar: 'var(--chart-7)' },
  { id: 'assinaturas', label: 'Assinaturas', chartVar: 'var(--chart-other)' },
  { id: 'outros', label: 'Outros', chartVar: 'var(--chart-other)' },
];

export const INCOME_CATEGORIES: CategoryDef[] = [
  { id: 'salario', label: 'Salário', chartVar: 'var(--chart-1)' },
  { id: 'freelance', label: 'Freelance', chartVar: 'var(--chart-2)' },
  { id: 'rendimentos', label: 'Rendimentos', chartVar: 'var(--chart-4)' },
  { id: 'outros', label: 'Outros', chartVar: 'var(--chart-other)' },
];

export const ASSET_KINDS = [
  'Conta corrente',
  'Poupança',
  'Investimentos',
  'Imóvel',
  'Veículo',
  'Dívida',
  'Outro',
];

const byId = new Map(
  [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].map((c) => [c.id, c] as const),
);

export function categoryLabel(id: string): string {
  return byId.get(id)?.label ?? id;
}

export function categoryColor(id: string): string {
  return byId.get(id)?.chartVar ?? 'var(--chart-other)';
}
