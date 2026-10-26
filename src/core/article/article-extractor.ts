import type { ArticleAnalysis } from '@/core/types/article';

export interface ExtractedArticle extends ArticleAnalysis {
  firstParagraphs: string[];
}

export function extractArticle(document: Document): ExtractedArticle {
  const title = (document.title.trim() || document.querySelector('meta[property="og:title"]')?.getAttribute('content') || document.querySelector('h1')?.textContent || '').trim().slice(0, 200);
  const description = (document.querySelector('meta[name="description"]')?.getAttribute('content') || document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '').trim().slice(0, 400);
  // Preserve the existing article shape, but do not collect article body for AI prompts.
  const paragraphs: string[] = [];

  return {
    title,
    summary: description,
    headings: [],
    paragraphs,
    firstParagraphs: paragraphs,
    language: detectLanguage(document)
  };
}

function detectLanguage(document: Document): string {
  const htmlLang = document.documentElement.lang;
  if (htmlLang) {
    return htmlLang;
  }

  const metaLanguage = document.querySelector('meta[http-equiv="content-language"], meta[name="language"]');
  const metaLang = metaLanguage?.getAttribute('content');
  if (metaLang) {
    return metaLang;
  }

  // Fallback: content-based language detection
  const title = document.title;
  const description = document.querySelector('meta[name="description"]')?.getAttribute('content') ?? '';
  return detectLanguageByContent(`${title} ${description}`);
}

function detectLanguageByContent(text: string): string {
  const patterns: Record<string, RegExp> = {
    en: /\b(the|and|is|are|was|were|have|has|had|do|does|did|will|would|could|should|may|might|must|can|this|that|these|those|with|from|they|we|you|he|she|it)\b/gi,
    zh: /[\u4e00-\u9fff]/,
    es: /\b(el|la|los|las|un|una|del|al|y|o|que|en|por|para|con|sin|sobre|entre|hasta|desde|este|esta|estos|estas|pero|más|muy|todo|toda|todos|todas)\b/gi,
    fr: /\b(le|la|les|un|une|des|du|de|et|ou|que|en|pour|par|avec|sans|sur|entre|jusqu|depuis|ce|cette|ces|mais|plus|très|tout|toute|tous|toutes)\b/gi,
    de: /\b(der|die|das|den|dem|des|ein|eine|einer|eines|einem|einen|und|oder|dass|weil|wenn|aber|auch|nur|schon|noch|immer|hier|heute|jetzt|dann|wo|was|wer|wie|wann|warum)\b/gi,
    ja: /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/,
    ko: /[\uac00-\ud7af]/,
    ru: /[\u0400-\u04ff]/,
    pt: /\b(o|a|os|as|um|uma|de|do|da|dos|das|em|no|na|nos|nas|por|para|com|sem|sobre|entre|até|desde|este|esta|estes|estas|mas|mais|muito|todo|toda|todos|todas)\b/gi,
    it: /\b(il|lo|la|i|gli|le|un|uno|una|di|del|della|dei|delle|a|al|alla|ai|alle|da|dal|dalla|dai|dalle|in|nel|nella|nei|nelle|con|su|sul|sulla|sui|sulle|per|tra|fra|ma|anche|solo|sempre|già|qui|oggi|ora|poi|dove|cosa|chi|come|quando|perché)\b/gi
  };

  let bestMatch = '';
  let bestScore = 0;

  for (const [lang, pattern] of Object.entries(patterns)) {
    const matches = text.match(pattern) ?? [];
    const score = matches.length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = lang;
    }
  }

  return bestMatch;
}
