export type TargetStatus =
  | 'pending'
  | 'opened'
  | 'analyzed'
  | 'generated'
  | 'filled'
  | 'submitted'
  | 'need_login'
  | 'comment_closed'
  | 'generation_failed'
  | 'failed'
  | 'skipped';

export const TARGET_STATUSES = [
  'pending',
  'opened',
  'analyzed',
  'generated',
  'filled',
  'submitted',
  'need_login',
  'comment_closed',
  'generation_failed',
  'failed',
  'skipped'
] as const satisfies readonly TargetStatus[];

export type SubmissionStatus =
  | 'unknown'
  | 'submitted'
  | 'indexed'
  | 'pending_review'
  | 'rejected';

export const SUBMISSION_STATUSES = [
  'unknown',
  'submitted',
  'indexed',
  'pending_review',
  'rejected'
] as const satisfies readonly SubmissionStatus[];

export interface BacklinkTarget {
  id: string;
  url: string;
  status: TargetStatus;
  submissionStatus?: SubmissionStatus;
  language: string;
  commentSystem: string;
  qualityScore: number;
  projectId: string;
  notes: string;
  updatedAt: number;
}

export interface QueueState {
  id: string;
  activeProjectId: string | null;
  currentTargetId: string | null;
  updatedAt: number;
}

export interface QueueFilter {
  projectId?: string;
  status?: TargetStatus;
  search?: string;
}

export interface QueueStatistics {
  total: number;
  completed: number;
  failed: number;
  skipped: number;
}

export interface QueueRepository {
  listTargets(projectId: string): Promise<BacklinkTarget[]>;
  listAllTargets(): Promise<BacklinkTarget[]>;
  getTarget(id: string): Promise<BacklinkTarget | null>;
  saveTarget(target: BacklinkTarget): Promise<void>;
  updateTargetStatus(id: string, status: TargetStatus): Promise<void>;
  updateSubmissionStatus(id: string, status: SubmissionStatus): Promise<void>;
  clearProjectTargets(projectId: string): Promise<void>;
}

export interface QueueStateRepository {
  getState(id: string): Promise<QueueState | null>;
  saveState(state: QueueState): Promise<void>;
}
