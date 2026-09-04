// Shape every backend endpoint responds with.
export interface ApiEnvelope<T = unknown> {
  success: boolean;
  response: T;
  message?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
