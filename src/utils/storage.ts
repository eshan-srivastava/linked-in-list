// storing StorageData to local storage of the browser
// Not using class methods as UI can call the functions anytime, besides for an extension its init time can become uncertain, static feels better for that reason
// also technically chrome storage API is static and not instance based. Multiple storage manager instances will end up communicating with same chrome API

import { SavedSearch, AppSettings, StorageData } from "./types";

// Will be used by the worker
export class StorageManager {


    static async getAllSearches(): Promise<SavedSearch[]> {
        return []
    }

    static async getSearch() {
        
    }

    static async searchExists(): Promise<boolean> {
        return false
    }

    static async saveSearch() {
    
    }

    static async updateSearch() {

    }

    static async deleteSearch() {

    }

    static async reorderSearches() {

    }

    // Settings Storage
    static async getSettings() : Promise<AppSettings>{
    }

    static async updateSettings() {

    }


    // Export Import JSON searches
    static async exportData() {

    }

    static async importData() {

    }
}
