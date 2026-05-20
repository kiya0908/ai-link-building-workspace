import { create } from 'zustand';
import { createId } from '@/shared/id';
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
  identities: SidebarIdentity[];
  projectIdentityIds: Record<string, string>;
  currentIdentityId: string;
  identity: SidebarIdentity;
  queueItems: QueueItem[];
  articleAnalysis: SidebarArticleAnalysis;
  commentState: CommentState;
  status: SidebarStatus;
  hydrateWorkspace(): Promise<void>;
  toggle(): void;
  runAction(action: SidebarAction): void;
  createWorkspaceProfile(project: SidebarProject, identity: SidebarIdentity): void;
  switchProject(projectId: string): void;
  deleteProject(projectId: string): void;
  updateProject(project: SidebarProject): void;
  setIdentity(identity: SidebarIdentity): void;
  switchIdentity(identityId: string): void;
  createIdentity(identity: SidebarIdentity): void;
  deleteIdentity(identityId: string): void;
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
  identities: [
    {
      id: 'identity-1',
      name: '',
      email: '',
      website: 'https://dogagecalculator.info'
    }
  ],
  projectIdentityIds: {
    'project-1': 'identity-1'
  },
  currentIdentityId: 'identity-1',
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
      identities: stored.identities,
      projectIdentityIds: stored.projectIdentityIds,
      currentIdentityId: stored.currentIdentityId,
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
      const nextIdentities = upsertIdentity(state.identities, identity);
      const nextProjectIdentityIds = {
        ...state.projectIdentityIds,
        [project.id]: identity.id
      };
      const nextState = {
        projects: [...state.projects, project],
        currentProject: project,
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: identity.id,
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
      const projectScopedIdentity = createProjectScopedIdentity(
        state.projects,
        state.projectIdentityIds,
        state.currentProject.id,
        identity
      );
      const nextIdentities = upsertIdentity(state.identities, projectScopedIdentity);
      const nextProjectIdentityIds = {
        ...state.projectIdentityIds,
        [state.currentProject.id]: projectScopedIdentity.id
      };
      const nextState = {
        projects: state.projects,
        currentProject: state.currentProject,
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: projectScopedIdentity.id,
        identity: projectScopedIdentity
      };
      void saveStoredWorkspace(nextState);
      return {
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: projectScopedIdentity.id,
        identity: projectScopedIdentity,
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
    })),
  switchProject: (projectId) =>
    set((state) => {
      const project = state.projects.find((p) => p.id === projectId);
      if (!project) {
        return state;
      }
      const identityId = state.projectIdentityIds[project.id] ?? state.currentIdentityId;
      const identity = state.identities.find((item) => item.id === identityId) ?? state.identity;
      const nextState = {
        projects: state.projects,
        currentProject: project,
        identities: state.identities,
        projectIdentityIds: {
          ...state.projectIdentityIds,
          [project.id]: identity.id
        },
        currentIdentityId: identity.id,
        identity
      };
      void saveStoredWorkspace(nextState);
      return {
        currentProject: project,
        projectIdentityIds: nextState.projectIdentityIds,
        currentIdentityId: identity.id,
        identity,
        commentState: {
          ...state.commentState,
          mode: project.defaultCommentMode
        },
        status: {
          label: 'Project switched',
          detail: `${project.brand} is now the active project.`,
          tone: 'success'
        }
      };
    }),
  deleteProject: (projectId) =>
    set((state) => {
      const nextProjects = state.projects.filter((p) => p.id !== projectId);
      const nextCurrent =
        state.currentProject.id === projectId
          ? (nextProjects[0] ?? state.currentProject)
          : state.currentProject;
      const nextProjectIdentityIds = Object.fromEntries(
        Object.entries(state.projectIdentityIds).filter(([mappedProjectId]) => mappedProjectId !== projectId)
      );
      const nextIdentityId = nextProjectIdentityIds[nextCurrent.id] ?? state.currentIdentityId;
      const nextIdentity =
        state.identities.find((item) => item.id === nextIdentityId) ?? state.identity;
      const nextState = {
        projects: nextProjects,
        currentProject: nextCurrent,
        identities: state.identities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: nextIdentity.id,
        identity: nextIdentity
      };
      void saveStoredWorkspace(nextState);
      return {
        ...nextState,
        status: {
          label: 'Project deleted',
          detail: 'The project and its targets have been removed.',
          tone: 'success'
        }
      };
    }),
  updateProject: (project) =>
    set((state) => {
      const nextProjects = state.projects.map((p) =>
        p.id === project.id ? project : p
      );
      const nextCurrent =
        state.currentProject.id === project.id ? project : state.currentProject;
      const nextState = {
        projects: nextProjects,
        currentProject: nextCurrent,
        identities: state.identities,
        projectIdentityIds: state.projectIdentityIds,
        currentIdentityId: state.currentIdentityId,
        identity: state.identity
      };
      void saveStoredWorkspace(nextState);
      return {
        ...nextState,
        status: {
          label: 'Project updated',
          detail: `${project.brand} settings have been saved.`,
          tone: 'success'
        }
      };
    }),
  switchIdentity: (identityId) =>
    set((state) => {
      const identity = state.identities.find((i) => i.id === identityId);
      if (!identity) {
        return state;
      }
      const nextState = {
        projects: state.projects,
        currentProject: state.currentProject,
        identities: state.identities,
        projectIdentityIds: {
          ...state.projectIdentityIds,
          [state.currentProject.id]: identity.id
        },
        currentIdentityId: identity.id,
        identity
      };
      void saveStoredWorkspace(nextState);
      return {
        currentIdentityId: identity.id,
        identity,
        projectIdentityIds: nextState.projectIdentityIds,
        status: {
          label: 'Identity switched',
          detail: `${identity.name || 'Unnamed'} is now the active identity.`,
          tone: 'success'
        }
      };
    }),
  createIdentity: (identity) =>
    set((state) => {
      const nextIdentities = [...state.identities, identity];
      const nextProjectIdentityIds = {
        ...state.projectIdentityIds,
        [state.currentProject.id]: identity.id
      };
      const nextState = {
        projects: state.projects,
        currentProject: state.currentProject,
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: identity.id,
        identity
      };
      void saveStoredWorkspace(nextState);
      return {
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: identity.id,
        identity,
        status: {
          label: 'Identity created',
          detail: `${identity.name || 'Unnamed'} identity added.`,
          tone: 'success'
        }
      };
    }),
  deleteIdentity: (identityId) =>
    set((state) => {
      const nextIdentities = state.identities.filter((i) => i.id !== identityId);
      const nextIdentity =
        state.identity.id === identityId
          ? (nextIdentities[0] ?? state.identity)
          : state.identity;
      const nextProjectIdentityIds = Object.fromEntries(
        Object.entries(state.projectIdentityIds).map(([projectId, mappedIdentityId]) => [
          projectId,
          mappedIdentityId === identityId ? nextIdentity.id : mappedIdentityId
        ])
      );
      const nextState = {
        projects: state.projects,
        currentProject: state.currentProject,
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: nextIdentity.id,
        identity: nextIdentity
      };
      void saveStoredWorkspace(nextState);
      return {
        identities: nextIdentities,
        projectIdentityIds: nextProjectIdentityIds,
        currentIdentityId: nextIdentity.id,
        identity: nextIdentity,
        status: {
          label: 'Identity deleted',
          detail: 'The identity has been removed.',
          tone: 'success'
        }
      };
    })
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
  identities: SidebarIdentity[];
  projectIdentityIds: Record<string, string>;
  currentIdentityId: string;
  identity: SidebarIdentity;
}

