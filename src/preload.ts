import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    minimizeWindow: () => ipcRenderer.send('minimize-window'),
    closeWindow: () => ipcRenderer.send('close-window'),
    // Add auth methods
    signInWithBrowser: () => ipcRenderer.invoke('sign-in-with-browser'),
    handleAuthCallback: (url: string) => ipcRenderer.invoke('handle-auth-callback', url)
});