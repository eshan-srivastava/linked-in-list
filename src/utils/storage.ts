// storing StorageData to local storage of the browser
// Not using class methods as UI can call the functions anytime, besides for an extension its init time can become uncertain, static feels better for that reason
// also technically chrome storage API is static and not instance based. Multiple storage manager instances will end up communicating with same chrome API

import { SavedSearch, AppSettings, StorageData } from "./types";
import { version } from '../../package.json'

// Will be used by the worker
export class StorageManager {
    private static SEARCH_KEY = "linkedinsearches";
    private static SETTINGS_KEY = "appsettings"

    static async getAllSearches(): Promise<SavedSearch[]> {
        const result = await chrome.storage.local.get(this.SEARCH_KEY);
        return (result[this.SEARCH_KEY] as SavedSearch[]) || [];
    }

    static async getSearch(id: string): Promise<SavedSearch | undefined> {
        const searches = await this.getAllSearches();
        const search = searches.find(s => s.id === id)
        return search
    }

    static async searchExistsByUrl(url: string): Promise<boolean> {
        const searches = await this.getAllSearches();
        return searches.some(s => s.url === url);
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
        return (result[this.SETTINGS_KEY] as AppSettings) || {
            preventNativeBookmark: false,
            titleFormat: 'compact'
        }
    }

    static async updateSettings(settings: Partial<AppSettings>): Promise<void> {
        const current = await this.getSettings();
        await chrome.storage.local.set({
            [this.SETTINGS_KEY]: {...current, ...settings}, 
        });
    }


    // Export Import JSON searches
    static async exportData(): Promise<string> {
        const searches = await this.getAllSearches();
        const settings = await this.getSettings();
        return JSON.stringify({searches, settings, version: version })
    }

    static async importData(jsonString: string): Promise<void> {
        const data: StorageData & { version: string } = JSON.parse(jsonString);
        if (data.searches) {
            await chrome.storage.local.set({ [this.SEARCH_KEY]: data.searches});
        }
        if (data.settings) {
            await chrome.storage.local.set({ [this.SETTINGS_KEY]: data.settings });
        }
    }
}
