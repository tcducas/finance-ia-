import { describe, expect, it } from 'vitest';
import { anonymizeContext, netWorthBand, sanitizeUserText } from '../ai/anonymize.js';

describe('anonymizeContext', () => {
  const raw = {
    screen: 'carteira',
    profile: 'moderado',
    summary: { receitas: 5000, despesas: 2020, saldo: 2980 },
    spending: [
      { category: 'moradia', total: 1200 },
      { category: 'mercado', total: 640 },
      { category: 'lazer', total: 180 },
    ],
    budgets: [{ category: 'mercado', monthly_limit: 800, spent: 640 }],
    netWorth: 11_000,
    watchlist: ['PETR4', 'WEGE3'],
  };

  it('nenhum valor absoluto sai no contexto', () => {
    const json = JSON.stringify(anonymizeContext(raw));
    for (const absoluto of ['5000', '2020', '2980', '1200', '640', '180', '800', '11000']) {
      expect(json).not.toContain(absoluto);
    }
  });

  it('converte para percentuais e faixas', () => {
    const ctx = anonymizeContext(raw);
    expect(ctx.comprometimento_renda_pct).toBe(40);
    expect(ctx.saldo_positivo).toBe(true);
    expect(ctx.gastos_por_categoria_pct?.[0]).toEqual({ categoria: 'moradia', pct: 59 });
    expect(ctx.orcamentos?.[0]).toEqual({ categoria: 'mercado', uso_pct: 80 });
    expect(ctx.faixa_patrimonio).toBe('R$ 10 mil – R$ 50 mil');
    expect(ctx.tickers_acompanhados).toEqual(['PETR4', 'WEGE3']);
  });

  it('descarta tickers com formato inválido (possível PII)', () => {
    const ctx = anonymizeContext({ watchlist: ['PETR4', 'joao@email.com', '123.456.789-00'] });
    expect(ctx.tickers_acompanhados).toEqual(['PETR4']);
  });
});

describe('netWorthBand', () => {
  it('cobre as faixas', () => {
    expect(netWorthBand(-5)).toContain('negativo');
    expect(netWorthBand(5_000)).toBe('até R$ 10 mil');
    expect(netWorthBand(11_000)).toBe('R$ 10 mil – R$ 50 mil');
    expect(netWorthBand(2_000_000)).toBe('acima de R$ 1 milhão');
  });
});

describe('sanitizeUserText', () => {
  it('remove e-mail, CPF e telefone', () => {
    const out = sanitizeUserText(
      'Sou o João, meu email é joao.silva@gmail.com, CPF 123.456.789-00, tel (11) 91234-5678.',
    );
    expect(out).not.toContain('joao.silva@gmail.com');
    expect(out).not.toContain('123.456.789-00');
    expect(out).not.toContain('91234-5678');
    expect(out).toContain('[e-mail removido]');
    expect(out).toContain('[documento removido]');
  });

  it('remove sequências longas de dígitos (contas, cartões)', () => {
    expect(sanitizeUserText('minha conta é 12345678901')).not.toContain('12345678901');
  });

  it('preserva percentuais e tickers', () => {
    const out = sanitizeUserText('vale a pena PETR4 com 30% da carteira?');
    expect(out).toContain('PETR4');
    expect(out).toContain('30%');
  });
});
