import { openWorkspaceDatabase, type StoreName } from '@/core/storage/database';
import type { Repository } from '@/core/storage/repository';
import { StorageError } from '@/core/storage/storage-error';

export class IndexedDBRepository<TEntity extends object, TKey extends IDBValidKey = string>
  implements Repository<TEntity, TKey>
{
  constructor(
    protected readonly storeName: StoreName,
    private readonly getKey: (entity: TEntity) => TKey
  ) {}

  async get(key: TKey): Promise<TEntity | null> {
    return runRequest(this.storeName, 'readonly', (store) => store.get(key));
  }

  async put(entity: TEntity): Promise<void> {
    await runRequest(this.storeName, 'readwrite', (store) => store.put(entity));
  }

  async delete(key: TKey): Promise<void> {
    await runRequest(this.storeName, 'readwrite', (store) => store.delete(key));
  }

  async list(): Promise<TEntity[]> {
    return runRequest(this.storeName, 'readonly', (store) => store.getAll());
  }

  protected keyOf(entity: TEntity): TKey {
    return this.getKey(entity);
  }
}

export async function runRequest<TResult>(
  storeName: StoreName,
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<TResult>
): Promise<TResult> {
  try {
    const database = await openWorkspaceDatabase();
    return await new Promise<TResult>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = operation(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    throw new StorageError(`IndexedDB operation failed for ${storeName}.`, error);
  }
}
