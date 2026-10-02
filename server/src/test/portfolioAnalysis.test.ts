import { describe, expect, it } from 'vitest';
import {
  alignmentScore,
  allocationGaps,
  annualize,
  annualizedVolatility,
  analyzePortfolio,
  concentrationLevel,
  effectivePositions,
  herfindahl,
  irr,
  liquidityLevel,
  monthsSince,
  npv,
  paybackFromDividends,
  paybackMonths,
  TARGET_ALLOCATION,
  type PositionInput,
} from '../lib/portfolioAnalysis.js';

describe('npv', () => {
  it('desconta pela taxa de atratividade composta', () => {
    // 12,68% a.a. equivale a ~1% ao mês: 100 daqui a 1 mês valem ~99,01 hoje.
    expect(npv(0.1268, [{ month: 1, amount: 100 }])).toBeCloseTo(99.01, 1);
  });

  it('com taxa zero é a soma simples do fluxo', () => {
    expect(
      npv(0, [
        { month: 0, amount: -100 },
        { month: 12, amount: 150 },
      ]),
    ).toBe(50);
  });

  it('é positivo quando o fluxo rende acima da taxa', () => {
    const flows = [
      { month: 0, amount: -1000 },
      { month: 12, amount: 1200 },
    ];
    expect(npv(0.1, flows)).toBeGreaterThan(0);
    expect(npv(0.3, flows)).toBeLessThan(0);
  });
});

describe('irr', () => {
  const flows = [
    { month: 0, amount: -1000 },
    { month: 12, amount: 1100 },
  ];

  it('encontra a taxa que zera o VPL', () => {
    const rate = irr(flows);
    expect(rate).not.toBeNull();
    expect(rate as number).toBeCloseTo(0.1, 2);
    expect(npv(rate as number, flows)).toBeCloseTo(0, 1);
  });

  it('devolve taxa negativa quando a carteira perdeu', () => {
    const rate = irr([
      { month: 0, amount: -1000 },
      { month: 12, amount: 900 },
    ]);
    expect(rate).not.toBeNull();
    expect(rate as number).toBeLessThan(0);
  });

  it('devolve null sem troca de sinal: fluxo só de aportes não tem TIR', () => {
    expect(
      irr([
        { month: 0, amount: -100 },
        { month: 1, amount: -100 },
      ]),
    ).toBeNull();
    expect(
      irr([
        { month: 0, amount: 100 },
        { month: 1, amount: 100 },
      ]),
    ).toBeNull();
  });

  it('devolve null com menos de dois pontos', () => {
    expect(irr([{ month: 0, amount: -100 }])).toBeNull();
  });
});

describe('payback', () => {
  it('encontra o mês em que o acumulado vira positivo', () => {
    expect(
      paybackMonths([
        { month: 0, amount: -300 },
        { month: 1, amount: 100 },
        { month: 2, amount: 100 },
        { month: 3, amount: 150 },
      ]),
    ).toBe(3);
  });

  it('devolve null quando o fluxo nunca se paga', () => {
    expect(
      paybackMonths([
        { month: 0, amount: -300 },
        { month: 1, amount: 50 },
      ]),
    ).toBeNull();
  });

  it('estima payback por dividendos no ritmo médio observado', () => {
    // 600 investidos, 60 de proventos em 6 meses = 10/mês, logo 60 meses.
    expect(paybackFromDividends(600, 60, 6)).toBe(60);
  });

  it('sem proventos não há payback por dividendos', () => {
    expect(paybackFromDividends(600, 0, 12)).toBeNull();
    expect(paybackFromDividends(600, 50, 0)).toBeNull();
  });
});

describe('concentração', () => {
  it('HHI vai de 1 (tudo num ativo) a 1/n (distribuído)', () => {
    expect(herfindahl([100])).toBe(1);
    expect(herfindahl([25, 25, 25, 25])).toBeCloseTo(0.25, 4);
  });

  it('posições efetivas são 1/HHI', () => {
    expect(effectivePositions([25, 25, 25, 25])).toBe(4);
    expect(effectivePositions([90, 10])).toBeLessThan(2);
  });

  it('classifica em faixas úteis', () => {
    expect(concentrationLevel(0.5)).toBe('concentrada');
    expect(concentrationLevel(0.2)).toBe('moderada');
    expect(concentrationLevel(0.05)).toBe('diversificada');
  });

  it('carteira vazia não quebra', () => {
    expect(herfindahl([])).toBe(0);
    expect(effectivePositions([])).toBe(0);
  });
});

describe('annualizedVolatility', () => {
  it('preço constante tem volatilidade zero', () => {
    expect(annualizedVolatility([10, 10, 10, 10, 10])).toBe(0);
  });

  it('série mais agitada tem volatilidade maior', () => {
    const calma = annualizedVolatility([100, 101, 100, 101, 100, 101]) as number;
    const agitada = annualizedVolatility([100, 115, 95, 120, 90, 118]) as number;
    expect(agitada).toBeGreaterThan(calma);
  });

  it('devolve null com dados insuficientes', () => {
    expect(annualizedVolatility([10, 11])).toBeNull();
    expect(annualizedVolatility([])).toBeNull();
  });
});

describe('liquidityLevel', () => {
  it('posição pequena frente ao giro diário é líquida', () => {
    expect(liquidityLevel(1_000, 100_000_000)).toBe('alta');
  });

  it('posição grande frente ao giro é ilíquida', () => {
    expect(liquidityLevel(1_000_000, 10_000_000)).toBe('baixa');
  });

  it('sem volume não inventa classificação', () => {
    expect(liquidityLevel(1000, null)).toBe('desconhecida');
    expect(liquidityLevel(1000, 0)).toBe('desconhecida');
  });
});

