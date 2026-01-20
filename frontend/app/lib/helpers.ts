export class ApiError extends Error {
  constructor(
    message: string,
    public readonly cause?: Record<string, string>,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
