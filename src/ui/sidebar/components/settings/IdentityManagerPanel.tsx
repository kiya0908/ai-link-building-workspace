import { useState } from 'react';
import { createId } from '@/shared/id';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { SidebarIdentity } from '@/ui/sidebar/types';

interface IdentityManagerPanelProps {
  identities: SidebarIdentity[];
  currentIdentity: SidebarIdentity;
  onSwitch(identityId: string): void;
  onDelete(identityId: string): void;
  onSave(identity: SidebarIdentity): void;
  onCreate(identity: SidebarIdentity): void;
}

export function IdentityManagerPanel({
  identities,
  currentIdentity,
  onSwitch,
  onDelete,
  onSave,
  onCreate
}: IdentityManagerPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(currentIdentity.name);
  const [email, setEmail] = useState(currentIdentity.email);
  const [website, setWebsite] = useState(currentIdentity.website);

  const handleSave = () => {
    onSave({
      ...currentIdentity,
      name: name.trim(),
      email: email.trim(),
      website: website.trim()
    });
    setIsEditing(false);
  };

  const handleCreate = () => {
    onCreate({
      id: createId(),
      name: '',
      email: '',
      website: ''
    });
  };

  return (
    <WorkspacePanel
      title="Identities"
      actions={
        <div className="ai-link-panel__action-row">
          <button
            type="button"
            className="ai-link-icon-button"
            onClick={handleCreate}
            title="Add identity"
          >
            +
          </button>
        </div>
      }
    >
      <div className="ai-link-settings">
        <ul className="ai-link-queue">
          {identities.map((identity) => (
            <li
              key={identity.id}
              className={
                identity.id === currentIdentity.id
                  ? 'ai-link-queue__item ai-link-queue__item--manager is-active'
                  : 'ai-link-queue__item ai-link-queue__item--manager'
              }
            >
              <button
                type="button"
                className="ai-link-queue__button ai-link-queue__button--manager"
                onClick={() => onSwitch(identity.id)}
              >
                <span className="ai-link-queue__main">
                  <strong>{identity.name || 'Unnamed'}</strong>
                  <small>{identity.email}</small>
                </span>
              </button>
              {identity.id !== currentIdentity.id && (
                <button
                  type="button"
                  className="ai-link-icon-button"
                  onClick={() => onDelete(identity.id)}
                  title="Delete"
                >
                  x
                </button>
              )}
            </li>
          ))}
        </ul>

        {isEditing ? (
          <>
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
            <div className="ai-link-panel__action-row">
              <button type="button" className="ai-link-button" onClick={handleSave}>
                Save
              </button>
              <button
                type="button"
                className="ai-link-button"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            className="ai-link-button"
            onClick={() => {
              setName(currentIdentity.name);
              setEmail(currentIdentity.email);
              setWebsite(currentIdentity.website);
              setIsEditing(true);
            }}
          >
            Edit Current Identity
          </button>
        )}
      </div>
    </WorkspacePanel>
  );
}
