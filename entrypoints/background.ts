import { createBackgroundMessageHandlers } from '@/shared/messaging/background-handlers';
import { createRuntimeMessageRouter } from '@/shared/messaging/runtime-router';
import { AUTOMATION_OPEN_ALARM, handleAutomationOpenTimeout } from '@/core/automation/automation-coordinator';

export default defineBackground(() => {
  createRuntimeMessageRouter(createBackgroundMessageHandlers()).attach();
  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === AUTOMATION_OPEN_ALARM) void handleAutomationOpenTimeout();
  });
});
