import type { RuntimeMessage, RuntimeMessageHandler } from '@/shared/messaging/messages';

export interface RuntimeMessageRouter {
  attach(): void;
}

export function createRuntimeMessageRouter(
  handlers: RuntimeMessageHandler[] = []
): RuntimeMessageRouter {
  return {
    attach() {
      chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
        const handler = handlers.find((candidate) => candidate.canHandle(message));

        if (!handler) {
          return false;
        }

        handler
          .handle(message, sender)
          .then(sendResponse)
          .catch((error: unknown) => {
            sendResponse({
              error: error instanceof Error ? error.message : 'Unknown runtime message error'
            });
          });

        return true;
      });
    }
  };
}
