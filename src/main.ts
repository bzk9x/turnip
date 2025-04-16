import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import isDev from 'electron-is-dev';
import { setupProtocol } from './main/protocol';
import { setupIPC } from './main/ipc';
import { setupSecurity } from './main/security';
import { initSecureConfig, getCurrentUser } from './main/config';
import { handleUrl } from './main/deeplinks'; // Changed from setupDeepLinks to handleUrl
import { setupWindows } from './main/windows';

// Global unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Function to handle deep links
function handleDeepLinks(window: BrowserWindow | null) {
  if (!window) return;
  
  // Set up deep linking
  // Use handleUrl instead of setupDeepLinks
  
  // Handle second instance (when app is already running)
  app.on('second-instance', (event, commandLine) => {
    // Someone tried to run a second instance, focus our window instead
    if (window && !window.isDestroyed()) {
      if (window.isMinimized()) window.restore();
      window.focus();
      
      // Handle the deep link from the second instance
      if (process.platform === 'win32' && commandLine.length > 1) {
        const url = commandLine[commandLine.length - 1];
        if (url.startsWith('macademia:')) {
          handleUrl(url); // Changed to handleUrl
        }
      }
    }
  });
  
  // Handle deep links on macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (window && !window.isDestroyed()) {
      handleUrl(url); // Changed to handleUrl
    }
  });
}

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

// Handle activation (macOS)
app.on('activate', () => {
  const { getHomeWindow, createHomeWindow, getOnboardingWindow, createOnboardingWindow } = setupWindows();
  
  // Check if we have any windows open
  const homeWindow = getHomeWindow();
  const onboardingWindow = getOnboardingWindow();
  
  if (!homeWindow && !onboardingWindow) {
    // No windows open, create appropriate window based on auth state
    getCurrentUser().then(user => {
      if (user) {
        const newHomeWindow = createHomeWindow();
        if (newHomeWindow) {
          newHomeWindow.show();
          newHomeWindow.webContents.send('user-data', user);
        }
      } else {
        const newOnboardingWindow = createOnboardingWindow();
        if (newOnboardingWindow) newOnboardingWindow.show();
      }
    });
  }
});