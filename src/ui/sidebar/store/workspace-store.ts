import { create } from 'zustand';
import type {
  CommentState,
  QueueItem,
  SidebarAction,
  SidebarArticleAnalysis,
  SidebarProject,
  SidebarStatus
} from '@/ui/sidebar/types';

interface WorkspaceStore {
  isOpen: boolean;
  activeItemId: string | null;
  currentProject: SidebarProject;
  queueItems: QueueItem[];
  articleAnalysis: SidebarArticleAnalysis;
  commentState: CommentState;
  status: SidebarStatus;
  toggle(): void;
  runAction(action: SidebarAction): void;
  setActionError(message: string): void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  isOpen: true,
  activeItemId: 'target-1',
  currentProject: {
    id: 'project-1',
    name: 'Primary Workspace',
    brand: 'Dog Age Calculator',
    website: 'https://dogagecalculator.info',
    description: 'Soft mention backlink workflow for pet care blog comments.',
    defaultCommentMode: 'soft_mention'
  },
  queueItems: [
    {
      id: 'target-1',
      projectId: 'project-1',
      url: 'https://example.com/dog-health-guide',
      title: 'Dog health guide',
      domain: 'example.com',
      position: 1,
      status: 'opened'
    },
    {
      id: 'target-2',
      projectId: 'project-1',
      url: 'https://example.org/puppy-care',
      title: 'Puppy care checklist',
      domain: 'example.org',
      position: 2,
      status: 'pending'
    },
    {
      id: 'target-3',
      projectId: 'project-1',
      url: 'https://example.net/senior-dogs',
      title: 'Senior dog nutrition',
      domain: 'example.net',
      position: 3,
      status: 'pending'
    }
  ],
  articleAnalysis: {
    title: 'Dog health guide',
    summary: 'Placeholder summary for the current page analysis panel.',
    language: 'en',
    detectedProvider: 'Not analyzed',
    qualityScore: 72
  },
  commentState: {
    draft:
      'This is a placeholder comment draft. Real AI generation will be connected in a later task.',
    mode: 'soft_mention',
    style: 'friendly',
    isGenerating: false,
    error: null
  },
  status: {
    label: 'Ready',
    detail: 'Sidebar UI is using mock workspace state.',
    tone: 'idle'
  },
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  runAction: (action) =>
    set((state) => ({
      commentState: {
        ...state.commentState,
        isGenerating: action === 'generate' || action === 'regenerate',
        error: null
      },
      status: {
        label: actionLabelMap[action],
        detail: 'Message scaffold sent; business logic is intentionally not implemented yet.',
        tone: action === 'fill' ? 'warning' : 'loading'
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
    }))
}));

const actionLabelMap: Record<SidebarAction, string> = {
  generate: 'Generate requested',
  fill: 'Fill requested',
  next: 'Next requested',
  skip: 'Skip requested',
  regenerate: 'Regenerate requested'
};
