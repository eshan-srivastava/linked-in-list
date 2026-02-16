import { StorageManager } from "./utils/storage";
import { LinkedInSearchParser } from "./utils/parser";

function isLinkedInSearch(url: string): boolean {
  return url.includes("linkedin.com/search/");
}

async function updateBadgeForTab(tab: chrome.tabs.Tab) {}

// Performs the save search flow
async function saveCurrentSearch(url: string) {
  const settings = await StorageManager.getSettings();
  const parsed = await LinkedInSearchParser.parseUrl(url);
  const title = LinkedInSearchParser.generateTitle(
    parsed,
    settings.titleFormat,
  );

  await StorageManager.saveSearch({ url, title, notes: "" });

  // update badge to show that we saved the search
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true }); //idk if we have a better condition
  if (tabs[0]?.id) {
    chrome.action.setBadgeText({ text: "+", tabId: tabs[0].id });
    chrome.action.setBadgeBackgroundColor({
      color: "#10B981",
      tabId: tabs[0].id,
    });
  }
}

// Starts the loop to add listener for extension badge if tab switch is complete
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
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
chrome.bookmarks.onCreated.addListener(async (id, bookmark) => {
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
