import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/audioDebug' // Importiere Debug-Tools
import './utils/audioPlaybackFix' // Importiere Audio-Playback-Fix
import './utils/audioLogger' // Importiere Audio-Logger
import { unifiedAudioManager } from './services/unifiedAudioManager' // Importiere Unified Audio Manager
import { centralDB } from './database/centralDatabase_simple' // Importiere zentrale Datenbank

// Initialisiere UnifiedAudioManager mit besserer Fehlerbehandlung
unifiedAudioManager.initialize().then(() => {
  console.log('✅ UnifiedAudioManager initialized');
}).catch((error) => {
  console.error('❌ UnifiedAudioManager initialization failed:', error);
  // App trotzdem starten, auch wenn AudioManager fehlschlägt
});

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
    event.message.includes('extension port is moved') ||
    event.message.includes('message channel is closed') ||
    event.message.includes('Cannot read properties of undefined') ||
    event.filename?.includes('serviceWorker.js') ||
    event.filename?.includes('background.js') ||
    event.filename?.includes('content.js') ||
    event.filename?.includes('extension://') ||
    event.filename?.includes('moz-extension://') ||
    event.filename?.includes('chrome-extension://')
  )) {
    event.preventDefault();
    return;
  }
  console.error('🚨 Unbehandelter Fehler:', event.error);
});

// Globale Promise-Fehlerbehandlung
window.addEventListener('unhandledrejection', (event) => {
  // Ignoriere Extension-Fehler
  if (event.reason && event.reason.message && (
    event.reason.message.includes('Frame with ID') ||
    event.reason.message.includes('No tab with id') ||
    event.reason.message.includes('No frame with id') ||
    event.reason.message.includes('extension port is moved') ||
    event.reason.message.includes('message channel is closed') ||
    event.reason.message.includes('serviceWorker') ||
    event.reason.message.includes('background.js') ||
    event.reason.message.includes('Cannot read properties of undefined') ||
    event.reason.message.includes('checkoutUrls')
  )) {
    event.preventDefault(); // Verhindere dass der Fehler in der Konsole erscheint
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

// Bereinige nur alte, nicht mehr verwendete Datenquellen (nach Migration)
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
    localStorage.removeItem(key);
    cleanedCount++;
  }
});

// Cleanup completed

// Bereinige veraltete sessionStorage-Einträge mit Blob-URLs
const sessionKeys = ['recordingData', 'audioData'];
let sessionCleanedCount = 0;
sessionKeys.forEach(key => {
  const data = sessionStorage.getItem(key);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (parsed.data && parsed.data.startsWith('blob:http://localhost:5173/')) {
        sessionStorage.removeItem(key);
        sessionCleanedCount++;
      }
    } catch (e) {
      // Ignoriere Parse-Fehler
    }
  }
});

// Session cleanup completed

// Die zentrale Datenbank (aural-central-database) bleibt erhalten!

// Globale Debug-Funktionen für die Browser-Konsole
(window as any).debugHollaTracks = () => {
  console.log('🔔 Debug: Lade holladiewaldfee Tracks...');
  centralDB.forceAddHollaTracks();
  console.log('🔔 Debug: Tracks geladen! Aktualisiere die Seite...');
  window.location.reload();
};

(window as any).showHollaTracks = () => {
  const hollaTracks = centralDB.getAllTracks().filter(track => track.user.username === 'holladiewaldfee');
  console.log('🔔 Holla-Tracks:', hollaTracks.length);
  console.table(hollaTracks.map(t => ({ id: t.id, title: t.title, likes: t.likes, createdAt: t.createdAt })));
};

console.log('🔔 Debug-Funktionen verfügbar:');
console.log('  - debugHollaTracks() - Lädt die neuen holladiewaldfee Tracks');
console.log('  - showHollaTracks() - Zeigt alle holladiewaldfee Tracks');

// Sicherstellen dass das root-Element existiert
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Root element not found!');
  // Erstelle root-Element falls es nicht existiert
  const newRoot = document.createElement('div');
  newRoot.id = 'root';
  document.body.appendChild(newRoot);
}

// App mit Fehlerbehandlung rendern
try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log('✅ App erfolgreich gerendert');
} catch (error) {
  console.error('❌ Fehler beim Rendern der App:', error);
  // Fallback: Zeige einfache Fehlermeldung
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>Fehler beim Laden der App</h1>
      <p>Bitte laden Sie die Seite neu oder kontaktieren Sie den Support.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Seite neu laden
      </button>
    </div>
  `;
}
