import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';

interface DatabaseExportPanelProps {
  onSaved(message: string): void;
  onError(message: string): void;
}

const runtimeClient = createRuntimeMessageClient();

export function DatabaseExportPanel({ onSaved, onError }: DatabaseExportPanelProps) {
  const handleFullDatabaseExport = () => {
    runtimeClient
      .send<string>({
        type: 'QUEUE_EXPORT_FULL_DATABASE'
      })
      .then((content) => {
        downloadFile(content, `ai-link-workspace-database-${Date.now()}.json`, 'application/json');
        onSaved('Full database export started.');
      })
      .catch((error: unknown) => {
        onError(error instanceof Error ? error.message : 'Unable to export database.');
      });
  };

  return (
    <WorkspacePanel title="Database Export">
      <div className="ai-link-settings">
        <button type="button" className="ai-link-button" onClick={handleFullDatabaseExport}>
          Export Full Database JSON
        </button>
      </div>
    </WorkspacePanel>
  );
}

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
