import type { AIProvider, GenerateCommentInput } from '@/core/ai/ai-provider';

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
}

export class OpenRouterProvider implements AIProvider {
  constructor(private readonly config: OpenRouterConfig) {}

  generateComment(_input: GenerateCommentInput): Promise<string> {
    void this.config;
    throw new Error('OpenRouterProvider.generateComment is not implemented yet.');
  }
}
