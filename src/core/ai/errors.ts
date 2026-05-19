export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly code: 'missing_api_key' | 'rate_limited' | 'timeout' | 'invalid_response' | 'request_failed'
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
