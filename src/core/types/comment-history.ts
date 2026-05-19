import type { CommentMode } from '@/core/types/project';

export interface CommentHistoryEntry {
  id: string;
  targetId: string;
  projectId: string;
  comment: string;
  mode: CommentMode;
  createdAt: number;
}
