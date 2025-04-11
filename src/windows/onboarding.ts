const minimizeButton = document.getElementById('window-control-minimize');
const closeButton = document.getElementById('window-control-close');
const authButton = document.getElementById('auth-button');

minimizeButton?.addEventListener('click', () => {
    (window as any).electronAPI.minimizeWindow();
});

closeButton?.addEventListener('click', () => {
    (window as any).electronAPI.closeWindow();
});

authButton?.addEventListener('click', async () => {
    try {
        const result = await (window as any).signInWithBrowser();
        if (result.success) {
            (window as any).signInSuccessful();
        } else {
            console.error('Auth failed:', result.error);
        }
    } catch (error) {
        console.error('Auth error:', error);
    }
});