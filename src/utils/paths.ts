import * as path from 'path';
import { app } from 'electron';

// Helper function to get the correct path in both development and production
export function getAppPath(relativePath: string): string {
  const basePath = app.isPackaged 
    ? path.dirname(app.getPath('exe'))
    : __dirname;
  
  return path.join(basePath, relativePath);
}

// Helper to get the correct path to resources
export function getResourcePath(relativePath: string): string {
  const resourcePath = app.isPackaged
    ? path.join(process.resourcesPath, 'app.asar')
    : path.join(__dirname, '..');
  
  return path.join(resourcePath, relativePath);
}