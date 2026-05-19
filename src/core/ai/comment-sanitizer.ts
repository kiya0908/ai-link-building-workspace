export function sanitizeGeneratedComment(comment: string): string {
  return comment
    .replace(/```[\s\S]*?```/g, '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripUnsafeHtml(comment: string): string {
  return comment
    .replace(/<(?!\/?a(?=\s|>))[^>]+>/gi, '')
    .replace(/\son\w+="[^"]*"/gi, '')
    .replace(/\son\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}
