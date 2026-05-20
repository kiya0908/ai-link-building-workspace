import { create } from 'zustand';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import type { QueueSnapshotResponse } from '@/shared/messaging/messages';
import type {
  BacklinkTarget,
  QueueFilter,
  QueueStatistics,
  SubmissionStatus,
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
  openTarget(targetId: string): Promise<BacklinkTarget | null>;
  openNextTarget(): Promise<BacklinkTarget | null>;
  updateStatus(targetId: string, status: TargetStatus): Promise<void>;
  updateSubmissionStatus(targetId: string, status: SubmissionStatus): Promise<void>;
  skipTarget(targetId: string): Promise<void>;
  retryTarget(targetId: string): Promise<void>;
  filterQueue(filter: QueueFilter): Promise<void>;
  importTargets(targets: BacklinkTarget[], options?: { replaceExisting?: boolean }): Promise<void>;
}

const runtimeClient = createRuntimeMessageClient();

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
      applyQueueSnapshot(
        set,
        await runtimeClient.send<QueueSnapshotResponse>({
          type: 'QUEUE_HYDRATE',
          payload: { projectId }
        })
      );
    });
  },
  async switchCurrentProject(projectId) {
    await runQueueMutation(set, async () => {
      applyQueueSnapshot(
        set,
        await runtimeClient.send<QueueSnapshotResponse>({
          type: 'QUEUE_SWITCH_PROJECT',
          payload: { projectId }
        })
      );
    });
  },
  async openTarget(targetId) {
    let openedTarget: BacklinkTarget | null = null;
    await runQueueMutation(set, async () => {
      const snapshot = await runtimeClient.send<QueueSnapshotResponse>({
        type: 'QUEUE_OPEN_TARGET',
        payload: { targetId }
      });
      openedTarget = snapshot.openedTarget ?? null;
      applyQueueSnapshot(set, snapshot);
    });
    return openedTarget;
  },
  async openNextTarget() {
    const projectId = get().activeProjectId;
    if (!projectId) {
      return null;
    }

    let openedTarget: BacklinkTarget | null = null;
    await runQueueMutation(set, async () => {
      const snapshot = await runtimeClient.send<QueueSnapshotResponse>({
        type: 'QUEUE_OPEN_NEXT',
        payload: { projectId }
      });
      openedTarget = snapshot.openedTarget ?? null;
      applyQueueSnapshot(set, snapshot);
    });
    return openedTarget;
  },
  async updateStatus(targetId, status) {
    await runQueueMutation(set, async () => {
      applyQueueSnapshot(
        set,
        await runtimeClient.send<QueueSnapshotResponse>({
          type: 'QUEUE_UPDATE_STATUS',
          payload: { targetId, status }
        })
      );
    });
  },
  async updateSubmissionStatus(targetId, status) {
    await runQueueMutation(set, async () => {
      applyQueueSnapshot(
        set,
        await runtimeClient.send<QueueSnapshotResponse>({
          type: 'QUEUE_UPDATE_SUBMISSION_STATUS',
          payload: { targetId, status }
        })
      );
    });
  },
  async skipTarget(targetId) {
    await get().updateStatus(targetId, 'skipped');
  },
  async retryTarget(targetId) {
    await get().updateStatus(targetId, 'pending');
  },
  async filterQueue(filter) {
    await runQueueMutation(set, async () => {
      applyQueueSnapshot(
        set,
        await runtimeClient.send<QueueSnapshotResponse>({
          type: 'QUEUE_FILTER',
          payload: { filter }
        })
      );
    });
  },
  async importTargets(targets, options = { replaceExisting: true }) {
    await runQueueMutation(set, async () => {
      applyQueueSnapshot(
        set,
        await runtimeClient.send<QueueSnapshotResponse>({
          type: 'QUEUE_IMPORT_TARGETS',
          payload: { targets, replaceExisting: options.replaceExisting ?? true }
        })
      );
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
    const message = error instanceof Error ? error.message : 'Queue operation failed.';
    set({
      error: message
    });
    throw new Error(message);
  } finally {
    set({ isLoading: false });
  }
}

function applyQueueSnapshot(set: (state: Partial<QueueStore>) => void, snapshot: QueueSnapshotResponse) {
  set({
    activeProjectId: snapshot.state.activeProjectId,
    currentTargetId: snapshot.state.currentTargetId,
    targets: snapshot.targets,
    statistics: snapshot.statistics
  });
}
