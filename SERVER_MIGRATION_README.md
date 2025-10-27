# Server-basierte Architektur Migration

## Problem gelöst ✅

**Vorher:** Audio-Aufnahmen und Warteschlange wurden nur lokal im Browser gespeichert (localStorage), wodurch sie nicht geräteübergreifend verfügbar waren.

**Jetzt:** Alles wird zentral auf dem Server gespeichert und ist geräteübergreifend verfügbar.

## Was wurde implementiert

### 1. Server-basierte Datenbank (`upload.php`)
- **Zentrale JSON-Datenbank** auf dem Server (`aural_database.json`)
- **API-Endpunkte** für alle Datenbank-Operationen
- **Automatische Datei-Uploads** in `/uploads/` Ordner
- **Warteschlange-Management** direkt auf dem Server

### 2. Server Database Service (`serverDatabaseService.ts`)
- **Einheitliche API** für alle Server-Operationen
- **Automatische Fallbacks** zu localStorage bei Server-Problemen
- **Fehlerbehandlung** und Retry-Logik

### 3. Migrierte Komponenten
- **PendingUploadsQueue**: Lädt jetzt vom Server statt localStorage
- **AdminPage**: Pending Count vom Server
- **Upload-Seiten**: Keine lokale Warteschlange mehr

### 4. Automatische Migration
- **Auto-Migration** beim App-Start wenn nötig
- **Backup-System** für lokale Daten
- **Nahtlose Übergang** ohne Datenverlust

## API-Endpunkte

### Upload & Warteschlange
```
POST /upload.php?action=upload          - Audio hochladen
GET  /upload.php?action=getPendingUploads - Warteschlange laden
POST /upload.php?action=approveUpload   - Upload genehmigen
```

### Datenbank
```
GET  /upload.php?action=getDatabase     - Komplette DB laden
GET  /upload.php?action=getTracks       - Alle Tracks laden
POST /upload.php?action=addTrack        - Track hinzufügen
POST /upload.php?action=deleteTrack     - Track löschen
```

### Benutzer
```
GET  /upload.php?action=getUser         - User laden
POST /upload.php?action=addUser         - User hinzufügen
```

## Dateistruktur

```
/
├── upload.php                    # Server-API
├── aural_database.json          # Zentrale Datenbank
├── uploads/                     # Audio-Dateien
│   ├── audio_12345.wav
│   └── audio_67890.mp3
└── src/
    ├── services/
    │   └── serverDatabaseService.ts  # Server-Client
    ├── utils/
    │   └── migrateToServer.ts        # Migration
    └── components/admin/
        └── PendingUploadsQueue.tsx   # Migrierte Warteschlange
```

## Vorteile der neuen Architektur

### ✅ Geräteübergreifend
- Aufnahmen sind auf allen Geräten verfügbar
- Admin kann von überall auf Warteschlange zugreifen
- Keine lokalen Daten mehr

### ✅ Zentralisiert
- Eine einzige Datenbank auf dem Server
- Konsistente Daten überall
- Einfache Backups

### ✅ Skalierbar
- Server kann mehrere Benutzer gleichzeitig bedienen
- Einfache Erweiterung um weitere Features
- Professionelle Architektur

### ✅ Zuverlässig
- Automatische Fallbacks zu localStorage
- Fehlerbehandlung auf allen Ebenen
- Migration ohne Datenverlust

## Migration Details

### Automatisch beim App-Start
1. **Prüfung** ob Migration nötig ist
2. **Backup** der lokalen Daten
3. **Sync** mit Server-Datenbank
4. **Fallback** bei Server-Problemen

### Manuelle Migration
```typescript
import { migrateLocalDataToServer } from './utils/migrateToServer';

// Führe Migration durch
await migrateLocalDataToServer();
```

## Fallback-System

Bei Server-Problemen:
1. **Server-Service** versucht Verbindung
2. **Automatischer Fallback** zu localStorage
3. **Benutzer** merkt nichts von Problemen
4. **Automatische Wiederherstellung** wenn Server wieder da ist

## Nächste Schritte

### Empfohlene Verbesserungen
1. **Echte Datenbank** (MySQL/PostgreSQL) statt JSON
2. **Benutzer-Authentifizierung** mit Sessions
3. **Real-time Updates** mit WebSockets
4. **Caching-System** für bessere Performance
5. **Backup-System** für Server-Daten

### Monitoring
- **Server-Logs** überwachen
- **Datenbank-Größe** im Auge behalten
- **Upload-Statistiken** sammeln
- **Fehler-Rate** überwachen

## Technische Details

### Server-Konfiguration
- **PHP 7.4+** erforderlich
- **JSON-Unterstützung** für Datenbank
- **File-Upload** für Audio-Dateien
- **CORS-Headers** für Frontend

### Client-Konfiguration
- **Fetch-API** für Server-Kommunikation
- **Error-Handling** mit Retry-Logik
- **Offline-Support** mit localStorage-Fallback
- **TypeScript** für Typsicherheit

## Support

Bei Problemen:
1. **Browser-Konsole** prüfen
2. **Server-Logs** überprüfen
3. **Fallback-Daten** in localStorage prüfen
4. **Migration-Backup** wiederherstellen

---

**Status:** ✅ Implementiert und getestet  
**Datum:** $(date)  
**Version:** 1.0.0
