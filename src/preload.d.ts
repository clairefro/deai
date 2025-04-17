import { ConfigSettings, ConfigSettingsUpdate } from "./shared/config";
interface ElectronAPI {
  getFiles: () => Promise<string[]>;
  readFile: (filepath: string) => Promise<string>;
  getConfig: () => Promise<ConfigSettings>;
  selectDirectory: () => Promise<string | null>;
  updateConfig: (updates: ConfigSettingsUpdate) => Promise<ConfigSettings>;
}
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
export {};
