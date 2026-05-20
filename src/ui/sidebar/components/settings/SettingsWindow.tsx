import { AISettingsPanel } from '@/ui/sidebar/components/settings/AISettingsPanel';
import { DatabaseExportPanel } from '@/ui/sidebar/components/settings/DatabaseExportPanel';
import { IdentityManagerPanel } from '@/ui/sidebar/components/settings/IdentityManagerPanel';
import { LinkAssetSettingsPanel } from '@/ui/sidebar/components/settings/LinkAssetSettingsPanel';
import { ProjectManagerPanel } from '@/ui/sidebar/components/settings/ProjectManagerPanel';
import { WorkspaceProfilePanel } from '@/ui/sidebar/components/settings/WorkspaceProfilePanel';
import type { SidebarIdentity, SidebarProject } from '@/ui/sidebar/types';

interface SettingsWindowProps {
  project: SidebarProject;
  identity: SidebarIdentity;
  identities: SidebarIdentity[];
  projects: SidebarProject[];
  onProfileImport(project: SidebarProject, identity: SidebarIdentity): void;
  onIdentitySave(identity: SidebarIdentity): void;
  onCreateIdentity(identity: SidebarIdentity): void;
  onSwitchIdentity(identityId: string): void;
  onDeleteIdentity(identityId: string): void;
  onSwitchProject(projectId: string): void;
  onDeleteProject(projectId: string): void;
  onUpdateProject(project: SidebarProject): void;
  onCreateProject(project: SidebarProject): void;
  onClose(): void;
  onSaved(message: string): void;
  onError(message: string): void;
}

export function SettingsWindow({
  project,
  identity,
  identities,
  projects,
  onProfileImport,
  onIdentitySave,
  onCreateIdentity,
  onSwitchIdentity,
  onDeleteIdentity,
  onSwitchProject,
  onDeleteProject,
  onUpdateProject,
  onCreateProject,
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
        <ProjectManagerPanel
          projects={projects}
          currentProject={project}
          onSwitch={onSwitchProject}
          onDelete={onDeleteProject}
          onUpdate={onUpdateProject}
          onCreate={onCreateProject}
          onError={onError}
        />
        <IdentityManagerPanel
          identities={identities}
          currentIdentity={identity}
          onSwitch={onSwitchIdentity}
          onDelete={onDeleteIdentity}
          onSave={onIdentitySave}
          onCreate={onCreateIdentity}
        />
        <LinkAssetSettingsPanel
          projectId={project.id}
          onSaved={onSaved}
          onError={onError}
        />
        <DatabaseExportPanel onSaved={onSaved} onError={onError} />
        <AISettingsPanel onSaved={onSaved} onError={onError} />
      </div>
    </div>
  );
}
