import { Readability } from '@mozilla/readability';
import type { ArticleAnalysis } from '@/core/types/article';

export interface ExtractedArticle extends ArticleAnalysis {
  firstParagraphs: string[];
}

export function extractArticle(document: Document): ExtractedArticle {
  const clone = document.cloneNode(true) as Document;
  const readable = new Readability(clone).parse();
  const paragraphs = getFirstParagraphs(document);

  return {
    title: readable?.title ?? document.title,
    summary: readable?.excerpt ?? paragraphs.slice(0, 2).join(' '),
    headings: Array.from(document.querySelectorAll('h1, h2'))
      .map((heading) => heading.textContent?.trim() ?? '')
      .filter(Boolean)
      .slice(0, 8),
    paragraphs,
    firstParagraphs: paragraphs,
    language: detectLanguage(document)
  };
}

function getFirstParagraphs(document: Document): string[] {
  return Array.from(document.querySelectorAll('article p, main p, p'))
    .map((paragraph) => paragraph.textContent?.trim() ?? '')
    .filter((text) => text.length > 40)
    .slice(0, 5);
}

function detectLanguage(document: Document): string {
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    return htmlLang;
  }

  const metaLanguage = document.querySelector('meta[http-equiv="content-language"], meta[name="language"]');
  return metaLanguage?.getAttribute('content') ?? '';
}
