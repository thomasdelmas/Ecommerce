export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly meta?: Record<string, unknown>;

  constructor(
    message: string,
    {
      statusCode = 500,
      code = 'INTERNAL_ERROR',
      meta,
    }: {
      statusCode?: number;
      code?: string;
      meta?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;

    Error.captureStackTrace(this, this.constructor);
  }
}
