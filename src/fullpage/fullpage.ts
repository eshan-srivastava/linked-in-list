import { StorageManager } from "../utils/storage";
import { SavedSearch } from "../utils/types";

let searches: SavedSearch[] = [];
let draggedElement: HTMLElement | null = null;
let draggedSearchId: string | null = null;

async function init() {
  await loadSearches();
  renderSearches();
  setupEventListeners();
}

async function loadSearches() {
  searches = (await StorageManager.getAllSearches()).sort(
    (a, b) => a.order - b.order,
  );
}

function renderSearches() {
  const listEl = document.getElementById("searchList")!;
  listEl.innerHTML =
    searches.length === 0
      ? '<p class="text-gray-500 text-center py-8">No saved searches yet. Visit LinkedIn and save some searches!</p>'
      : searches.map((search) => createSearchCard(search)).join("");

  // Add event listeners for each card
  searches.forEach((search) => {
    const card = document.getElementById(`card-${search.id}`);
    if (card) {
      setupCardListeners(card, search);
    }
  });
}

function createSearchCard(search: SavedSearch): string {
  const date = new Date(search.timestamp).toLocaleString();
  return `
    <div 
      id="card-${search.id}" 
      data-id="${search.id}"
      draggable="true"
      class="p-4 bg-white border rounded-lg hover:shadow-lg transition-shadow cursor-move"
    >
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <a href="${search.url}" target="_blank" class="text-lg font-medium text-blue-600 hover:underline">
            ${escapeHtml(search.title)}
          </a>
          <p class="text-sm text-gray-500 mt-1">${date}</p>
          ${search.notes ? `<p class="text-sm text-gray-700 mt-2">${escapeHtml(search.notes)}</p>` : ""}
          <button id="edit-notes-${search.id}" class="text-xs text-blue-500 hover:underline mt-2">
            ${search.notes ? "Edit notes" : "Add notes"}
          </button>
        </div>
        <div class="flex space-x-2 ml-4">
          <button id="inspect-${search.id}" class="px-2 py-1 text-xs bg-gray-100 rounded hover:bg-gray-200">
            Inspect
          </button>
          <button id="delete-${search.id}" class="px-2 py-1 text-xs bg-red-100 text-red-600 rounded hover:bg-red-200">
            Remove
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

  // Button events
  document
    .getElementById(`delete-${search.id}`)
    ?.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (confirm("Delete this search?")) {
        await StorageManager.deleteSearch(search.id);
        await loadSearches();
        renderSearches();
      }
    });

  document
    .getElementById(`inspect-${search.id}`)
    ?.addEventListener("click", (e) => {
      e.stopPropagation();
      alert(
        `URL: ${search.url}\n\nID: ${search.id}\n\nTimestamp: ${new Date(search.timestamp).toISOString()}`,
      );
    });

  document
    .getElementById(`edit-notes-${search.id}`)
    ?.addEventListener("click", async (e) => {
      e.stopPropagation();
      const notes = prompt("Enter notes for this search:", search.notes);
      if (notes !== null) {
        await StorageManager.updateSearch(search.id, { notes });
        await loadSearches();
        renderSearches();
      }
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
    renderSearches();
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
          renderSearches();
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
