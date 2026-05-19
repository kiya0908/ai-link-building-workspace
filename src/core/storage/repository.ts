export interface Repository<TEntity, TKey extends IDBValidKey = string> {
  get(key: TKey): Promise<TEntity | null>;
  put(entity: TEntity): Promise<void>;
  delete(key: TKey): Promise<void>;
  list(): Promise<TEntity[]>;
}
