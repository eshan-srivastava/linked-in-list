export interface SavedSearch {
  id: string;
  url: string;
  title: string;
  notes: string;
  timestamp: number;
  order: number;
}

export interface AppSettings {
  // if enabled this does not save ALT+SHIFT+D to chrome but only to extension
  preventNativeBookmark: boolean;
  titleFormat: "compact" | "verbose";
}

export interface StorageData {
  searches: SavedSearch[];
  settings: AppSettings;
}
