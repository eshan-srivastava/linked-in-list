import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  version: pkg.version,
  icons: {
    16: "public/icon16.jpeg",
    48: "public/icon48.jpeg",
    128: "public/icon128.jpeg",
  },
  permissions: [
    // 'contentSettings', Ideally i can work without this
    "sidePanel",
    "storage",
    "bookmarks",
    "activeTab",
  ],
  host_permissions: ["https://www.linkedin.com/*"],
  background: {
    type: "module",
    service_worker: "src/background.ts",
  },
  action: {
    default_icon: {
      16: "public/icon16.jpeg",
      48: "public/icon48.jpeg",
      128: "public/icon128.jpeg",
    },
    default_popup: "src/popup/popup.html",
  },
  content_scripts: [
    {
      js: ["src/content/content.ts"],
      matches: ["https://*/*"],
    },
  ],
  commands: {
    "save-search": {
      suggested_key: {
        default: "Alt+Shift+D",
        mac: "Option+Shift+D",
      },
      description: "Save currently open linked search",
    },
  },
});
