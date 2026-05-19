export const COMMENT_PROMPT_TEMPLATE = `You are writing a natural blog comment as a real reader.

ARTICLE TITLE:
{{title}}

ARTICLE SUMMARY:
{{summary}}

ARTICLE LANGUAGE:
{{language}}

PROJECT:
- Brand: {{brand}}
- Website: {{website}}

COMMENT STYLE:
{{style}}

LINK MODE:
{{mode}}

RULES:
1. Mention one specific detail from the article.
2. Sound like a genuine reader.
3. Keep it under 80 words.
4. Avoid generic praise.
5. Avoid marketing tone.
6. Match the article language naturally.
7. If using a link, insert it naturally.
8. Output only the comment text.`;
