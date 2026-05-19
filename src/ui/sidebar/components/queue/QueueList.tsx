import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import { QueueTargetImportMenu } from '@/ui/sidebar/components/queue/QueueTargetImportMenu';
import type { BacklinkTarget } from '@/core/types/queue';
import type { QueueItem } from '@/ui/sidebar/types';

interface QueueListProps {
  items: QueueItem[];
  activeItemId: string | null;
  projectId: string;
  onOpen(item: QueueItem): void;
  onImport(targets: BacklinkTarget[]): Promise<void>;
  onImportError(message: string): void;
}

export function QueueList({ items, activeItemId, projectId, onOpen, onImport, onImportError }: QueueListProps) {
  return (
    <WorkspacePanel
      title="Queue List"
      actions={
        <div className="ai-link-panel__action-row">
          <span className="ai-link-count">{items.length} targets</span>
          <QueueTargetImportMenu projectId={projectId} onImport={onImport} onError={onImportError} />
        </div>
      }
    >
      {items.length > 0 ? (
        <ol className="ai-link-queue">
          {items.map((item) => (
            <li
              className={item.id === activeItemId ? 'ai-link-queue__item is-active' : 'ai-link-queue__item'}
              key={item.id}
            >
              <button type="button" className="ai-link-queue__button" onClick={() => onOpen(item)}>
                <span className="ai-link-queue__position">{item.position}</span>
                <span className="ai-link-queue__main">
                  <strong>{item.title}</strong>
                  <small>{item.domain}</small>
                </span>
                <span className={`ai-link-status-pill ai-link-status-pill--${item.status}`}>
                  {item.status}
                </span>
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <div className="ai-link-empty">
          <span>No targets imported yet.</span>
        </div>
      )}
    </WorkspacePanel>
  );
}
