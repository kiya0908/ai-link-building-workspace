import type { Project } from '@/core/types/project';
import { IndexedDBRepository } from '@/core/storage/indexeddb-repository';
import { STORE_NAMES } from '@/core/storage/database';

export function createIndexedDBProjectRepository() {
  return new IndexedDBRepository<Project>(STORE_NAMES.projects, (project) => project.id);
}
