import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('sidebar app composes the required workspace sections', () => {
  const sidebarApp = read('src/ui/sidebar/SidebarApp.tsx');

  [
    'ProjectSummary',
    'QueueList',
    'ArticleAnalysisPanel',
    'GeneratedCommentPanel',
    'StatusPanel',
    'ActionBar'
  ].forEach((componentName) => {
    assert.match(sidebarApp, new RegExp(`<${componentName}\\b`));
  });
});

test('sidebar exposes the required action labels without business logic', () => {
  const actionBar = read('src/ui/sidebar/components/sidebar/ActionBar.tsx');

  [
    'Generate Comment',
    'Fill',
    'Next',
    'Skip',
    'Regenerate'
  ].forEach((label) => {
    assert.match(actionBar, new RegExp(label));
  });

  assert.doesNotMatch(actionBar, /openrouter|querySelector|indexedDB/i);
});

test('sidebar store contains mock state and no persistence dependency', () => {
  const store = read('src/ui/sidebar/store/workspace-store.ts');

  [
    'currentProject',
    'queueItems',
    'articleAnalysis',
    'commentState',
    'status'
  ].forEach((stateKey) => {
    assert.match(store, new RegExp(stateKey));
  });

  assert.doesNotMatch(store, /indexedDB|localStorage|chrome\\.storage/i);
});
