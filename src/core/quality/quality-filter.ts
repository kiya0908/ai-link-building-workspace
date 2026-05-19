import type { CommentProvider } from '@/core/dom/comment-provider';
import type { ArticleAnalysis } from '@/core/types/article';

export type QualityIssue =
  | 'comments_closed'
  | 'login_required'
  | 'no_comment_area'
  | 'archive_page'
  | 'low_quality';

export interface QualityFilterResult {
  isSuitable: boolean;
  issues: QualityIssue[];
  score: number;
}

export function evaluatePageQuality(
  document: Document,
  provider: CommentProvider | null,
  article: ArticleAnalysis
): QualityFilterResult {
  const issues: QualityIssue[] = [];

  if (!provider?.getCommentBox()) {
    issues.push('no_comment_area');
  }

  if (containsText(document, ['comments are closed', 'commenting is closed'])) {
    issues.push('comments_closed');
  }

  if (containsText(document, ['log in to comment', 'login to comment', 'must be logged in'])) {
    issues.push('login_required');
  }

  if (isArchivePage(document)) {
    issues.push('archive_page');
  }

  if (article.paragraphs.join(' ').length < 240) {
    issues.push('low_quality');
  }

  return {
    isSuitable: issues.length === 0,
    issues,
    score: Math.max(0, 100 - issues.length * 25)
  };
}

function containsText(document: Document, needles: string[]): boolean {
  const pageText = document.body?.textContent?.toLowerCase() ?? '';
  return needles.some((needle) => pageText.includes(needle));
}

function isArchivePage(document: Document): boolean {
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? '';
  const pathname = canonical || document.location.pathname;
  return /\/(tag|category|archive|author)\//i.test(pathname);
}
