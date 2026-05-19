import { useEffect, useState } from 'react';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import { WorkspaceProfileImportMenu } from '@/ui/sidebar/components/settings/WorkspaceProfileImportMenu';
import type { SidebarIdentity, SidebarProject } from '@/ui/sidebar/types';

interface WorkspaceProfilePanelProps {
  project: SidebarProject;
  identity: SidebarIdentity;
  onImport(project: SidebarProject, identity: SidebarIdentity): void;
  onError(message: string): void;
  onIdentitySave(identity: SidebarIdentity): void;
}

export function WorkspaceProfilePanel({
  project,
  identity,
  onImport,
  onError,
  onIdentitySave
}: WorkspaceProfilePanelProps) {
  const [name, setName] = useState(identity.name);
  const [email, setEmail] = useState(identity.email);
  const [website, setWebsite] = useState(identity.website);

  useEffect(() => {
    setName(identity.name);
    setEmail(identity.email);
    setWebsite(identity.website);
  }, [identity.id, identity.name, identity.email, identity.website]);

  return (
    <WorkspacePanel
      title="Workspace Profile"
      actions={<WorkspaceProfileImportMenu onImport={onImport} onError={onError} />}
    >
      <div className="ai-link-profile">
        <section>
          <h3>Project</h3>
          <strong>{project.brand}</strong>
          <a href={project.website} target="_blank" rel="noreferrer">
            {project.website}
          </a>
          <p>{project.description}</p>
        </section>
        <section>
          <h3>Comment Identity</h3>
          <div className="ai-link-settings">
            <label>
              <span>Name</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.currentTarget.value)}
                placeholder="Your comment name"
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.currentTarget.value)}
                placeholder="name@example.com"
              />
            </label>
            <label>
              <span>Website</span>
              <input
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.currentTarget.value)}
                placeholder="https://example.com"
              />
            </label>
            <button
              type="button"
              className="ai-link-button"
              onClick={() =>
                onIdentitySave({
                  ...identity,
                  name: name.trim(),
                  email: email.trim(),
                  website: website.trim()
                })
              }
            >
              Save Profile
            </button>
          </div>
        </section>
      </div>
    </WorkspacePanel>
  );
}
