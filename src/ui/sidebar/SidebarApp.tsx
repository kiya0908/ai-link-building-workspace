import { useEffect, useMemo } from 'react';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import { GeneratedCommentPanel } from '@/ui/sidebar/components/comment/GeneratedCommentPanel';
import { ArticleAnalysisPanel } from '@/ui/sidebar/components/project/ArticleAnalysisPanel';
import { ProjectSummary } from '@/ui/sidebar/components/project/ProjectSummary';
import { QueueList } from '@/ui/sidebar/components/queue/QueueList';
import { ActionBar } from '@/ui/sidebar/components/sidebar/ActionBar';
import { SidebarErrorBoundary } from '@/ui/sidebar/components/sidebar/SidebarErrorBoundary';
import { StatusPanel } from '@/ui/sidebar/components/status/StatusPanel';
import { useQueueStore } from '@/ui/sidebar/store/queue-store';
import { useWorkspaceStore } from '@/ui/sidebar/store/workspace-store';
import type { SidebarAction } from '@/ui/sidebar/types';

const runtimeClient = createRuntimeMessageClient();

export function SidebarApp() {
  const isOpen = useWorkspaceStore((state) => state.isOpen);
  const toggle = useWorkspaceStore((state) => state.toggle);
  const activeItemId = useWorkspaceStore((state) => state.activeItemId);
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const queueItems = useWorkspaceStore((state) => state.queueItems);
  const articleAnalysis = useWorkspaceStore((state) => state.articleAnalysis);
  const commentState = useWorkspaceStore((state) => state.commentState);
  const status = useWorkspaceStore((state) => state.status);
  const runAction = useWorkspaceStore((state) => state.runAction);
  const setActionError = useWorkspaceStore((state) => state.setActionError);
  const hydrateQueue = useQueueStore((state) => state.hydrateQueue);
  const persistedTargets = useQueueStore((state) => state.targets);
  const persistedCurrentTargetId = useQueueStore((state) => state.currentTargetId);

  useEffect(() => {
    hydrateQueue(currentProject.id).catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : 'Unable to restore queue state.');
    });
  }, [currentProject.id, hydrateQueue, setActionError]);

  const visibleQueueItems = useMemo(() => {
    if (persistedTargets.length === 0) {
      return queueItems;
    }

    return persistedTargets.map((target, index) => ({
      id: target.id,
      projectId: target.projectId,
      url: target.url,
      status: target.status,
      title: target.url,
      domain: getHostname(target.url),
      position: index + 1
    }));
  }, [persistedTargets, queueItems]);

  const visibleActiveItemId = persistedCurrentTargetId ?? activeItemId;

  const handleAction = (action: SidebarAction) => {
    runAction(action);
    runtimeClient.send({ type: 'SIDEBAR_ACTION', payload: { action } }).catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : 'Unable to send sidebar action.');
    });
  };

  return (
    <SidebarErrorBoundary>
      <aside className={isOpen ? 'ai-link-sidebar is-open' : 'ai-link-sidebar'}>
        <button className="ai-link-sidebar__toggle" type="button" onClick={toggle}>
          AI Link
        </button>
        {isOpen ? (
          <div className="ai-link-sidebar__panel">
            <header className="ai-link-sidebar__header">
              <div>
                <h1>AI Link Workspace</h1>
                <p>Sidebar-first backlink workflow</p>
              </div>
            </header>
            <main className="ai-link-sidebar__content">
              <ProjectSummary project={currentProject} />
              <QueueList items={visibleQueueItems} activeItemId={visibleActiveItemId} />
              <ArticleAnalysisPanel
                analysis={articleAnalysis}
                isLoading={status.tone === 'loading' && status.label.includes('Next')}
              />
              <GeneratedCommentPanel commentState={commentState} />
              <StatusPanel status={status} />
              <ActionBar isGenerating={commentState.isGenerating} onAction={handleAction} />
            </main>
          </div>
        ) : null}
      </aside>
    </SidebarErrorBoundary>
  );
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
