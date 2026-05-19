import type { RuntimeMessage, RuntimeMessageHandler } from '@/shared/messaging/messages';

export function createBackgroundMessageHandlers(): RuntimeMessageHandler[] {
  return [
    {
      canHandle(message: RuntimeMessage) {
        return message.type === 'SIDEBAR_READY' || message.type === 'SIDEBAR_ACTION';
      },
      async handle(message) {
        return {
          ok: true,
          received: message.type
        };
      }
    }
  ];
}
