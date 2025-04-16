import { session } from 'electron';

// Set up security features
export function setupSecurity() {
  setupCSP();
  enforceHttps();
}

// Helper function to set Content Security Policy
function setupCSP() {
  // Set up CSP for all sessions
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; " +
          "script-src 'self'; " +
          "style-src 'self' 'unsafe-inline'; " +
          "img-src 'self' https://www.googleapis.com data:; " +
          "connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com https://accounts.google.com; " +
          "font-src 'self'; " +
          "object-src 'none'; " +
          "media-src 'self'; " +
          "child-src 'none'; " +
          "form-action 'self'; " +
          "frame-ancestors 'none'; " +
          "upgrade-insecure-requests;"
        ]
      }
    });
  });
}

// Helper function to enforce HTTPS for all requests
function enforceHttps() {
  // Intercept all HTTP requests and redirect to HTTPS
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const url = new URL(details.url);
    
    // If the URL is HTTP and not localhost, redirect to HTTPS
    if (url.protocol === 'http:' && url.hostname !== 'localhost' && !url.hostname.includes('127.0.0.1')) {
      url.protocol = 'https:';
      callback({ redirectURL: url.toString() });
    } else {
      callback({});
    }
  });
}