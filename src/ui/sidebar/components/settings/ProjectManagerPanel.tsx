import { useState } from 'react';
import { createId } from '@/shared/id';
import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { SidebarProject } from '@/ui/sidebar/types';

interface ProjectManagerPanelProps {
  projects: SidebarProject[];
  currentProject: SidebarProject;
  onSwitch(projectId: string): void;
  onDelete(projectId: string): void;
  onUpdate(project: SidebarProject): void;
  onCreate(project: SidebarProject): void;
  onError(message: string): void;
}

export function ProjectManagerPanel({
  projects,
  currentProject,
  onSwitch,
  onDelete,
  onUpdate,
  onCreate,
  onError
}: ProjectManagerPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [brand, setBrand] = useState(currentProject.brand);
  const [website, setWebsite] = useState(currentProject.website);
  const [description, setDescription] = useState(currentProject.description);

  const handleSave = () => {
    const trimmedBrand = brand.trim();
    if (!trimmedBrand) {
      onError('Project brand is required.');
      return;
    }
    onUpdate({
      ...currentProject,
      brand: trimmedBrand,
      website: website.trim(),
      description: description.trim()
    });
    setIsEditing(false);
  };

  const handleCreate = () => {
    const id = createId();
    onCreate({
      id,
      name: `Project ${projects.length + 1}`,
      brand: `New Project ${projects.length + 1}`,
      website: '',
      description: '',
      defaultCommentMode: 'soft_mention'
    });
  };

  return (
    <WorkspacePanel
      title="Projects"
      actions={
        <div className="ai-link-panel__action-row">
          <button
            type="button"
            className="ai-link-icon-button"
            onClick={handleCreate}
            title="Add project"
          >
            +
          </button>
        </div>
      }
    >
      <div className="ai-link-settings">
        <ul className="ai-link-queue">
          {projects.map((project) => (
            <li
              key={project.id}
              className={
                project.id === currentProject.id
                  ? 'ai-link-queue__item ai-link-queue__item--manager is-active'
                  : 'ai-link-queue__item ai-link-queue__item--manager'
              }
            >
              <button
                type="button"
                className="ai-link-queue__button ai-link-queue__button--manager"
                onClick={() => onSwitch(project.id)}
              >
                <span className="ai-link-queue__main">
                  <strong>{project.brand}</strong>
                  <small>{project.website}</small>
                </span>
              </button>
              {project.id !== currentProject.id && (
                <button
                  type="button"
                  className="ai-link-icon-button"
                  onClick={() => onDelete(project.id)}
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
              <span>Brand</span>
              <input
                type="text"
                value={brand}
                onChange={(event) => setBrand(event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Website</span>
              <input
                type="url"
                value={website}
                onChange={(event) => setWebsite(event.currentTarget.value)}
              />
            </label>
            <label>
              <span>Description</span>
              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.currentTarget.value)}
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
              setBrand(currentProject.brand);
              setWebsite(currentProject.website);
              setDescription(currentProject.description);
              setIsEditing(true);
            }}
          >
            Edit Current Project
          </button>
        )}
      </div>
    </WorkspacePanel>
  );
}
