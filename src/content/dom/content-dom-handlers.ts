import { extractArticle } from '@/core/article/article-extractor';
import type { CommentFormFields } from '@/core/dom/comment-provider';
import { retry } from '@/core/dom/base/retry';
import { evaluatePageQuality } from '@/core/quality/quality-filter';
import { createIndexedDBSiteLearningRepository } from '@/core/storage/repositories/site-learning-repository';
import type { RuntimeMessageHandler } from '@/shared/messaging/messages';
import { detectDefaultProvider } from '@/content/dom/provider-registry';

export function createContentDomMessageHandlers(document: Document): RuntimeMessageHandler[] {
  return [
    {
      canHandle(message) {
        return (
          message.type === 'ANALYZE_CURRENT_PAGE' ||
          message.type === 'FILL_COMMENT_FIELDS' ||
          message.type === 'SCROLL_TO_COMMENT'
        );
      },
      async handle(message) {
        const provider = await detectProviderWithLearning(document);

        if (message.type === 'ANALYZE_CURRENT_PAGE') {
          const article = extractArticle(document);
          return {
            article,
            provider: provider?.debug() ?? null,
            quality: evaluatePageQuality(document, provider, article)
          };
        }

        if (message.type === 'FILL_COMMENT_FIELDS') {
          await retry(() => {
            const retryProvider = provider ?? detectDefaultProvider(document);
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

async function detectProviderWithLearning(document: Document) {
  const repository = createIndexedDBSiteLearningRepository();
  const learnedRecord = await repository.get(document.location.hostname);
  return detectDefaultProvider(document, learnedRecord);
}

export type { CommentFormFields };
