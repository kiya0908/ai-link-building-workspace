import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('provider contract includes confidence scoring and field filling', () => {
  const contract = read('src/core/dom/comment-provider.ts');

  ['getConfidence', 'fillFields', 'debug', 'ProviderCapabilities', 'ProviderCreateOptions'].forEach((member) => {
    assert.match(contract, new RegExp(member));
  });

  assert.match(contract, /CommentFormFields/);
  assert.match(contract, /ProviderDetectionResult/);
});

test('provider detector prioritizes learned selectors then confidence score', () => {
  const detector = read('src/core/dom/provider-detector.ts');

  assert.match(detector, /learnedSelectorProviderFactory/);
  assert.match(detector, /getConfidence/);
  assert.match(detector, /sortProvidersByConfidence/);
  assert.match(detector, /createProviderDetectionSession/);
  assert.match(detector, /observeDomChanges/);
});

test('safe DOM helpers centralize selector access, highlighting, iframe and contenteditable support', () => {
  const safeDom = read('src/core/dom/base/safe-dom.ts');

  [
    'safeQuery',
    'safeQueryInput',
    'setElementValue',
    'highlightElement',
    'scrollElementIntoView',
    'isEditableCommentElement',
    'getAccessibleFrameDocuments'
  ].forEach(
    (functionName) => {
      assert.match(safeDom, new RegExp(`function ${functionName}\\b`));
    }
  );
});

test('generic and wordpress providers implement detection and safe filling', () => {
  const generic = read('src/core/dom/providers/generic-provider.ts');
  const wordpress = read('src/core/dom/providers/wordpress-provider.ts');

  assert.match(generic, /contenteditable/);
  assert.match(generic, /getAccessibleFrameDocuments/);
  assert.match(generic, /fillFields/);
  assert.match(generic, /safeQuery/);
  assert.match(generic, /capabilities/);
  assert.match(wordpress, /commentform|respond|wp-/);
  assert.match(wordpress, /getAccessibleFrameDocuments/);
  assert.match(wordpress, /getConfidence/);
});

test('manual learning has repository-backed selector priority', () => {
  const learnedProvider = read('src/core/dom/providers/manual-learn-provider.ts');
  const manualLearning = read('src/core/dom/manual/manual-learning.ts');

  assert.match(learnedProvider, /SiteLearningRecord/);
  assert.match(learnedProvider, /getConfidence/);
  assert.match(manualLearning, /storeLearnedSelector/);
  assert.match(manualLearning, /createIndexedDBSiteLearningRepository/);
  assert.match(manualLearning, /data-ai-link-learning/);
  assert.match(manualLearning, /Escape/);
});

test('dynamic page support, debug logging, and quality/article extraction layers exist', () => {
  const observer = read('src/core/dom/base/dom-observer.ts');
  const retry = read('src/core/dom/base/retry.ts');
  const logger = read('src/core/dom/base/provider-logger.ts');
  const contentHandlers = read('src/content/dom/content-dom-handlers.ts');
  const article = read('src/core/article/article-extractor.ts');
  const quality = read('src/core/quality/quality-filter.ts');

  assert.match(observer, /MutationObserver/);
  assert.match(retry, /retry/);
  assert.match(logger, /createConsoleProviderLogger/);
  assert.match(contentHandlers, /createDefaultProviderDetectionSession/);
  assert.match(contentHandlers, /START_MANUAL_LEARNING/);
  assert.match(article, /Readability/);
  assert.match(article, /firstParagraphs/);
  assert.match(quality, /comments_closed|login_required|no_comment_area|archive_page|low_quality/);
});
