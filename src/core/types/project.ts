export type CommentMode = 'soft_mention' | 'plain_url' | 'html_link';

export interface Project {
  id: string;
  name: string;
  brand: string;
  website: string;
  description: string;
  defaultCommentMode: CommentMode;
}

export interface Identity {
  id: string;
  name: string;
  email: string;
  website: string;
}

export interface LinkAsset {
  id: string;
  projectId: string;
  anchorText: string;
  htmlCode: string;
  plainUrl: string;
}
