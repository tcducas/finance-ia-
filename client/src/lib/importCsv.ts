import type { AssetInput, TransactionInput, TransactionType } from '../types/finance';

/**
 * Parse de CSV de extrato / carteira, tolerante ao que os bancos e corretoras
 * brasileiros exportam: separador `,` ou `;`, valores com "R$", milhar `.` e
 * decimal `,`, datas em DD/MM/AAAA. O servidor revalida cada linha com Zod.
 */

export interface ImportIssue {
  line: number;
  message: string;
}

export interface ImportParse<T> {
  rows: T[];
  issues: ImportIssue[];
  /** Linhas de dados encontradas (válidas + inválidas). */
  total: number;
}

// --- CSV cru ---------------------------------------------------------------

function detectDelimiter(headerLine: string): ',' | ';' | '\t' {
  let comma = 0;
  let semi = 0;
  let tab = 0;
  for (const ch of headerLine) {
    if (ch === ',') comma += 1;
    else if (ch === ';') semi += 1;
    else if (ch === '\t') tab += 1;
  }
  if (semi > comma && semi >= tab) return ';';
  if (tab > comma && tab > semi) return '\t';
  return ',';
}

/** Divide o texto em matriz de campos, respeitando aspas duplas. */
function toMatrix(text: string, delimiter: string): string[][] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quoted) {
      if (ch === '"') {
        if (clean[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
    } else {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function normalizeHeader(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

interface CsvTable {
  records: Record<string, string>[];
}

function parseCsv(text: string): CsvTable {
  const firstLine = text.replace(/^﻿/, '').split(/\r\n?|\n/, 1)[0] ?? '';
  const delimiter = detectDelimiter(firstLine);
  const matrix = toMatrix(text, delimiter).filter((r) => r.some((c) => c.trim() !== ''));
  if (matrix.length === 0) return { records: [] };

  const headers = (matrix[0] ?? []).map(normalizeHeader);
  const records = matrix.slice(1).map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) record[h] = (cells[idx] ?? '').trim();
    });
    return record;
  });
  return { records };
}

// --- Coerção de valores --------------------------------------------------

function pick(record: Record<string, string>, aliases: string[]): string {
  for (const alias of aliases) {
    const value = record[alias];
    if (value !== undefined && value !== '') return value;
  }
  return '';
}

const TRUTHY = new Set(['sim', 's', 'true', '1', 'yes', 'y', 'x', 'verdadeiro']);

export function parseAmount(raw: string): number | null {
  let s = raw.trim().replace(/\s/g, '').replace(/r\$/i, '').replace(/%/g, '');
  if (!s) return null;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith('-')) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith('+')) {
    s = s.slice(1);
  }
  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    // O separador mais à direita é o decimal; o outro é milhar.
    if (lastComma > lastDot) s = s.replace(/\./g, '').replace(',', '.');
    else s = s.replace(/,/g, '');
  } else if (lastComma !== -1) {
    s = s.replace(/\./g, '').replace(',', '.');
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return null;
  return negative ? -n : n;
}

export function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (!s) return null;
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const y = iso[1] ?? '';
    const m = iso[2] ?? '';
    const d = iso[3] ?? '';
    return isValidYmd(Number(y), Number(m), Number(d)) ? `${y}-${m}-${d}` : null;
  }
  const br = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/.exec(s);
  if (br) {
    const dd = (br[1] ?? '').padStart(2, '0');
    const mm = (br[2] ?? '').padStart(2, '0');
    let y = br[3] ?? '';
    if (y.length === 2) y = `20${y}`;
    return isValidYmd(Number(y), Number(mm), Number(dd)) ? `${y}-${mm}-${dd}` : null;
  }
  return null;
}

function isValidYmd(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

function normalizeType(raw: string, amount: number): TransactionType {
  const s = raw
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (['receita', 'entrada', 'income', 'credito', 'credit', 'c', '+'].includes(s)) return 'receita';
  if (['despesa', 'saida', 'expense', 'debito', 'debit', 'd', '-'].includes(s)) return 'despesa';
  return amount < 0 ? 'despesa' : 'receita';
}

// --- Mapeadores públicos ------------------------------------------------

const TX_ALIASES = {
  date: ['data', 'date', 'dia', 'occurredon', 'datalancamento', 'dtlancamento'],
  type: ['tipo', 'type', 'natureza', 'operacao'],
  category: ['categoria', 'category', 'cat', 'classe'],
  amount: ['valor', 'amount', 'value', 'montante', 'quantia'],
  description: ['descricao', 'description', 'historico', 'memo', 'detalhe', 'lancamento'],
  recurring: ['recorrente', 'recurring', 'fixo', 'fixa'],
};

export function parseTransactionsCsv(text: string): ImportParse<TransactionInput> {
  const { records } = parseCsv(text);
  const rows: TransactionInput[] = [];
  const issues: ImportIssue[] = [];

  records.forEach((record, index) => {
    const line = index + 2; // +1 header, +1 base-1
    const rawAmount = pick(record, TX_ALIASES.amount);
    const rawDate = pick(record, TX_ALIASES.date);
    const amount = parseAmount(rawAmount);
    const occurred_on = parseDate(rawDate);

    if (amount === null || amount === 0) {
      issues.push({ line, message: `valor inválido ("${rawAmount}")` });
      return;
    }
    if (!occurred_on) {
      issues.push({ line, message: `data inválida ("${rawDate}")` });
      return;
    }

    const type = normalizeType(pick(record, TX_ALIASES.type), amount);
    const category = (pick(record, TX_ALIASES.category) || 'outros').slice(0, 60);
    const description = pick(record, TX_ALIASES.description).slice(0, 200) || undefined;
    const is_recurring = TRUTHY.has(pick(record, TX_ALIASES.recurring).toLowerCase());

    rows.push({ type, amount: Math.abs(amount), category, occurred_on, description, is_recurring });
  });

  return { rows, issues, total: records.length };
}

const ASSET_ALIASES = {
  kind: ['tipo', 'kind', 'classe', 'categoria', 'class'],
  name: ['nome', 'name', 'ativo', 'descricao', 'papel', 'ticker'],
  value: ['valor', 'value', 'saldo', 'amount', 'total', 'posicao'],
  liability: ['passivo', 'liability', 'divida', 'isliability'],
};

export function parseAssetsCsv(text: string): ImportParse<AssetInput> {
  const { records } = parseCsv(text);
  const rows: AssetInput[] = [];
  const issues: ImportIssue[] = [];

  records.forEach((record, index) => {
    const line = index + 2;
    const rawValue = pick(record, ASSET_ALIASES.value);
    const value = parseAmount(rawValue);
    const name = pick(record, ASSET_ALIASES.name).slice(0, 120);

    if (value === null) {
      issues.push({ line, message: `valor inválido ("${rawValue}")` });
      return;
    }
    if (!name) {
      issues.push({ line, message: 'nome vazio' });
      return;
    }

    const is_liability = TRUTHY.has(pick(record, ASSET_ALIASES.liability).toLowerCase());
    const kind = (pick(record, ASSET_ALIASES.kind) || (is_liability ? 'Dívida' : 'Outro')).slice(
      0,
      60,
    );

    rows.push({ kind, name, value: Math.abs(value), is_liability });
  });

  return { rows, issues, total: records.length };
}
