import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Globale Fehlerbehandlung - CSP-konform
window.addEventListener('error', (event) => {
  // Ignoriere Service Worker Fehler von Extensions
  if (event.message && (
    event.message.includes('Frame with ID') ||
    event.message.includes('No tab with id') ||
    event.message.includes('No frame with id') ||
    event.message.includes('Could not establish connection') ||
    event.message.includes('serviceWorker') ||
    event.message.includes('background.js') ||
    event.message.includes('checkoutUrls') ||
    event.filename?.includes('serviceWorker.js') ||
    event.filename?.includes('background.js') ||
    event.filename?.includes('content.js')
  )) {
    event.preventDefault();
    return;
  }
  console.error('🚨 Unbehandelter Fehler:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  // Ignoriere Service Worker Promise-Rejections von Extensions
  if (event.reason && event.reason.message && (
    event.reason.message.includes('Frame with ID') ||
    event.reason.message.includes('No tab with id') ||
    event.reason.message.includes('No frame with id') ||
    event.reason.message.includes('serviceWorker') ||
    event.reason.message.includes('background.js') ||
    event.reason.message.includes('checkoutUrls')
  )) {
    event.preventDefault();
    return;
  }
  console.error('🚨 Unbehandelte Promise-Rejection:', event.reason);
});

// Service Worker Fehlerbehandlung - CSP-konform
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      if (registration.scope.includes('chrome-extension://') || 
          registration.scope.includes('moz-extension://')) {
        // Ignoriere Extension Service Workers
        continue;
      }
    }
  }).catch(() => {
    // Ignoriere Service Worker Fehler
  });
}

// Vereinfachte Migration - nur bei Bedarf
console.log('🚀 Starte Anwendung...');

// Bereinige nur alte, nicht mehr verwendete Datenquellen (nach Migration)
console.log('🧹 Bereinige alte, veraltete localStorage-Daten...');
const obsoleteKeys = [
  'simulated-database',
  'aural-feed-store', 
  'aural-player-store',
  'jochen-data-created',
  'database-initialized'
  // WICHTIG: 'aural-central-database' NICHT löschen - das ist unsere Single Source of Truth!
];

let cleanedCount = 0;
obsoleteKeys.forEach(key => {
  if (localStorage.getItem(key)) {
    console.log('🗑️ Lösche veralteten localStorage-Schlüssel:', key);
    localStorage.removeItem(key);
    cleanedCount++;
  }
});

if (cleanedCount > 0) {
  console.log(`✅ ${cleanedCount} veraltete Datenquellen bereinigt`);
} else {
  console.log('✅ Keine veralteten Datenquellen gefunden - System ist sauber');
}

// Bereinige veraltete sessionStorage-Einträge mit Blob-URLs
console.log('🧹 Bereinige veraltete sessionStorage Blob-URLs...');
const sessionKeys = ['recordingData', 'audioData'];
let sessionCleanedCount = 0;
sessionKeys.forEach(key => {
  const data = sessionStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.data && parsed.data.startsWith('blob:http://localhost:5173/')) {
        sessionStorage.removeItem(key);
        console.log(`🗑️ Veraltete sessionStorage Blob-URL entfernt: ${key}`);
        sessionCleanedCount++;
      }
    } catch (e) {
      // Ignoriere Parse-Fehler
    }
  }
});

if (sessionCleanedCount > 0) {
  console.log(`✅ ${sessionCleanedCount} veraltete sessionStorage Blob-URLs bereinigt`);
} else {
  console.log('✅ Keine veralteten sessionStorage Blob-URLs gefunden');
}

// Die zentrale Datenbank (aural-central-database) bleibt erhalten!

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
