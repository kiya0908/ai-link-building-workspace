import { createRoot } from 'react-dom/client';
import { createContentDomMessageHandlers } from '@/content/dom/content-dom-handlers';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import { createRuntimeMessageRouter } from '@/shared/messaging/runtime-router';
import { SidebarApp } from '@/ui/sidebar/SidebarApp';
import '@/ui/sidebar/sidebar.css';

const SIDEBAR_ROOT_ID = 'ai-link-building-workspace-sidebar-root';

function ensureSidebarRoot(): HTMLElement {
  const existingRoot = document.getElementById(SIDEBAR_ROOT_ID);
  if (existingRoot) {
    return existingRoot;
  }

  const root = document.createElement('div');
  root.id = SIDEBAR_ROOT_ID;
  document.documentElement.append(root);
  return root;
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_idle',
  main() {
    createRuntimeMessageRouter(createContentDomMessageHandlers(document)).attach();
    createRuntimeMessageClient().send({ type: 'SIDEBAR_READY' }).catch(() => {
      // Background may be restarting under Manifest V3; UI remains usable with mock state.
    });
    createRoot(ensureSidebarRoot()).render(<SidebarApp />);
  }
});
