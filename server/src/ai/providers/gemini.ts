import { env } from '../../env.js';
import { AppError } from '../../errors/AppError.js';

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Gemini — chat conversacional e explicações (alto volume, menor custo).
 * REST v1beta generateContent; a chave nunca sai do backend.
 */
export async function geminiChat(
  systemPrompt: string,
  history: ChatTurn[],
  message: string,
): Promise<string> {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      'IA não configurada no servidor (GEMINI_API_KEY ausente).',
      'AI_NOT_CONFIGURED',
      503,
    );
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;

  const contents = [
    ...history.map((turn) => ({
      role: turn.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: turn.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 1024, temperature: 0.7 },
      }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new AppError('Provedor de IA indisponível no momento.', 'AI_UNAVAILABLE', 502);
  }

  if (!res.ok) {
    console.error(`[ai] gemini status ${res.status}`);
    throw new AppError('Provedor de IA indisponível no momento.', 'AI_UNAVAILABLE', 502);
  }

  const body = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = body.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) {
    throw new AppError('Resposta vazia do provedor de IA.', 'AI_UNAVAILABLE', 502);
  }
  return text;
}