async function loadStoredWorkspace(): Promise<StoredWorkspaceState | null> {
  const stored = await chrome.storage.local.get(WORKSPACE_STORAGE_KEY);
  const value = stored[WORKSPACE_STORAGE_KEY] as Partial<StoredWorkspaceState> | undefined;
  if (!value?.projects || !value.currentProject || !value.identity) {
    return null;
  }

  const identities = value.identities?.length ? value.identities : [value.identity];
  const currentIdentityId = value.currentIdentityId ?? value.identity.id;
  const identity = identities.find((item) => item.id === currentIdentityId) ?? value.identity;
  const projectIdentityIds = value.projectIdentityIds ?? {
    [value.currentProject.id]: identity.id
  };

  return {
    projects: value.projects,
    currentProject: value.currentProject,
    identities,
    projectIdentityIds,
    currentIdentityId: identity.id,
    identity
  };
}

async function saveStoredWorkspace(state: StoredWorkspaceState): Promise<void> {
  await chrome.storage.local.set({
    [WORKSPACE_STORAGE_KEY]: state
  });
}

function upsertIdentity(identities: SidebarIdentity[], identity: SidebarIdentity): SidebarIdentity[] {
  const exists = identities.some((item) => item.id === identity.id);
  if (!exists) {
    return [...identities, identity];
  }

  return identities.map((item) => (item.id === identity.id ? identity : item));
}

function createProjectScopedIdentity(
  projects: SidebarProject[],
  projectIdentityIds: Record<string, string>,
  currentProjectId: string,
  identity: SidebarIdentity
): SidebarIdentity {
  const isSharedWithAnotherProject = projects.some(
    (project) =>
      project.id !== currentProjectId &&
      (projectIdentityIds[project.id] ?? identity.id) === identity.id
  );
  if (!isSharedWithAnotherProject) {
    return identity;
  }

  return {
    ...identity,
    id: createId()
  };
}
