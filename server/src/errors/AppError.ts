/** Erro de domínio com código estável para o contrato { error: { message, code } }. */
export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}
