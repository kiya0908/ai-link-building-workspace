import { useEffect, useMemo, useRef, useState } from 'react';
import { extractArticle } from '@/core/article/article-extractor';
import { detectDefaultProvider } from '@/content/dom/provider-registry';
import { runPageAutomation } from '@/core/automation/page-automation-workflow';
import type { AutomationMode, AutomationSession } from '@/core/types/automation';
import {
  startManualLearning,
  storeLearnedSelector,
  type ManualLearningSession
} from '@/core/dom/manual/manual-learning';
import { evaluatePageQuality } from '@/core/quality/quality-filter';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import type { LinkAsset } from '@/core/types/project';
import { createIndexedDBLinkAssetRepository } from '@/core/storage/repositories/link-asset-repository';
import type { GenerateCommentResponse, QueueSnapshotResponse } from '@/shared/messaging/messages';
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
  const projects = useWorkspaceStore((state) => state.projects);
  const switchProject = useWorkspaceStore((state) => state.switchProject);
  const createWorkspaceProfile = useWorkspaceStore((state) => state.createWorkspaceProfile);
  const setIdentity = useWorkspaceStore((state) => state.setIdentity);
  const setArticleAnalysis = useWorkspaceStore((state) => state.setArticleAnalysis);
  const setGeneratedComment = useWorkspaceStore((state) => state.setGeneratedComment);
  const setActionSuccess = useWorkspaceStore((state) => state.setActionSuccess);
  const setActionError = useWorkspaceStore((state) => state.setActionError);
  const identities = useWorkspaceStore((state) => state.identities);
  const createIdentity = useWorkspaceStore((state) => state.createIdentity);
  const switchIdentity = useWorkspaceStore((state) => state.switchIdentity);
  const deleteIdentity = useWorkspaceStore((state) => state.deleteIdentity);
  const deleteProject = useWorkspaceStore((state) => state.deleteProject);
  const updateProject = useWorkspaceStore((state) => state.updateProject);
  const hydrateQueue = useQueueStore((state) => state.hydrateQueue);
  const importTargets = useQueueStore((state) => state.importTargets);
  const openTarget = useQueueStore((state) => state.openTarget);
  const openNextTarget = useQueueStore((state) => state.openNextTarget);
  const updateTargetStatus = useQueueStore((state) => state.updateStatus);
  const updateSubmissionStatus = useQueueStore((state) => state.updateSubmissionStatus);
  const persistedTargets = useQueueStore((state) => state.targets);
  const persistedCurrentTargetId = useQueueStore((state) => state.currentTargetId);
  const manualLearningSession = useRef<ManualLearningSession | null>(null);
  const automationStartedForPage = useRef(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [automationMode, setAutomationMode] = useState<AutomationMode>('auto_submit');
  const [automationSession, setAutomationSession] = useState<AutomationSession | null>(null);

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

  const visibleActiveItemId = persistedCurrentTargetId ?? activeItemId;

  const visibleQueueItems = useMemo(() => {
    return persistedTargets.map((target, index) => ({
      id: target.id,
      projectId: target.projectId,
      url: target.url,
      status: target.status,
      submissionStatus: target.submissionStatus ?? 'unknown',
      title: target.url,
      domain: getHostname(target.url),
      position: index + 1
    }));
  }, [persistedTargets]);
  const [linkAsset, setLinkAsset] = useState<LinkAsset | null>(null);

  useEffect(() => {
    if (!currentProject.id) {
      return;
    }
    createIndexedDBLinkAssetRepository()
      .getDefaultForProject(currentProject.id)
      .then(setLinkAsset)
      .catch(() => {
        setLinkAsset(null);
      });
  }, [currentProject.id]);

  useEffect(() => {
    if (!isWorkspaceHydrated || automationStartedForPage.current) return;
    automationStartedForPage.current = true;
    runtimeClient
      .send<AutomationSession | null>({ type: 'AUTOMATION_GET' })
      .then((session) => {
        setAutomationSession(session);
        if (!session?.running || session.projectId !== currentProject.id) return session;
        return runPageAutomation(document, {
          project: currentProject,
          identity,
          linkAsset,
          style: commentState.style
        });
      })
      .then((session) => {
        if (session) setAutomationSession(session);
      })
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : 'Automatic workflow failed.');
      });
  }, [commentState.style, currentProject, identity, isWorkspaceHydrated, linkAsset, setActionError]);

  const toggleAutomation = () => {
    if (automationSession?.running) {
      runtimeClient.send<AutomationSession | null>({ type: 'AUTOMATION_STOP' }).then(setAutomationSession).catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : 'Unable to stop automation.');
      });
      return;
    }
    runtimeClient.send<AutomationSession | null>({
      type: 'AUTOMATION_START',
      payload: { projectId: currentProject.id, mode: automationMode }
    }).then(setAutomationSession).catch((error: unknown) => {
      setActionError(error instanceof Error ? error.message : 'Unable to start automation.');
    });
  };

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

      const targetId = visibleActiveItemId ?? window.location.href;
      updateTargetStatus(targetId, 'analyzed').catch(() => {
        // Silently ignore status update failures
      });

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
            targetId
          }
        })
        .then((result) => {
          setGeneratedComment(result);
          updateTargetStatus(targetId, 'generated').catch(() => {
            // Silently ignore status update failures
          });
        })
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

      createIndexedDBLinkAssetRepository()
        .getDefaultForProject(currentProject.id)
        .catch(() => linkAsset)
        .then((latestLinkAsset) => {
          const websiteValue =
            (commentState.mode === 'html_link' && latestLinkAsset?.htmlCode) ||
            (commentState.mode === 'plain_url' && latestLinkAsset?.plainUrl) ||
            latestLinkAsset?.anchorText ||
            identity.website ||
            currentProject.website;

          setLinkAsset(latestLinkAsset);
          provider.fillFields({
            comment: commentState.draft,
            name: identity.name,
            email: identity.email,
            website: websiteValue
          });
          provider.scrollToComment();

          const targetId = visibleActiveItemId ?? window.location.href;
          updateTargetStatus(targetId, 'filled').catch(() => {
            // Silently ignore status update failures
          });

          setActionSuccess('Comment filled', 'Review the page fields and submit manually when ready.');
        });
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

    if (action === 'skip') {
      const targetId = visibleActiveItemId ?? window.location.href;
      updateTargetStatus(targetId, 'skipped')
        .then(() => {
          setActionSuccess('Target skipped', 'The current target has been marked as skipped.');
        })
        .catch((error: unknown) => {
          setActionError(error instanceof Error ? error.message : 'Unable to skip target.');
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
                {projects.length > 1 ? (
                  <select
                    className="ai-link-project-switcher"
                    value={currentProject.id}
                    onChange={(event) => {
                      switchProject(event.currentTarget.value);
                    }}
                    title="Switch project"
                  >
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.brand}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p>Sidebar-first backlink workflow</p>
                )}
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
                onSubmissionStatusChange={(targetId, status) =>
                  updateSubmissionStatus(targetId, status).then(() => {
                    setActionSuccess('Submission result saved', `Target marked as ${status}.`);
                  })
                }
                onExport={() => {
                  runtimeClient
                    .send<string>({
                      type: 'QUEUE_EXPORT_TARGETS_CSV',
                      payload: { projectId: currentProject.id }
                    })
                    .then((content) => {
                      downloadFile(content, `ai-link-queue-targets-${Date.now()}.csv`, 'text/csv');
                      setActionSuccess('Queue targets export started', 'The current project queue was exported.');
                    })
                    .catch((error: unknown) => {
                      setActionError(error instanceof Error ? error.message : 'Unable to export queue targets.');
                    });
                }}
                onImportError={setActionError}
              />
              <ArticleAnalysisPanel
                analysis={articleAnalysis}
                isLoading={status.tone === 'loading' && status.label.includes('Next')}
              />
              <GeneratedCommentPanel commentState={commentState} />
              <StatusPanel status={status} />
              <ActionBar
                isGenerating={commentState.isGenerating}
                isAutomationRunning={Boolean(automationSession?.running)}
                automationMode={automationMode}
                onAutomationModeChange={setAutomationMode}
                onAutomationToggle={toggleAutomation}
                onAction={handleAction}
              />
            </main>
            {isSettingsOpen ? (
              <SettingsWindow
                project={currentProject}
                identity={identity}
                identities={identities}
                projects={projects}
                onProfileImport={createWorkspaceProfile}
                onIdentitySave={setIdentity}
                onCreateIdentity={createIdentity}
                onSwitchIdentity={switchIdentity}
                onDeleteIdentity={deleteIdentity}
                onSwitchProject={switchProject}
                onDeleteProject={deleteProject}
                onUpdateProject={updateProject}
                onCreateProject={(project) => createWorkspaceProfile(project, identity)}
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

function downloadFile(content: string, filename: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
