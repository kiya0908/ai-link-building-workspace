import { useState } from 'react';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import { QueueTargetImportMenu } from '@/ui/sidebar/components/queue/QueueTargetImportMenu';
import {
  SUBMISSION_STATUSES,
  type BacklinkTarget,
  type SubmissionStatus
} from '@/core/types/queue';
import { createId } from '@/shared/id';
import type { QueueItem } from '@/ui/sidebar/types';

interface QueueListProps {
  items: QueueItem[];
  activeItemId: string | null;
  projectId: string;
  onOpen(item: QueueItem): void;
  onImport(targets: BacklinkTarget[], options?: { replaceExisting?: boolean }): Promise<void>;
  onSubmissionStatusChange(targetId: string, status: SubmissionStatus): Promise<void>;
  onExport(): void;
  onImportError(message: string): void;
}

const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  unknown: 'unknown',
  submitted: 'submitted',
  indexed: 'indexed',
  pending_review: 'review',
  rejected: 'rejected'
};

export function QueueList({
  items,
  activeItemId,
  projectId,
  onOpen,
  onImport,
  onSubmissionStatusChange,
  onExport,
  onImportError
}: QueueListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
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
      id: createId(),
      url: trimmedUrl,
      status: 'pending',
      submissionStatus: 'unknown',
      language: '',
      commentSystem: '',
      qualityScore: 0,
      projectId,
      notes: notes.trim(),
      updatedAt: Date.now()
    };

    setIsSubmitting(true);
    try {
      await onImport([target], { replaceExisting: false });
      setUrl('');
      setNotes('');
      setIsAdding(false);
    } catch (error) {
      onImportError(error instanceof Error ? error.message : 'Unable to add queue target.');
    } finally {
      setIsSubmitting(false);
    }
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
            <button type="button" className="ai-link-button" onClick={handleAdd} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
            <button
              type="button"
              className="ai-link-button"
              onClick={() => setIsAdding(false)}
              disabled={isSubmitting}
            >
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
              </button>
              <span className={`ai-link-status-pill ai-link-status-pill--${item.status}`}>
                {item.status}
              </span>
              <select
                className="ai-link-submission-select"
                value={item.submissionStatus ?? 'unknown'}
                onChange={(event) => {
                  void onSubmissionStatusChange(item.id, event.currentTarget.value as SubmissionStatus);
                }}
                title="Submission result"
              >
                {SUBMISSION_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {SUBMISSION_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ol>
      ) : (
        <div className="ai-link-empty">
          <span>No targets imported yet.</span>
        </div>
      )}

      <button
        type="button"
        className="ai-link-button ai-link-button--full"
        onClick={onExport}
        disabled={items.length === 0}
      >
        Export Queue Targets CSV
      </button>
    </WorkspacePanel>
  );
}
