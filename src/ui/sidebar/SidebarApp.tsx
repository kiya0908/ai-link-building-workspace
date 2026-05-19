import { useEffect, useMemo, useRef, useState } from 'react';
import { extractArticle } from '@/core/article/article-extractor';
import { detectDefaultProvider } from '@/content/dom/provider-registry';
import {
  startManualLearning,
  storeLearnedSelector,
  type ManualLearningSession
} from '@/core/dom/manual/manual-learning';
import { evaluatePageQuality } from '@/core/quality/quality-filter';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import type { GenerateCommentResponse } from '@/shared/messaging/messages';
import { GeneratedCommentPanel } from '@/ui/sidebar/components/comment/GeneratedCommentPanel';
import { ArticleAnalysisPanel } from '@/ui/sidebar/components/project/ArticleAnalysisPanel';
import { QueueList } from '@/ui/sidebar/components/queue/QueueList';
import { SettingsWindow } from '@/ui/sidebar/components/settings/SettingsWindow';
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
  const isWorkspaceHydrated = useWorkspaceStore((state) => state.isHydrated);
  const currentProject = useWorkspaceStore((state) => state.currentProject);
  const identity = useWorkspaceStore((state) => state.identity);
  const articleAnalysis = useWorkspaceStore((state) => state.articleAnalysis);
  const commentState = useWorkspaceStore((state) => state.commentState);
  const status = useWorkspaceStore((state) => state.status);
  const hydrateWorkspace = useWorkspaceStore((state) => state.hydrateWorkspace);
  const runAction = useWorkspaceStore((state) => state.runAction);
  const createWorkspaceProfile = useWorkspaceStore((state) => state.createWorkspaceProfile);
  const setIdentity = useWorkspaceStore((state) => state.setIdentity);
  const setArticleAnalysis = useWorkspaceStore((state) => state.setArticleAnalysis);
  const setGeneratedComment = useWorkspaceStore((state) => state.setGeneratedComment);
  const setActionSuccess = useWorkspaceStore((state) => state.setActionSuccess);
  const setActionError = useWorkspaceStore((state) => state.setActionError);
  const hydrateQueue = useQueueStore((state) => state.hydrateQueue);
  const importTargets = useQueueStore((state) => state.importTargets);
  const openTarget = useQueueStore((state) => state.openTarget);
  const openNextTarget = useQueueStore((state) => state.openNextTarget);
  const persistedTargets = useQueueStore((state) => state.targets);
  const persistedCurrentTargetId = useQueueStore((state) => state.currentTargetId);
  const manualLearningSession = useRef<ManualLearningSession | null>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    hydrateWorkspace().catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : 'Unable to restore workspace profile.');
    });
  }, [hydrateWorkspace, setActionError]);

  useEffect(() => {
    if (!isWorkspaceHydrated) {
      return;
    }

    hydrateQueue(currentProject.id).catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : 'Unable to restore queue state.');
    });
  }, [currentProject.id, hydrateQueue, isWorkspaceHydrated, setActionError]);

  useEffect(() => {
    return () => {
      manualLearningSession.current?.stop();
    };
  }, []);

  const visibleQueueItems = useMemo(() => {
    return persistedTargets.map((target, index) => ({
      id: target.id,
      projectId: target.projectId,
      url: target.url,
      status: target.status,
      title: target.url,
      domain: getHostname(target.url),
      position: index + 1
    }));
  }, [persistedTargets]);

  const visibleActiveItemId = persistedCurrentTargetId ?? activeItemId;

  const handleAction = (action: SidebarAction) => {
    runAction(action);

    if (action === 'select_comment_box') {
      manualLearningSession.current?.stop();
      manualLearningSession.current = startManualLearning(
        document,
        'comment',
        (selector) => {
          storeLearnedSelector(window.location.hostname, 'comment', selector)
            .then(() => {
              setActionSuccess('Comment box saved', `Learned selector: ${selector}`);
            })
            .catch((error: unknown) => {
              setActionError(error instanceof Error ? error.message : 'Unable to save learned selector.');
            });
          manualLearningSession.current = null;
        },
        {
          onCancelled() {
            setActionError('Manual selection cancelled.');
            manualLearningSession.current = null;
          }
        }
      );
      return;
    }

    if (action === 'generate' || action === 'regenerate') {
      const analysis = analyzeCurrentPage();
      setArticleAnalysis(analysis.sidebarAnalysis);
      runtimeClient
        .send<GenerateCommentResponse>({
          type: 'GENERATE_COMMENT',
          payload: {
            article: analysis.article,
            project: {
              id: currentProject.id,
              name: currentProject.name,
              brand: currentProject.brand,
              website: currentProject.website,
              description: currentProject.description,
              defaultCommentMode: currentProject.defaultCommentMode
            },
            style: commentState.style,
            mode: commentState.mode,
            targetId: visibleActiveItemId ?? window.location.href
          }
        })
        .then(setGeneratedComment)
        .catch((error: unknown) => {
          setActionError(error instanceof Error ? error.message : 'Unable to generate comment.');
        });
      return;
    }

    if (action === 'fill') {
      const provider = detectDefaultProvider(document);
      if (!provider) {
        setActionError('No comment provider detected on this page.');
        return;
      }

      provider.fillFields({
        comment: commentState.draft,
        name: identity.name,
        email: identity.email,
        website: identity.website || currentProject.website
      });
      provider.scrollToComment();
      setActionSuccess('Comment filled', 'Review the page fields and submit manually when ready.');
      return;
    }

    if (action === 'next') {
      openNextTarget()
        .then((target) => {
          if (!target) {
            setActionSuccess('Queue complete', 'No pending backlink targets remain.');
            return;
          }

          window.location.href = target.url;
        })
        .catch((error: unknown) => {
          setActionError(error instanceof Error ? error.message : 'Unable to open next target.');
        });
      return;
    }

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
              <button
                type="button"
                className={
                  isSettingsOpen
                    ? 'ai-link-button ai-link-button--compact is-active'
                    : 'ai-link-button ai-link-button--compact'
                }
                onClick={() => setSettingsOpen((value) => !value)}
              >
                Settings
              </button>
            </header>
            <main className="ai-link-sidebar__content">
              <QueueList
                items={visibleQueueItems}
                activeItemId={visibleActiveItemId}
                projectId={currentProject.id}
                onOpen={(item) => {
                  openTarget(item.id)
                    .then((target) => {
                      if (target) {
                        window.location.href = target.url;
                      }
                    })
                    .catch((error: unknown) => {
                      setActionError(error instanceof Error ? error.message : 'Unable to open target.');
                    });
                }}
                onImport={(targets) =>
                  importTargets(targets).then(() => {
                    setActionSuccess('Targets imported', `${targets.length} backlink targets were added.`);
                  })
                }
                onImportError={setActionError}
              />
              <ArticleAnalysisPanel
                analysis={articleAnalysis}
                isLoading={status.tone === 'loading' && status.label.includes('Next')}
              />
              <GeneratedCommentPanel commentState={commentState} />
              <StatusPanel status={status} />
              <ActionBar isGenerating={commentState.isGenerating} onAction={handleAction} />
            </main>
            {isSettingsOpen ? (
              <SettingsWindow
                project={currentProject}
                identity={identity}
                onProfileImport={createWorkspaceProfile}
                onIdentitySave={setIdentity}
                onClose={() => setSettingsOpen(false)}
                onSaved={(message) => setActionSuccess('Settings saved', message)}
                onError={setActionError}
              />
            ) : null}
          </div>
        ) : null}
      </aside>
    </SidebarErrorBoundary>
  );
}

function analyzeCurrentPage() {
  const article = extractArticle(document);
  const provider = detectDefaultProvider(document);
  const quality = evaluatePageQuality(document, provider, article);

  return {
    article,
    sidebarAnalysis: {
      title: article.title,
      summary: article.summary,
      language: article.language || 'unknown',
      detectedProvider: provider?.id ?? 'none',
      qualityScore: quality.score
    }
  };
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
