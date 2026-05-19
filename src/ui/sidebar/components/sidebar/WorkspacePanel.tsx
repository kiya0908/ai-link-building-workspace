import type { ReactNode } from 'react';

interface WorkspacePanelProps {
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

export function WorkspacePanel({ title, actions, children }: WorkspacePanelProps) {
  return (
    <section className="ai-link-panel" aria-labelledby={`ai-link-panel-${title}`}>
      <div className="ai-link-panel__header">
        <h2 id={`ai-link-panel-${title}`}>{title}</h2>
        {actions ? <div className="ai-link-panel__actions">{actions}</div> : null}
      </div>
      <div className="ai-link-panel__body">{children}</div>
    </section>
  );
}
