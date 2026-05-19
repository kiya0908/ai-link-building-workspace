import { WorkspacePanel } from '@/ui/sidebar/components/sidebar/WorkspacePanel';
import type { SidebarProject } from '@/ui/sidebar/types';

interface ProjectSummaryProps {
  project: SidebarProject;
}

export function ProjectSummary({ project }: ProjectSummaryProps) {
  return (
    <WorkspacePanel title="Current Project">
      <div className="ai-link-project">
        <div>
          <strong>{project.name}</strong>
          <span>{project.brand}</span>
        </div>
        <a href={project.website} target="_blank" rel="noreferrer">
          {project.website}
        </a>
        <p>{project.description}</p>
      </div>
    </WorkspacePanel>
  );
}
