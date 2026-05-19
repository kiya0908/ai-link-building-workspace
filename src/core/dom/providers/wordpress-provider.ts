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

export class WordPressProvider implements CommentProvider {
  readonly id = 'wordpress';

  constructor(private readonly document: Document) {}

  detect(): boolean {
    return this.getConfidence() >= 50;
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
    return safeQuery<HTMLElement>(this.document, [
      '#commentform textarea#comment',
      '#respond textarea#comment',
      'textarea[name="comment"]'
    ]);
  }

  getNameInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, ['#commentform input#author', 'input[name="author"]']);
  }

  getEmailInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, ['#commentform input#email', 'input[name="email"]']);
  }

  getWebsiteInput(): HTMLInputElement | null {
    return safeQueryInput(this.document, ['#commentform input#url', 'input[name="url"]']);
  }

  getSubmitButton(): HTMLElement | null {
    return safeQuery<HTMLElement>(this.document, [
      '#commentform input#submit',
      '#commentform button[type="submit"]',
      '#respond input[type="submit"]'
    ]);
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
      reason: 'WordPress commentform/respond/wp- structure scan.'
    };
  }
}

export const wordpressProviderFactory: CommentProviderFactory = {
  create(document) {
    return new WordPressProvider(document);
  }
};
