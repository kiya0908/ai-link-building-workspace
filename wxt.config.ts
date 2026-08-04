import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  entrypointsDir: '../entrypoints',
  manifestVersion: 3,
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'AI Link Building Workspace',
    description: 'Local-first AI-assisted backlink comment workflow workspace.',
    permissions: ['storage', 'activeTab', 'scripting', 'tabs', 'alarms'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'AI Link Workspace'
    }
  }
});
