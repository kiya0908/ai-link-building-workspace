import { useState } from 'react';
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
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      onImportError('URL is required.');
      return;
    }
    try {
      new URL(trimmedUrl);
    } catch {
      onImportError('Invalid URL format.');
      return;
    }

    const target: BacklinkTarget = {
      id: crypto.randomUUID(),
      url: trimmedUrl,
      status: 'pending',
      language: '',
      commentSystem: '',
      qualityScore: 0,
      projectId,
      notes: notes.trim(),
      updatedAt: Date.now()
    };

    void onImport([target]);
    setUrl('');
    setNotes('');
    setIsAdding(false);
  };

  return (
    <WorkspacePanel
      title="Queue List"
      actions={
        <div className="ai-link-panel__action-row">
          <span className="ai-link-count">{items.length} targets</span>
          <button
            type="button"
            className="ai-link-icon-button"
            onClick={() => setIsAdding((value) => !value)}
            title="Add target"
          >
            +
          </button>
          <QueueTargetImportMenu projectId={projectId} onImport={onImport} onError={onImportError} />
        </div>
      }
    >
      {isAdding && (
        <div className="ai-link-settings" style={{ marginBottom: 8 }}>
          <label>
            <span>URL</span>
            <input
              type="url"
              value={url}
              onChange={(event) => setUrl(event.currentTarget.value)}
              placeholder="https://example.com/blog-post"
            />
          </label>
          <label>
            <span>Notes</span>
            <input
              type="text"
              value={notes}
              onChange={(event) => setNotes(event.currentTarget.value)}
              placeholder="Optional notes"
            />
          </label>
          <div className="ai-link-panel__action-row">
            <button type="button" className="ai-link-button" onClick={handleAdd}>
              Add
            </button>
            <button type="button" className="ai-link-button" onClick={() => setIsAdding(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

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
