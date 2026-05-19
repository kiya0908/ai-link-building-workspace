import {
  createProviderDetectionSession,
  createProviderDetector
} from '@/core/dom/provider-detector';
import { genericProviderFactory } from '@/core/dom/providers/generic-provider';
import { wordpressProviderFactory } from '@/core/dom/providers/wordpress-provider';
import type { SiteLearningRecord } from '@/core/types/site-learning';

export function createDefaultProviderDetector() {
  return createProviderDetector([wordpressProviderFactory, genericProviderFactory]);
}

export function detectDefaultProvider(document: Document, learnedRecord?: SiteLearningRecord | null) {
  return createDefaultProviderDetector().detect(document, learnedRecord);
}

export function createDefaultProviderDetectionSession(
  document: Document,
  learnedRecord?: SiteLearningRecord | null
) {
  return createProviderDetectionSession(document, [wordpressProviderFactory, genericProviderFactory], learnedRecord, {
    debug: document.documentElement.dataset.aiLinkProviderDebug === 'true'
  });
}
