import type {
  CommentFormFields,
  CommentProvider,
  CommentProviderFactory,
  ProviderDetectionResult
} from '@/core/dom/comment-provider';
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
    private readonly record: SiteLearningRecord
  ) {}

  detect(): boolean {
    return this.getCommentBox() !== null;
  }

  getConfidence(): number {
    return this.detect() ? 100 : 0;
  }

  getCommentBox(): HTMLElement | null {
    return safeQuery<HTMLElement>(this.document, [this.record.selectors.comment]);
  }

  getNameInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, [this.record.selectors.name]);
  }

  getEmailInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, [this.record.selectors.email]);
  }

  getWebsiteInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, [this.record.selectors.website]);
  }

  getSubmitButton(): HTMLElement | null {
    return safeQuery<HTMLElement>(this.document, [this.record.selectors.submit]);
  }

  fillFields(fields: CommentFormFields): void {
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

  debug(): ProviderDetectionResult {
    return {
      providerId: this.id,
      detected: this.detect(),
      confidence: this.getConfidence(),
      reason: `Learned selectors for ${this.record.domain}.`
    };
  }
}

export const learnedSelectorProviderFactory: CommentProviderFactory = {
  create(document, learnedRecord) {
    if (!learnedRecord) {
      return new NullLearnedProvider();
    }

    return new ManualLearnProvider(document, learnedRecord);
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

  debug(): ProviderDetectionResult {
    return {
      providerId: this.id,
      detected: false,
      confidence: 0,
      reason: 'No learned selectors available.'
    };
  }
}
