// Main entry point for the Electron application
import { app } from 'electron';
import { setupProtocol } from './main/protocol';
import { setupWindows } from './main/windows';
import { setupIPC } from './main/ipc';
import { setupSecurity } from './main/security';
import { handleDeepLinks } from './main/deeplinks';
import { initSecureConfig, getCurrentUser } from './main/config';

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
}

// Initialize the application
app.whenReady().then(async () => {
  // Initialize secure config first
  await initSecureConfig();
  
  // Set up security features
  setupSecurity();
  
  // Set up protocol handling
  setupProtocol();
  
  // Set up windows
  const { createSplashWindow, createOnboardingWindow, createHomeWindow } = setupWindows();
  
  // Create initial windows
  const splashWindow = createSplashWindow();
  const onboardingWindow = createOnboardingWindow();
  
  // Set up deep linking
  handleDeepLinks(onboardingWindow);
  
  // Set up IPC handlers
  setupIPC();
  
  // Check if user is already logged in
  const currentUser = await getCurrentUser();
  
  // Show appropriate window after splash
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.close();
    }
    
    if (currentUser) {
      // User is logged in, show home window
      const homeWindow = createHomeWindow();
      if (homeWindow) {
        homeWindow.show();
        homeWindow.webContents.send('user-data', currentUser);
      }
    } else {
      // No user, show onboarding
      if (onboardingWindow) onboardingWindow.show();
    }
  }, 2000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
