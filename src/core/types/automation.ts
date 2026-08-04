import type { SubmissionStatus, TargetStatus } from '@/core/types/queue';

export type AutomationMode = 'fill_only' | 'auto_submit';
export type AutomationPhase =
  | 'idle'
  | 'opening'
  | 'analyzing'
  | 'generating'
  | 'filling'
  | 'submitting'
  | 'confirming'
  | 'stopped';

export interface AutomationSession {
  id: 'default';
  running: boolean;
  mode: AutomationMode;
  phase: AutomationPhase;
  projectId: string;
  targetId: string | null;
  targetUrl: string | null;
  tabId: number | null;
  deadlineAt: number | null;
  comment: string | null;
  lastResult: TargetStatus | null;
  lastSubmissionStatus: SubmissionStatus | null;
  detail: string;
  updatedAt: number;
}

export interface AutomationStartInput {
  projectId: string;
  mode: AutomationMode;
}

export interface AutomationStateRepository {
  get(): Promise<AutomationSession | null>;
  save(session: AutomationSession): Promise<void>;
}