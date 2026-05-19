import type {
  AIProvider,
  GeneratedCommentResult,
  GenerateCommentInput,
  TokenUsage
} from '@/core/ai/ai-provider';
import { sanitizeGeneratedComment, stripUnsafeHtml } from '@/core/ai/comment-sanitizer';
import { AIProviderError } from '@/core/ai/errors';
import { buildCommentPrompt, COMMENT_SYSTEM_PROMPT } from '@/core/ai/prompts/comment-prompt';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
}

export class OpenRouterProvider implements AIProvider {
  constructor(private readonly config: OpenRouterConfig) {}

  async generateComment(input: GenerateCommentInput): Promise<GeneratedCommentResult> {
    if (!this.config.apiKey) {
      throw new AIProviderError('OpenRouter API key is not configured.', 'missing_api_key');
    }

    const response = await this.requestWithTimeout(input);
    const rawComment = response.choices?.[0]?.message?.content;

    if (!rawComment) {
      throw new AIProviderError('OpenRouter returned an empty comment.', 'invalid_response');
    }

    return {
      comment: stripUnsafeHtml(sanitizeGeneratedComment(rawComment)),
      model: this.config.model,
      usage: normalizeUsage(response.usage)
    };
  }

  private async requestWithTimeout(input: GenerateCommentInput): Promise<OpenRouterResponse> {
    const controller = new AbortController();
    const timeout = globalThis.setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30000);

    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ai-link-building-workspace.local',
          'X-Title': 'AI Link Building Workspace'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            { role: 'system', content: COMMENT_SYSTEM_PROMPT },
            { role: 'user', content: buildCommentPrompt(input) }
          ],
          temperature: 0.7,
          max_tokens: 220
        })
      });

      if (response.status === 429) {
        throw new AIProviderError('OpenRouter rate limit reached. Try again later.', 'rate_limited');
      }

      const payload = (await response.json()) as OpenRouterResponse;

      if (!response.ok) {
        throw new AIProviderError(payload.error?.message ?? 'OpenRouter request failed.', 'request_failed');
      }

      return payload;
    } catch (error) {
      if (error instanceof AIProviderError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new AIProviderError('OpenRouter request timed out.', 'timeout');
      }

      throw new AIProviderError(
        error instanceof Error ? error.message : 'OpenRouter request failed.',
        'request_failed'
      );
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
}

function normalizeUsage(usage: OpenRouterResponse['usage']): TokenUsage | null {
  if (!usage) {
    return null;
  }

  return {
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0
  };
}
