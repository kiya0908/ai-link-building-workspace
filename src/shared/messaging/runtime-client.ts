import type { RuntimeMessage } from '@/shared/messaging/messages';

export interface RuntimeMessageClient {
  send<TResponse = unknown>(message: RuntimeMessage): Promise<TResponse>;
}

export function createRuntimeMessageClient(): RuntimeMessageClient {
  return {
    async send<TResponse = unknown>(message: RuntimeMessage): Promise<TResponse> {
      const response = await chrome.runtime.sendMessage(message);
      if (isRuntimeErrorResponse(response)) {
        throw new Error(response.error);
      }

      return response as TResponse;
    }
  };
}

function isRuntimeErrorResponse(response: unknown): response is { error: string } {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as { error: unknown }).error === 'string'
  );
}
