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
}

export interface ProviderDebugLogger {
  debug(message: string, context?: Record<string, unknown>): void;
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
  debug(): ProviderDetectionResult;
}

export interface CommentProviderFactory {
  create(document: Document, learnedRecord?: SiteLearningRecord | null): CommentProvider;
}
