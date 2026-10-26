import type { GeneratedCommentResult, GenerateCommentInput } from '@/core/ai/ai-provider';
import { validateGeneratedComment, type CommentValidationResult } from '@/core/ai/comment-validator';
import { AIProviderError } from '@/core/ai/errors';
import type { CommentHistoryEntry } from '@/core/types/comment-history';

export interface CommentGenerationWorkflowResult extends GeneratedCommentResult {
  validation: CommentValidationResult;
}

export async function generateReviewedComment(
  input: GenerateCommentInput,
  generate: (input: GenerateCommentInput) => Promise<GeneratedCommentResult>
): Promise<CommentGenerationWorkflowResult> {
  const budgets = [600, 1200, 2000];
  let lastError: Error | undefined;
  for (let attempt = 0; attempt < budgets.length; attempt++) {
    try {
      const result = await generate({ ...input, outputTokenLimit: budgets[attempt] });
      const validation = validateGeneratedComment(result.comment, input.mode, input.article.language, input.project.website);
      if (validation.valid) return { ...result, validation };
      lastError = new AIProviderError(`Comment validation failed: ${validation.issues.join(', ')} (attempt ${attempt + 1}/3)`, 'validation_failed');
    } catch (error) {
      if (!(error instanceof AIProviderError)) throw error;
      if (!['output_truncated', 'context_length_exceeded', 'validation_failed'].includes(error.code)) throw error;
      lastError = error;
    }
    // Trim secondary context for retries without losing metadata and target URL.
    input = { ...input, previousComments: [], article: { ...input.article, summary: input.article.summary.slice(0, attempt === 0 ? 250 : 120) } };
  }
  throw lastError ?? new AIProviderError('AI generation exhausted retry attempts.', 'validation_failed');
}

export function createCommentHistoryEntry(params: {
  targetId: string;
  projectId: string;
  mode: GenerateCommentInput['mode'];
  result: CommentGenerationWorkflowResult;
}): CommentHistoryEntry {
  return {
    id: `${params.targetId}-${Date.now()}`,
    targetId: params.targetId,
    projectId: params.projectId,
    comment: params.result.comment,
    mode: params.mode,
    model: params.result.model,
    tokenUsage: params.result.usage,
    validationIssues: params.result.validation.issues,
    createdAt: Date.now()
  };
}
