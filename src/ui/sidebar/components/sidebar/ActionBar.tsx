import type { SidebarAction } from '@/ui/sidebar/types';

interface ActionBarProps {
  isGenerating: boolean;
  onAction(action: SidebarAction): void;
}

export function ActionBar({ isGenerating, onAction }: ActionBarProps) {
  return (
    <div className="ai-link-action-bar" aria-label="Workspace actions">
      <button type="button" className="ai-link-button ai-link-button--primary" onClick={() => onAction('generate')} disabled={isGenerating}>
        Generate Comment
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('fill')}>
        Fill
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('select_comment_box')}>
        Select Comment Box
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('next')}>
        Next
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('skip')}>
        Skip
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('regenerate')} disabled={isGenerating}>
        Regenerate
      </button>
    </div>
  );
}
