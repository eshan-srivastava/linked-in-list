import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    16: 'public/logo16.png',
    48: 'public/logo.png',
    128: 'public/logo128.png'
  },
  permissions: [
    // 'contentSettings', Ideally i can work without this
    "sidePanel",
    "storage",
    "bookmarks",
    "activeTab",
  ],
  host_permissions: [
    "https://www.linkedin.com/*"
  ],
  background: {
    type: "module",
    service_worker: "src/background.ts"
  },
  action: {
    default_icon: {
      16: 'public/logo16.png',
      48: 'public/logo.png',
      128: 'public/logo128.png'
    },
    default_popup: 'src/popup/popup.html',
  },
  content_scripts: [{
    js: ['src/content/content.ts'],
    matches: ['https://*/*'],
  }],
  commands: {
    "save-search": {
      suggested_key: {
        default: "Alt+Shift+D",
        mac: "Option+Shift+D"
      },
      description: "Save currently open linked search"
    }
  }
})
