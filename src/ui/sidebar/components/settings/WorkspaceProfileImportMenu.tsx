import type { ChangeEvent } from 'react';
import { useState } from 'react';
import {
  createCsvExampleContent,
  createJsonExampleContent,
  parseWorkspaceProfileFile
} from '@/core/workspace/workspace-profile-import';
import type { SidebarIdentity, SidebarProject } from '@/ui/sidebar/types';

interface WorkspaceProfileImportMenuProps {
  onImport(project: SidebarProject, identity: SidebarIdentity): void;
  onError(message: string): void;
}

export function WorkspaceProfileImportMenu({ onImport, onError }: WorkspaceProfileImportMenuProps) {
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
        const profiles = parseWorkspaceProfileFile(file.name, content);
        profiles.forEach((profile) => {
          onImport(profile.project, profile.identity);
        });
        setOpen(false);
      })
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : 'Unable to import workspace profile.');
      });
  };

  return (
    <div className="ai-link-import-menu">
      <button
        type="button"
        className={isOpen ? 'ai-link-icon-button is-active' : 'ai-link-icon-button'}
        onClick={() => setOpen((value) => !value)}
        aria-label="Import workspace profile"
      >
        +
      </button>
      {isOpen ? (
        <div className="ai-link-import-menu__panel">
          <label className="ai-link-import-menu__item">
            <span>Import JSON/CSV</span>
            <input type="file" accept=".json,.csv,application/json,text/csv" onChange={handleFileChange} />
          </label>
          <button type="button" className="ai-link-import-menu__item" onClick={() => downloadExample('json')}>
            Download JSON Example
          </button>
          <button type="button" className="ai-link-import-menu__item" onClick={() => downloadExample('csv')}>
            Download CSV Example
          </button>
        </div>
      ) : null}
    </div>
  );
}

function downloadExample(type: 'json' | 'csv'): void {
  const content = type === 'json' ? createJsonExampleContent() : createCsvExampleContent();
  const mimeType = type === 'json' ? 'application/json' : 'text/csv';
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `workspace-profile-example.${type}`;
  link.click();
  URL.revokeObjectURL(url);
}
