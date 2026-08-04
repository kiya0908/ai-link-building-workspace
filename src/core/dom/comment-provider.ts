import type { SiteLearningRecord } from '@/core/types/site-learning';

export interface CommentFormFields {
  comment: string;
  name?: string;
  email?: string;
  website?: string;
}

export interface ProviderDetectionResult {
  providerId: string;
  detected: boolean;
  confidence: number;
  reason: string;
  capabilities?: ProviderCapabilities;
}

export interface ProviderDebugLogger {
  debug(message: string, context?: Record<string, unknown>): void;
}

export interface ProviderCapabilities {
  iframeReady: boolean;
  contentEditableReady: boolean;
  dynamicPageReady: boolean;
}

export interface ProviderCreateOptions {
  logger?: ProviderDebugLogger;
}

export interface SubmissionPreflightResult {
  canSubmit: boolean;
  reason: string;
}

export interface SubmissionSnapshot {
  url: string;
  comment: string;
  commentWasPresent: boolean;
}

export interface SubmissionCheckResult {
  outcome: 'success' | 'failure' | 'unknown';
  moderationPending: boolean;
  reason: string;
  signals: string[];
}

export interface CommentProvider {
  readonly id: string;
  detect(): boolean;
  getConfidence(): number;
  getCommentBox(): HTMLElement | null;
  getNameInput(): HTMLInputElement | null;
  getEmailInput(): HTMLInputElement | null;
  getWebsiteInput(): HTMLInputElement | null;
  getSubmitButton(): HTMLElement | null;
  fillFields(fields: CommentFormFields): void;
  fillComment(text: string): void;
  scrollToComment(): void;
  checkSubmissionReadiness(): SubmissionPreflightResult;
  createSubmissionSnapshot(comment: string): SubmissionSnapshot;
  submit(): void;
  checkSubmissionResult(snapshot: SubmissionSnapshot): SubmissionCheckResult;
  debug(): ProviderDetectionResult;
}

export interface CommentProviderFactory {
  create(
    document: Document,
    learnedRecord?: SiteLearningRecord | null,
    options?: ProviderCreateOptions
  ): CommentProvider;
}
