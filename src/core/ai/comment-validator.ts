import type { CommentMode } from '@/core/types/project';

export type CommentValidationIssue =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'too_many_links'
  | 'spam_phrase'
  | 'html_not_allowed';

export interface CommentValidationResult {
  valid: boolean;
  issues: CommentValidationIssue[];
}

const SPAM_PHRASES = [
  'buy now',
  'limited time',
  'click here',
  'best price',
  'guaranteed results'
];

export function validateGeneratedComment(comment: string, mode: CommentMode): CommentValidationResult {
  const issues: CommentValidationIssue[] = [];
  const words = comment.split(/\s+/).filter(Boolean);

  if (!comment.trim()) {
    issues.push('empty');
  }

  if (words.length < 12) {
    issues.push('too_short');
  }

  if (words.length > 90) {
    issues.push('too_long');
  }

  const linkCount = countLinks(comment);
  if (linkCount > 1) {
    issues.push('too_many_links');
  }

  if (mode !== 'html_link' && /<\/?a[\s>]/i.test(comment)) {
    issues.push('html_not_allowed');
  }

  const lower = comment.toLowerCase();
  if (SPAM_PHRASES.some((phrase) => lower.includes(phrase))) {
    issues.push('spam_phrase');
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

function countLinks(comment: string): number {
  const urls = comment.match(/https?:\/\/\S+/gi) ?? [];
  const anchors = comment.match(/<a\s/gi) ?? [];
  return urls.length + anchors.length;
}
