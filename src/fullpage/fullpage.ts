import { StorageManager } from "../utils/storage";
import { SavedSearch } from "../utils/types";

let searches: SavedSearch[] = [];
let filteredSearches: SavedSearch[] = [];
let draggedElement: HTMLElement | null = null;
let draggedSearchId: string | null = null;
let activeSearchId: string | null = null;

async function init() {
  await loadSearches();
  refreshList();
  setupEventListeners();
  setupUniversalModalListeners();
  setupClickOutsideListeners();
}

function refreshList() {
  const query =
    (
      document.getElementById("searchInput") as HTMLInputElement
    )?.value.toLowerCase() || "";
  filteredSearches = searches.filter(
    (s) =>
      s.title.toLowerCase().includes(query) ||
      s.notes.toLowerCase().includes(query),
  );
  renderSearches();
}

async function loadSearches() {
  searches = (await StorageManager.getAllSearches()).sort(
    (a, b) => a.order - b.order,
  );
}

function renderSearches() {
  const listEl = document.getElementById("searchList")!;
  listEl.innerHTML =
    filteredSearches.length === 0
      ? '<p class="text-gray-500 text-center py-8">No saved searches found. Visit LinkedIn and save some searches!</p>'
      : filteredSearches.map((search) => createSearchCard(search)).join("");

  // Add event listeners for each card
  filteredSearches.forEach((search) => {
    const card = document.getElementById(`card-${search.id}`);
    if (card) {
      setupCardListeners(card, search);
    }
  });
}

