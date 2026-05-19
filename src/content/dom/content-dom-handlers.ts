import { extractArticle } from '@/core/article/article-extractor';
import type { CommentFormFields } from '@/core/dom/comment-provider';
import { retry } from '@/core/dom/base/retry';
import {
  startManualLearning,
  storeLearnedSelector,
  type ManualLearningSession
} from '@/core/dom/manual/manual-learning';
import type { ProviderDetectionSession } from '@/core/dom/provider-detector';
import { evaluatePageQuality } from '@/core/quality/quality-filter';
import { createIndexedDBSiteLearningRepository } from '@/core/storage/repositories/site-learning-repository';
import type { RuntimeMessageHandler } from '@/shared/messaging/messages';
import {
  createDefaultProviderDetectionSession,
  detectDefaultProvider
} from '@/content/dom/provider-registry';

export function createContentDomMessageHandlers(document: Document): RuntimeMessageHandler[] {
  let manualLearningSession: ManualLearningSession | null = null;

  return [
    {
      canHandle(message) {
        return (
          message.type === 'ANALYZE_CURRENT_PAGE' ||
          message.type === 'FILL_COMMENT_FIELDS' ||
          message.type === 'SCROLL_TO_COMMENT' ||
          message.type === 'START_MANUAL_LEARNING'
        );
      },
      async handle(message) {
        if (message.type === 'START_MANUAL_LEARNING') {
          manualLearningSession?.stop();
          manualLearningSession = startManualLearning(document, message.payload.field, (selector) => {
            void storeLearnedSelector(document.location.hostname, message.payload.field, selector);
            manualLearningSession = null;
          }, {
            onCancelled() {
              manualLearningSession = null;
            }
          });
          return { ok: true };
        }

        const providerSession = await detectProviderSessionWithLearning(document);
        const provider = providerSession.getCurrentProvider() ?? providerSession.detectNow();

        if (message.type === 'ANALYZE_CURRENT_PAGE') {
          const article = extractArticle(document);
          return {
            article,
            provider: provider?.debug() ?? null,
            providers: providerSession.debug(),
            quality: evaluatePageQuality(document, provider, article)
          };
        }

        if (message.type === 'FILL_COMMENT_FIELDS') {
          await retry(() => {
            const retryProvider = providerSession.detectNow() ?? detectDefaultProvider(document);
            if (!retryProvider) {
              throw new Error('No comment provider detected.');
            }
            retryProvider.fillFields(message.payload.fields);
          }, { attempts: 3, delayMs: 250 });
          return { ok: true };
        }

        provider?.scrollToComment();
        return { ok: Boolean(provider) };
      }
    }
  ];
}

let providerSessionPromise: Promise<ProviderDetectionSession> | null = null;

async function detectProviderSessionWithLearning(document: Document) {
  providerSessionPromise ??= createProviderSession(document);
  return providerSessionPromise;
}

async function createProviderSession(document: Document) {
  const repository = createIndexedDBSiteLearningRepository();
  const learnedRecord = await repository.get(document.location.hostname);
  return createDefaultProviderDetectionSession(document, learnedRecord);
}

export type { CommentFormFields };
