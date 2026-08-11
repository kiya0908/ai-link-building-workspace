import type { CommentMode } from '@/core/types/project';

export type CommentValidationIssue =
  | 'empty'
  | 'too_short'
  | 'too_long'
  | 'too_many_links'
  | 'spam_phrase'
  | 'html_not_allowed'
  | 'missing_html_link'
  | 'invalid_html_link'
  | 'wrong_link_target'
  | 'empty_anchor_text';

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

export function validateGeneratedComment(
  comment: string,
  mode: CommentMode,
  language = '',
  expectedWebsite = ''
): CommentValidationResult {
  const issues: CommentValidationIssue[] = [];
  const visibleText = getVisibleText(comment);

  if (!comment.trim()) {
    issues.push('empty');
  }

  addLengthIssues(issues, visibleText, language);

  const linkCount = countLinks(comment);
  if (linkCount > 1) {
    issues.push('too_many_links');
  }

  if (mode !== 'html_link' && /<\/?a[\s>]/i.test(comment)) {
    issues.push('html_not_allowed');
  }

  if (mode === 'html_link') {
    validateRequiredAnchor(comment, expectedWebsite, issues);
  }

  const lower = comment.toLowerCase();
  if (SPAM_PHRASES.some((phrase) => lower.includes(phrase))) {
    issues.push('spam_phrase');
  }

  return {
    // Length is primarily controlled by the prompt. Keep deviations visible for
    // review/history, but do not turn an otherwise safe generated comment into
    // an automatic AI failure.
    valid: issues.every((issue) => issue === 'too_short' || issue === 'too_long'),
    issues
  };
}

function countLinks(comment: string): number {
  const anchors = comment.match(/<a\s/gi) ?? [];
  const withoutAnchors = comment.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, '');
  const bareUrls = withoutAnchors.match(/https?:\/\/[^\s<]+/gi) ?? [];
  return anchors.length + bareUrls.length;
}

function addLengthIssues(
  issues: CommentValidationIssue[],
  visibleText: string,
  language: string
): void {
  if (isCjkContent(language, visibleText)) {
    const characters = visibleText.replace(/\s/g, '').length;
    if (characters < 25) issues.push('too_short');
    if (characters > 160) issues.push('too_long');
    return;
  }

  const words = visibleText.split(/\s+/).filter(Boolean);
  if (words.length < 15) issues.push('too_short');
  if (words.length > 85) issues.push('too_long');
}

function getVisibleText(comment: string): string {
  return comment
    .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCjkContent(language: string, text: string): boolean {
  return /^(zh|ja|ko)(?:-|$)/i.test(language.trim()) || /[\u3040-\u30ff\u3400-\u9fff\uac00-\ud7af]/.test(text);
}

function validateRequiredAnchor(
  comment: string,
  expectedWebsite: string,
  issues: CommentValidationIssue[]
): void {
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  const anchors = Array.from(comment.matchAll(anchorPattern));
  if (anchors.length === 0) {
    issues.push('missing_html_link');
    return;
  }

  const [attributes, anchorText] = [anchors[0]?.[1] ?? '', anchors[0]?.[2] ?? ''];
  const hrefMatch = attributes.match(/\bhref\s*=\s*(["'])(.*?)\1/i);
  if (!hrefMatch?.[2]) {
    issues.push('invalid_html_link');
  } else if (expectedWebsite && hrefMatch[2].trim() !== expectedWebsite.trim()) {
    issues.push('wrong_link_target');
  }

  if (!getVisibleText(anchorText)) {
    issues.push('empty_anchor_text');
  }
}
