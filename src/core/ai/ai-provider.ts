import type { ArticleAnalysis } from '@/core/types/article';
import type { CommentMode, Project } from '@/core/types/project';

export type CommentStyle = 'friendly' | 'casual' | 'expert' | 'question';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GenerateCommentInput {
  article: ArticleAnalysis;
  project: Project;
  style: CommentStyle;
  mode: CommentMode;
  previousComments?: string[];
}

export interface GeneratedCommentResult {
  comment: string;
  model: string;
  usage: TokenUsage | null;
}

export interface AIProvider {
  generateComment(input: GenerateCommentInput): Promise<GeneratedCommentResult>;
}
