import { app, BrowserWindow } from 'electron';
import { Deeplink } from 'electron-deeplink';
import isDev from 'electron-is-dev';
import { PROTOCOL_NAME, ALLOWED_HOSTS } from './config';
import { validateTokens, fetchUserInfo, processUserInfo } from './auth';
import { setupWindows } from './windows';

// Set up deep linking
export function handleDeepLinks(mainWindow: BrowserWindow) {
  // Initialize deeplink after window creation
  const deeplink = new Deeplink({ 
    app, 
    mainWindow, 
    protocol: PROTOCOL_NAME,
    isDev: isDev as boolean,
    debugLogging: true 
  });

  // Handle deep links with validation
  deeplink.on('received', (url: string) => {
    // Use the common handleUrl function for consistency
    handleUrl(url);
  });
  
  // Second instance handler
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance with a protocol link
    const url = commandLine.pop();
    if (url) handleUrl(url);
    
    // Focus existing window
    const { getOnboardingWindow } = setupWindows();
    const onboardingWindow = getOnboardingWindow();
    if (onboardingWindow) {
      if (onboardingWindow.isMinimized()) onboardingWindow.restore();
      onboardingWindow.focus();
    }
  });

  // Single open-url handler
  app.on('open-url', (event, url) => {
    event.preventDefault();
    handleUrl(url);
  });
}

// Helper function to handle URLs
export function handleUrl(url: string) {
  console.log('Handling URL:', url);
  
  try {
    // Skip handling if the URL is a command line argument or file path
    if (url.startsWith('--') || url.startsWith('C:')) {
      console.log('Skipping non-protocol URL:', url);
      return;
    }

    // Fix for URL parsing - ensure proper URL format
    let urlToProcess = url;
    if (!url.includes('://')) {
      // If URL doesn't have protocol separator, add it
      urlToProcess = `${PROTOCOL_NAME}://${url}`;
    }
    
    // For URLs that start with the protocol name but don't have ://
    if (url.startsWith(`${PROTOCOL_NAME}:`) && !url.startsWith(`${PROTOCOL_NAME}://`)) {
      urlToProcess = url.replace(`${PROTOCOL_NAME}:`, `${PROTOCOL_NAME}://`);
    }

    console.log('Processing URL:', urlToProcess);
    const urlObj = new URL(urlToProcess);
    console.log('Parsed URL:', urlObj);
    
    // Validate hostname is in allowed list
    if (!ALLOWED_HOSTS.includes(urlObj.hostname)) {
      console.error('Invalid hostname in deep link:', urlObj.hostname);
      return;
    }
    
    // Check if this is an auth URL
    if (urlObj.hostname === 'auth') {
      processAuthUrl(urlObj);
    }
  } catch (error) {
    console.error('URL parsing error:', error);
    console.error('Original URL:', url);
    
    // Try alternative parsing for malformed URLs
    try {
      if (url.includes('access_token=') && url.includes('id_token=')) {
        console.log('Attempting to extract tokens directly from URL');
        
        // Extract tokens directly from the URL string
        const accessTokenMatch = url.match(/access_token=([^&]+)/);
        const idTokenMatch = url.match(/id_token=([^&]+)/);
        
        if (accessTokenMatch && idTokenMatch) {
          const accessToken = accessTokenMatch[1];
          const idToken = idTokenMatch[1];
          
          console.log('Extracted tokens directly:', { 
            hasAccessToken: !!accessToken, 
            hasIdToken: !!idToken 
          });
          
          // Create a mock URL object with the extracted tokens
          const mockUrlObj = {
            searchParams: new URLSearchParams()
          };
          mockUrlObj.searchParams.set('access_token', accessToken);
          mockUrlObj.searchParams.set('id_token', idToken);
          
          // Process the tokens
          processAuthUrl(mockUrlObj as URL);
        }
      }
    } catch (fallbackError) {
      console.error('Fallback parsing error:', fallbackError);
    }
  }
}

// Process authentication URLs
async function processAuthUrl(urlObj: URL) {
  console.log('Processing auth URL');
  
  // Try to get tokens from both query parameters and hash fragment
  let accessToken = urlObj.searchParams.get('access_token');
  let idToken = urlObj.searchParams.get('id_token');
  
  // If not in query params, check hash fragment
  if (!accessToken || !idToken) {
    try {
      const hashParams = new URLSearchParams(urlObj.hash?.substring(1) || '');
      const hashAccessToken = hashParams.get('access_token');
      const hashIdToken = hashParams.get('id_token');
      
      if (hashAccessToken) accessToken = hashAccessToken;
      if (hashIdToken) idToken = hashIdToken;
    } catch (error) {
      console.error('Error parsing hash fragment:', error);
    }
  }
  
  console.log('Tokens found:', { hasAccessToken: !!accessToken, hasIdToken: !!idToken });
  
  if (accessToken && idToken) {
    console.log('Received tokens, validating...');
    
    const { getOnboardingWindow, createHomeWindow } = setupWindows();
    const onboardingWindow = getOnboardingWindow();
    
    try {
      // Validate tokens before using them
      const tokensValid = await validateTokens(idToken, accessToken);
      
      if (!tokensValid) {
        console.error('Invalid tokens received');
        if (onboardingWindow) {
          onboardingWindow.webContents.send('auth-error', { 
            error: 'Invalid authentication tokens' 
          });
        }
        return;
      }
      
      console.log('Tokens validated, fetching user info');
      
      // Send tokens to the renderer process
      if (onboardingWindow) {
        onboardingWindow.webContents.send('auth-response', { 
          token: 'pending',
          accessToken, 
          idToken 
        });
        onboardingWindow.focus();
        
        // Fetch user info directly
        const userInfo = await fetchUserInfo(accessToken);
        
        if (userInfo && onboardingWindow && !onboardingWindow.isDestroyed()) {
          // Process and store user data
          const user = processUserInfo(userInfo);
          
          onboardingWindow.webContents.send('auth-response', {
            token: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL
          });
          
          // Wait a bit before transitioning to home window
          setTimeout(() => {
            if (onboardingWindow && !onboardingWindow.isDestroyed()) {
              onboardingWindow.close();
              const homeWindow = createHomeWindow();
              if (homeWindow) {
                homeWindow.show();
                // Load user data in home window
                homeWindow.webContents.send('user-data', user);
              }
            }
          }, 1500);
        }
      }
    } catch (error) {
      console.error('Error processing authentication:', error);
      if (onboardingWindow) {
        onboardingWindow.webContents.send('auth-error', { 
          error: error instanceof Error ? error.message : 'Authentication error' 
        });
      }
    }
  } else {
    console.error('No tokens found in URL');
    const onboardingWindow = setupWindows().getOnboardingWindow();
    if (onboardingWindow) {
      onboardingWindow.webContents.send('auth-error', { 
        error: 'No authentication tokens found in URL' 
      });
    }
  }
}