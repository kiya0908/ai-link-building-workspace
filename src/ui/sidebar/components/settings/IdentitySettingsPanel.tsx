import { useState } from 'react';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { SidebarIdentity } from '@/ui/sidebar/types';

interface IdentitySettingsPanelProps {
  identity: SidebarIdentity;
  onSave(identity: SidebarIdentity): void;
}

export function IdentitySettingsPanel({ identity, onSave }: IdentitySettingsPanelProps) {
  const [name, setName] = useState(identity.name);
  const [email, setEmail] = useState(identity.email);
  const [website, setWebsite] = useState(identity.website);

  return (
    <WorkspacePanel title="Comment Identity">
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
          onClick={() => onSave({ ...identity, name: name.trim(), email: email.trim(), website: website.trim() })}
        >
          Save Identity
        </button>
      </div>
    </WorkspacePanel>
  );
}
