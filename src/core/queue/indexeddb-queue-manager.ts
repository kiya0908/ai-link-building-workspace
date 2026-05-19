import { createQueueManager } from '@/core/queue/queue-manager';
import { createIndexedDBQueueStateRepository } from '@/core/storage/repositories/queue-state-repository';
import { createIndexedDBTargetRepository } from '@/core/storage/repositories/target-repository';

export function createIndexedDBQueueManager() {
  return createQueueManager(createIndexedDBTargetRepository(), createIndexedDBQueueStateRepository());
}
