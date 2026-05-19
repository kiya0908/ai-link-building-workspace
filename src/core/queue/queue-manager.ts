import type {
  BacklinkTarget,
  QueueFilter,
  QueueRepository,
  QueueState,
  QueueStateRepository,
  QueueStatistics,
  TargetStatus
} from '@/core/types/queue';
import { DEFAULT_QUEUE_STATE_ID } from '@/core/storage/repositories/queue-state-repository';

export interface QueueManager {
  list(projectId: string): Promise<BacklinkTarget[]>;
  saveTarget(target: BacklinkTarget): Promise<void>;
  openTarget(targetId: string): Promise<BacklinkTarget>;
  openNextTarget(projectId: string): Promise<BacklinkTarget | null>;
  updateStatus(targetId: string, status: TargetStatus): Promise<void>;
  markStatus(targetId: string, status: TargetStatus): Promise<void>;
  skipTarget(targetId: string): Promise<void>;
  retryTarget(targetId: string): Promise<void>;
  restoreState(projectId?: string): Promise<QueueState>;
  filterTargets(filter: QueueFilter): Promise<BacklinkTarget[]>;
  getStatistics(projectId: string): Promise<QueueStatistics>;
}

export function createQueueManager(
  repository: QueueRepository,
  stateRepository: QueueStateRepository
): QueueManager {
  const updateStatus = (targetId: string, status: TargetStatus) =>
    repository.updateTargetStatus(targetId, status);

  return {
    list(projectId) {
      return repository.listTargets(projectId);
    },
    saveTarget(target) {
      return repository.saveTarget(target);
    },
    async openTarget(targetId) {
      const target = await repository.getTarget(targetId);
      if (!target) {
        throw new Error(`Target not found: ${targetId}`);
      }

      const openedTarget = {
        ...target,
        status: 'opened' as TargetStatus,
        updatedAt: Date.now()
      };

      await repository.saveTarget(openedTarget);
      await stateRepository.saveState(createQueueState(openedTarget.projectId, openedTarget.id));
      return openedTarget;
    },
    async openNextTarget(projectId) {
      const targets = await repository.listTargets(projectId);
      const nextTarget = sortTargets(targets).find((target) => target.status === 'pending');

      if (!nextTarget) {
        await stateRepository.saveState(createQueueState(projectId, null));
        return null;
      }

      const openedTarget = {
        ...nextTarget,
        status: 'opened' as TargetStatus,
        updatedAt: Date.now()
      };

      await repository.saveTarget(openedTarget);
      await stateRepository.saveState(createQueueState(projectId, openedTarget.id));
      return openedTarget;
    },
    async updateStatus(targetId, status) {
      return updateStatus(targetId, status);
    },
    markStatus(targetId, status) {
      return updateStatus(targetId, status);
    },
    skipTarget(targetId) {
      return updateStatus(targetId, 'skipped');
    },
    retryTarget(targetId) {
      return updateStatus(targetId, 'pending');
    },
    async restoreState(projectId) {
      const state = await stateRepository.getState(DEFAULT_QUEUE_STATE_ID);
      if (state && (!projectId || state.activeProjectId === projectId)) {
        return state;
      }

      const initialState = createQueueState(projectId ?? null, null);
      await stateRepository.saveState(initialState);
      return initialState;
    },
    async filterTargets(filter) {
      const targets = filter.projectId
        ? await repository.listTargets(filter.projectId)
        : await repository.listAllTargets();

      return sortTargets(
        targets.filter((target) => {
          const matchesStatus = filter.status ? target.status === filter.status : true;
          const matchesSearch = filter.search
            ? target.url.toLowerCase().includes(filter.search.toLowerCase()) ||
              target.notes.toLowerCase().includes(filter.search.toLowerCase())
            : true;

          return matchesStatus && matchesSearch;
        })
      );
    },
    async getStatistics(projectId) {
      const targets = await repository.listTargets(projectId);

      return {
        total: targets.length,
        completed: targets.filter((target) => target.status === 'submitted').length,
        failed: targets.filter((target) => target.status === 'failed').length,
        skipped: targets.filter((target) => target.status === 'skipped').length
      };
    }
  };
}

function createQueueState(activeProjectId: string | null, currentTargetId: string | null): QueueState {
  return {
    id: DEFAULT_QUEUE_STATE_ID,
    activeProjectId,
    currentTargetId,
    updatedAt: Date.now()
  };
}

function sortTargets(targets: BacklinkTarget[]) {
  return [...targets].sort((left, right) => left.updatedAt - right.updatedAt);
}
