import type { OpenRouterConfig } from '@/core/ai/providers/openrouter-provider';

export const DEFAULT_OPENROUTER_MODEL = 'deepseek/deepseek-v4-flash';
export const OPENROUTER_CONFIG_STORAGE_KEY = 'openrouterConfig';

export interface StoredOpenRouterConfig {
  apiKey: string;
  model: string;
  timeoutMs: number;
}

export async function loadOpenRouterConfig(): Promise<OpenRouterConfig> {
  const stored = await chrome.storage.local.get(OPENROUTER_CONFIG_STORAGE_KEY);
  const config = stored[OPENROUTER_CONFIG_STORAGE_KEY] as Partial<OpenRouterConfig> | undefined;

  return {
    apiKey: config?.apiKey ?? import.meta.env.WXT_OPENROUTER_API_KEY ?? '',
    model: config?.model ?? import.meta.env.WXT_OPENROUTER_MODEL ?? DEFAULT_OPENROUTER_MODEL,
    timeoutMs: config?.timeoutMs ?? 30000
  };
}

export async function saveOpenRouterConfig(config: Partial<StoredOpenRouterConfig>): Promise<void> {
  const existing = await loadOpenRouterConfig();
  await chrome.storage.local.set({
    [OPENROUTER_CONFIG_STORAGE_KEY]: {
      apiKey: config.apiKey ?? existing.apiKey,
      model: config.model ?? existing.model,
      timeoutMs: config.timeoutMs ?? existing.timeoutMs ?? 30000
    }
  });
}

export async function loadStoredOpenRouterConfig(): Promise<StoredOpenRouterConfig> {
  const config = await loadOpenRouterConfig();
  return {
    apiKey: config.apiKey,
    model: config.model,
    timeoutMs: config.timeoutMs ?? 30000
  };
}
