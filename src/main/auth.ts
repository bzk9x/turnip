import { secureConfig, setCurrentUser } from './config';

// Helper function to validate tokens
export async function validateTokens(idToken: string, accessToken: string): Promise<boolean> {
  try {
    // Validate access token by making a request to Google's tokeninfo endpoint
    const fetch = require('node-fetch');
    
    // Ensure HTTPS is used
    const tokenInfoUrl = `https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken}`;
    if (!tokenInfoUrl.startsWith('https://')) {
      throw new Error('Non-HTTPS URL detected in API request');
    }
    
    const response = await fetch(tokenInfoUrl);
    
    if (!response.ok) {
      console.error('Token validation failed:', await response.text());
      return false;
    }
    
    const tokenInfo = await response.json();
    
    // Verify the token is for your application
    if (tokenInfo.aud !== secureConfig.clientId) {
      console.error('Token has invalid audience:', tokenInfo.aud);
      return false;
    }
    
    // Check if token is expired
    const expiresIn = parseInt(tokenInfo.expires_in);
    if (expiresIn <= 0) {
      console.error('Token is expired');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating tokens:', error);
    return false;
  }
}

// Helper function to fetch user info
export async function fetchUserInfo(accessToken: string) {
  try {
    const fetch = require('node-fetch');
    
    // Ensure HTTPS is used
    const userInfoUrl = 'https://www.googleapis.com/oauth2/v3/userinfo';
    if (!userInfoUrl.startsWith('https://')) {
      throw new Error('Non-HTTPS URL detected in API request');
    }
    
    const response = await fetch(userInfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google API error (${response.status}):`, errorText);
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user info:', error);
    throw error;
  }
}

// Process user info and store it
export function processUserInfo(userInfo: any) {
  if (!userInfo || !userInfo.sub) {
    throw new Error('Invalid user info received');
  }
  
  const user = {
    uid: userInfo.sub,
    email: userInfo.email,
    displayName: userInfo.name,
    photoURL: userInfo.picture
  };
  
  setCurrentUser(user);
  return user;
}