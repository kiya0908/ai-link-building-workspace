export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly code: 'missing_api_key' | 'rate_limited' | 'timeout' | 'invalid_response' | 'request_failed' | 'output_truncated' | 'context_length_exceeded' | 'validation_failed'
  ) {
    super(message);
    this.name = 'AIProviderError';
  }
}
