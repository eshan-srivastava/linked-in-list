import { StorageManager } from "../utils/storage";
import { SavedSearch } from "../utils/types";
import { LinkedInSearchParser } from "../utils/parser";

const ITEMS_PER_PAGE = 6;
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
    !!tab?.url && LinkedInSearchParser.isSearchUrl(tab.url);
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
    if (!currentTab?.url || !LinkedInSearchParser.isSearchUrl(currentTab.url)) {
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

  // Modal setup
  const notesModal = document.getElementById("notesModal")!;
  const closeModal = () => {
    notesModal.classList.add("hidden");
    notesModal.classList.remove("flex");
  };

  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document
    .getElementById("modalCloseBtn")
    ?.addEventListener("click", closeModal);
  notesModal.addEventListener("click", (e) => {
    if (e.target === notesModal) closeModal();
  });
}

function showNotesModal(notes: string) {
  const modal = document.getElementById("notesModal")!;
  const content = document.getElementById("modalContentInner")!;
  content.textContent = notes;
  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function getSearchType(url: string): "SEARCH" | "JOB" {
  return LinkedInSearchParser.getSearchType(url);
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

    document
      .getElementById(`delete-${search.id}`)
      ?.addEventListener("click", async () => {
        await StorageManager.deleteSearch(search.id);
        allSearches = (await StorageManager.getAllSearches()).sort(
          (a, b) => a.order - b.order,
        );
        const totalPages = Math.ceil(allSearches.length / ITEMS_PER_PAGE);
        if (currentPage > totalPages && currentPage > 1) {
          currentPage = totalPages;
        }
        renderPage();
      });

    document
      .getElementById(`notes-${search.id}`)
      ?.addEventListener("click", () => {
        showNotesModal(search.notes);
      });
  });
}

function createSearchItem(search: SavedSearch): string {
  const date = new Date(search.timestamp).toLocaleDateString();
  const type = getSearchType(search.url);
  const typeClasses =
    type === "JOB"
      ? "bg-orange-100 text-orange-800"
      : "bg-blue-100 text-blue-800";

  return `
    <div class="p-3 bg-white border rounded-lg hover:shadow-md transition-shadow group">
      <div class="flex justify-between items-start gap-2">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <button id="open-${search.id}" class="text-sm font-medium text-blue-600 hover:underline text-left">
              ${escapeHtml(search.title)}
            </button>
            <span class="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded ${typeClasses}">
              ${type}
            </span>
          </div>
          <div class="flex items-center gap-2 mt-1">
            <p class="text-[10px] text-gray-500">${date}</p>
            ${
              search.notes
                ? `
              <button id="notes-${search.id}" class="text-[10px] text-blue-500 font-bold uppercase hover:underline">
                View Notes
              </button>`
                : ""
            }
          </div>
        </div>
        <button id="delete-${search.id}" title="delete" class="mt-0.5 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
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
