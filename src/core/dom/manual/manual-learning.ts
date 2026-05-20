import { buildStableSelector } from '@/core/dom/base/selector-builder';
import { createIndexedDBSiteLearningRepository } from '@/core/storage/repositories/site-learning-repository';
import type { LearnedSelectors, SiteLearningRecord } from '@/core/types/site-learning';

export type LearnableField = keyof LearnedSelectors;

export interface ManualLearningSession {
  stop(): void;
}

export interface ManualLearningOptions {
  onCancelled?(): void;
}

export function startManualLearning(
  document: Document,
  field: LearnableField,
  onSelected: (selector: string) => void,
  options: ManualLearningOptions = {}
): ManualLearningSession {
  const SIDEBAR_ROOT_ID = 'ai-link-building-workspace-sidebar-root';

  const handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    if (target.closest(`#${SIDEBAR_ROOT_ID}`) || target.id === SIDEBAR_ROOT_ID) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    if (isLearnableElement(target, field)) {
      onSelected(buildStableSelector(target));
      stop();
    } else {
      stop();
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') {
      return;
    }

    event.preventDefault();
    options.onCancelled?.();
    stop();
  };

  const stop = () => {
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);
    document.documentElement.removeAttribute('data-ai-link-learning');
  };

  document.documentElement.setAttribute('data-ai-link-learning', field);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('keydown', handleKeyDown, true);

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

function isLearnableElement(element: Element, field: LearnableField): boolean {
  if (field === 'comment') {
    return (
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLElement && element.isContentEditable
    );
  }

  if (field === 'submit') {
    return element instanceof HTMLButtonElement || element instanceof HTMLInputElement;
  }

  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement;
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
