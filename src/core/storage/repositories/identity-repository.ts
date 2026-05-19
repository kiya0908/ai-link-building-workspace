import type { Identity } from '@/core/types/project';
import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository } from '@/core/storage/indexeddb-repository';

export function createIndexedDBIdentityRepository() {
  return new IndexedDBRepository<Identity>(STORE_NAMES.identities, (identity) => identity.id);
}
