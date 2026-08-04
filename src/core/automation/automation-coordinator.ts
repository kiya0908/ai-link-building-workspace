import { createIndexedDBQueueManager } from '@/core/queue/indexeddb-queue-manager';
import { createIndexedDBAutomationStateRepository } from '@/core/storage/repositories/automation-state-repository';
import type { AutomationMode, AutomationPhase, AutomationSession } from '@/core/types/automation';
import type { SubmissionStatus, TargetStatus } from '@/core/types/queue';

export const AUTOMATION_OPEN_ALARM = 'ai-link-automation-open-timeout';
const OPEN_TIMEOUT_MS = 60_000;

const repository = createIndexedDBAutomationStateRepository();
const queue = createIndexedDBQueueManager();

export async function getAutomationSession(): Promise<AutomationSession | null> {
  return repository.get();
}

export async function startAutomation(projectId: string, mode: AutomationMode, tabId: number | null) {
  await repository.save(createSession(projectId, mode, tabId));
  return openNextAutomationTarget();
}

export async function stopAutomation(detail = 'Automation stopped by user.') {
  const current = await repository.get();
  if (!current) return null;
  await browser.alarms.clear(AUTOMATION_OPEN_ALARM);
  const stopped = { ...current, running: false, phase: 'stopped' as const, deadlineAt: null, detail, updatedAt: Date.now() };
  await repository.save(stopped);
  return stopped;
}

export async function markAutomationPageReady(tabId: number | null) {
  const current = await repository.get();
  if (!current?.running || !current.targetId || (current.tabId !== null && tabId !== null && current.tabId !== tabId)) return current;
  await browser.alarms.clear(AUTOMATION_OPEN_ALARM);
  if (current.phase !== 'opening') return current;
  return updateAutomationPhase('analyzing', 'Page loaded; analyzing comment capability.', { tabId });
}

export async function updateAutomationPhase(
  phase: AutomationPhase,
  detail: string,
  patch: Partial<AutomationSession> = {}
) {
  const current = await repository.get();
  if (!current) throw new Error('Automation session was not found.');
  const next = { ...current, ...patch, phase, detail, updatedAt: Date.now() };
  await repository.save(next);
  return next;
}

export async function completeAutomationTarget(input: {
  targetId: string;
  status: TargetStatus;
  submissionStatus?: SubmissionStatus;
  detail: string;
}) {
  const current = await repository.get();
  if (!current?.running || current.targetId !== input.targetId) return current;
  await queue.updateStatus(input.targetId, input.status);
  if (input.submissionStatus) await queue.updateSubmissionStatus(input.targetId, input.submissionStatus);
  await repository.save({
    ...current,
    phase: 'idle',
    targetId: null,
    targetUrl: null,
    deadlineAt: null,
    comment: null,
    lastResult: input.status,
    lastSubmissionStatus: input.submissionStatus ?? null,
    detail: input.detail,
    updatedAt: Date.now()
  });
  return openNextAutomationTarget();
}

export async function handleAutomationOpenTimeout() {
  const current = await repository.get();
  if (!current?.running || current.phase !== 'opening' || !current.targetId) return;
  await completeAutomationTarget({ targetId: current.targetId, status: 'skipped', detail: 'Page did not become ready within 60 seconds.' });
}

async function openNextAutomationTarget() {
  const current = await repository.get();
  if (!current?.running) return current;
  const target = await queue.openNextTarget(current.projectId);
  if (!target) {
    const done = { ...current, running: false, phase: 'idle' as const, targetId: null, targetUrl: null, deadlineAt: null, detail: 'Queue complete.', updatedAt: Date.now() };
    await repository.save(done);
    return done;
  }

  const deadlineAt = Date.now() + OPEN_TIMEOUT_MS;
  const opening = { ...current, phase: 'opening' as const, targetId: target.id, targetUrl: target.url, deadlineAt, comment: null, detail: `Opening ${target.url}`, updatedAt: Date.now() };
  await repository.save(opening);
  await browser.alarms.create(AUTOMATION_OPEN_ALARM, { when: deadlineAt });
  if (opening.tabId !== null) await browser.tabs.update(opening.tabId, { url: target.url });
  return opening;
}

function createSession(projectId: string, mode: AutomationMode, tabId: number | null): AutomationSession {
  return {
    id: 'default', running: true, mode, phase: 'idle', projectId, targetId: null,
    targetUrl: null, tabId, deadlineAt: null, comment: null, lastResult: null,
    lastSubmissionStatus: null, detail: 'Automation started.', updatedAt: Date.now()
  };
}