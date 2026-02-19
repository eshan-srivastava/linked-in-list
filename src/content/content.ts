import { StorageManager } from "../utils/storage";
import { LinkedInSearchParser } from "../utils/parser";
// import "./content.css"; // We will create this small file for shadow DOM styles

console.log("LinkedIn Search Saver: Content script loaded");

class LinkedInOverlay {
  private container: HTMLDivElement | null = null;
  private shadowRoot: ShadowRoot | null = null;

  constructor() {
    this.init();
    this.observeUrlChanges();
  }

  private async init() {
    // Only run on search pages
    if (!this.isSearchPage()) return;

    // Avoid duplicate injections
    if (document.getElementById("lss-root")) return;

    this.createOverlay();
    await this.updateState();
  }

  private isSearchPage(): boolean {
    return window.location.href.includes("/search/");
  }

  private createOverlay() {
    // 1. Create Host Container
    this.container = document.createElement("div");
    this.container.id = "lss-root";
    this.container.style.position = "fixed";
    this.container.style.zIndex = "9999";
    this.container.style.bottom = "20px";
    this.container.style.right = "20px";

    // 2. Attach Shadow DOM (Open mode for debug)
    this.shadowRoot = this.container.attachShadow({ mode: "open" });

    // 3. Inject Styles (Tailwind or custom CSS)
    // CRXJS allows importing CSS files as URLs
    const style = document.createElement("style");
    style.textContent = `
      .lss-badge {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 50px;
        height: 50px;
        background-color: #3b82f6;
        color: white;
        border-radius: 50%;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        cursor: pointer;
        transition: transform 0.2s, background-color 0.2s;
        font-family: sans-serif;
        font-weight: bold;
        font-size: 24px;
        border: none;
        outline: none;
      }
      .lss-badge:hover {
        transform: scale(1.1);
        background-color: #2563eb;
      }
      .lss-badge.saved {
        background-color: #10b981; /* Green */
      }
      .lss-badge.saved:hover {
        background-color: #059669;
      }
      
      /* Toast Notification */
      .lss-toast {
        position: absolute;
        bottom: 60px;
        right: 0;
        background: #1f2937;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        white-space: nowrap;
        opacity: 0;
        transform: translateY(10px);
        transition: opacity 0.3s, transform 0.3s;
        pointer-events: none;
      }
      .lss-toast.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    this.shadowRoot.appendChild(style);

    // 4. Create Button
    const button = document.createElement("button");
    button.className = "lss-badge";
    button.innerHTML = "+"; // Default state
    button.onclick = () => this.handleSave();

    // 5. Create Toast
    const toast = document.createElement("div");
    toast.className = "lss-toast";
    toast.textContent = "Search Saved!";

    this.shadowRoot.appendChild(button);
    this.shadowRoot.appendChild(toast);
    document.body.appendChild(this.container);
  }

  private async updateState() {
    if (!this.shadowRoot) return;

    const isSaved = await StorageManager.searchExistsByUrl(
      window.location.href,
    );
    const button = this.shadowRoot.querySelector(".lss-badge");

    if (button) {
      if (isSaved) {
        button.classList.add("saved");
        button.innerHTML = "✓";
        button.setAttribute("title", "Search Saved (Click to view)");
      } else {
        button.classList.remove("saved");
        button.innerHTML = "+";
        button.setAttribute("title", "Save this search");
      }
    }
  }

  private async handleSave() {
    const url = window.location.href;
    const isSaved = await StorageManager.searchExistsByUrl(url);

    if (isSaved) {
      // If already saved, maybe open the full page view?
      // Content scripts cannot directly open extensions tabs easily without background help
      chrome.runtime.sendMessage({ action: "openFullPage" });
    } else {
      // Save logic
      const settings = await StorageManager.getSettings();
      const parsed = LinkedInSearchParser.parseUrl(url);
      const title = LinkedInSearchParser.generateTitle(
        parsed,
        settings.titleFormat,
      );

      await StorageManager.saveSearch({
        url,
        title,
        notes: "",
      });

      this.showToast("Search Saved!");
      await this.updateState();
    }
  }

  private showToast(message: string) {
    if (!this.shadowRoot) return;
    const toast = this.shadowRoot.querySelector(".lss-toast");
    if (toast) {
      toast.textContent = message;
      toast.classList.add("visible");
      setTimeout(() => toast.classList.remove("visible"), 2000);
    }
  }

  private observeUrlChanges() {
    // Method 1: Popstate for back/forward
    window.addEventListener("popstate", () => this.handleUrlChange());

    // Method 2: MutationObserver to detect URL changes in SPAs
    // LinkedIn changes the URL without reloading. We can poll or observe title.
    let lastUrl = window.location.href;

    const observer = new MutationObserver(() => {
      const url = window.location.href;
      if (url !== lastUrl) {
        lastUrl = url;
        this.handleUrlChange();
      }
    });

    observer.observe(document, { subtree: true, childList: true });
  }

  private handleUrlChange() {
    if (this.isSearchPage()) {
      if (!this.container) {
        this.init();
      } else {
        this.container.style.display = "block";
        this.updateState();
      }
    } else {
      // Hide if not on search page
      if (this.container) {
        this.container.style.display = "none";
      }
    }
  }
}

// Start the overlay
new LinkedInOverlay();
