import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository } from '@/core/storage/indexeddb-repository';
import type { QueueState, QueueStateRepository } from '@/core/types/queue';

export const DEFAULT_QUEUE_STATE_ID = 'default';

export class IndexedDBQueueStateRepository
  extends IndexedDBRepository<QueueState>
  implements QueueStateRepository
{
  constructor() {
    super(STORE_NAMES.queueState, (state) => state.id);
  }

  getState(id = DEFAULT_QUEUE_STATE_ID): Promise<QueueState | null> {
    return this.get(id);
  }

  saveState(state: QueueState): Promise<void> {
    return this.put(state);
  }
}

export function createIndexedDBQueueStateRepository() {
  return new IndexedDBQueueStateRepository();
}