describe('alinhamento estratégico', () => {
  it('toda alocação-alvo soma 100', () => {
    for (const target of Object.values(TARGET_ALLOCATION)) {
      const total = Object.values(target).reduce((sum, v) => sum + (v ?? 0), 0);
      expect(total).toBe(100);
    }
  });

  it('carteira igual ao alvo marca 100', () => {
    const gaps = allocationGaps(TARGET_ALLOCATION.moderado, 'moderado');
    expect(alignmentScore(gaps)).toBe(100);
  });

  it('ordena os gaps pelo desvio mais grave', () => {
    const gaps = allocationGaps({ acao: 100 }, 'conservador');
    expect(gaps[0]?.assetClass).toBe('acao');
    expect(gaps[0]?.gap).toBe(90);
  });

  it('carteira oposta ao perfil marca baixo', () => {
    const gaps = allocationGaps({ cripto: 100 }, 'conservador');
    expect(alignmentScore(gaps)).toBeLessThan(10);
  });
});

describe('monthsSince e annualize', () => {
  const today = new Date('2026-10-01T00:00:00Z');

  it('conta meses cheios desde a data', () => {
    expect(monthsSince('2025-10-01', today)).toBe(12);
    expect(monthsSince('2026-09-20', today)).toBe(0);
  });

  it('data no futuro devolve null', () => {
    expect(monthsSince('2027-01-01', today)).toBeNull();
  });

  it('anualiza retorno total pelo período', () => {
    // 10% em 6 meses equivale a ~21% ao ano.
    expect(annualize(0.1, 6)).toBeCloseTo(0.21, 2);
    expect(annualize(0.1, 12)).toBeCloseTo(0.1, 4);
  });

  it('perda total não anualiza', () => {
    expect(annualize(-1, 12)).toBeNull();
    expect(annualize(0.1, 0)).toBeNull();
  });
});

describe('analyzePortfolio', () => {
  const today = new Date('2026-10-01T00:00:00Z');
  const options = { profile: 'moderado' as const, attractivenessRate: 0.1, today };

  const position = (over: Partial<PositionInput> = {}): PositionInput => ({
    ticker: 'PETR4',
    assetClass: 'acao',
    quantity: 100,
    avgPrice: 30,
    currentPrice: 36,
    dailyVolumeValue: 500_000_000,
    closes: [30, 31, 33, 32, 36],
    acquiredOn: '2025-10-01',
    dividendsReceived: 0,
    ...over,
  });

  it('consolida investido, valor atual e lucro', () => {
    const result = analyzePortfolio([position()], options);
    expect(result.invested).toBe(3000);
    expect(result.currentValue).toBe(3600);
    expect(result.profit).toBe(600);
    expect(result.profitPercent).toBe(20);
  });

  it('pesos somam ~100 e viram alocação por classe', () => {
    const result = analyzePortfolio(
      [
        position(),
        position({
          ticker: 'HGLG11',
          assetClass: 'fii',
          avgPrice: 150,
          quantity: 10,
          currentPrice: 150,
        }),
      ],
      options,
    );
    const total = result.positions.reduce((sum, p) => sum + p.weight, 0);
    expect(total).toBeCloseTo(100, 1);
    expect(result.allocation.acao).toBeGreaterThan(0);
    expect(result.allocation.fii).toBeGreaterThan(0);
  });

  it('calcula TIR quando há data de aporte', () => {
    const result = analyzePortfolio([position()], options);
    // 20% em 12 meses: TIR perto de 20% ao ano.
    expect(result.irr).not.toBeNull();
    expect(result.irr as number).toBeCloseTo(0.2, 1);
  });

  it('sem data de aporte não inventa TIR nem VPL', () => {
    const result = analyzePortfolio([position({ acquiredOn: null })], options);
    expect(result.irr).toBeNull();
    expect(result.npv).toBe(0);
    expect(result.paybackMonths).toBeNull();
  });

  it('marca posição sem cotação em vez de zerar o valor', () => {
    const result = analyzePortfolio([position({ currentPrice: null })], options);
    expect(result.stalePositions).toEqual(['PETR4']);
    // Cai para o preço médio: a posição vale o custo, não zero.
    expect(result.currentValue).toBe(3000);
    expect(result.positions[0]?.priceStale).toBe(true);
  });

  it('carteira de um ativo é classificada como concentrada', () => {
    const result = analyzePortfolio([position()], options);
    expect(result.hhi).toBe(1);
    expect(result.concentration).toBe('concentrada');
    expect(result.effectivePositions).toBe(1);
  });

  it('carteira vazia devolve zeros sem quebrar', () => {
    const result = analyzePortfolio([], {
      profile: 'conservador',
      attractivenessRate: 0.1,
      today,
    });
    expect(result.currentValue).toBe(0);
    expect(result.profitPercent).toBeNull();
    expect(result.portfolioVolatility).toBeNull();
    expect(result.positions).toEqual([]);
  });

  it('alinhamento cai quando a carteira foge do perfil', () => {
    const agressiva = analyzePortfolio([position({ assetClass: 'cripto' })], {
      profile: 'conservador',
      attractivenessRate: 0.1,
      today,
    });
    const alinhada = analyzePortfolio([position({ assetClass: 'renda_fixa' })], {
      profile: 'conservador',
      attractivenessRate: 0.1,
      today,
    });
    expect(alinhada.alignmentScore).toBeGreaterThan(agressiva.alignmentScore);
  });

  it('conta os proventos recebidos e o yield sobre o custo', () => {
    const result = analyzePortfolio([position({ dividendsReceived: 300 })], options);
    expect(result.totalDividends).toBe(300);
    // 300 de proventos sobre 3000 de custo = 10%.
    expect(result.positions[0]?.dividendYieldOnCost).toBe(10);
  });
});
