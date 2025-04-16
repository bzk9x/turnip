import { BrowserWindow } from 'electron';
import * as path from 'path';

// Window references
let splashWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;
let homeWindow: BrowserWindow | null = null;

// Set up window creation functions
export function setupWindows() {
  return {
    createSplashWindow,
    createOnboardingWindow,
    createHomeWindow,
    getSplashWindow: () => splashWindow,
    getOnboardingWindow: () => onboardingWindow,
    getHomeWindow: () => homeWindow
  };
}

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 300,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../splash-preload.js')
    }
  });

  splashWindow.loadFile(path.join(__dirname, '../windows/splash.html'));
  return splashWindow;
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
      preload: path.join(__dirname, '../preload.js')
    }
  });
  onboardingWindow.loadFile(path.join(__dirname, '../windows/onboarding.html'));
  return onboardingWindow;
}

function createHomeWindow() {
  homeWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload.js')
    }
  });

  homeWindow.loadFile(path.join(__dirname, '../windows/home.html'));
  return homeWindow;
}