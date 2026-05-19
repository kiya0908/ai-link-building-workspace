import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { parseTargetsFromCsv, parseTargetsFromJson } from '@/core/queue/queue-import-export';
import type { BacklinkTarget } from '@/core/types/queue';

interface QueueTargetImportMenuProps {
  projectId: string;
  onImport(targets: BacklinkTarget[]): Promise<void>;
  onError(message: string): void;
}

export function QueueTargetImportMenu({ projectId, onImport, onError }: QueueTargetImportMenuProps) {
  const [isOpen, setOpen] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = '';

    if (!file) {
      return;
    }

    file
      .text()
      .then((content) => {
        const targets = applyProjectId(parseTargetFile(file.name, content), projectId);
        if (targets.length === 0) {
          throw new Error('Import file did not contain any valid target URLs.');
        }

        return onImport(targets);
      })
      .then(() => setOpen(false))
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : 'Unable to import backlink targets.');
      });
  };

  return (
    <div className="ai-link-import-menu">
      <button
        type="button"
        className={isOpen ? 'ai-link-icon-button is-active' : 'ai-link-icon-button'}
        onClick={() => setOpen((value) => !value)}
        aria-label="Import backlink target URLs"
      >
        +
      </button>
      {isOpen ? (
        <div className="ai-link-import-menu__panel">
          <label className="ai-link-import-menu__item">
            <span>Import Targets JSON/CSV</span>
            <input type="file" accept=".json,.csv,application/json,text/csv" onChange={handleFileChange} />
          </label>
          <button type="button" className="ai-link-import-menu__item" onClick={() => downloadTargetExample('json')}>
            Download JSON Example
          </button>
          <button type="button" className="ai-link-import-menu__item" onClick={() => downloadTargetExample('csv')}>
            Download CSV Example
          </button>
        </div>
      ) : null}
    </div>
  );
}

function parseTargetFile(fileName: string, content: string): BacklinkTarget[] {
  if (fileName.toLowerCase().endsWith('.json')) {
    return parseTargetsFromJson(content);
  }

  return parseTargetsFromCsv(content);
}

function applyProjectId(targets: BacklinkTarget[], projectId: string): BacklinkTarget[] {
  return targets
    .filter((target) => target.url.trim())
    .map((target) => ({
      ...target,
      projectId,
      status: target.status || 'pending',
      updatedAt: target.updatedAt || Date.now()
    }));
}

function downloadTargetExample(type: 'json' | 'csv'): void {
  const content = type === 'json' ? createJsonExampleContent() : createCsvExampleContent();
  const blob = new Blob([content], {
    type: type === 'json' ? 'application/json' : 'text/csv'
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `backlink-targets-example.${type}`;
  link.click();
  URL.revokeObjectURL(url);
}

function createJsonExampleContent(): string {
  return JSON.stringify(
    [
      {
        url: 'https://example.com/post-1',
        notes: 'First target'
      },
      {
        url: 'https://example.com/post-2',
        notes: 'Second target'
      }
    ],
    null,
    2
  );
}

function createCsvExampleContent(): string {
  return ['url,notes', 'https://example.com/post-1,First target', 'https://example.com/post-2,Second target'].join('\n');
}
