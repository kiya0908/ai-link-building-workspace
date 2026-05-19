import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('database schema includes all phase 3 stores and target indexes', () => {
  const database = read('src/core/storage/database.ts');

  [
    'projects',
    'identities',
    'targets',
    'queueState',
    'siteLearning',
    'commentHistory'
  ].forEach((storeName) => {
    assert.match(database, new RegExp(`${storeName}: '${storeName}'`));
  });

  assert.match(database, /createIndex\([^,]+, 'projectId'/);
  assert.match(database, /createIndex\([^,]+, 'status'/);
});

test('queue manager exposes persistence-safe workflow operations', () => {
  const manager = read('src/core/queue/queue-manager.ts');

  [
    'openNextTarget',
    'openTarget',
    'saveTarget',
    'updateStatus',
    'skipTarget',
    'retryTarget',
    'getStatistics',
    'filterTargets',
    'restoreState'
  ].forEach((methodName) => {
    assert.match(manager, new RegExp(`${methodName}\\(`));
  });

  assert.match(manager, /state\.activeProjectId === projectId/);
  assert.doesNotMatch(manager, /let\\s+current|serviceWorker|globalThis\\./);
});

test('storage adapters exist for required persistent models', () => {
  [
    'src/core/storage/repositories/project-repository.ts',
    'src/core/storage/repositories/identity-repository.ts',
    'src/core/storage/repositories/target-repository.ts',
    'src/core/storage/repositories/queue-state-repository.ts',
    'src/core/storage/repositories/site-learning-repository.ts',
    'src/core/storage/repositories/comment-history-repository.ts'
  ].forEach((path) => {
    assert.match(read(path), /IndexedDB/);
  });
});

test('queue import export supports JSON and CSV without AI or DOM logic', () => {
  const importExport = read('src/core/queue/queue-import-export.ts');

  ['exportTargetsAsJson', 'exportTargetsAsCsv', 'parseTargetsFromJson', 'parseTargetsFromCsv'].forEach(
    (functionName) => {
      assert.match(importExport, new RegExp(`function ${functionName}\\b|const ${functionName}\\b`));
    }
  );

  assert.doesNotMatch(importExport, /openrouter|querySelector|fillComment/i);
});

test('zustand queue store hydrates from queue manager instead of in-memory background state', () => {
  const queueStore = read('src/ui/sidebar/store/queue-store.ts');
  const backgroundHandlers = read('src/shared/messaging/background-handlers.ts');

  assert.match(queueStore, /hydrateQueue/);
  assert.match(queueStore, /createRuntimeMessageClient/);
  assert.match(queueStore, /QUEUE_HYDRATE/);
  assert.match(backgroundHandlers, /createIndexedDBQueueManager/);
  assert.match(backgroundHandlers, /QUEUE_IMPORT_TARGETS/);
  assert.doesNotMatch(queueStore, /chrome\\.storage|localStorage/);
});
