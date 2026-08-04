import type { ArticleAnalysis } from '@/core/types/article';
import type { GeneratedCommentResult, GenerateCommentInput } from '@/core/ai/ai-provider';
import type { CommentValidationResult } from '@/core/ai/comment-validator';
import type { CommentFormFields } from '@/core/dom/comment-provider';
import type { LearnableField } from '@/core/dom/manual/manual-learning';
import type {
  BacklinkTarget,
  QueueFilter,
  QueueState,
  QueueStatistics,
  SubmissionStatus,
  TargetStatus
} from '@/core/types/queue';
import type { SidebarAction } from '@/shared/messaging/sidebar-actions';
import type { AutomationMode, AutomationPhase, AutomationSession } from '@/core/types/automation';

export type RuntimeMessage =
  | {
      type: 'SIDEBAR_READY';
    }
  | {
      type: 'SIDEBAR_ACTION';
      payload: {
        action: SidebarAction;
      };
    }
  | {
      type: 'GENERATE_COMMENT';
      payload: GenerateCommentInput & {
        targetId: string;
      };
    }
  | {
      type: 'QUEUE_HYDRATE';
      payload: {
        projectId?: string;
      };
    }
  | {
      type: 'QUEUE_SWITCH_PROJECT';
      payload: {
        projectId: string;
      };
    }
  | {
      type: 'QUEUE_IMPORT_TARGETS';
      payload: {
        targets: BacklinkTarget[];
        replaceExisting?: boolean;
      };
    }
  | {
      type: 'QUEUE_OPEN_TARGET';
      payload: {
        targetId: string;
      };
    }
  | {
      type: 'QUEUE_OPEN_NEXT';
      payload: {
        projectId: string;
      };
    }
  | {
      type: 'QUEUE_UPDATE_STATUS';
      payload: {
        targetId: string;
        status: TargetStatus;
      };
    }
  | {
      type: 'QUEUE_UPDATE_SUBMISSION_STATUS';
      payload: {
        targetId: string;
        status: SubmissionStatus;
      };
    }
  | {
      type: 'QUEUE_FILTER';
      payload: {
        filter: QueueFilter;
      };
    }
  | {
      type: 'QUEUE_EXPORT_TARGETS_CSV';
      payload: {
        projectId: string;
      };
    }
  | {
      type: 'QUEUE_EXPORT_FULL_DATABASE';
    }
  | {
      type: 'ANALYZE_CURRENT_PAGE';
    }
  | {
      type: 'FILL_COMMENT_FIELDS';
      payload: {
        fields: CommentFormFields;
      };
    }
  | {
      type: 'SCROLL_TO_COMMENT';
    }
  | {
      type: 'START_MANUAL_LEARNING';
      payload: {
        field: LearnableField;
      };
    }
  | {
      type: 'PAGE_ANALYZED';
      payload: ArticleAnalysis;
    }
  | { type: 'AUTOMATION_GET' }
  | { type: 'AUTOMATION_START'; payload: { projectId: string; mode: AutomationMode } }
  | { type: 'AUTOMATION_STOP' }
  | { type: 'AUTOMATION_PAGE_READY' }
  | { type: 'AUTOMATION_SET_PHASE'; payload: { phase: AutomationPhase; detail: string; comment?: string } }
  | {
      type: 'AUTOMATION_COMPLETE_TARGET';
      payload: { targetId: string; status: TargetStatus; submissionStatus?: SubmissionStatus; detail: string };
    };

export type AutomationResponse = AutomationSession | null;

export interface GenerateCommentResponse extends GeneratedCommentResult {
  validation: CommentValidationResult;
}

export interface QueueSnapshotResponse {
  state: QueueState;
  targets: BacklinkTarget[];
  statistics: QueueStatistics;
  openedTarget?: BacklinkTarget | null;
}

export interface RuntimeMessageHandler {
  canHandle(message: RuntimeMessage): boolean;
  handle(message: RuntimeMessage, sender: RuntimeMessageSender): Promise<unknown>;
}

export interface RuntimeMessageSender {
  tab?: { id?: number };
}
