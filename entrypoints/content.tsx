import { createRoot } from 'react-dom/client';
import { createContentDomMessageHandlers } from '@/content/dom/content-dom-handlers';
import { createRuntimeMessageClient } from '@/shared/messaging/runtime-client';
import { createRuntimeMessageRouter } from '@/shared/messaging/runtime-router';
import { SidebarApp } from '@/ui/sidebar/SidebarApp';
import sidebarCss from '@/ui/sidebar/sidebar.css?raw';

const SIDEBAR_ROOT_ID = 'ai-link-building-workspace-sidebar-root';
const SIDEBAR_MOUNT_ID = 'ai-link-building-workspace-sidebar-mount';
const SIDEBAR_STYLE_ID = 'ai-link-building-workspace-sidebar-style';
const GLOBAL_INTERACTION_STYLE_ID = 'ai-link-building-workspace-global-interaction-style';

function ensureSidebarRoot(): HTMLElement {
  const host = ensureSidebarHost();
  const shadowRoot = host.shadowRoot ?? host.attachShadow({ mode: 'open' });

  if (!shadowRoot.getElementById(SIDEBAR_STYLE_ID)) {
    const style = document.createElement('style');
    style.id = SIDEBAR_STYLE_ID;
    style.textContent = sidebarCss;
    shadowRoot.prepend(style);
  }

  const existingMount = shadowRoot.getElementById(SIDEBAR_MOUNT_ID);
  if (existingMount) {
    return existingMount;
  }

  const mount = document.createElement('div');
  mount.id = SIDEBAR_MOUNT_ID;
  shadowRoot.append(mount);
  return mount;
}

function ensureSidebarHost(): HTMLElement {
  const existingHost = document.getElementById(SIDEBAR_ROOT_ID);
  if (existingHost) {
    applySidebarHostStyles(existingHost);
    return existingHost;
  }

  const host = document.createElement('div');
  host.id = SIDEBAR_ROOT_ID;
  applySidebarHostStyles(host);
  document.documentElement.append(host);
  return host;
}

function applySidebarHostStyles(host: HTMLElement): void {
  host.style.setProperty('all', 'initial', 'important');
  host.style.setProperty('position', 'fixed', 'important');
  host.style.setProperty('top', '0', 'important');
  host.style.setProperty('right', '0', 'important');
  host.style.setProperty('z-index', '2147483647', 'important');
  host.style.setProperty('color-scheme', 'light', 'important');
}

function ensureGlobalInteractionStyles(): void {
  if (document.getElementById(GLOBAL_INTERACTION_STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = GLOBAL_INTERACTION_STYLE_ID;
  style.textContent = `
    html[data-ai-link-learning="comment"] textarea,
    html[data-ai-link-learning="comment"] input,
    html[data-ai-link-learning="comment"] [contenteditable="true"] {
      cursor: crosshair !important;
    }
  `;
  document.documentElement.append(style);
}

export default defineContentScript({
  matches: ['<all_urls>'],
  runAt: 'document_end',
  main() {
    ensureGlobalInteractionStyles();
    createRuntimeMessageRouter(createContentDomMessageHandlers(document)).attach();
    createRuntimeMessageClient().send({ type: 'SIDEBAR_READY' }).catch(() => {
      // Background may be restarting under Manifest V3; UI remains usable with mock state.
    });
    createRoot(ensureSidebarRoot()).render(<SidebarApp />);
  }
});
