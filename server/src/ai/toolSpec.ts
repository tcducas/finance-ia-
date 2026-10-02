import type { z } from 'zod';

/**
 * Contrato de uma saída estruturada de IA. Os provedores (Groq e Claude) são
 * genéricos sobre isto: qualquer análise nova entra declarando um ToolSpec, sem
 * mexer no código de rede nem duplicar tratamento de erro.
 */
export interface ToolSpec<T> {
  name: string;
  description: string;
  /** JSON Schema entregue ao tool calling do provedor. */
  jsonSchema: unknown;
  /**
   * Zod que revalida a saída — modelos sem `strict` garantido mentem o formato.
   * A entrada é `unknown` porque vem de JSON do provedor, e isso permite que o
   * schema use `.transform()` para acrescentar campos (ex.: o disclaimer).
   */
  schema: z.ZodType<T, z.ZodTypeDef, unknown>;
}
