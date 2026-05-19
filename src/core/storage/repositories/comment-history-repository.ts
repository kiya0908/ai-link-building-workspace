import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository, runRequest } from '@/core/storage/indexeddb-repository';
import type { CommentHistoryEntry } from '@/core/types/comment-history';

export class IndexedDBCommentHistoryRepository extends IndexedDBRepository<CommentHistoryEntry> {
  constructor() {
    super(STORE_NAMES.commentHistory, (entry) => entry.id);
  }

  listByTarget(targetId: string): Promise<CommentHistoryEntry[]> {
    return runRequest(STORE_NAMES.commentHistory, 'readonly', (store) =>
      store.index('targetId').getAll(targetId)
    );
  }
}

export function createIndexedDBCommentHistoryRepository() {
  return new IndexedDBCommentHistoryRepository();
}
