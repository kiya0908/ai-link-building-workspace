import { observeDomChanges, type DomObserverHandle } from '@/core/dom/base/dom-observer';
import { createConsoleProviderLogger } from '@/core/dom/base/provider-logger';
import type {
  CommentProvider,
  CommentProviderFactory,
  ProviderCreateOptions,
  ProviderDebugLogger
} from '@/core/dom/comment-provider';
import { learnedSelectorProviderFactory } from '@/core/dom/providers/manual-learn-provider';
import type { SiteLearningRecord } from '@/core/types/site-learning';

export interface ProviderDetector {
  detect(document: Document, learnedRecord?: SiteLearningRecord | null): CommentProvider | null;
  debug(document: Document, learnedRecord?: SiteLearningRecord | null): ReturnType<CommentProvider['debug']>[];
}

export interface ProviderDetectorOptions {
  debug?: boolean;
  logger?: ProviderDebugLogger;
}

export interface ProviderDetectionSession {
  detectNow(learnedRecord?: SiteLearningRecord | null): CommentProvider | null;
  getCurrentProvider(): CommentProvider | null;
  debug(): ReturnType<CommentProvider['debug']>[];
  disconnect(): void;
}

export function createProviderDetector(
  factories: CommentProviderFactory[],
  options: ProviderDetectorOptions = {}
): ProviderDetector {
  const orderedFactories = [learnedSelectorProviderFactory, ...factories];
  const loggerOptions = createConsoleProviderLogger(Boolean(options.debug));
  const createOptions: ProviderCreateOptions = {
    logger: options.logger ?? loggerOptions.logger
  };

  return {
    detect(document, learnedRecord) {
      const detectedProviders = orderedFactories
        .map((factory) => factory.create(document, learnedRecord, createOptions))
        .filter((provider) => provider.detect());

      const provider = sortProvidersByConfidence(detectedProviders)[0] ?? null;
      createOptions.logger?.debug('Provider detector selected provider.', {
        providerId: provider?.id ?? null,
        candidates: detectedProviders.map((candidate) => candidate.debug())
      });
      return provider;
    },
    debug(document, learnedRecord) {
      return orderedFactories.map((factory) => factory.create(document, learnedRecord, createOptions).debug());
    }
  };
}

export function createProviderDetectionSession(
  document: Document,
  factories: CommentProviderFactory[],
  learnedRecord?: SiteLearningRecord | null,
  options: ProviderDetectorOptions = {}
): ProviderDetectionSession {
  const detector = createProviderDetector(factories, options);
  let currentProvider = detector.detect(document, learnedRecord);
  let currentLearnedRecord = learnedRecord;

  const observer = createSafeObserver(document, () => {
    currentProvider = detector.detect(document, currentLearnedRecord);
  });

  return {
    detectNow(nextLearnedRecord) {
      currentLearnedRecord = nextLearnedRecord ?? currentLearnedRecord;
      currentProvider = detector.detect(document, currentLearnedRecord);
      return currentProvider;
    },
    getCurrentProvider() {
      return currentProvider;
    },
    debug() {
      return detector.debug(document, currentLearnedRecord);
    },
    disconnect() {
      observer?.disconnect();
    }
  };
}

export function sortProvidersByConfidence(providers: CommentProvider[]): CommentProvider[] {
  return [...providers].sort((left, right) => right.getConfidence() - left.getConfidence());
}

function createSafeObserver(document: Document, onChange: () => void): DomObserverHandle | null {
  const root = document.documentElement;
  if (!root) {
    return null;
  }

  return observeDomChanges(root, onChange);
}
