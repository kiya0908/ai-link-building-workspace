import { create } from 'zustand';
import type { GenerateCommentResponse } from '@/shared/messaging/messages';
import type {
  CommentState,
  QueueItem,
  SidebarAction,
  SidebarArticleAnalysis,
  SidebarIdentity,
  SidebarProject,
  SidebarStatus
} from '@/ui/sidebar/types';

interface WorkspaceStore {
  isOpen: boolean;
  activeItemId: string | null;
  isHydrated: boolean;
  projects: SidebarProject[];
  currentProject: SidebarProject;
  identity: SidebarIdentity;
  queueItems: QueueItem[];
  articleAnalysis: SidebarArticleAnalysis;
  commentState: CommentState;
  status: SidebarStatus;
  hydrateWorkspace(): Promise<void>;
  toggle(): void;
  runAction(action: SidebarAction): void;
  createWorkspaceProfile(project: SidebarProject, identity: SidebarIdentity): void;
  setIdentity(identity: SidebarIdentity): void;
  setArticleAnalysis(analysis: SidebarArticleAnalysis): void;
  setGeneratedComment(result: GenerateCommentResponse): void;
  setActionSuccess(label: string, detail: string): void;
  setActionError(message: string): void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  isOpen: true,
  activeItemId: 'target-1',
  isHydrated: false,
  projects: [
    {
      id: 'project-1',
      name: 'Primary Workspace',
      brand: 'Dog Age Calculator',
      website: 'https://dogagecalculator.info',
      description: 'Soft mention backlink workflow for pet care blog comments.',
      defaultCommentMode: 'soft_mention'
    }
  ],
  currentProject: {
    id: 'project-1',
    name: 'Primary Workspace',
    brand: 'Dog Age Calculator',
    website: 'https://dogagecalculator.info',
    description: 'Soft mention backlink workflow for pet care blog comments.',
    defaultCommentMode: 'soft_mention'
  },
  identity: {
    id: 'identity-1',
    name: '',
    email: '',
    website: 'https://dogagecalculator.info'
  },
  queueItems: [],
  articleAnalysis: {
    title: 'Current page not analyzed',
    summary: 'Click Generate Comment to analyze the current browser page.',
    language: 'unknown',
    detectedProvider: 'Not analyzed',
    qualityScore: 0
  },
  commentState: {
    draft:
      'This is a placeholder comment draft. Real AI generation will be connected in a later task.',
    mode: 'soft_mention',
    style: 'friendly',
    isGenerating: false,
    error: null,
    model: null,
    tokenUsage: null,
    validationIssues: []
  },
  status: {
    label: 'Ready',
    detail: 'Import targets, open a page, then generate a reviewed comment.',
    tone: 'idle'
  },
  hydrateWorkspace: async () => {
    const stored = await loadStoredWorkspace();
    if (!stored) {
      set({ isHydrated: true });
      return;
    }

    set((state) => ({
      isHydrated: true,
      projects: stored.projects,
      currentProject: stored.currentProject,
      identity: stored.identity,
      commentState: {
        ...state.commentState,
        mode: stored.currentProject.defaultCommentMode
      }
    }));
  },
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  createWorkspaceProfile: (project, identity) =>
    set((state) => {
      const nextState = {
        projects: [...state.projects, project],
        currentProject: project,
        identity
      };
      void saveStoredWorkspace(nextState);
      return {
        ...nextState,
        commentState: {
          ...state.commentState,
          mode: project.defaultCommentMode
        },
        status: {
          label: 'Workspace profile imported',
          detail: `${project.brand} was added and selected.`,
          tone: 'success'
        }
      };
    }),
  setIdentity: (identity) =>
    set((state) => {
      const nextState = {
        projects: state.projects,
        currentProject: state.currentProject,
        identity
      };
      void saveStoredWorkspace(nextState);
      return {
        identity,
        status: {
          label: 'Identity saved',
          detail: 'Name, email, and website will be used when filling comment forms.',
          tone: 'success'
        }
      };
    }),
  runAction: (action) =>
    set((state) => ({
      commentState: {
        ...state.commentState,
        isGenerating: action === 'generate' || action === 'regenerate',
        error: null,
        validationIssues: []
      },
      status: {
        label: actionLabelMap[action],
        detail: actionDetailMap[action],
        tone: action === 'fill' ? 'warning' : 'loading'
      }
    })),
  setArticleAnalysis: (analysis) =>
    set({
      articleAnalysis: analysis,
      status: {
        label: 'Page analyzed',
        detail: 'Article summary and DOM provider quality are ready for generation.',
        tone: 'success'
      }
    }),
  setGeneratedComment: (result) =>
    set((state) => ({
      commentState: {
        ...state.commentState,
        draft: result.comment,
        isGenerating: false,
        error: result.validation.valid
          ? null
          : `Generated comment needs review: ${result.validation.issues.join(', ')}`,
        model: result.model,
        tokenUsage: result.usage,
        validationIssues: result.validation.issues
      },
      status: {
        label: 'Comment ready',
        detail: 'Review the draft, then click Fill when it is acceptable.',
        tone: result.validation.valid ? 'success' : 'warning'
      }
    })),
  setActionError: (message) =>
    set((state) => ({
      commentState: {
        ...state.commentState,
        isGenerating: false,
        error: message
      },
      status: {
        label: 'Action failed',
        detail: message,
        tone: 'error'
      }
    })),
  setActionSuccess: (label, detail) =>
    set((state) => ({
      commentState: {
        ...state.commentState,
        isGenerating: false,
        error: null
      },
      status: {
        label,
        detail,
        tone: 'success'
      }
    }))
}));

const actionLabelMap: Record<SidebarAction, string> = {
  generate: 'Generate requested',
  fill: 'Fill requested',
  next: 'Next requested',
  skip: 'Skip requested',
  regenerate: 'Regenerate requested',
  select_comment_box: 'Select comment box'
};

const actionDetailMap: Record<SidebarAction, string> = {
  generate: 'Message scaffold sent; AI generation is intentionally not implemented yet.',
  fill: 'Fill request sent to the DOM provider layer.',
  next: 'Message scaffold sent; queue navigation will be connected in a later task.',
  skip: 'Message scaffold sent; queue skipping will be connected in a later task.',
  regenerate: 'Message scaffold sent; AI generation is intentionally not implemented yet.',
  select_comment_box: 'Click the page comment box. Press Escape to cancel.'
};

const WORKSPACE_STORAGE_KEY = 'workspaceProfileState';

interface StoredWorkspaceState {
  projects: SidebarProject[];
  currentProject: SidebarProject;
  identity: SidebarIdentity;
}

async function loadStoredWorkspace(): Promise<StoredWorkspaceState | null> {
  const stored = await chrome.storage.local.get(WORKSPACE_STORAGE_KEY);
  return (stored[WORKSPACE_STORAGE_KEY] as StoredWorkspaceState | undefined) ?? null;
}

async function saveStoredWorkspace(state: StoredWorkspaceState): Promise<void> {
  await chrome.storage.local.set({
    [WORKSPACE_STORAGE_KEY]: state
  });
}
