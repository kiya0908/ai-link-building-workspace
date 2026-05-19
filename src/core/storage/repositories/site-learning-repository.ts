import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository } from '@/core/storage/indexeddb-repository';
import type { SiteLearningRecord } from '@/core/types/site-learning';

export function createIndexedDBSiteLearningRepository() {
  return new IndexedDBRepository<SiteLearningRecord, string>(
    STORE_NAMES.siteLearning,
    (record) => record.domain
  );
}
