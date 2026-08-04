import type { SidebarAction } from '@/ui/sidebar/types';
import type { AutomationMode } from '@/core/types/automation';

interface ActionBarProps {
  isGenerating: boolean;
  isAutomationRunning: boolean;
  automationMode: AutomationMode;
  onAction(action: SidebarAction): void;
  onAutomationModeChange(mode: AutomationMode): void;
  onAutomationToggle(): void;
}

export function ActionBar({
  isGenerating,
  isAutomationRunning,
  automationMode,
  onAction,
  onAutomationModeChange,
  onAutomationToggle
}: ActionBarProps) {
  return (
    <div className="ai-link-action-bar" aria-label="Workspace actions">
      <div className="ai-link-automation-controls">
        <label>
          Automation mode
          <select value={automationMode} disabled={isAutomationRunning} onChange={(event) => onAutomationModeChange(event.currentTarget.value as AutomationMode)}>
            <option value="fill_only">Fill only</option>
            <option value="auto_submit">Auto submit</option>
          </select>
        </label>
        <button type="button" className="ai-link-button ai-link-button--primary" onClick={onAutomationToggle}>
          {isAutomationRunning ? 'Stop Automation' : 'Start Automation'}
        </button>
      </div>
      <button type="button" className="ai-link-button ai-link-button--primary" onClick={() => onAction('generate')} disabled={isGenerating || isAutomationRunning}>
        Generate Comment
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('fill')} disabled={isAutomationRunning}>
        Fill
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('select_comment_box')}>
        Select Comment Box
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('next')} disabled={isAutomationRunning}>
        Next
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('skip')} disabled={isAutomationRunning}>
        Skip
      </button>
      <button type="button" className="ai-link-button" onClick={() => onAction('regenerate')} disabled={isGenerating || isAutomationRunning}>
        Regenerate
      </button>
    </div>
  );
}
