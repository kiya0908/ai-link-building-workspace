import type { CommentProvider, CommentProviderFactory } from '@/core/dom/comment-provider';
import { learnedSelectorProviderFactory } from '@/core/dom/providers/manual-learn-provider';
import type { SiteLearningRecord } from '@/core/types/site-learning';

export interface ProviderDetector {
  detect(document: Document, learnedRecord?: SiteLearningRecord | null): CommentProvider | null;
  debug(document: Document, learnedRecord?: SiteLearningRecord | null): ReturnType<CommentProvider['debug']>[];
}

export function createProviderDetector(factories: CommentProviderFactory[]): ProviderDetector {
  const orderedFactories = [learnedSelectorProviderFactory, ...factories];

  return {
    detect(document, learnedRecord) {
      const detectedProviders = orderedFactories
        .map((factory) => factory.create(document, learnedRecord))
        .filter((provider) => provider.detect());

      return sortProvidersByConfidence(detectedProviders)[0] ?? null;
    },
    debug(document, learnedRecord) {
      return orderedFactories.map((factory) => factory.create(document, learnedRecord).debug());
    }
  };
}

export function sortProvidersByConfidence(providers: CommentProvider[]): CommentProvider[] {
  return [...providers].sort((left, right) => right.getConfidence() - left.getConfidence());
}
