import { contextBridge } from 'electron';

// Expose only what's needed for the splash screen
contextBridge.exposeInMainWorld('splashAPI', {
    // Add any functions needed by the splash screen
    getAppVersion: () => process.env.npm_package_version || 'unknown'
});