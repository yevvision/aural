import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './utils/audioDebug' // Importiere Debug-Tools
import './utils/audioPlaybackFix' // Importiere Audio-Playback-Fix
import './utils/audioLogger' // Importiere Audio-Logger
import { unifiedAudioManager } from './services/unifiedAudioManager' // Importiere Unified Audio Manager
import { centralDB } from './database/centralDatabase_simple' // Importiere zentrale Datenbank
import { autoMigrateIfNeeded } from './utils/migrateToServer' // Importiere Migration

// Initialisiere UnifiedAudioManager mit besserer Fehlerbehandlung
unifiedAudioManager.initialize().then(() => {
  console.log('✅ UnifiedAudioManager initialized');
}).catch((error) => {
  console.error('❌ UnifiedAudioManager initialization failed:', error);
  // App trotzdem starten, auch wenn AudioManager fehlschlägt
});

// Führe automatische Migration durch wenn nötig
autoMigrateIfNeeded().then(() => {
  console.log('✅ Migration check completed');
}).catch((error) => {
  console.error('❌ Migration check failed:', error);
  // App trotzdem starten, auch wenn Migration fehlschlägt
});

// Lade Daten aus dist_original/ und überschreibe localStorage
const loadDistOriginalData = async () => {
  try {
    console.log('🔧 Main: Loading data from dist_original/...');
    
    // WICHTIG: BEHALTE existierende Likes/Bookmarks/Plays und KOMMENTARE aus localStorage!
    const existingData = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
    const savedLikes = existingData.likes || [];
    const savedBookmarks = existingData.bookmarks || [];
    const savedPlaysMap = existingData.playsMap || [];
    const savedCommentLikesMap = existingData.commentLikesMap || [];
    
    // WICHTIG: Erstelle eine Map der existierenden Tracks mit ihren Kommentaren
    const existingTracksMap = new Map<string, any>();
    if (Array.isArray(existingData.tracks)) {
      existingData.tracks.forEach((track: any) => {
        if (track.id && track.comments && Array.isArray(track.comments) && track.comments.length > 0) {
          existingTracksMap.set(track.id, track);
        }
      });
    }
    
    console.log('🔧 Main: Behalte existierende User-Daten:', {
      likes: savedLikes.length,
      bookmarks: savedBookmarks.length,
      playsMap: savedPlaysMap.length,
      commentLikesMap: savedCommentLikesMap.length,
      tracksMitKommentaren: existingTracksMap.size
    });
    
    const response = await fetch('/aural_database.json');
    if (response.ok) {
      const data = await response.json();
      
      // WICHTIG: Bereinige Tracks von dynamischen Werten UND MERGE Kommentare!
      if (data.tracks && Array.isArray(data.tracks)) {
        data.tracks = data.tracks.map((track: any) => {
          // Bereinige dynamische Werte
          const { 
            likes: _likes, 
            isLiked: _isLiked, 
            isBookmarked: _isBookmarked, 
            plays: _plays,
            commentsCount: _commentsCount,
            ...cleanTrack 
          } = track;
          
          // WICHTIG: MERGE Kommentare aus existierenden Tracks!
          const existingTrack = existingTracksMap.get(track.id);
          if (existingTrack && existingTrack.comments && Array.isArray(existingTrack.comments)) {
            // Behalte die Kommentare aus dem existierenden Track
            cleanTrack.comments = existingTrack.comments;
            console.log(`🔧 Main: Behalte ${existingTrack.comments.length} Kommentare für Track ${track.id}`);
          }
          
          return cleanTrack;
        });
        console.log('🔧 Main: Tracks bereinigt und Kommentare gemerged');
      }
      
      // WICHTIG: MERGE die existierenden Likes/Bookmarks/Plays mit den neuen Daten!
      // Überschreibe NUR die Tracks/Users/Comments, behalte User-Interaktionen!
      const mergedData = {
        ...data,
        // BEHALTE existierende Likes/Bookmarks/Plays, wenn sie existieren!
        likes: savedLikes.length > 0 ? savedLikes : (data.likes || []),
        bookmarks: savedBookmarks.length > 0 ? savedBookmarks : (data.bookmarks || []),
        playsMap: savedPlaysMap.length > 0 ? savedPlaysMap : (data.playsMap || []),
        commentLikesMap: savedCommentLikesMap.length > 0 ? savedCommentLikesMap : (data.commentLikesMap || [])
      };
      
      localStorage.setItem('aural-central-database', JSON.stringify(mergedData));
      console.log('✅ Main: Loaded data from dist_original/, tracks:', mergedData.tracks?.length || 0);
      console.log('✅ Main: User-Daten behalten:', {
        likes: mergedData.likes?.length || 0,
        bookmarks: mergedData.bookmarks?.length || 0,
        playsMap: mergedData.playsMap?.length || 0
      });
      // Lade die Datenbank neu
      centralDB.loadFromStorage();
    } else {
      console.error('❌ Main: Failed to load aural_database.json');
    }
  } catch (error) {
    console.error('❌ Main: Error loading dist_original data:', error);
  }
};

