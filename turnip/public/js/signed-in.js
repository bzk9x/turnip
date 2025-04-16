function openMacademia() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const idToken = params.get('id_token');
    
    if (accessToken && idToken) {
        const encodedAccessToken = encodeURIComponent(accessToken);
        const encodedIdToken = encodeURIComponent(idToken);
        window.location.href = `macademia:auth/${encodedIdToken}/${encodedAccessToken}`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
        continueBtn.addEventListener('click', openMacademia);
    }
});