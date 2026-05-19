Phase 3 — Implement IndexedDB Persistence and Queue System

Continue the existing project.

Now implement:

1. IndexedDB storage layer
2. Queue persistence
3. Project persistence
4. Target persistence
5. Status tracking system

IMPORTANT:
Manifest V3 service workers are non-persistent.
DO NOT rely on in-memory state.

Requirements:

1. Use IndexedDB as primary storage.

2. Create storage adapters for:

* projects
* identities
* targets
* queue
* learned selectors
* comment history

3. Suggested architecture:

/storage
indexeddb.ts
repositories/
adapters/

4. Create QueueManager.

Responsibilities:

* open next target
* update status
* skip target
* retry target
* persist queue state

5. Queue statuses:

pending
opened
analyzed
generated
filled
submitted
need_login
comment_closed
failed
skipped

6. Add Zustand integration.

7. Restore queue state after extension reload.

8. Add import/export support:

* JSON
* CSV

9. Add queue filtering support.

10. Add current project switching.

11. Add target statistics:

* total
* completed
* failed
* skipped

12. Add storage error handling.

13. Add migration-safe schema design.

14. Add TypeScript repository interfaces.

IMPORTANT:
Queue state MUST survive:

* browser refresh
* extension reload
* service worker sleep

DO NOT implement AI yet.
DO NOT implement provider DOM filling yet.

Goal:
Stable MV3-safe local persistence system.
