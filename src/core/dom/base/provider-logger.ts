import type { ProviderDebugLogger } from '@/core/dom/comment-provider';

export interface ProviderDebugOptions {
  enabled: boolean;
  logger: ProviderDebugLogger;
}

export const noopProviderLogger: ProviderDebugLogger = {
  debug() {}
};

export function createConsoleProviderLogger(enabled = false): ProviderDebugOptions {
  return {
    enabled,
    logger: enabled ? consoleProviderLogger : noopProviderLogger
  };
}

const consoleProviderLogger: ProviderDebugLogger = {
  debug(message, context) {
    console.debug(`[ai-link-provider] ${message}`, context ?? {});
  }
};
