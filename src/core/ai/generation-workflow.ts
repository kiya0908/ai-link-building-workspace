import type { GeneratedCommentResult, GenerateCommentInput } from '@/core/ai/ai-provider';
import { validateGeneratedComment, type CommentValidationResult } from '@/core/ai/comment-validator';
import type { CommentHistoryEntry } from '@/core/types/comment-history';

export interface CommentGenerationWorkflowResult extends GeneratedCommentResult {
  validation: CommentValidationResult;
}

export async function generateReviewedComment(
  input: GenerateCommentInput,
  generate: (input: GenerateCommentInput) => Promise<GeneratedCommentResult>
): Promise<CommentGenerationWorkflowResult> {
  const result = await generate(input);
  return {
    ...result,
    validation: validateGeneratedComment(result.comment, input.mode)
  };
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
