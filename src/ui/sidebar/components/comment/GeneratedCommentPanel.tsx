import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { CommentState } from '@/ui/sidebar/types';

interface GeneratedCommentPanelProps {
  commentState: CommentState;
}

export function GeneratedCommentPanel({ commentState }: GeneratedCommentPanelProps) {
  return (
    <WorkspacePanel title="Generated Comment">
      {commentState.error ? (
        <div className="ai-link-alert">{commentState.error}</div>
      ) : null}
      <textarea
        className="ai-link-comment-box"
        value={commentState.isGenerating ? 'Generating placeholder comment...' : commentState.draft}
        readOnly
      />
      <div className="ai-link-comment-meta">
        <span>{commentState.style}</span>
        <span>{commentState.mode}</span>
      </div>
    </WorkspacePanel>
  );
}
