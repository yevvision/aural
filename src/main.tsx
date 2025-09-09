import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
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

// Die zentrale Datenbank (aural-central-database) bleibt erhalten!

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
