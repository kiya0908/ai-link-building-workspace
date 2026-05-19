import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { SidebarStatus } from '@/ui/sidebar/types';

interface StatusPanelProps {
  status: SidebarStatus;
}

export function StatusPanel({ status }: StatusPanelProps) {
  return (
    <WorkspacePanel title="Status">
      <div className={`ai-link-status ai-link-status--${status.tone}`}>
        <strong>{status.label}</strong>
        <span>{status.detail}</span>
      </div>
    </WorkspacePanel>
  );
}
