import { StorageManager } from "./utils/storage";
import { LinkedInSearchParser } from "./utils/parser";

function isLinkedInSearch(url: string): boolean {
  return LinkedInSearchParser.isSearchUrl(url);
}

async function updateBadgeForTab(tab: chrome.tabs.Tab) {
  if (!tab.url || !tab.id) return;

  if (isLinkedInSearch(tab.url)) {
    const exists = await StorageManager.searchExistsByUrl(tab.url);
    chrome.action.setBadgeText({ text: exists ? "✓" : "+", tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({
      color: exists ? "#10B981" : "#3B82F6",
      tabId: tab.id,
    });
  } else {
    chrome.action.setBadgeText({ text: "", tabId: tab.id });
  }
}

// Performs the save search flow
async function saveCurrentSearch(url: string) {
  const settings = await StorageManager.getSettings();
  const parsed = await LinkedInSearchParser.parseUrl(url);
  const title = LinkedInSearchParser.generateTitle(
    parsed,
    settings.titleFormat,
  );

  await StorageManager.saveSearch({ url, title, notes: "" });

  // Badge updating is now centrally handled by chrome.storage.onChanged listener.
}

// Starts the loop to add listener for extension badge if tab switch is complete
chrome.tabs.onUpdated.addListener(async (_, changeInfo, tab) => {
  if (changeInfo.status === "complete") {
    await updateBadgeForTab(tab);
  }
});

// Handle extension badge highlight when linkedin search is active
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  await updateBadgeForTab(tab);
});

// Handle clicking the extension badge
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url && isLinkedInSearch(tab.url)) {
    await saveCurrentSearch(tab.url);
  } else {
    //open popup for non linkedin pages
    chrome.action.openPopup();
  }
});

// Handle keyboard shortcut for saving via assigned shortcut
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "save-search") {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]?.url && isLinkedInSearch(tabs[0].url)) {
      await saveCurrentSearch(tabs[0].url);
    }
  }
});

// Handle saving bookmark via UI
chrome.bookmarks.onCreated.addListener(async (_, bookmark) => {
  const settings = await StorageManager.getSettings();
  if (
    !settings.preventNativeBookmark &&
    bookmark.url &&
    isLinkedInSearch(bookmark.url)
  ) {
    const exists = await StorageManager.searchExistsByUrl(bookmark.url);
    if (!exists) {
      await saveCurrentSearch(bookmark.url);
    }
  }
});

// Update badges when storage changes
chrome.storage.onChanged.addListener(async (changes, namespace) => {
  if (namespace === "local" && changes.linkedinsearches) {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && isLinkedInSearch(tab.url)) {
        await updateBadgeForTab(tab);
      }
    }
  }
});
