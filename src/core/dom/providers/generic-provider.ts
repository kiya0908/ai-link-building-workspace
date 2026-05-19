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
  'button[name*="submit" i]',
  '[role="button"][aria-label*="submit" i]'
];

export class GenericProvider implements CommentProvider {
  readonly id = 'generic';

  constructor(private readonly document: Document) {}

  detect(): boolean {
    return this.getCommentBox() !== null;
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
    return safeQuery<HTMLElement>(this.document, COMMENT_SELECTORS);
  }

  getNameInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, NAME_SELECTORS);
  }

  getEmailInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, EMAIL_SELECTORS);
  }

  getWebsiteInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, WEBSITE_SELECTORS);
  }

  getSubmitButton(): HTMLElement | null {
    return safeQuery<HTMLElement>(this.document, SUBMIT_SELECTORS);
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
      reason: 'Generic textarea/input/contenteditable comment form scan.'
    };
  }
}

export const genericProviderFactory: CommentProviderFactory = {
  create(document) {
    return new GenericProvider(document);
  }
};
