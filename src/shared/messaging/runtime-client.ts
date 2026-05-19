import type { RuntimeMessage } from '@/shared/messaging/messages';

export interface RuntimeMessageClient {
  send<TResponse = unknown>(message: RuntimeMessage): Promise<TResponse>;
}

export function createRuntimeMessageClient(): RuntimeMessageClient {
  return {
    send(message) {
      return chrome.runtime.sendMessage(message);
    }
  };
}
