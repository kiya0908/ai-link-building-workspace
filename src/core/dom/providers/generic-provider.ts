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
  findCommentFormSubmit,
  getAccessibleFrameDocuments,
  highlightElement,
  isEditableCommentElement,
  safeQuery,
  safeQueryInput,
  scrollElementIntoView,
  setElementValue
} from '@/core/dom/base/safe-dom';

const COMMENT_SELECTORS = [
  'textarea[name*="comment" i]',
  'textarea[id*="comment" i]',
  '[contenteditable="true"][aria-label*="comment" i]',
  '[contenteditable="true"][data-placeholder*="comment" i]',
  '[contenteditable="true"]'
];

const NAME_SELECTORS = ['input[name*="author" i]', 'input[name*="name" i]', 'input[id*="name" i]'];
const EMAIL_SELECTORS = ['input[type="email"]', 'input[name*="email" i]', 'input[id*="email" i]'];
const WEBSITE_SELECTORS = ['input[name*="url" i]', 'input[name*="website" i]', 'input[id*="url" i]'];
const SUBMIT_SELECTORS = [
  'button[type="submit"]',
  'input[type="submit"]',
  'input[name="submit" i]',
  '#submit',
  'button[name*="submit" i]',
  '[role="button"][aria-label*="submit" i]'
];

export class GenericProvider implements CommentProvider {
  readonly id = 'generic';

  constructor(
    private readonly document: Document,
    private readonly options: ProviderCreateOptions = {}
  ) {}

  detect(): boolean {
    const detected = this.getCommentBox() !== null;
    this.options.logger?.debug('Generic provider detection complete.', {
      detected,
      confidence: this.getConfidence()
    });
    return detected;
  }

  getConfidence(): number {
    let score = 0;
    if (this.getCommentBox()) score += 45;
    if (this.getSubmitButton()) score += 15;
    if (this.getEmailInput()) score += 10;
    if (this.getNameInput()) score += 10;
    return score;
  }

  getCommentBox(): HTMLElement | null {
    return this.queryAcrossAccessibleDocuments<HTMLElement>(COMMENT_SELECTORS, isEditableCommentElement);
  }

  getNameInput(): HTMLInputElement | null {
    return this.queryInputAcrossAccessibleDocuments(NAME_SELECTORS);
  }

  getEmailInput(): HTMLInputElement | null {
    return this.queryInputAcrossAccessibleDocuments(EMAIL_SELECTORS);
  }

  getWebsiteInput(): HTMLInputElement | null {
    return this.queryInputAcrossAccessibleDocuments(WEBSITE_SELECTORS);
  }

  getSubmitButton(): HTMLElement | null {
    const commentFormSubmit = findCommentFormSubmit(this.getCommentBox(), SUBMIT_SELECTORS);
    if (commentFormSubmit) {
      return commentFormSubmit;
    }

    return this.queryAcrossAccessibleDocuments<HTMLElement>(SUBMIT_SELECTORS);
  }

  fillFields(fields: CommentFormFields): void {
    this.options.logger?.debug('Generic provider filling comment fields.');
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
      reason: 'Generic textarea/input/contenteditable comment form scan.',
      capabilities: {
        iframeReady: true,
        contentEditableReady: true,
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

  private queryAcrossAccessibleDocuments<TElement extends HTMLElement>(
    selectors: string[],
    validate: (element: Element | null) => element is TElement = (
      element
    ): element is TElement => element instanceof HTMLElement
  ): TElement | null {
    for (const candidateDocument of this.getCandidateDocuments()) {
      const element = safeQuery<TElement>(candidateDocument, selectors);
      if (validate(element)) {
        return element;
      }
    }

    return null;
  }

  private getCandidateDocuments(): Document[] {
    return [this.document, ...getAccessibleFrameDocuments(this.document)];
  }
}

export const genericProviderFactory: CommentProviderFactory = {
  create(document, _learnedRecord, options) {
    return new GenericProvider(document, options);
  }
};
