import type { ArticleAnalysis } from '@/core/types/article';
import type { CommentFormFields } from '@/core/dom/comment-provider';
import type { SidebarAction } from '@/shared/messaging/sidebar-actions';

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
      type: 'PAGE_ANALYZED';
      payload: ArticleAnalysis;
    };

export interface RuntimeMessageHandler {
  canHandle(message: RuntimeMessage): boolean;
  handle(message: RuntimeMessage, sender: chrome.runtime.MessageSender): Promise<unknown>;
}
