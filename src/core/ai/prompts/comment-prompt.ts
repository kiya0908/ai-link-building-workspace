import type { GenerateCommentInput } from '@/core/ai/ai-provider';

export const COMMENT_SYSTEM_PROMPT = `You write short, natural blog comments for a human-reviewed backlink workflow. Output only the final comment text.`;

export function buildCommentPrompt(input: GenerateCommentInput): string {
  return [
    'ARTICLE',
    `Title: ${input.article.title.slice(0, 200)}`,
    `Description: ${input.article.summary.slice(0, 400) || '(not available)'}`,
    `Language: ${input.article.language || 'detect from the title and description'}`,
    '',
    'PROJECT',
    `Brand: ${input.project.brand.slice(0, 100)}`,
    `Website: ${input.project.website}`,
    `Description: ${input.project.description.slice(0, 400)}`,
    '',
    'COMMENT SETTINGS',
    `Mode: ${input.mode}`,
    `Style: ${input.style}`,
    '',
    'MODE RULES',
    htmlLinkRule(input.project.website),
    '',
    'QUALITY RULES',
    '- Write a natural, topic-relevant comment using only the title and description.',
    '- Do not invent details or claim to have read the full article.',
    ...lengthRules(input.article.language),
    '- Do not sound promotional.',
    '- Do not claim personal experience unless the article supports it.',
    '- Include exactly one HTML anchor and no other URL or link.',
    '- Match the article language naturally.',
    '- Do not include markdown fences or explanations.',
    '',
    'AVOID DUPLICATES',
    input.previousComments?.slice(0, 3).map((comment) => comment.slice(0, 220)).join('\n---\n') || 'No previous generated comments.'
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
      '- Write 40–100 visible CJK characters, excluding HTML markup.',
      '- Use 2–3 natural sentences.'
    ];
  }

  return [
    '- Write 25–55 words, excluding HTML markup and the target URL.',
    '- Use 2–3 natural sentences.'
  ];
}

function isCjkLanguage(language: string): boolean {
  return /^(zh|ja|ko)(?:-|$)/i.test(language.trim());
}