function createSearchCard(searchItem: SavedSearch): string {
  const date = new Date(searchItem.timestamp).toLocaleString();
  return `
    <div 
      id="card-${searchItem.id}" 
      data-id="${searchItem.id}"
      draggable="true"
      class="p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow cursor-move"
    >
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <a href="${searchItem.url}" target="_blank" class="text-lg font-medium text-blue-600 hover:underline">
            ${escapeHtml(searchItem.title)}
          </a>
          <p class="text-sm text-gray-500 mt-1">${date}</p>
          ${searchItem.notes ? `<p class="text-sm text-gray-700 mt-2">${escapeHtml(searchItem.notes)}</p>` : ""}
          <button id="edit-notes-${searchItem.id}" class="text-xs text-blue-500 hover:underline mt-2">
            ${searchItem.notes ? "Edit notes" : "Add notes"}
          </button>
          
        </div>
        <div class="flex items-center ml-4">
          <button id="options-${searchItem.id}" class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
}

function setupCardListeners(card: HTMLElement, search: SavedSearch) {
  // Drag events
  card.addEventListener("dragstart", handleDragStart);
  card.addEventListener("dragover", handleDragOver);
  card.addEventListener("drop", handleDrop);
  card.addEventListener("dragend", handleDragEnd);

  // Options button
  const optionsBtn = document.getElementById(`options-${search.id}`);
  optionsBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showOptionsDropdown(optionsBtn, search);
  });

  // Add/Edit notes button
  const notesBtn = document.getElementById(`edit-notes-${search.id}`);
  notesBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    showModal(search.notes ? "Edit Notes" : "Add Notes", search, "addNotes");
  });
}

function showOptionsDropdown(anchor: HTMLElement, savedSearch: SavedSearch) {
  activeSearchId = savedSearch.id;
  const dropdown = document.getElementById("optionsDropdown")!;
  const rect = anchor.getBoundingClientRect();

  const optsNotesBtnText = document.getElementById("optsNotesBtnText")!;
  optsNotesBtnText.textContent = savedSearch.notes ? "Edit notes" : "Add notes";

  dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
  dropdown.style.left = `${rect.right - 192}px`; // 192px is w-48
  dropdown.classList.remove("hidden");
}

function setupClickOutsideListeners() {
  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("optionsDropdown")!;
    if (!dropdown.contains(e.target as Node)) {
      dropdown.classList.add("hidden");
    }
  });

  // Action clicks inside dropdown
  const dropdown = document.getElementById("optionsDropdown")!;
  dropdown.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = (btn as HTMLElement).dataset.action;
      if (action && activeSearchId) {
        handleDropdownAction(action, activeSearchId);
      }
      dropdown.classList.add("hidden");
    });
  });
}

async function handleDropdownAction(action: string, searchId: string) {
  const search = searches.find((s) => s.id === searchId);
  if (!search) return;

  switch (action) {
    case "editTitle":
      showModal("Edit Title", search, "editTitle");
      break;
    case "addNotes":
      showModal(search.notes ? "Edit Notes" : "Add Notes", search, "addNotes");
      break;
    case "viewDetails":
      showModal("Search Details", search, "viewDetails");
      break;
    case "delete":
      if (confirm("Delete this search?")) {
        await StorageManager.deleteSearch(search.id);
        await loadSearches();
        refreshList();
      }
      break;
  }
}

let currentModalSearch: SavedSearch | null = null;
let currentModalType: string | null = null;

function showModal(title: string, search: SavedSearch, type: string) {
  currentModalSearch = search;
  currentModalType = type;

  const modal = document.getElementById("universalModal")!;
  const modalTitle = document.getElementById("modalTitle")!;
  const modalContent = document.getElementById("modalContent")!;
  const modalSave = document.getElementById("modalSave") as HTMLButtonElement;

  modalTitle.textContent = title;
  modalContent.innerHTML = "";
  modalSave.classList.remove("hidden");

  if (type === "editTitle") {
    modalContent.innerHTML = `
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Search Title</label>
        <input type="text" id="modalInput" maxlength="256" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value="${escapeHtml(search.title)}">
        <p class="text-xs text-gray-400 text-right"><span id="charCount">0</span>/256</p>
      </div>
    `;
    const input = document.getElementById("modalInput") as HTMLInputElement;
    const count = document.getElementById("charCount")!;
    input.addEventListener(
      "input",
      () => (count.textContent = input.value.length.toString()),
    );
    count.textContent = input.value.length.toString();
  } else if (type === "addNotes") {
    modalContent.innerHTML = `
      <div class="space-y-2">
        <label class="block text-sm font-medium text-gray-700">Notes</label>
        <textarea id="modalTextarea" maxlength="1024" rows="5" class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none">${escapeHtml(search.notes)}</textarea>
        <p class="text-xs text-gray-400 text-right"><span id="charCount">0</span>/1024</p>
      </div>
    `;
    const textarea = document.getElementById(
      "modalTextarea",
    ) as HTMLTextAreaElement;
    const count = document.getElementById("charCount")!;
    textarea.addEventListener(
      "input",
      () => (count.textContent = textarea.value.length.toString()),
    );
    count.textContent = textarea.value.length.toString();
  } else if (type === "viewDetails") {
    modalSave.classList.add("hidden");
    const date = new Date(search.timestamp).toLocaleString();
    modalContent.innerHTML = `
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">Title</label>
          <p class="text-gray-900 font-medium">${escapeHtml(search.title)}</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">URL</label>
          <a href="${search.url}" target="_blank" class="text-blue-600 hover:underline break-all text-sm">${escapeHtml(search.url)}</a>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">Saved On</label>
          <p class="text-gray-700 text-sm">${date}</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">Notes</label>
          <p class="text-gray-700 text-sm whitespace-pre-wrap">${search.notes ? escapeHtml(search.notes) : "No notes added."}</p>
        </div>
        <div>
          <label class="block text-xs font-bold text-gray-400 uppercase tracking-wider">Internal ID</label>
          <p class="text-gray-400 text-[10px] font-mono">${search.id}</p>
        </div>
      </div>
    `;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
}

function setupUniversalModalListeners() {
  const modal = document.getElementById("universalModal")!;
  const closeBtn = document.getElementById("closeModal")!;
  const cancelBtn = document.getElementById("modalCancel")!;
  const saveBtn = document.getElementById("modalSave")!;

  const closeModal = () => {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  };

  closeBtn.addEventListener("click", closeModal);
  cancelBtn.addEventListener("click", closeModal);

  saveBtn.addEventListener("click", async () => {
    if (!currentModalSearch || !currentModalType) return;

    if (currentModalType === "editTitle") {
      const input = document.getElementById("modalInput") as HTMLInputElement;
      const title = input.value.trim();
      if (title) {
        await StorageManager.updateSearch(currentModalSearch.id, { title });
      }
    } else if (currentModalType === "addNotes") {
      const textarea = document.getElementById(
        "modalTextarea",
      ) as HTMLTextAreaElement;
      const notes = textarea.value.trim();
      await StorageManager.updateSearch(currentModalSearch.id, { notes });
    }

    await loadSearches();
    refreshList();
    closeModal();
  });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });
}

function handleDragStart(e: DragEvent) {
  draggedElement = e.currentTarget as HTMLElement;
  draggedSearchId = draggedElement.dataset.id || null;
  draggedElement.style.opacity = "0.5";
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  if (target !== draggedElement) {
    target.classList.add("drag-over");
  }
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove("drag-over");

  if (!draggedSearchId || !target.dataset.id) return;

  const draggedIdx = searches.findIndex((s) => s.id === draggedSearchId);
  const targetIdx = searches.findIndex((s) => s.id === target.dataset.id);

  if (draggedIdx !== -1 && targetIdx !== -1 && draggedIdx !== targetIdx) {
    // Reorder array
    const [removed] = searches.splice(draggedIdx, 1);
    searches.splice(targetIdx, 0, removed);

    // Save new order
    StorageManager.reorderSearches(searches.map((s) => s.id));
    refreshList();
  }
}

function handleDragEnd(_: DragEvent) {
  if (draggedElement) {
    draggedElement.style.opacity = "1";
    draggedElement = null;
  }
  draggedSearchId = null;

  // Remove all drag-over classes
  document.querySelectorAll(".drag-over").forEach((el) => {
    el.classList.remove("drag-over");
  });
}
function setupEventListeners() {
  // Searchbar input
  document.getElementById("searchInput")?.addEventListener("input", () => {
    refreshList();
  });

  // Export
  document.getElementById("exportBtn")?.addEventListener("click", async () => {
    const data = await StorageManager.exportData();
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkedin-searches-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  document.getElementById("importBtn")?.addEventListener("click", () => {
    document.getElementById("importFile")?.click();
  });

  document
    .getElementById("importFile")
    ?.addEventListener("change", async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        try {
          await StorageManager.importData(text);
          await loadSearches();
          refreshList();
          alert("Import successful!");
        } catch (err) {
          alert("Import failed: Invalid file format");
        }
      }
    });

  // Settings
  document
    .getElementById("settingsBtn")
    ?.addEventListener("click", async () => {
      const settings = await StorageManager.getSettings();
      (document.getElementById("preventBookmark") as HTMLInputElement).checked =
        settings.preventNativeBookmark;
      (document.getElementById("titleFormat") as HTMLSelectElement).value =
        settings.titleFormat;
      document.getElementById("settingsModal")?.classList.remove("hidden");
      document.getElementById("settingsModal")?.classList.add("flex");
    });

  document.getElementById("closeSettings")?.addEventListener("click", () => {
    document.getElementById("settingsModal")?.classList.add("hidden");
  });

  document
    .getElementById("saveSettings")
    ?.addEventListener("click", async () => {
      await StorageManager.updateSettings({
        preventNativeBookmark: (
          document.getElementById("preventBookmark") as HTMLInputElement
        ).checked,
        titleFormat: (
          document.getElementById("titleFormat") as HTMLSelectElement
        ).value as "compact" | "verbose",
      });
      document.getElementById("settingsModal")?.classList.add("hidden");
      alert("Settings saved!");
    });
}

function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

init();
