import type { ArticleAnalysis } from '@/core/types/article';
import type { CommentMode, Project } from '@/core/types/project';

export type CommentStyle = 'friendly' | 'casual' | 'expert' | 'question';

export interface GenerateCommentInput {
  article: ArticleAnalysis;
  project: Project;
  style: CommentStyle;
  mode: CommentMode;
}

export interface AIProvider {
  generateComment(input: GenerateCommentInput): Promise<string>;
}
