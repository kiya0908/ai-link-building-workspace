import { STORE_NAMES } from '@/core/storage/database';
import { IndexedDBRepository } from '@/core/storage/indexeddb-repository';
import type { AutomationSession, AutomationStateRepository } from '@/core/types/automation';

export class IndexedDBAutomationStateRepository
  extends IndexedDBRepository<AutomationSession>
  implements AutomationStateRepository
{
  constructor() {
    super(STORE_NAMES.automationState, (session) => session.id);
  }

  override get(): Promise<AutomationSession | null> {
    return super.get('default');
  }

  save(session: AutomationSession): Promise<void> {
    return this.put(session);
  }
}

export function createIndexedDBAutomationStateRepository() {
  return new IndexedDBAutomationStateRepository();
}