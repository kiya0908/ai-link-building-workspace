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
  getAccessibleFrameDocuments,
  highlightElement,
  safeQuery,
  safeQueryInput,
  scrollElementIntoView,
  setElementValue
} from '@/core/dom/base/safe-dom';

export class WordPressProvider implements CommentProvider {
  readonly id = 'wordpress';

  constructor(
    private readonly document: Document,
    private readonly options: ProviderCreateOptions = {}
  ) {}

  detect(): boolean {
    const confidence = this.getConfidence();
    const detected = confidence >= 50;
    this.options.logger?.debug('WordPress provider detection complete.', {
      detected,
      confidence
    });
    return detected;
  }

  getConfidence(): number {
    let score = 0;
    if (this.document.getElementById('commentform')) score += 35;
    if (this.document.getElementById('respond')) score += 20;
    if (this.getCommentBox()) score += 30;
    if (this.getSubmitButton()) score += 15;
    if (this.document.body?.className.includes('wp-')) score += 10;
    return score;
  }

  getCommentBox(): HTMLElement | null {
    return this.queryAcrossAccessibleDocuments<HTMLElement>([
      '#commentform textarea#comment',
      '#respond textarea#comment',
      'textarea[name="comment"]'
    ]);
  }

  getNameInput(): HTMLInputElement | null {
    return this.queryInputAcrossAccessibleDocuments(['#commentform input#author', 'input[name="author"]']);
  }

  getEmailInput(): HTMLInputElement | null {
    return this.queryInputAcrossAccessibleDocuments(['#commentform input#email', 'input[name="email"]']);
  }

  getWebsiteInput(): HTMLInputElement | null {
    return this.queryInputAcrossAccessibleDocuments(['#commentform input#url', 'input[name="url"]']);
  }

  getSubmitButton(): HTMLElement | null {
    return this.queryAcrossAccessibleDocuments<HTMLElement>([
      '#commentform input#submit',
      '#commentform button[type="submit"]',
      '#respond input[type="submit"]'
    ]);
  }

  fillFields(fields: CommentFormFields): void {
    this.options.logger?.debug('WordPress provider filling comment fields.');
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
    return checkGenericSubmissionResult(this, snapshot, { wordpress: true });
  }

  debug(): ProviderDetectionResult {
    return {
      providerId: this.id,
      detected: this.detect(),
      confidence: this.getConfidence(),
      reason: 'WordPress commentform/respond/wp- structure scan.',
      capabilities: {
        iframeReady: true,
        contentEditableReady: false,
        dynamicPageReady: true
      }
    };
  }

  private queryInputAcrossAccessibleDocuments(selectors: string[]): HTMLInputElement | null {
    for (const candidateDocument of this.getCandidateDocuments()) {
      const input = safeQueryInput(candidateDocument, selectors);
      if (input) {
        return input;
      }
    }

    return null;
  }

  private queryAcrossAccessibleDocuments<TElement extends HTMLElement>(selectors: string[]): TElement | null {
    for (const candidateDocument of this.getCandidateDocuments()) {
      const element = safeQuery<TElement>(candidateDocument, selectors);
      if (element) {
        return element;
      }
    }

    return null;
  }

  private getCandidateDocuments(): Document[] {
    return [this.document, ...getAccessibleFrameDocuments(this.document)];
  }
}

export const wordpressProviderFactory: CommentProviderFactory = {
  create(document, _learnedRecord, options) {
    return new WordPressProvider(document, options);
  }
};
