import type { CommentMode } from '@/core/types/project';
import type { CommentValidationIssue } from '@/core/ai/comment-validator';
import type { TokenUsage } from '@/core/ai/ai-provider';

export interface CommentHistoryEntry {
  id: string;
  targetId: string;
  projectId: string;
  comment: string;
  mode: CommentMode;
  model?: string;
  tokenUsage?: TokenUsage | null;
  validationIssues?: CommentValidationIssue[];
  createdAt: number;
}
