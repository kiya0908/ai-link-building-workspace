import { createBackgroundMessageHandlers } from '@/shared/messaging/background-handlers';
import { createRuntimeMessageRouter } from '@/shared/messaging/runtime-router';

export default defineBackground(() => {
  createRuntimeMessageRouter(createBackgroundMessageHandlers()).attach();
});
