import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "./package.json";

export default defineManifest({
  manifest_version: 3,
  name: pkg.name,
  description: "Save your LinkedIn searches for quick access later",
  version: pkg.version,
  icons: {
    16: "icon128.png",
    48: "icon128.png",
    128: "icon128.png",
  },
  permissions: ["storage", "bookmarks", "activeTab"],
  host_permissions: ["https://www.linkedin.com/*"],
  background: {
    type: "module",
    service_worker: "src/background.ts",
  },
  action: {
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
      description: "Save currently open linkedin search",
    },
  },
});
