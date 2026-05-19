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
    modeRule(input.mode, input.project.website),
    '',
    'QUALITY RULES',
    '- Mention one concrete detail from the article.',
    '- Keep the comment under 80 words.',
    '- Do not sound promotional.',
    '- Do not claim personal experience unless the article supports it.',
    '- Use at most one link.',
    '- Match the article language naturally.',
    '- Do not include markdown fences or explanations.',
    '',
    'AVOID DUPLICATES',
    input.previousComments?.slice(0, 5).join('\n---\n') || 'No previous generated comments.'
  ].join('\n');
}

function modeRule(mode: GenerateCommentInput['mode'], website: string): string {
  if (mode === 'plain_url') {
    return `Include this plain URL only if it fits naturally: ${website}`;
  }

  if (mode === 'html_link') {
    return `Use one simple HTML anchor only if it fits naturally: <a href="${website}">relevant anchor text</a>`;
  }

  return 'Use a soft brand mention. Do not force a URL into the comment.';
}
