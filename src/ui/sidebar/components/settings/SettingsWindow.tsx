import { AISettingsPanel } from '@/ui/sidebar/components/settings/AISettingsPanel';
import { WorkspaceProfilePanel } from '@/ui/sidebar/components/settings/WorkspaceProfilePanel';
import type { SidebarIdentity, SidebarProject } from '@/ui/sidebar/types';

interface SettingsWindowProps {
  project: SidebarProject;
  identity: SidebarIdentity;
  onProfileImport(project: SidebarProject, identity: SidebarIdentity): void;
  onIdentitySave(identity: SidebarIdentity): void;
  onClose(): void;
  onSaved(message: string): void;
  onError(message: string): void;
}

export function SettingsWindow({
  project,
  identity,
  onProfileImport,
  onIdentitySave,
  onClose,
  onSaved,
  onError
}: SettingsWindowProps) {
  return (
    <div className="ai-link-settings-window" role="dialog" aria-label="Workspace settings">
      <div className="ai-link-settings-window__header">
        <div>
          <strong>Settings</strong>
          <span>Workspace profile and AI provider</span>
        </div>
        <button type="button" className="ai-link-icon-button" onClick={onClose} aria-label="Close settings">
          x
        </button>
      </div>
      <div className="ai-link-settings-window__content">
        <WorkspaceProfilePanel
          project={project}
          identity={identity}
          onImport={onProfileImport}
          onError={onError}
          onIdentitySave={onIdentitySave}
        />
        <AISettingsPanel onSaved={onSaved} onError={onError} />
      </div>
    </div>
  );
}
