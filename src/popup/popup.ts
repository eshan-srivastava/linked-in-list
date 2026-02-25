import { StorageManager } from "../utils/storage";
import { SavedSearch } from "../utils/types";
import { LinkedInSearchParser } from "../utils/parser";

const ITEMS_PER_PAGE = 10;
let currentPage = 1;
let allSearches: SavedSearch[] = [];

async function init() {
  allSearches = (await StorageManager.getAllSearches()).sort(
    (a, b) => a.order - b.order,
  );
  renderPage();

  // Check active tab and setup Add Current Page button
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const isLinkedInSearch =
    !!tab?.url && tab.url.includes("linkedin.com/search/");
  const addCurrentPageBtn = document.getElementById(
    "addCurrentPage",
  ) as HTMLButtonElement;
  addCurrentPageBtn.disabled = !isLinkedInSearch;
  if (!isLinkedInSearch) {
    addCurrentPageBtn.classList.add("opacity-50", "cursor-not-allowed");
  }

  document.getElementById("openFullPage")?.addEventListener("click", () => {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/fullpage/fullpage.html"),
    });
  });

  // Add Current Page button handler
  addCurrentPageBtn?.addEventListener("click", async () => {
    const [currentTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!currentTab?.url || !currentTab.url.includes("linkedin.com/search/")) {
      return; // Should not happen since button is disabled, but safety check
    }

    const settings = await StorageManager.getSettings();
    const parsed = LinkedInSearchParser.parseUrl(currentTab.url);
    const title = LinkedInSearchParser.generateTitle(
      parsed,
      settings.titleFormat,
    );

    await StorageManager.saveSearch({
      url: currentTab.url,
      title,
      notes: "",
    });

    // Refresh the list
    allSearches = (await StorageManager.getAllSearches()).sort(
      (a, b) => a.order - b.order,
    );
    currentPage = 1; // Reset to first page to show the new item
    renderPage();
  });

  document.getElementById("prevPage")?.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderPage();
    }
  });

  document.getElementById("nextPage")?.addEventListener("click", () => {
    const totalPages = Math.ceil(allSearches.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderPage();
    }
  });
}

function renderPage() {
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  const pageSearches = allSearches.slice(startIdx, endIdx);

  const listEl = document.getElementById("searchList")!;
  listEl.innerHTML =
    pageSearches.length === 0
      ? '<p class="text-gray-500 text-sm text-center py-4">No saved searches yet</p>'
      : pageSearches.map((search) => createSearchItem(search)).join("");

  // Update pagination controls
  const totalPages = Math.ceil(allSearches.length / ITEMS_PER_PAGE);
  document.getElementById("pageInfo")!.textContent =
    `Page ${currentPage} of ${totalPages || 1}`;
  (document.getElementById("prevPage") as HTMLButtonElement).disabled =
    currentPage === 1;
  (document.getElementById("nextPage") as HTMLButtonElement).disabled =
    currentPage >= totalPages;

  // Add event listeners
  pageSearches.forEach((search) => {
    document
      .getElementById(`open-${search.id}`)
      ?.addEventListener("click", () => {
        chrome.tabs.create({ url: search.url });
      });
  });
}

function createSearchItem(search: SavedSearch): string {
  const date = new Date(search.timestamp).toLocaleDateString();
  return `
    <div class="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <button id="open-${search.id}" class="text-sm font-medium text-blue-600 hover:underline text-left">
            ${escapeHtml(search.title)}
          </button>
          <p class="text-xs text-gray-500 mt-1">${date}</p>
          ${search.notes ? `<p class="text-xs text-gray-600 mt-1">${escapeHtml(search.notes)}</p>` : ""}
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

init();
