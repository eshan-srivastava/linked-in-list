// storing StorageData to local storage of the browser
// Not using class methods as UI can call the functions anytime, besides for an extension its init time can become uncertain, static feels better for that reason
// also technically chrome storage API is static and not instance based. Multiple storage manager instances will end up communicating with same chrome API

import { SavedSearch, AppSettings, StorageData } from "./types";

// Will be used by the worker
export class StorageManager {
    private static SEARCH_KEY = "linkedinsearches";
    private static SETTINGS_KEY = "appsettings"

    static async getAllSearches(): Promise<SavedSearch[]> {
        const result = await chrome.storage.local.get(this.SEARCH_KEY);
        return result[this.SEARCH_KEY] || [];
    }

    static async getSearch(id: string): Promise<SavedSearch | undefined> {
        const searches = await this.getAllSearches();
        const search = searches.find(s => s.id === id)
        return search
    }

    static async searchExists(): Promise<boolean> {
        return false
    }

    static async saveSearch(search: Omit<SavedSearch, "id" | "timestamp" | "order">): Promise<void> {
        const searches = await this.getAllSearches();
        const newSearch: SavedSearch = {
            ...search,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            order: searches.length
        }
        searches.push(newSearch)
        await chrome.storage.local.set({ [this.SEARCH_KEY]: searches })
    }

    static async updateSearch(id: string, updates: Partial<SavedSearch>): Promise<void> {
        const searches = await this.getAllSearches();
        const index = searches.findIndex(s => s.id === id)
        if (index !== -1) {
            searches[index] = { ...searches[index], ...updates} //spread original and then spread updates
            await chrome.storage.local.set({ [this.SEARCH_KEY]: searches })
        }
    }

    static async deleteSearch(id: string): Promise<void> {
        const searches = await this.getAllSearches();
        // keep all the ones not getting deleted
        // orderId rebalancing can exist as reorderSearches call by frontend
        const filtered = searches.filter(s => s.id !== id)

        await chrome.storage.local.set({ [this.SEARCH_KEY]: filtered })
    }

    static async reorderSearches(orderIds: string[]): Promise<void> {
        const searches = await this.getAllSearches();
        const reordered = orderIds.map((id, index) => {
            const search = searches.find(s => s.id === id);
            return { ...search, order: index};
        });
        await chrome.storage.local.set({ [this.SEARCH_KEY]: reordered })
    }

    // Settings Storage
    static async getSettings() : Promise<AppSettings>{
        const result = await chrome.storage.local.get(this.SETTINGS_KEY)
        // TODO FIX LINTER ERRORS
        return result[this.SETTINGS_KEY] || {
            preventNativeBookmark: false,
            titleFormat: 'compact'
        }
    }

    static async updateSettings() {

    }


    // Export Import JSON searches
    static async exportData() {

    }

    static async importData() {

    }
}
