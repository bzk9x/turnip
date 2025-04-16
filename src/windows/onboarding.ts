/// <reference types="electron" />

const minimizeButton = document.getElementById('window-control-minimize');
const closeButton = document.getElementById('window-control-close');
const authButton = document.getElementById('auth-button');

minimizeButton?.addEventListener('click', () => {
    window.electronAPI.minimizeWindow();
});

closeButton?.addEventListener('click', () => {
    window.electronAPI.closeWindow();
});

authButton?.addEventListener('click', async () => {
    try {
        const button = authButton as HTMLButtonElement;
        button.disabled = true;
        button.textContent = 'Opening browser...';
        
        const result = await window.electronAPI.signInWithBrowser();
        if (result.status === 'pending') {
            button.textContent = 'Waiting for authorization...';
        } else {
            button.disabled = false;
            button.textContent = 'Sign in with browser';
        }
    } catch (error) {
        console.error('Auth error:', error);
        const button = authButton as HTMLButtonElement;
        button.disabled = false;
        button.textContent = 'Sign in with browser';
    }
});

window.electronAPI.onAuthResponse((_event, data) => {
    const button = document.getElementById('auth-button') as HTMLButtonElement;
    
    if (data.token === 'pending' && data.accessToken && data.idToken) {
        // We received tokens from the URL handler
        button.textContent = 'Authenticating...';
        
        // Send tokens to main process for authentication
        window.electronAPI.sendAuthTokens({
            accessToken: data.accessToken,
            idToken: data.idToken
        });
    } else if (data.token) {
        // Authentication was successful
        button.textContent = 'Success!';
    } else {
        // Authentication failed
        button.disabled = false;
        button.textContent = 'Sign in with browser';
    }
});