import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { secureStorage } from './secureStorage';

// Constants
export const PROTOCOL_NAME = 'macademia';
export const ALLOWED_HOSTS = ['auth']; // Restrict to only allowed hosts

// Load configuration from secure storage
export async function loadSecureConfig() {
  try {
    // Try to get from secure storage first
    const config = await secureStorage.get('appConfig');
    
    if (config) {
      console.log('Loaded config from secure storage');
      return config;
    }
    
    // If not in secure storage, try to load from file (for migration)
    const configPath = path.join(app.getPath('userData'), 'secure-config.json');
    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Save to secure storage for next time
      await secureStorage.save('appConfig', fileConfig);
      
      // Remove the plain text file
      try {
        fs.unlinkSync(configPath);
      } catch (e) {
        console.error('Could not remove plain text config file:', e);
      }
      
      return fileConfig;
    }
    
    // Fallback for development only
    const defaultConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID || '35888371990-61he5fu8ul5val9qkhhdpovd0nuhmsmn.apps.googleusercontent.com',
      redirectUri: process.env.REDIRECT_URI || 'https://bittscafecorp.firebaseapp.com/turnip/signed-in/'
    };
    
    // Save default config to secure storage
    await secureStorage.save('appConfig', defaultConfig);
    
    return defaultConfig;
  } catch (error) {
    console.error('Error loading secure config:', error);
    return {};
  }
}

// This will be initialized asynchronously
export let secureConfig: any = {};

// Initialize secure config
export async function initSecureConfig() {
  secureConfig = await loadSecureConfig();
  return secureConfig;
}

// Store user data
export let currentUser: any = null;

export function setCurrentUser(user: any) {
  currentUser = user;
  
  // Also save to secure storage
  secureStorage.save('currentUser', user);
}

export async function getCurrentUser() {
  // If we have a current user in memory, use that
  if (currentUser) {
    return currentUser;
  }
  
  // Otherwise try to load from secure storage
  const storedUser = await secureStorage.get('currentUser');
  if (storedUser) {
    currentUser = storedUser;
  }
  
  return currentUser;
}