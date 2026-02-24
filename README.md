**LinkedIn Search Saver**

A lightweight **bookmark manager for LinkedIn saved searches**. Save the search you’re currently viewing, auto-generate a readable title from the URL filters, and keep an ordered list you can revisit later.

## Features

- **One-keystroke save**: save the currently open LinkedIn search into the extension.
- **On-page quick save**: a small floating `+ / ✓` button appears on LinkedIn search pages.
- **Toolbar badge indicator**: on LinkedIn search pages the extension icon shows:
  - `+` when the search isn’t saved yet
  - `✓` when it’s already saved
- **Popup list**: browse saved searches with pagination and open them in a new tab.
- **Full View manager**:
  - drag-and-drop reorder
  - add/edit notes
  - inspect metadata (URL/id/timestamp)
  - remove entries
- **Export / Import**: backup and restore your saved searches as JSON.
- **Settings**:
  - title format: `compact` vs `verbose`
  - optional “native bookmark” integration toggle (disable if you don’t want saves triggered from browser bookmarks)

## Keyboard shortcut

- **Save current LinkedIn search**: `Alt+Shift+D` (Windows/Linux), `Option+Shift+D` (macOS)
- **Change the shortcut**: open Chrome’s shortcuts page at `chrome://extensions/shortcuts` and edit the command named **“Save currently open linked search”**.

## What counts as a “search”?

The extension treats any URL under `linkedin.com/search/` as a search page and can save it.

Saved entries include:
- **url**: the full search URL
- **title**: generated from URL filters (keywords, location, time posted, remote, etc.); title rewriting support is being expanded over time
- **notes**: optional free text you add later
- **timestamp** and **order**: used for display and sorting

## Install (unpacked)

This project builds a **Manifest V3** Chrome extension.

### Build from source

```bash
npm install
npm run build
```

Then in Chrome:
- Go to **Manage extensions** (`chrome://extensions/`)
- Enable **Developer mode**
- Click **Load unpacked**
- Select the generated `dist` folder

`npm run build` also produces a zipped artifact in `release/` (useful for sharing the build output).

### Development

```bash
npm run dev
```

Load the `dist` folder as an unpacked extension (same as above). When you change code, rebuild/reload the extension as needed.

## Data & privacy

- Saved searches and settings are stored locally using `chrome.storage.local`.
- No server component; nothing is uploaded by this project.

## License

MIT

