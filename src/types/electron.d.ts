import { IpcRendererEvent } from 'electron';

export interface AuthResponseData {
    token?: string;
    email?: string;
    displayName?: string;
    accessToken?: string;
    idToken?: string;
    error?: any;
}

export interface GoogleTokens {
    accessToken: string;
    idToken: string;
}

export interface ElectronAPI {
    minimizeWindow: () => void;
    closeWindow: () => void;
    signInWithBrowser: () => Promise<{ status: 'pending' | 'error'; error?: string }>;
    onAuthResponse: (callback: (event: IpcRendererEvent, data: AuthResponseData) => void) => void;
    sendAuthTokens: (tokens: GoogleTokens) => Promise<{ success: boolean; error?: string }>;
    getUserInfo: (tokens: GoogleTokens) => Promise<any>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export {};