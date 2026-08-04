import { loadOpenRouterConfig } from '@/core/ai/adapters/openrouter-config';
import { createCommentHistoryEntry, generateReviewedComment } from '@/core/ai/generation-workflow';
import { OpenRouterProvider } from '@/core/ai/providers/openrouter-provider';
import { createIndexedDBQueueManager } from '@/core/queue/indexeddb-queue-manager';
import { exportFullDatabase, exportTargetsAsCsv } from '@/core/queue/queue-import-export';
import { createIndexedDBCommentHistoryRepository } from '@/core/storage/repositories/comment-history-repository';
import type {
  QueueSnapshotResponse,
  RuntimeMessage,
  RuntimeMessageHandler
} from '@/shared/messaging/messages';
import {
  completeAutomationTarget,
  getAutomationSession,
  markAutomationPageReady,
  startAutomation,
  stopAutomation,
  updateAutomationPhase
} from '@/core/automation/automation-coordinator';

const queueManager = createIndexedDBQueueManager();

export function createBackgroundMessageHandlers(): RuntimeMessageHandler[] {
  return [
    {
      canHandle(message: RuntimeMessage) {
        return (
          message.type === 'SIDEBAR_READY' ||
          message.type === 'SIDEBAR_ACTION' ||
          message.type === 'GENERATE_COMMENT' ||
          message.type.startsWith('AUTOMATION_') ||
          message.type.startsWith('QUEUE_')
        );
      },
      async handle(message, sender) {
        if (message.type === 'AUTOMATION_GET') return getAutomationSession();
        if (message.type === 'AUTOMATION_START') {
          return startAutomation(message.payload.projectId, message.payload.mode, senderTabId(sender));
        }
        if (message.type === 'AUTOMATION_STOP') return stopAutomation();
        if (message.type === 'AUTOMATION_PAGE_READY') return markAutomationPageReady(senderTabId(sender));
        if (message.type === 'AUTOMATION_SET_PHASE') {
          return updateAutomationPhase(message.payload.phase, message.payload.detail, { comment: message.payload.comment ?? null });
        }
        if (message.type === 'AUTOMATION_COMPLETE_TARGET') return completeAutomationTarget(message.payload);
        if (message.type === 'GENERATE_COMMENT') {
          const config = await loadOpenRouterConfig();
          const provider = new OpenRouterProvider(config);
          const previousComments = await createIndexedDBCommentHistoryRepository().listByTarget(
            message.payload.targetId
          );
          const result = await generateReviewedComment(
            {
              article: message.payload.article,
              project: message.payload.project,
              style: message.payload.style,
              mode: message.payload.mode,
              previousComments: previousComments.map((entry) => entry.comment)
            },
            (input) => provider.generateComment(input)
          );

          await createIndexedDBCommentHistoryRepository().put(
            createCommentHistoryEntry({
              targetId: message.payload.targetId,
              projectId: message.payload.project.id,
              mode: message.payload.mode,
              result
            })
          );

          return result;
        }

        if (message.type === 'QUEUE_HYDRATE') {
          const state = await queueManager.restoreState(message.payload.projectId);
          return createQueueSnapshot(state.activeProjectId, state.currentTargetId);
        }

        if (message.type === 'QUEUE_SWITCH_PROJECT') {
          const openedTarget = await queueManager.openNextTarget(message.payload.projectId);
          return createQueueSnapshot(message.payload.projectId, openedTarget?.id ?? null, openedTarget);
        }

        if (message.type === 'QUEUE_IMPORT_TARGETS') {
          const projectId = message.payload.targets[0]?.projectId ?? null;
          const shouldReplace = message.payload.replaceExisting ?? true;
          if (projectId && shouldReplace) {
            await queueManager.clearProjectTargets(projectId);
          }
          const now = Date.now();
          for (const [index, target] of message.payload.targets.entries()) {
            await queueManager.saveTarget({ ...target, projectId: target.projectId || projectId || '', updatedAt: now + index });
          }
          return createQueueSnapshot(projectId, null);
        }

        if (message.type === 'QUEUE_OPEN_TARGET') {
          const openedTarget = await queueManager.openTarget(message.payload.targetId);
          return createQueueSnapshot(openedTarget.projectId, openedTarget.id, openedTarget);
        }

        if (message.type === 'QUEUE_OPEN_NEXT') {
          const openedTarget = await queueManager.openNextTarget(message.payload.projectId);
          return createQueueSnapshot(message.payload.projectId, openedTarget?.id ?? null, openedTarget);
        }

        if (message.type === 'QUEUE_UPDATE_STATUS') {
          await queueManager.updateStatus(message.payload.targetId, message.payload.status);
          const state = await queueManager.restoreState();
          return createQueueSnapshot(state.activeProjectId, state.currentTargetId);
        }

        if (message.type === 'QUEUE_UPDATE_SUBMISSION_STATUS') {
          await queueManager.updateSubmissionStatus(message.payload.targetId, message.payload.status);
          const state = await queueManager.restoreState();
          return createQueueSnapshot(state.activeProjectId, state.currentTargetId);
        }

        if (message.type === 'QUEUE_FILTER') {
          const targets = await queueManager.filterTargets(message.payload.filter);
          const state = await queueManager.restoreState(message.payload.filter.projectId);
          return {
            state,
            targets,
            statistics: state.activeProjectId
              ? await queueManager.getStatistics(state.activeProjectId)
              : emptyStatistics()
          } satisfies QueueSnapshotResponse;
        }

        if (message.type === 'QUEUE_EXPORT_TARGETS_CSV') {
          return exportTargetsAsCsv(await queueManager.list(message.payload.projectId));
        }

        if (message.type === 'QUEUE_EXPORT_FULL_DATABASE') {
          return exportFullDatabase();
        }

        return {
          ok: true,
          received: message.type
        };
      }
    }
  ];
}

function senderTabId(sender: { tab?: { id?: number } } | undefined): number | null {
  return sender?.tab?.id ?? null;
}

async function createQueueSnapshot(
  projectId: string | null,
  currentTargetId: string | null,
  openedTarget: QueueSnapshotResponse['openedTarget'] = null
): Promise<QueueSnapshotResponse> {
  const state = {
    id: 'default',
    activeProjectId: projectId,
    currentTargetId,
    updatedAt: Date.now()
  };

  return {
    state,
    targets: projectId ? await queueManager.list(projectId) : [],
    statistics: projectId ? await queueManager.getStatistics(projectId) : emptyStatistics(),
    openedTarget
  };
}

function emptyStatistics() {
  return {
    total: 0,
    completed: 0,
    failed: 0,
    skipped: 0
  };
}
