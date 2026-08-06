import type {
  CommentProvider,
  SubmissionCheckResult,
  SubmissionPreflightResult,
  SubmissionSnapshot
} from '@/core/dom/comment-provider';
import { getAssociatedForm } from '@/core/dom/base/safe-dom';

const FAILURE_PATTERNS = [
  'duplicate comment', 'already said that', 'invalid email', 'error:', 'captcha',
  'spam detected', 'must be logged in', 'comments are closed', 'commenting is closed'
];
const SUCCESS_PATTERNS = [
  'comment has been submitted', 'comment was submitted', 'comment submitted',
  'thank you for your comment', 'thanks for your comment', 'awaiting moderation',
  'held for moderation', 'pending moderation', 'your comment is awaiting moderation'
];

export function checkSubmissionReadiness(provider: CommentProvider): SubmissionPreflightResult {
  const button = provider.getSubmitButton();
  const commentBox = provider.getCommentBox();
  if (!commentBox) return { canSubmit: false, reason: 'Comment field is no longer available.' };
  if (!button) return { canSubmit: false, reason: 'Submit button was not detected.' };
  if (isDisabled(button)) return { canSubmit: false, reason: 'Submit button is disabled.' };

  const commentForm = getAssociatedForm(commentBox);
  const buttonForm = getAssociatedForm(button);
  if (commentForm && commentForm !== buttonForm) {
    return { canSubmit: false, reason: 'Detected submit button does not belong to the comment form.' };
  }
  const form = buttonForm ?? commentForm;
  if (form instanceof HTMLFormElement && !form.checkValidity()) {
    return { canSubmit: false, reason: 'The comment form did not pass browser validation.' };
  }
  const text = (button.ownerDocument.body?.textContent ?? '').toLowerCase();
  if (/captcha|recaptcha|hcaptcha|turnstile/.test(text)) {
    return { canSubmit: false, reason: 'CAPTCHA requires manual completion.' };
  }
  return { canSubmit: true, reason: 'Comment form is ready to submit.' };
}

export function createSubmissionSnapshot(provider: CommentProvider, comment: string): SubmissionSnapshot {
  return {
    url: provider.getCommentBox()?.ownerDocument.location.href ?? window.location.href,
    comment,
    commentWasPresent: normalizedPageText(provider).includes(normalize(comment))
  };
}

export function submitProviderForm(provider: CommentProvider): void {
  const button = provider.getSubmitButton();
  if (!button) throw new Error('Submit button was not detected.');
  const commentForm = getAssociatedForm(provider.getCommentBox());
  const buttonForm = getAssociatedForm(button);
  if (commentForm && commentForm !== buttonForm) {
    throw new Error('Detected submit button does not belong to the comment form.');
  }
  button.click();
}

export function checkGenericSubmissionResult(
  provider: CommentProvider,
  snapshot: SubmissionSnapshot,
  options: { wordpress?: boolean } = {}
): SubmissionCheckResult {
  const text = normalizedPageText(provider);
  const failure = FAILURE_PATTERNS.find((pattern) => text.includes(pattern));
  if (failure) return result('failure', false, `Submission error detected: ${failure}`, [failure]);

  const success = SUCCESS_PATTERNS.find((pattern) => text.includes(pattern));
  if (success) {
    return result('success', /moderation|pending|held/.test(success), `Site confirmation detected: ${success}`, [success]);
  }

  const signals: string[] = [];
  const comment = normalize(snapshot.comment);
  const commentBox = provider.getCommentBox();
  const currentValue = getElementValue(commentBox);
  if (comment.length >= 16 && text.includes(comment) && !snapshot.commentWasPresent) signals.push('comment-visible');
  if (currentValue === '') signals.push('comment-field-cleared');
  if (window.location.href !== snapshot.url) signals.push('url-changed');
  if (!commentBox) signals.push('form-removed');
  if (options.wordpress && /#comment-\d+|comment-page-\d+/i.test(window.location.href)) signals.push('wordpress-comment-url');

  const strong = signals.includes('comment-visible') || signals.includes('wordpress-comment-url');
  if (strong || signals.length >= 2) {
    return result('success', false, 'Multiple consistent submission signals were detected.', signals);
  }
  return result('unknown', false, 'No reliable success or failure confirmation was detected.', signals);
}

export function checkSubmissionDocument(document: Document, comment: string): SubmissionCheckResult {
  const text = normalize(document.body?.textContent ?? '');
  const failure = FAILURE_PATTERNS.find((pattern) => text.includes(pattern));
  if (failure) return result('failure', false, `Submission error detected: ${failure}`, [failure]);
  const success = SUCCESS_PATTERNS.find((pattern) => text.includes(pattern));
  if (success) return result('success', /moderation|pending|held/.test(success), `Site confirmation detected: ${success}`, [success]);
  const normalizedComment = normalize(comment);
  if (normalizedComment.length >= 16 && text.includes(normalizedComment)) {
    return result('success', false, 'The submitted comment is visible on the page.', ['comment-visible']);
  }
  if (/#comment-\d+|comment-page-\d+/i.test(document.location.href)) {
    return result('success', false, 'A comment-specific result URL was detected.', ['wordpress-comment-url']);
  }
  return result('unknown', false, 'No reliable submission evidence was found on the result page.', []);
}

function normalizedPageText(provider: CommentProvider): string {
  return normalize(provider.getCommentBox()?.ownerDocument.body?.textContent ?? document.body?.textContent ?? '');
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function getElementValue(element: HTMLElement | null): string {
  if (element instanceof HTMLTextAreaElement || element instanceof HTMLInputElement) return element.value.trim();
  return element?.textContent?.trim() ?? '';
}

function isDisabled(element: HTMLElement): boolean {
  return (element instanceof HTMLButtonElement || element instanceof HTMLInputElement) && element.disabled;
}

function result(
  outcome: SubmissionCheckResult['outcome'], moderationPending: boolean, reason: string, signals: string[]
): SubmissionCheckResult {
  return { outcome, moderationPending, reason, signals };
}