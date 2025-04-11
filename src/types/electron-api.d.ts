export interface ElectronAPI {
    minimizeWindow: () => void;
    closeWindow: () => void;
    signInWithBrowser: () => Promise<{ success: boolean; user?: any; error?: string }>;
    signInSuccessful: () => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}