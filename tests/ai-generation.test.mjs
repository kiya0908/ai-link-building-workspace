import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('ai provider abstraction and OpenRouter implementation support model config and usage', () => {
  const provider = read('src/core/ai/ai-provider.ts');
  const openrouter = read('src/core/ai/providers/openrouter-provider.ts');
  const config = read('src/core/ai/adapters/openrouter-config.ts');

  assert.match(provider, /interface AIProvider/);
  assert.match(provider, /GeneratedCommentResult/);
  assert.match(provider, /TokenUsage/);
  assert.match(openrouter, /OpenRouterProvider/);
  assert.match(openrouter, /https:\/\/openrouter\.ai\/api\/v1\/chat\/completions/);
  assert.match(openrouter, /rate_limited|timeout|missing_api_key/);
  assert.match(config, /DEFAULT_OPENROUTER_MODEL/);
  assert.match(config, /saveOpenRouterConfig/);
  assert.match(config, /deepseek\/deepseek-v4-flash/);
});

test('sidebar exposes OpenRouter settings form backed by chrome storage', () => {
  const settings = read('src/ui/sidebar/components/settings/AISettingsPanel.tsx');
  const settingsWindow = read('src/ui/sidebar/components/settings/SettingsWindow.tsx');

  assert.match(settings, /OpenRouter API Key/);
  assert.match(settings, /type="password"/);
  assert.match(settings, /saveOpenRouterConfig/);
  assert.match(settings, /loadStoredOpenRouterConfig/);
  assert.match(settingsWindow, /AISettingsPanel/);
});

test('prompt builder isolates article, project, mode, style, and duplicate context', () => {
  const prompt = read('src/core/ai/prompts/comment-prompt.ts');

  ['article.title', 'article.summary', 'article.language', 'project.brand', 'project.website', 'mode', 'style'].forEach(
    (token) => {
      assert.match(prompt, new RegExp(token.replace('.', '\\.')));
    }
  );

  assert.match(prompt, /soft brand mention/);
  assert.match(prompt, /plain URL/);
  assert.match(prompt, /HTML anchor/);
  assert.match(prompt, /previousComments/);
});

test('generation workflow sanitizes, validates, records history, and does not auto-submit', () => {
  const sanitizer = read('src/core/ai/comment-sanitizer.ts');
  const validator = read('src/core/ai/comment-validator.ts');
  const workflow = read('src/core/ai/generation-workflow.ts');
  const background = read('src/shared/messaging/background-handlers.ts');
  const sidebar = read('src/ui/sidebar/SidebarApp.tsx');

  assert.match(sanitizer, /sanitizeGeneratedComment/);
  assert.match(sanitizer, /stripUnsafeHtml/);
  assert.match(validator, /too_many_links|spam_phrase|html_not_allowed/);
  assert.match(workflow, /createCommentHistoryEntry/);
  assert.match(background, /createIndexedDBCommentHistoryRepository/);
  assert.match(background, /GENERATE_COMMENT/);
  assert.match(sidebar, /setGeneratedComment/);
  assert.match(sidebar, /action === 'fill'/);
  assert.doesNotMatch(sidebar, /submit\(\)/);
});
