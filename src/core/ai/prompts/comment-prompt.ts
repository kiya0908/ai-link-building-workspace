import type { GenerateCommentInput } from '@/core/ai/ai-provider';

export const COMMENT_SYSTEM_PROMPT = `You write short, natural blog comments for a human-reviewed backlink workflow. Output only the final comment text.`;

export function buildCommentPrompt(input: GenerateCommentInput): string {
  return [
    'ARTICLE',
    `Title: ${input.article.title}`,
    `Summary: ${input.article.summary}`,
    `Language: ${input.article.language || 'detect from article text'}`,
    `Headings: ${input.article.headings.slice(0, 6).join(' | ')}`,
    `First paragraphs: ${input.article.paragraphs.slice(0, 3).join('\n')}`,
    '',
    'PROJECT',
    `Brand: ${input.project.brand}`,
    `Website: ${input.project.website}`,
    `Description: ${input.project.description}`,
    '',
    'COMMENT SETTINGS',
    `Mode: ${input.mode}`,
    `Style: ${input.style}`,
    '',
    'MODE RULES',
    htmlLinkRule(input.project.website),
    '',
    'QUALITY RULES',
    '- Mention one concrete detail from the article.',
    ...lengthRules(input.article.language),
    '- Do not sound promotional.',
    '- Do not claim personal experience unless the article supports it.',
    '- Include exactly one HTML anchor and no other URL or link.',
    '- Match the article language naturally.',
    '- Do not include markdown fences or explanations.',
    '',
    'AVOID DUPLICATES',
    input.previousComments?.slice(0, 5).join('\n---\n') || 'No previous generated comments.'
  ].join('\n');
}

function htmlLinkRule(website: string): string {
  return [
    'Mode: html_link (required for every comment).',
    `Use the provided target URL exactly as the href: ${website}`,
    `Required structure: <a href="${website}">natural, context-relevant anchor text</a>`,
    'Integrate the anchor naturally into a relevant sentence.',
    'Do not omit the anchor and do not output a second link.'
  ].join('\n');
}

function lengthRules(language: string): string[] {
  if (isCjkLanguage(language)) {
    return [
      '- Write 40–120 visible CJK characters, excluding HTML markup.',
      '- Use 2–3 natural sentences.'
    ];
  }

  return [
    '- Write 25–70 words, excluding HTML markup and the target URL.',
    '- Use 2–3 natural sentences.'
  ];
}

function isCjkLanguage(language: string): boolean {
  return /^(zh|ja|ko)(?:-|$)/i.test(language.trim());
}
