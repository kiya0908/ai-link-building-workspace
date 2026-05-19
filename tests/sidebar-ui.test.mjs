import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('sidebar app composes the required workspace sections', () => {
  const sidebarApp = read('src/ui/sidebar/SidebarApp.tsx');

  [
    'SettingsWindow',
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
    'Select Comment Box',
    'Next',
    'Skip',
    'Regenerate'
  ].forEach((label) => {
    assert.match(actionBar, new RegExp(label));
  });

  assert.doesNotMatch(actionBar, /openrouter|querySelector|indexedDB/i);
});

test('sidebar wires manual comment-box learning to IndexedDB selector storage', () => {
  const sidebarApp = read('src/ui/sidebar/SidebarApp.tsx');
  const actions = read('src/shared/messaging/sidebar-actions.ts');

  assert.match(actions, /select_comment_box/);
  assert.match(sidebarApp, /startManualLearning/);
  assert.match(sidebarApp, /storeLearnedSelector/);
  assert.match(sidebarApp, /window\.location\.hostname/);
});

test('sidebar store contains mock state and no persistence dependency', () => {
  const store = read('src/ui/sidebar/store/workspace-store.ts');

  [
    'currentProject',
    'identity',
    'queueItems',
    'articleAnalysis',
    'commentState',
    'status'
  ].forEach((stateKey) => {
    assert.match(store, new RegExp(stateKey));
  });

  assert.match(store, /hydrateWorkspace/);
  assert.match(store, /workspaceProfileState/);
  assert.match(store, /chrome\.storage\.local/);
  assert.doesNotMatch(store, /indexedDB|localStorage/i);
});

test('settings window separates project, identity, and AI settings from main workflow', () => {
  const settingsWindow = read('src/ui/sidebar/components/settings/SettingsWindow.tsx');
  const profilePanel = read('src/ui/sidebar/components/settings/WorkspaceProfilePanel.tsx');
  const sidebarApp = read('src/ui/sidebar/SidebarApp.tsx');

  assert.match(sidebarApp, /SettingsWindow/);
  assert.match(settingsWindow, /WorkspaceProfilePanel/);
  assert.match(settingsWindow, /AISettingsPanel/);
  assert.match(profilePanel, /Workspace Profile/);
  assert.match(profilePanel, /Project/);
  assert.match(profilePanel, /Comment Identity/);
  assert.match(profilePanel, /useEffect/);
  ['Name', 'Email', 'Website'].forEach((label) => {
    assert.match(profilePanel, new RegExp(label));
  });
});

test('workspace profile supports file import and example downloads', () => {
  const importMenu = read('src/ui/sidebar/components/settings/WorkspaceProfileImportMenu.tsx');
  const parser = read('src/core/workspace/workspace-profile-import.ts');
  const store = read('src/ui/sidebar/store/workspace-store.ts');

  assert.match(importMenu, /type="file"/);
  assert.match(importMenu, /Download JSON Example/);
  assert.match(importMenu, /Download CSV Example/);
  assert.match(parser, /commentMode/);
  assert.match(parser, /projectBrand,projectWebsite,projectDescription,commentMode,identityName,identityEmail,identityWebsite/);
  assert.match(store, /createWorkspaceProfile/);
});

test('queue list supports backlink target URL file import', () => {
  const queueList = read('src/ui/sidebar/components/queue/QueueList.tsx');
  const importMenu = read('src/ui/sidebar/components/queue/QueueTargetImportMenu.tsx');
  const queueStore = read('src/ui/sidebar/store/queue-store.ts');
  const sidebarApp = read('src/ui/sidebar/SidebarApp.tsx');
  const css = read('src/ui/sidebar/sidebar.css');

  assert.match(queueList, /QueueTargetImportMenu/);
  assert.match(queueList, /onOpen/);
  assert.match(queueList, /ai-link-queue__button/);
  assert.match(importMenu, /Import Targets JSON\/CSV/);
  assert.match(importMenu, /parseTargetsFromCsv/);
  assert.match(importMenu, /parseTargetsFromJson/);
  assert.match(importMenu, /backlink-targets-example/);
  assert.match(importMenu, /did not contain any valid target URLs/);
  assert.match(queueStore, /importTargets/);
  assert.match(queueStore, /QUEUE_IMPORT_TARGETS/);
  assert.match(queueStore, /openTarget/);
  assert.match(sidebarApp, /openNextTarget/);
  assert.doesNotMatch(sidebarApp, /return queueItems/);
  assert.match(queueList, /No targets imported yet/);
  assert.match(sidebarApp, /window\.location\.href = target\.url/);
  assert.match(css, /max-height: 188px/);
  assert.match(css, /overflow-y: auto/);
});
