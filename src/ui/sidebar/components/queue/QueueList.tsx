import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { QueueItem } from '@/ui/sidebar/types';

interface QueueListProps {
  items: QueueItem[];
  activeItemId: string | null;
}

export function QueueList({ items, activeItemId }: QueueListProps) {
  return (
    <WorkspacePanel
      title="Queue List"
      actions={<span className="ai-link-count">{items.length} targets</span>}
    >
      <ol className="ai-link-queue">
        {items.map((item) => (
          <li
            className={item.id === activeItemId ? 'ai-link-queue__item is-active' : 'ai-link-queue__item'}
            key={item.id}
          >
            <span className="ai-link-queue__position">{item.position}</span>
            <span className="ai-link-queue__main">
              <strong>{item.title}</strong>
              <small>{item.domain}</small>
            </span>
            <span className={`ai-link-status-pill ai-link-status-pill--${item.status}`}>
              {item.status}
            </span>
          </li>
        ))}
      </ol>
    </WorkspacePanel>
  );
}