// Lade Daten vor dem App-Start (immer)
loadDistOriginalData();

// WICHTIG: Initialisiere Server-Synchronisation beim App-Start
// Das stellt sicher, dass Likes, Kommentare, Bookmarks und Plays vom Server geladen werden
setTimeout(async () => {
  try {
    console.log('🌐 Main: Initialisiere Server-Synchronisation...');
    const { DatabaseService } = await import('./services/databaseService');
    // Trigger Server-Sync durch getTracks() Aufruf
    DatabaseService.getTracks();
    console.log('✅ Main: Server-Synchronisation initialisiert');
  } catch (error) {
    console.error('❌ Main: Fehler bei Server-Synchronisation:', error);
    // App trotzdem starten, auch wenn Sync fehlschlägt
  }
}, 3000); // Warte 3 Sekunden, damit Datenbank geladen ist

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
      if (parsed.data && (parsed.data.startsWith('blob:http://localhost:5174/') || parsed.data.startsWith('blob:http://localhost:5175/'))) {
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

// AUTOMATISCHES LÖSCHEN: Lösche alle Tracks von holladiewaldfee (nur einmal)
// Prüfe ob bereits gelöscht wurde
const hollaTracksDeleted = localStorage.getItem('holladiewaldfee-tracks-deleted');

if (!hollaTracksDeleted) {
  // Warte kurz, damit die Datenbank geladen ist
  setTimeout(() => {
    console.log('🗑️ Automatisches Löschen von holladiewaldfee Tracks...');
    const allTracks = centralDB.getAllTracks();
    const hollaTracks = allTracks.filter(track => track.user?.username === 'holladiewaldfee');

    if (hollaTracks.length > 0) {
      console.log(`📊 Gefundene Tracks von holladiewaldfee: ${hollaTracks.length}`);
      
      let deletedCount = 0;
      hollaTracks.forEach(track => {
        const success = centralDB.deleteTrack(track.id);
        if (success) {
          deletedCount++;
          console.log(`✅ Gelöscht: "${track.title}"`);
        }
      });
      
      console.log(`✅ Automatisches Löschen abgeschlossen: ${deletedCount} von ${hollaTracks.length} Tracks gelöscht`);
      
      // Markiere als gelöscht, damit es nicht wieder passiert
      localStorage.setItem('holladiewaldfee-tracks-deleted', 'true');
    } else {
      console.log('✅ Keine Tracks von holladiewaldfee gefunden.');
      // Markiere auch hier, damit wir nicht jedes Mal prüfen müssen
      localStorage.setItem('holladiewaldfee-tracks-deleted', 'true');
    }
  }, 2000); // Warte 2 Sekunden, damit Datenbank geladen ist
} else {
  console.log('✅ holladiewaldfee Tracks wurden bereits gelöscht (überspringe).');
}

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

// Umfassende Test-Funktion für Likes/Bookmarks/Plays
(window as any).testDatabase = () => {
  console.log('🧪 ===== DATENBANK-TEST START =====');
  
  // 1. Lade localStorage-Daten
  const data = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
  
  console.log('\n📊 1. LOCALSTORAGE-STATUS:');
  console.log('  - Tracks gespeichert:', data.tracks?.length || 0);
  console.log('  - Likes gespeichert:', data.likes?.length || 0);
  console.log('  - Bookmarks gespeichert:', data.bookmarks?.length || 0);
  console.log('  - Plays gespeichert:', data.playsMap?.length || 0);
  
  // 2. Prüfe ob Tracks statische Werte haben (SOLLTEN NICHT!)
  console.log('\n🔍 2. PRÜFE TRACKS (sollten KEINE likes/isLiked/isBookmarked haben):');
  const sampleTrack = data.tracks?.[0];
  if (sampleTrack) {
    const hasLikes = 'likes' in sampleTrack;
    const hasIsLiked = 'isLiked' in sampleTrack;
    const hasIsBookmarked = 'isBookmarked' in sampleTrack;
    const hasPlays = 'plays' in sampleTrack;
    
    console.log('  - Track hat "likes":', hasLikes, hasLikes ? '❌ FEHLER!' : '✅ OK');
    console.log('  - Track hat "isLiked":', hasIsLiked, hasIsLiked ? '❌ FEHLER!' : '✅ OK');
    console.log('  - Track hat "isBookmarked":', hasIsBookmarked, hasIsBookmarked ? '❌ FEHLER!' : '✅ OK');
    console.log('  - Track hat "plays":', hasPlays, hasPlays ? '❌ FEHLER!' : '✅ OK');
    
    if (hasLikes || hasIsLiked || hasIsBookmarked || hasPlays) {
      console.warn('  ⚠️ PROBLEM: Tracks haben statische Werte! Diese sollten in Maps gespeichert werden!');
    }
  } else {
    console.log('  - Keine Tracks gefunden');
  }
  
  // 3. Zeige Likes-Details
  console.log('\n❤️ 3. LIKES-DETAILS:');
  if (data.likes && Array.isArray(data.likes)) {
    console.log('  - Gesamt Likes-Einträge:', data.likes.length);
    data.likes.slice(0, 5).forEach((like: any) => {
      console.log(`    • Track ${like.trackId}: ${like.userIds?.length || 0} Likes`, like.userIds);
    });
    
    // Prüfe einen spezifischen Track
    const testTrackId = data.tracks?.[0]?.id || 'holla-1';
    const trackLikes = data.likes.find((l: any) => l.trackId === testTrackId);
    console.log(`\n  - Likes für Track "${testTrackId}":`, trackLikes || 'Keine Likes');
  } else {
    console.log('  - Keine Likes gefunden oder nicht als Array');
  }
  
  // 4. Zeige Bookmarks-Details
  console.log('\n🔖 4. BOOKMARKS-DETAILS:');
  if (data.bookmarks && Array.isArray(data.bookmarks)) {
    console.log('  - Gesamt Bookmarks-Einträge:', data.bookmarks.length);
    data.bookmarks.slice(0, 5).forEach((bm: any) => {
      console.log(`    • Track ${bm.trackId}: ${bm.userIds?.length || 0} Bookmarks`, bm.userIds);
    });
  } else {
    console.log('  - Keine Bookmarks gefunden oder nicht als Array');
  }
  
  // 5. Zeige Plays-Details
  console.log('\n▶️ 5. PLAYS-DETAILS:');
  if (data.playsMap && Array.isArray(data.playsMap)) {
    console.log('  - Gesamt Plays-Einträge:', data.playsMap.length);
    data.playsMap.slice(0, 5).forEach((play: any) => {
      console.log(`    • Track ${play.trackId}: ${play.count || 0} Plays`);
    });
  } else {
    console.log('  - Keine Plays gefunden oder nicht als Array');
  }
  
  // 6. Prüfe Datenbank-Maps direkt
  console.log('\n🗄️ 6. DATENBANK-MAPS (live):');
  const db = centralDB.getDatabase();
  console.log('  - Likes Map Größe:', db.likes?.size || 0);
  console.log('  - Bookmarks Map Größe:', db.bookmarks?.size || 0);
  console.log('  - Plays Map Größe:', db.playsMap?.size || 0);
  console.log('  - CommentLikes Map Größe:', db.commentLikesMap?.size || 0);
  
  // 7. Prüfe Tracks mit bereicherten Daten
  console.log('\n🎵 7. TRACKS MIT BEREICHERTEN DATEN (via getAllTracks):');
  const userId = 'user-1';
  const enrichedTracks = centralDB.getAllTracks(userId);
  if (enrichedTracks.length > 0) {
    const sampleEnriched = enrichedTracks[0];
    console.log(`  - Erster Track "${sampleEnriched.title}":`, {
      id: sampleEnriched.id,
      likes: sampleEnriched.likes,
      isLiked: sampleEnriched.isLiked,
      isBookmarked: sampleEnriched.isBookmarked,
      plays: sampleEnriched.plays,
      commentsCount: sampleEnriched.commentsCount
    });
    
    // Finde Tracks mit Likes
    const tracksWithLikes = enrichedTracks.filter(t => (t.likes || 0) > 0 || t.isLiked);
    console.log(`\n  - Tracks mit Likes: ${tracksWithLikes.length}`);
    tracksWithLikes.slice(0, 3).forEach(t => {
      console.log(`    • ${t.title}: ${t.likes} Likes, isLiked: ${t.isLiked}`);
    });
  }
  
  // 8. Vergleich localStorage vs. Datenbank
  console.log('\n⚖️ 8. VERGLEICH LOCALSTORAGE vs. DATENBANK:');
  const localStorageLikesCount = data.likes?.length || 0;
  const dbLikesCount = db.likes?.size || 0;
  console.log('  - Likes localStorage:', localStorageLikesCount);
  console.log('  - Likes Datenbank:', dbLikesCount);
  if (localStorageLikesCount !== dbLikesCount) {
    console.warn('  ⚠️ UNTERSCHIED: localStorage und Datenbank stimmen nicht überein!');
  } else {
    console.log('  ✅ Übereinstimmung');
  }
  
  // 9. Zusammenfassung
  console.log('\n📋 9. ZUSAMMENFASSUNG:');
  const issues: string[] = [];
  
  if (sampleTrack && ('likes' in sampleTrack || 'isLiked' in sampleTrack || 'isBookmarked' in sampleTrack)) {
    issues.push('❌ Tracks haben statische Werte gespeichert');
  }
  
  if (localStorageLikesCount !== dbLikesCount) {
    issues.push('❌ localStorage und Datenbank stimmen nicht überein');
  }
  
  if (issues.length === 0) {
    console.log('  ✅ ALLES OK! Keine Probleme gefunden.');
  } else {
    console.log('  ⚠️ PROBLEME GEFUNDEN:');
    issues.forEach(issue => console.log(`    ${issue}`));
  }
  
  console.log('\n🧪 ===== DATENBANK-TEST ENDE =====\n');
  
  return {
    localStorage: {
      tracks: data.tracks?.length || 0,
      likes: data.likes?.length || 0,
      bookmarks: data.bookmarks?.length || 0,
      plays: data.playsMap?.length || 0
    },
    database: {
      tracks: db.tracks?.length || 0,
      likes: db.likes?.size || 0,
      bookmarks: db.bookmarks?.size || 0,
      plays: db.playsMap?.size || 0
    },
    issues: issues.length,
    ok: issues.length === 0
  };
};

// Test für einen spezifischen Track
(window as any).testTrack = (trackId: string) => {
  console.log(`🧪 Teste Track: ${trackId}`);
  
  // localStorage
  const data = JSON.parse(localStorage.getItem('aural-central-database') || '{}');
  const trackLike = data.likes?.find((l: any) => l.trackId === trackId);
  const trackBookmark = data.bookmarks?.find((b: any) => b.trackId === trackId);
  const trackPlay = data.playsMap?.find((p: any) => p.trackId === trackId);
  const track = data.tracks?.find((t: any) => t.id === trackId);
  
  // Datenbank
  const db = centralDB.getDatabase();
  const dbLikes = db.likes?.get(trackId);
  const dbBookmarks = db.bookmarks?.get(trackId);
  const dbPlays = db.playsMap?.get(trackId);
  const enrichedTrack = centralDB.getAllTracks('user-1').find(t => t.id === trackId);
  
  console.log('📊 LOCALSTORAGE:');
  console.log('  - Track gefunden:', !!track);
  console.log('  - Likes:', trackLike);
  console.log('  - Bookmarks:', trackBookmark);
  console.log('  - Plays:', trackPlay);
  console.log('  - Track hat statische Werte:', {
    hasLikes: track && 'likes' in track,
    hasIsLiked: track && 'isLiked' in track,
    hasIsBookmarked: track && 'isBookmarked' in track
  });
  
  console.log('\n🗄️ DATENBANK:');
  console.log('  - Likes Map:', dbLikes ? Array.from(dbLikes) : 'Keine');
  console.log('  - Bookmarks Map:', dbBookmarks ? Array.from(dbBookmarks) : 'Keine');
  console.log('  - Plays:', dbPlays || 0);
  
  console.log('\n✨ BEREICHERTER TRACK:');
  if (enrichedTrack) {
    console.log('  - Likes:', enrichedTrack.likes);
    console.log('  - isLiked:', enrichedTrack.isLiked);
    console.log('  - isBookmarked:', enrichedTrack.isBookmarked);
    console.log('  - Plays:', enrichedTrack.plays);
    console.log('  - Comments:', enrichedTrack.commentsCount);
  } else {
    console.log('  - Track nicht gefunden');
  }
  
  return { trackId, trackLike, trackBookmark, trackPlay, dbLikes, dbBookmarks, dbPlays, enrichedTrack };
};

  // Globale Funktion zum Löschen aller Tracks außer den spezifizierten
  (window as any).deleteAllTracksExcept = () => {
    console.log('🗑️ Starte Löschvorgang...');
    
    // Liste der zu behaltenden Tracks (Titel und optional Username)
    const tracksToKeep = [
      { title: 'Cosmic Whispers', username: 'luna_voice' },
      { title: 'Nocturne', username: 'midnight_whisper' },
      { title: 'Cashmere Dreams', username: 'velvet_tone' },
      { title: 'Chamber Music', username: 'echo_chamber' },
      { title: 'Calm Before Storm', username: 'silent_storm' },
      { title: 'Starlight Dreams', username: 'luna_voice' },
      { title: 'Shadow Dance', username: 'midnight_whisper' },
      { title: 'Silk Sheets', username: 'velvet_tone' },
      { title: 'Reverberation', username: 'echo_chamber' },
      { title: 'Thunder in Silence', username: 'silent_storm' },
      { title: 'Moments of 19.10.2025', username: '' },
      { title: 'Moments of 18.10.2025', username: '' },
      { title: 'Hallo', username: '' },
      { title: '1 furzndes Lama', username: '' },
      { title: 'momomomomo', username: '' },
      { title: 'Bre', username: '' },
    ];
    
    // Lade alle Tracks
    const allTracks = centralDB.getAllTracks();
    console.log(`📊 Gefundene Tracks: ${allTracks.length}`);
    
    // Finde Tracks zum Löschen
    const tracksToDelete: string[] = [];
    const tracksToKeepIds: string[] = [];
    
    allTracks.forEach(track => {
      // Prüfe ob Track behalten werden soll
      const shouldKeep = tracksToKeep.some(keepTrack => {
        const titleMatch = track.title === keepTrack.title || 
                           track.title?.includes(keepTrack.title) ||
                           keepTrack.title?.includes(track.title);
        
        // Wenn Username spezifiziert ist, muss er auch übereinstimmen
        if (keepTrack.username && titleMatch) {
          return track.user?.username === keepTrack.username;
        }
        
        // Wenn kein Username spezifiziert ist, reicht Titel-Übereinstimmung
        return titleMatch;
      });
      
      if (shouldKeep) {
        tracksToKeepIds.push(track.id);
        console.log(`✅ Behalte: "${track.title}" (${track.user?.username || 'unbekannt'}) - ID: ${track.id}`);
      } else {
        tracksToDelete.push(track.id);
        console.log(`❌ Lösche: "${track.title}" (${track.user?.username || 'unbekannt'}) - ID: ${track.id}`);
      }
    });
    
    console.log(`\n📊 Zusammenfassung:`);
    console.log(`- Zu behalten: ${tracksToKeepIds.length}`);
    console.log(`- Zu löschen: ${tracksToDelete.length}`);
    
    // Bestätigung
    const confirmed = confirm(
      `Möchtest du wirklich ${tracksToDelete.length} Tracks löschen?\n\n` +
      `Behalten: ${tracksToKeepIds.length}\n` +
      `Löschen: ${tracksToDelete.length}`
    );
    
    if (!confirmed) {
      console.log('❌ Löschvorgang abgebrochen');
      return;
    }
    
    // Lösche alle Tracks
    let deletedCount = 0;
    tracksToDelete.forEach(trackId => {
      const success = centralDB.deleteTrack(trackId);
      if (success) {
        deletedCount++;
      } else {
        console.warn(`⚠️ Konnte Track ${trackId} nicht löschen`);
      }
    });
    
    console.log(`\n✅ Löschvorgang abgeschlossen!`);
    console.log(`- Gelöscht: ${deletedCount} Tracks`);
    console.log(`- Verbleibend: ${tracksToKeepIds.length} Tracks`);
    
    // Zeige verbleibende Tracks
    const remainingTracks = centralDB.getAllTracks();
    console.log('\n📋 Verbleibende Tracks:');
    remainingTracks.forEach(track => {
      console.log(`  - "${track.title}" (${track.user?.username || 'unbekannt'})`);
    });
    
    console.log('\n🔄 Bitte lade die Seite neu, um die Änderungen zu sehen.');
  };
  
  // Funktion zum Löschen aller Tracks von holladiewaldfee
  (window as any).deleteHolladiewaldfeeTracks = () => {
    console.log('🗑️ Starte Löschvorgang für holladiewaldfee Tracks...');
    
    // Lade alle Tracks
    const allTracks = centralDB.getAllTracks();
    
    // Filtere Tracks von holladiewaldfee
    const hollaTracks = allTracks.filter(track => track.user?.username === 'holladiewaldfee');
    
    console.log(`📊 Gefundene Tracks von holladiewaldfee: ${hollaTracks.length}`);
    
    if (hollaTracks.length === 0) {
      console.log('✅ Keine Tracks von holladiewaldfee gefunden.');
      return;
    }
    
    // Zeige alle zu löschenden Tracks
    console.log('\n📋 Tracks die gelöscht werden:');
    hollaTracks.forEach(track => {
      console.log(`  - "${track.title}" (ID: ${track.id})`);
    });
    
    // Bestätigung
    const confirmed = confirm(
      `Möchtest du wirklich ${hollaTracks.length} Tracks von holladiewaldfee löschen?\n\n` +
      `Diese Aktion kann nicht rückgängig gemacht werden!`
    );
    
    if (!confirmed) {
      console.log('❌ Löschvorgang abgebrochen');
      return;
    }
    
    // Lösche alle Tracks
    let deletedCount = 0;
    hollaTracks.forEach(track => {
      const success = centralDB.deleteTrack(track.id);
      if (success) {
        deletedCount++;
        console.log(`✅ Gelöscht: "${track.title}"`);
      } else {
        console.warn(`⚠️ Konnte Track "${track.title}" (${track.id}) nicht löschen`);
      }
    });
    
    console.log(`\n✅ Löschvorgang abgeschlossen!`);
    console.log(`- Gelöscht: ${deletedCount} von ${hollaTracks.length} Tracks`);
    
    // Prüfe ob noch Tracks vorhanden sind
    const remainingHollaTracks = centralDB.getAllTracks().filter(
      track => track.user?.username === 'holladiewaldfee'
    );
    
    if (remainingHollaTracks.length === 0) {
      console.log('✅ Alle holladiewaldfee Tracks wurden erfolgreich gelöscht.');
    } else {
      console.warn(`⚠️ ${remainingHollaTracks.length} Tracks konnten nicht gelöscht werden.`);
    }
    
    console.log('\n🔄 Bitte lade die Seite neu, um die Änderungen zu sehen.');
  };
  
  console.log('🔔 Debug-Funktionen verfügbar:');
  console.log('  - debugHollaTracks() - Lädt die neuen holladiewaldfee Tracks');
  console.log('  - showHollaTracks() - Zeigt alle holladiewaldfee Tracks');
  console.log('  - deleteHolladiewaldfeeTracks() - 🗑️ Löscht ALLE Tracks von holladiewaldfee');
  console.log('  - testDatabase() - 🆕 Vollständiger Datenbank-Test (Likes/Bookmarks/Plays)');
  console.log('  - testTrack(trackId) - 🆕 Test für einen spezifischen Track');
  console.log('  - deleteAllTracksExcept() - 🗑️ Löscht alle Tracks außer den spezifizierten');

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
