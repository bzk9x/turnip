import { app, BrowserWindow, ipcMain } from 'electron';
import { auth, provider } from './utils/firebase';
import { signInWithPopup } from 'firebase/auth';
import * as path from 'path';
import * as fs from 'fs';

const APP_DATA_PATH = path.join(app.getPath('userData'), 'appData.json');

interface AppState {
    hasCompletedOnboarding: boolean;
}

function loadAppState(): AppState {
    try {
        if (fs.existsSync(APP_DATA_PATH)) {
            const data = fs.readFileSync(APP_DATA_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading app state:', error);
    }
    return { hasCompletedOnboarding: false };
}

function saveAppState(state: Partial<AppState>) {
    try {
        const currentState = loadAppState();
        const newState = { ...currentState, ...state };
        fs.writeFileSync(APP_DATA_PATH, JSON.stringify(newState));
    } catch (error) {
        console.error('Error saving app state:', error);
    }
}

let splashWindow: BrowserWindow | null = null;
let mainWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  splashWindow.loadFile(path.join(__dirname, '../src/windows/splash.html'));
}

function createOnboardingWindow() {
  onboardingWindow = new BrowserWindow({
    width: 800,
    height: 600,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  onboardingWindow.loadFile(path.join(__dirname, './windows/onboarding.html'));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../src/windows/main.html'));
}

// Add IPC handlers
ipcMain.on('minimize-window', () => {
    if (onboardingWindow) {
        onboardingWindow.minimize();
    }
});

ipcMain.on('close-window', () => {
    if (onboardingWindow) {
        onboardingWindow.close();
    }
});

// Check auth state on startup
app.whenReady().then(() => {
    const appState = loadAppState();
    
    if (appState.hasCompletedOnboarding) {
        createMainWindow();
        if (mainWindow) mainWindow.show();
    } else {
        createSplashWindow();
        createOnboardingWindow();
        
        setTimeout(() => {
            if (splashWindow) splashWindow.close();
            if (onboardingWindow) onboardingWindow.show();
        }, 2000);
    }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.handle('sign-in-with-browser', async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        store.set('user', {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName
        });
        return { success: true, user };
    } catch (error) {
        console.error('Auth error:', error);
        return { success: false, error: error.message };
    }
});