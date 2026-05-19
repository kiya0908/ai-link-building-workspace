import type { TargetStatus } from '@/core/types/queue';
import type { TokenUsage } from '@/core/ai/ai-provider';
import type { CommentValidationIssue } from '@/core/ai/comment-validator';
import type { CommentMode } from '@/core/types/project';
import type { SidebarAction } from '@/shared/messaging/sidebar-actions';

export interface SidebarProject {
  id: string;
  name: string;
  brand: string;
  website: string;
  description: string;
  defaultCommentMode: CommentMode;
}

export interface SidebarIdentity {
  id: string;
  name: string;
  email: string;
  website: string;
}

export interface SidebarTarget {
  id: string;
  url: string;
  status: TargetStatus;
  projectId: string;
}

export interface QueueItem extends SidebarTarget {
  title: string;
  domain: string;
  position: number;
}

export interface SidebarArticleAnalysis {
  title: string;
  summary: string;
  language: string;
  detectedProvider: string;
  qualityScore: number;
}

export interface CommentState {
  draft: string;
  mode: CommentMode;
  style: 'friendly' | 'casual' | 'expert' | 'question';
  isGenerating: boolean;
  error: string | null;
  model: string | null;
  tokenUsage: TokenUsage | null;
  validationIssues: CommentValidationIssue[];
}

export interface SidebarStatus {
  label: string;
  detail: string;
  tone: 'idle' | 'loading' | 'success' | 'warning' | 'error';
}

export type { SidebarAction };
