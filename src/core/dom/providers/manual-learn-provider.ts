import type {
  CommentFormFields,
  CommentProvider,
  CommentProviderFactory,
  ProviderCreateOptions,
  ProviderDetectionResult,
  SubmissionCheckResult,
  SubmissionPreflightResult,
  SubmissionSnapshot
} from '@/core/dom/comment-provider';
import { checkGenericSubmissionResult, checkSubmissionReadiness, createSubmissionSnapshot, submitProviderForm } from '@/core/dom/submission-evidence';
import {
  highlightElement,
  safeQuery,
  safeQueryInput,
  scrollElementIntoView,
  setElementValue
} from '@/core/dom/base/safe-dom';
import type { SiteLearningRecord } from '@/core/types/site-learning';

export class ManualLearnProvider implements CommentProvider {
  readonly id = 'manual-learned';

  constructor(
    private readonly document: Document,
    private readonly record: SiteLearningRecord,
    private readonly options: ProviderCreateOptions = {}
  ) {}

  detect(): boolean {
    const detected = this.getCommentBox() !== null;
    this.options.logger?.debug('Manual learned provider detection complete.', {
      domain: this.record.domain,
      detected
    });
    return detected;
  }

  getConfidence(): number {
    return this.detect() ? 100 : 0;
  }

  getCommentBox(): HTMLElement | null {
    return this.queryLearned<HTMLElement>(this.record.selectors.comment);
  }

  getNameInput(): HTMLInputElement | null {
    return this.queryLearnedInput(this.record.selectors.name);
  }

  getEmailInput(): HTMLInputElement | null {
    return this.queryLearnedInput(this.record.selectors.email);
  }

  getWebsiteInput(): HTMLInputElement | null {
    return this.queryLearnedInput(this.record.selectors.website);
  }

  getSubmitButton(): HTMLElement | null {
    return this.queryLearned<HTMLElement>(this.record.selectors.submit);
  }

  fillFields(fields: CommentFormFields): void {
    this.options.logger?.debug('Manual learned provider filling comment fields.');
    this.fillComment(fields.comment);
    setElementValue(this.getNameInput(), fields.name ?? '');
    setElementValue(this.getEmailInput(), fields.email ?? '');
    setElementValue(this.getWebsiteInput(), fields.website ?? '');
  }

  fillComment(text: string): void {
    setElementValue(this.getCommentBox(), text);
  }

  scrollToComment(): void {
    const commentBox = this.getCommentBox();
    scrollElementIntoView(commentBox);
    highlightElement(commentBox);
    highlightElement(this.getSubmitButton());
  }

  checkSubmissionReadiness(): SubmissionPreflightResult { return checkSubmissionReadiness(this); }
  createSubmissionSnapshot(comment: string): SubmissionSnapshot { return createSubmissionSnapshot(this, comment); }
  submit(): void { submitProviderForm(this); }
  checkSubmissionResult(snapshot: SubmissionSnapshot): SubmissionCheckResult {
    return checkGenericSubmissionResult(this, snapshot);
  }

  debug(): ProviderDetectionResult {
    return {
      providerId: this.id,
      detected: this.detect(),
      confidence: this.getConfidence(),
      reason: `Learned selectors for ${this.record.domain}.`,
      capabilities: {
        iframeReady: false,
        contentEditableReady: true,
        dynamicPageReady: true
      }
    };
  }

  private queryLearned<TElement extends HTMLElement>(selector: string): TElement | null {
    if (!selector) {
      return null;
    }

    return safeQuery<TElement>(this.document, [selector]);
  }

  private queryLearnedInput(selector: string): HTMLInputElement | null {
    if (!selector) {
      return null;
    }

    return safeQueryInput(this.document, [selector]);
  }
}

export const learnedSelectorProviderFactory: CommentProviderFactory = {
  create(document, learnedRecord, options) {
    if (!learnedRecord) {
      return new NullLearnedProvider();
    }

    return new ManualLearnProvider(document, learnedRecord, options);
  }
};

class NullLearnedProvider implements CommentProvider {
  readonly id = 'manual-learned';

  detect(): boolean {
    return false;
  }

  getConfidence(): number {
    return 0;
  }

  getCommentBox(): HTMLElement | null {
    return null;
  }

  getNameInput(): HTMLInputElement | null {
    return null;
  }

  getEmailInput(): HTMLInputElement | null {
    return null;
  }

  getWebsiteInput(): HTMLInputElement | null {
    return null;
  }

  getSubmitButton(): HTMLElement | null {
    return null;
  }

  fillFields(): void {}

  fillComment(): void {}

  scrollToComment(): void {}

  checkSubmissionReadiness(): SubmissionPreflightResult { return { canSubmit: false, reason: 'No learned provider.' }; }
  createSubmissionSnapshot(comment: string): SubmissionSnapshot {
    return { url: this.id, comment, commentWasPresent: false };
  }
  submit(): void { throw new Error('No learned provider.'); }
  checkSubmissionResult(): SubmissionCheckResult {
    return { outcome: 'unknown', moderationPending: false, reason: 'No learned provider.', signals: [] };
  }

  debug(): ProviderDetectionResult {
    return {
      providerId: this.id,
      detected: false,
      confidence: 0,
      reason: 'No learned selectors available.',
      capabilities: {
        iframeReady: false,
        contentEditableReady: false,
        dynamicPageReady: true
      }
    };
  }
}
