import { create } from 'zustand';
import { createIndexedDBQueueManager } from '@/core/queue/indexeddb-queue-manager';
import type {
  BacklinkTarget,
  QueueFilter,
  QueueState,
  QueueStatistics,
  TargetStatus
} from '@/core/types/queue';

interface QueueStore {
  activeProjectId: string | null;
  currentTargetId: string | null;
  targets: BacklinkTarget[];
  statistics: QueueStatistics;
  isLoading: boolean;
  error: string | null;
  hydrateQueue(projectId?: string): Promise<void>;
  switchCurrentProject(projectId: string): Promise<void>;
  openNextTarget(): Promise<void>;
  updateStatus(targetId: string, status: TargetStatus): Promise<void>;
  skipTarget(targetId: string): Promise<void>;
  retryTarget(targetId: string): Promise<void>;
  filterQueue(filter: QueueFilter): Promise<void>;
}

const queueManager = createIndexedDBQueueManager();

const emptyStatistics: QueueStatistics = {
  total: 0,
  completed: 0,
  failed: 0,
  skipped: 0
};

export const useQueueStore = create<QueueStore>((set, get) => ({
  activeProjectId: null,
  currentTargetId: null,
  targets: [],
  statistics: emptyStatistics,
  isLoading: false,
  error: null,
  async hydrateQueue(projectId) {
    await runQueueMutation(set, async () => {
      const state = await queueManager.restoreState(projectId);
      await loadProjectQueue(set, state);
    });
  },
  async switchCurrentProject(projectId) {
    await runQueueMutation(set, async () => {
      await queueManager.restoreState(projectId);
      const openedTarget = await queueManager.openNextTarget(projectId);
      const state: QueueState = {
        id: 'default',
        activeProjectId: projectId,
        currentTargetId: openedTarget?.id ?? null,
        updatedAt: Date.now()
      };
      await loadProjectQueue(set, state);
    });
  },
  async openNextTarget() {
    const projectId = get().activeProjectId;
    if (!projectId) {
      return;
    }

    await runQueueMutation(set, async () => {
      const openedTarget = await queueManager.openNextTarget(projectId);
      await loadProjectQueue(set, {
        id: 'default',
        activeProjectId: projectId,
        currentTargetId: openedTarget?.id ?? null,
        updatedAt: Date.now()
      });
    });
  },
  async updateStatus(targetId, status) {
    await runQueueMutation(set, async () => {
      await queueManager.updateStatus(targetId, status);
      await reloadActiveProject(set, get());
    });
  },
  async skipTarget(targetId) {
    await runQueueMutation(set, async () => {
      await queueManager.skipTarget(targetId);
      await reloadActiveProject(set, get());
    });
  },
  async retryTarget(targetId) {
    await runQueueMutation(set, async () => {
      await queueManager.retryTarget(targetId);
      await reloadActiveProject(set, get());
    });
  },
  async filterQueue(filter) {
    await runQueueMutation(set, async () => {
      const targets = await queueManager.filterTargets(filter);
      set({ targets });
    });
  }
}));

async function runQueueMutation(
  set: (state: Partial<QueueStore>) => void,
  operation: () => Promise<void>
) {
  set({ isLoading: true, error: null });
  try {
    await operation();
  } catch (error) {
    set({
      error: error instanceof Error ? error.message : 'Queue operation failed.'
    });
  } finally {
    set({ isLoading: false });
  }
}

async function reloadActiveProject(
  set: (state: Partial<QueueStore>) => void,
  state: QueueStore
) {
  if (!state.activeProjectId) {
    return;
  }

  await loadProjectQueue(set, {
    id: 'default',
    activeProjectId: state.activeProjectId,
    currentTargetId: state.currentTargetId,
    updatedAt: Date.now()
  });
}

async function loadProjectQueue(
  set: (state: Partial<QueueStore>) => void,
  state: QueueState
) {
  const targets = state.activeProjectId ? await queueManager.list(state.activeProjectId) : [];
  const statistics = state.activeProjectId
    ? await queueManager.getStatistics(state.activeProjectId)
    : emptyStatistics;

  set({
    activeProjectId: state.activeProjectId,
    currentTargetId: state.currentTargetId,
    targets,
    statistics
  });
}
