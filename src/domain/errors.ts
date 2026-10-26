export type ArcLensErrorShape = {
  code: string;
  status: number;
  retryable: boolean;
  problem: string;
  cause: string;
  fix: string;
  docsUrl: string;
  requestId?: string;
  retryAfterSeconds?: number;
};

export class ArcLensError extends Error implements ArcLensErrorShape {
  readonly code: string;
  readonly status: number;
  readonly retryable: boolean;
  readonly problem: string;
  readonly cause: string;
  readonly fix: string;
  readonly docsUrl: string;
  readonly requestId?: string;
  readonly retryAfterSeconds?: number;

  constructor(shape: ArcLensErrorShape) {
    super(shape.problem);
    this.name = "ArcLensError";
    this.code = shape.code;
    this.status = shape.status;
    this.retryable = shape.retryable;
    this.problem = shape.problem;
    this.cause = shape.cause;
    this.fix = shape.fix;
    this.docsUrl = shape.docsUrl;
    this.requestId = shape.requestId;
    this.retryAfterSeconds = shape.retryAfterSeconds;
  }

  toJSON(): ArcLensErrorShape {
    return {
      code: this.code,
      status: this.status,
      retryable: this.retryable,
      problem: this.problem,
      cause: this.cause,
      fix: this.fix,
      docsUrl: this.docsUrl,
      ...(this.requestId ? { requestId: this.requestId } : {}),
      ...(this.retryAfterSeconds
        ? { retryAfterSeconds: this.retryAfterSeconds }
        : {}),
    };
  }
}
