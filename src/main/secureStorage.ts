import { safeStorage } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';

// Secure storage class for handling sensitive data
export class SecureStorage {
  private storagePath: string;
  
  constructor(filename = 'secure-data.enc') {
    // Store encrypted data in the user data directory
    this.storagePath = path.join(app.getPath('userData'), filename);
  }
  
  // Save data securely
  async save(key: string, value: any): Promise<boolean> {
    try {
      // Get all existing data
      const data = await this.getAll();
      
      // Update with new value
      data[key] = value;
      
      // Convert to string
      const jsonData = JSON.stringify(data);
      
      // Encrypt the data
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption is not available on this system');
      }
      
      const encrypted = safeStorage.encryptString(jsonData);
      
      // Write to file
      fs.writeFileSync(this.storagePath, encrypted);
      
      return true;
    } catch (error) {
      console.error('Error saving secure data:', error);
      return false;
    }
  }
  
  // Get a specific value
  async get(key: string): Promise<any> {
    try {
      const data = await this.getAll();
      return data[key];
    } catch (error) {
      console.error('Error getting secure data:', error);
      return null;
    }
  }
  
  // Get all stored data
  async getAll(): Promise<Record<string, any>> {
    try {
      // Check if file exists
      if (!fs.existsSync(this.storagePath)) {
        return {};
      }
      
      // Read encrypted data
      const encrypted = fs.readFileSync(this.storagePath);
      
      // Decrypt the data
      if (!safeStorage.isEncryptionAvailable()) {
        throw new Error('Encryption is not available on this system');
      }
      
      const decrypted = safeStorage.decryptString(encrypted);
      
      // Parse JSON
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Error reading secure data:', error);
      return {};
    }
  }
  
  // Delete a specific key
  async delete(key: string): Promise<boolean> {
    try {
      const data = await this.getAll();
      
      if (key in data) {
        delete data[key];
        
        // Convert to string
        const jsonData = JSON.stringify(data);
        
        // Encrypt the data
        if (!safeStorage.isEncryptionAvailable()) {
          throw new Error('Encryption is not available on this system');
        }
        
        const encrypted = safeStorage.encryptString(jsonData);
        
        // Write to file
        fs.writeFileSync(this.storagePath, encrypted);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting secure data:', error);
      return false;
    }
  }
  
  // Clear all stored data
  async clear(): Promise<boolean> {
    try {
      if (fs.existsSync(this.storagePath)) {
        fs.unlinkSync(this.storagePath);
      }
      return true;
    } catch (error) {
      console.error('Error clearing secure data:', error);
      return false;
    }
  }
}

// Create a singleton instance
export const secureStorage = new SecureStorage();