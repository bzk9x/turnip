import { ipcMain, shell } from 'electron';
import { secureConfig } from './config';
import { validateTokens, fetchUserInfo, processUserInfo } from './auth';
import { setupWindows } from './windows';

// Set up IPC handlers
export function setupIPC() {
  setupWindowControls();
  setupAuthHandlers();
}

// Set up window control handlers
function setupWindowControls() {
  const { getOnboardingWindow } = setupWindows();
  
  ipcMain.on('minimize-window', () => {
    const onboardingWindow = getOnboardingWindow();
    if (onboardingWindow) {
      onboardingWindow.minimize();
    }
  });

  ipcMain.on('close-window', () => {
    const onboardingWindow = getOnboardingWindow();
    if (onboardingWindow) {
      onboardingWindow.close();
    }
  });
}

// Set up authentication handlers
function setupAuthHandlers() {
  // Sign in with browser handler
  ipcMain.handle('sign-in-with-browser', async () => {
    try {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/auth');
      authUrl.searchParams.append('client_id', secureConfig.clientId);
      authUrl.searchParams.append('redirect_uri', secureConfig.redirectUri);
      authUrl.searchParams.append('response_type', 'id_token token');
      authUrl.searchParams.append('scope', 'openid email profile');
      authUrl.searchParams.append('prompt', 'select_account');
      authUrl.searchParams.append('nonce', Math.random().toString(36).substring(2));

      await shell.openExternal(authUrl.toString());
      return { status: 'pending' };
    } catch (error: any) {
      console.error('Auth error:', error);
      return { status: 'error', error: error.message };
    }
  });

  // Get user info handler
  ipcMain.handle('get-user-info', async (_event, tokens: { accessToken: string; idToken: string }) => {
    try {
      // Validate tokens first
      const tokensValid = await validateTokens(tokens.idToken, tokens.accessToken);
      if (!tokensValid) {
        return { success: false, error: 'Invalid authentication tokens' };
      }
      
      // Call Google's userinfo endpoint
      const userInfo = await fetchUserInfo(tokens.accessToken);
      
      // Process and store user data
      const user = processUserInfo(userInfo);
      
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Error fetching user info:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  });

  // In your setupAuthHandlers function, make sure the auth-tokens handler is properly transitioning to the home window:
  
  // Auth tokens handler
  ipcMain.handle('auth-tokens', async (_event, tokens: { accessToken: string; idToken: string }) => {
    try {
      // Validate tokens first
      const tokensValid = await validateTokens(tokens.idToken, tokens.accessToken);
      if (!tokensValid) {
        return { success: false, error: 'Invalid authentication tokens' };
      }
      
      // Fetch user info
      const userInfo = await fetchUserInfo(tokens.accessToken);
      
      // Process and store user data
      const user = processUserInfo(userInfo);
      
      // Get window references
      const { getOnboardingWindow, createHomeWindow } = setupWindows();
      const onboardingWindow = getOnboardingWindow();
      
      // Create and show home window with a slight delay
      setTimeout(() => {
        if (onboardingWindow && !onboardingWindow.isDestroyed()) {
          const homeWindow = createHomeWindow();
          if (homeWindow) {
            homeWindow.webContents.send('user-data', user);
            homeWindow.show();
            
            // Close onboarding window after home window is shown
            onboardingWindow.close();
          }
        }
      }, 1500);
      
      return { success: true, user };
    } catch (error) {
      console.error('Auth error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  });
}