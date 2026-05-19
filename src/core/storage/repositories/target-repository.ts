import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository, runRequest } from '@/core/storage/indexeddb-repository';
import type { BacklinkTarget, QueueRepository, TargetStatus } from '@/core/types/queue';

export class IndexedDBTargetRepository
  extends IndexedDBRepository<BacklinkTarget>
  implements QueueRepository
{
  constructor() {
    super(STORE_NAMES.targets, (target) => target.id);
  }

  listTargets(projectId: string): Promise<BacklinkTarget[]> {
    return runRequest(STORE_NAMES.targets, 'readonly', (store) =>
      store.index('projectId').getAll(projectId)
    );
  }

  listAllTargets(): Promise<BacklinkTarget[]> {
    return this.list();
  }

  getTarget(id: string): Promise<BacklinkTarget | null> {
    return this.get(id);
  }

  saveTarget(target: BacklinkTarget): Promise<void> {
    return this.put(target);
  }

  async updateTargetStatus(id: string, status: TargetStatus): Promise<void> {
    const target = await this.getTarget(id);
    if (!target) {
      throw new Error(`Target not found: ${id}`);
    }

    await this.saveTarget({
      ...target,
      status,
      updatedAt: Date.now()
    });
  }
}

export function createIndexedDBTargetRepository() {
  return new IndexedDBTargetRepository();
}
