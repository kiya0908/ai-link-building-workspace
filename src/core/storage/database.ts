export const DATABASE_NAME = 'ai-link-building-workspace';
export const DATABASE_VERSION = 3;

export const STORE_NAMES = {
  projects: 'projects',
  identities: 'identities',
  linkAssets: 'linkAssets',
  targets: 'targets',
  queueState: 'queueState',
  siteLearning: 'siteLearning',
  commentHistory: 'commentHistory',
  automationState: 'automationState'
} as const;

export type StoreName = (typeof STORE_NAMES)[keyof typeof STORE_NAMES];

export function openWorkspaceDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      const transaction = request.transaction;

      const projects = createStore(database, transaction, STORE_NAMES.projects, { keyPath: 'id' });
      createIndex(projects, 'website', 'website');

      createStore(database, transaction, STORE_NAMES.identities, { keyPath: 'id' });

      const linkAssets = createStore(database, transaction, STORE_NAMES.linkAssets, { keyPath: 'id' });
      createIndex(linkAssets, 'projectId', 'projectId');

      const targets = createStore(database, transaction, STORE_NAMES.targets, { keyPath: 'id' });
      createIndex(targets, 'projectId', 'projectId');
      createIndex(targets, 'status', 'status');
      createIndex(targets, 'projectIdStatus', ['projectId', 'status']);

      createStore(database, transaction, STORE_NAMES.queueState, { keyPath: 'id' });
      createStore(database, transaction, STORE_NAMES.automationState, { keyPath: 'id' });
      createStore(database, transaction, STORE_NAMES.siteLearning, { keyPath: 'domain' });

      const commentHistory = createStore(database, transaction, STORE_NAMES.commentHistory, {
        keyPath: 'id'
      });
      createIndex(commentHistory, 'targetId', 'targetId');
      createIndex(commentHistory, 'projectId', 'projectId');
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createStore(
  database: IDBDatabase,
  transaction: IDBTransaction | null,
  storeName: StoreName,
  options: IDBObjectStoreParameters
) {
  if (!database.objectStoreNames.contains(storeName)) {
    return database.createObjectStore(storeName, options);
  }

  if (!transaction) {
    throw new Error(`Cannot migrate existing store without upgrade transaction: ${storeName}`);
  }

  return transaction.objectStore(storeName);
}

function createIndex(
  store: IDBObjectStore,
  indexName: string,
  keyPath: string | string[],
  options?: IDBIndexParameters
) {
  if (!store.indexNames.contains(indexName)) {
    store.createIndex(indexName, keyPath, options);
  }
}
