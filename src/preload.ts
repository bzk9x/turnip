import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Authentication
  signInWithBrowser: () => ipcRenderer.invoke('sign-in-with-browser'),
  authTokens: (tokens: { accessToken: string; idToken: string }) => 
    ipcRenderer.invoke('auth-tokens', tokens),
  getUserInfo: (tokens: { accessToken: string; idToken: string }) => 
    ipcRenderer.invoke('get-user-info', tokens),
  
  // Event listeners
  onAuthResponse: (callback: any) => 
    ipcRenderer.on('auth-response', callback),
  onAuthError: (callback: any) => 
    ipcRenderer.on('auth-error', callback),
  onUserData: (callback: any) => 
    ipcRenderer.on('user-data', callback)
});