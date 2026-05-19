import { buildStableSelector } from '@/core/dom/base/selector-builder';
import { createIndexedDBSiteLearningRepository } from '@/core/storage/repositories/site-learning-repository';
import type { LearnedSelectors, SiteLearningRecord } from '@/core/types/site-learning';

export type LearnableField = keyof LearnedSelectors;

export interface ManualLearningSession {
  stop(): void;
}

export function startManualLearning(
  document: Document,
  field: LearnableField,
  onSelected: (selector: string) => void
): ManualLearningSession {
  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const target = event.target;
    if (target instanceof Element) {
      onSelected(buildStableSelector(target));
      stop();
    }
  };

  const stop = () => {
    document.removeEventListener('click', handleClick, true);
  };

  document.addEventListener('click', handleClick, true);

  return { stop };
}

export async function storeLearnedSelector(
  domain: string,
  field: LearnableField,
  selector: string
): Promise<SiteLearningRecord> {
  const repository = createIndexedDBSiteLearningRepository();
  const existing = await repository.get(domain);
  const selectors = createSelectors(existing?.selectors);

  const record: SiteLearningRecord = {
    domain,
    selectors: {
      ...selectors,
      [field]: selector
    },
    updatedAt: Date.now()
  };

  await repository.put(record);
  return record;
}

function createSelectors(existing?: Partial<LearnedSelectors>): LearnedSelectors {
  return {
    comment: existing?.comment ?? '',
    name: existing?.name ?? '',
    email: existing?.email ?? '',
    website: existing?.website ?? '',
    submit: existing?.submit ?? ''
  };
}
