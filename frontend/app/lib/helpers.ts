export class ApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: Record<string, string>,
    public readonly status?: number,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
