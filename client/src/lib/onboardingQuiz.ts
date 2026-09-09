/**
 * Quiz de perfil do investidor. As chaves e a escala (0..3) espelham
 * server/src/lib/riskScore.ts — o servidor recalcula o perfil por conta própria.
 */

export interface QuizOption {
  label: string;
  score: 0 | 1 | 2 | 3;
}

export interface QuizQuestion {
  key: 'horizon' | 'reaction' | 'experience' | 'income_stability' | 'goal';
  prompt: string;
  options: QuizOption[];
}

export const QUIZ: QuizQuestion[] = [
  {
    key: 'horizon',
    prompt: 'Em quanto tempo você pretende usar esse dinheiro?',
    options: [
      { label: 'Menos de 2 anos', score: 0 },
      { label: 'De 2 a 5 anos', score: 1 },
      { label: 'De 5 a 10 anos', score: 2 },
      { label: 'Mais de 10 anos', score: 3 },
    ],
  },
  {
    key: 'reaction',
    prompt: 'Se sua carteira caísse 20% em um mês, você...',
    options: [
      { label: 'Venderia tudo para não perder mais', score: 0 },
      { label: 'Venderia uma parte', score: 1 },
      { label: 'Manteria e esperaria recuperar', score: 2 },
      { label: 'Aproveitaria para comprar mais', score: 3 },
    ],
  },
  {
    key: 'experience',
    prompt: 'Qual sua experiência com investimentos?',
    options: [
      { label: 'Nenhuma', score: 0 },
      { label: 'Poupança e CDB', score: 1 },
      { label: 'Fundos e ações', score: 2 },
      { label: 'Opções, cripto ou day trade', score: 3 },
    ],
  },
  {
    key: 'income_stability',
    prompt: 'Como é a sua renda hoje?',
    options: [
      { label: 'Instável e imprevisível', score: 0 },
      { label: 'Varia de mês a mês', score: 1 },
      { label: 'Estável', score: 2 },
      { label: 'Estável e ainda sobra todo mês', score: 3 },
    ],
  },
  {
    key: 'goal',
    prompt: 'Qual seu objetivo principal com os investimentos?',
    options: [
      { label: 'Preservar o que tenho', score: 0 },
      { label: 'Gerar uma renda extra', score: 1 },
      { label: 'Crescer com equilíbrio', score: 2 },
      { label: 'Maximizar o crescimento, aceitando risco', score: 3 },
    ],
  },
];

export const RISK_LABEL: Record<string, string> = {
  conservador: 'Conservador',
  moderado: 'Moderado',
  arrojado: 'Arrojado',
};
