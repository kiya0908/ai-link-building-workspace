import { loadOpenRouterConfig } from '@/core/ai/adapters/openrouter-config';
import { createCommentHistoryEntry, generateReviewedComment } from '@/core/ai/generation-workflow';
import { OpenRouterProvider } from '@/core/ai/providers/openrouter-provider';
import { createIndexedDBQueueManager } from '@/core/queue/indexeddb-queue-manager';
import { createIndexedDBCommentHistoryRepository } from '@/core/storage/repositories/comment-history-repository';
import type {
  QueueSnapshotResponse,
  RuntimeMessage,
  RuntimeMessageHandler
} from '@/shared/messaging/messages';

const queueManager = createIndexedDBQueueManager();

export function createBackgroundMessageHandlers(): RuntimeMessageHandler[] {
  return [
    {
      canHandle(message: RuntimeMessage) {
        return (
          message.type === 'SIDEBAR_READY' ||
          message.type === 'SIDEBAR_ACTION' ||
          message.type === 'GENERATE_COMMENT' ||
          message.type.startsWith('QUEUE_')
        );
      },
      async handle(message) {
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
          await Promise.all(message.payload.targets.map((target) => queueManager.saveTarget(target)));
          const projectId = message.payload.targets[0]?.projectId ?? null;
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

        return {
          ok: true,
          received: message.type
        };
      }
    }
  ];
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
