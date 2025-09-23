# Aural Database V2 Migration

## Übersicht

Diese Migration erweitert die Aural-Datenbank um neue Features wie Follows, Notifications, Pending Uploads, Top Tags und erweiterte Validierungen. Die Migration ist vollständig rückwärtskompatibel und migriert automatisch bestehende V1-Daten.

## Neue Features

### 1. Follow-System
- **Follows**: Benutzer können anderen Benutzern folgen
- **Following-Feed**: Personalisierter Feed mit Tracks von gefolgten Benutzern
- **Follower/Following-Zähler**: Statistiken für Benutzerprofile

### 2. Notification-System
- **Benachrichtigungen**: Für Upload-Freigaben, neue Kommentare, Likes, etc.
- **Typen**: `UPLOAD_APPROVED`, `NEW_COMMENT`, `LIKE`, `FOLLOW`, `BOOKMARK`, `COMMENT_LIKE`
- **Payload**: Flexible JSON-Struktur für spezifische Daten

### 3. Pending Upload Queue
- **Warteschlange**: Für Uploads, die manuell freigegeben werden müssen
- **Gründe**: `rate` (Rate-Limit), `duplicate5` (5× dieselbe Datei)
- **Admin-Funktionen**: Freigabe/Ablehnung mit Notifications

### 4. Top Tags System
- **Automatische Berechnung**: Top 20 häufigste Tags
- **Caching**: Performance-optimiert
- **Vorschläge**: Für Tag-Eingabe in der UI

### 5. Erweiterte Validierungen
- **Track-Validierung**: Titel, URL, Dauer, Tags
- **Comment-Validierung**: Inhalt, Track-ID, Benutzer
- **Follow-Validierung**: Verhindert Self-Follow

### 6. Comment Likes
- **Like-System**: Für Kommentare
- **Zähler**: Like-Count pro Kommentar
- **Status**: Like-Status pro Benutzer

### 7. Play Tracking
- **Play-Count**: Anzahl der Wiedergaben pro Track
- **Increment**: Automatische Erhöhung bei Wiedergabe
- **Statistiken**: In Admin-Dashboard

## Datenbank-Schema V2

### Collections (Arrays)
```typescript
{
  users: User[],
  tracks: AudioTrack[],
  comments: Comment[],
  reports: ContentReport[],
  notifications: Notification[],
  pendingUploads: PendingUpload[],
  follows: Follow[],
  commentLikes: CommentLike[],
  plays: Play[]
}
```

### Relation Maps (Performance)
```typescript
{
  likes: Map<string, Set<string>>,           // trackId -> Set of userIds
  bookmarks: Map<string, Set<string>>,       // trackId -> Set of userIds
  commentLikesMap: Map<string, Set<string>>, // commentId -> Set of userIds
  playsMap: Map<string, number>              // trackId -> play count
}
```

### Cache
```typescript
{
  topTags: TopTag[]  // [{ tag: string, count: number }]
}
```

## Migration durchführen

### Automatische Migration
```typescript
import { autoMigrate } from './src/database/migration';

// Automatische Migration beim App-Start
const success = await autoMigrate();
if (success) {
  console.log('Migration erfolgreich');
} else {
  console.log('Migration fehlgeschlagen');
}
```

### Manuelle Migration
```typescript
import { DatabaseMigration } from './src/database/migration';

// 1. Status prüfen
const status = DatabaseMigration.getMigrationStatus();
console.log('Migration erforderlich:', status.needsMigration);

// 2. Migration mit Backup durchführen
const result = await DatabaseMigration.migrateWithBackup();
if (result.success) {
  console.log('Migration erfolgreich');
} else {
  console.log('Fehler:', result.errors);
}
```

## Verwendung der neuen Features

### Follow-System
```typescript
import { DatabaseServiceV2 } from './src/services/databaseService_v2';

// User folgen
DatabaseServiceV2.follow('user-1', 'user-2');

// Following-Liste abrufen
const following = DatabaseServiceV2.getFollowing('user-1');

// Following-Feed abrufen
const feed = DatabaseServiceV2.getFollowingFeed('user-1');
```

### Notifications
```typescript
// Notification hinzufügen
const notification = DatabaseServiceV2.addNotification({
  userId: 'user-1',
  type: 'UPLOAD_APPROVED',
  payload: { trackId: 'track-1', title: 'Mein Track' }
});

// Notifications abrufen
const notifications = DatabaseServiceV2.getUserNotifications('user-1');

// Als gelesen markieren
DatabaseServiceV2.markNotificationRead(notification.id);
```

### Pending Uploads
```typescript
// Pending Upload hinzufügen
const pending = DatabaseServiceV2.addPendingUpload({
  userId: 'user-1',
  deviceId: 'device-123',
  fileHash: 'sha256:abc123...',
  reason: 'rate',
  status: 'pending'
});

// Admin: Freigeben
DatabaseServiceV2.approvePendingUpload(pending.id, 'admin-1');

// Admin: Ablehnen
DatabaseServiceV2.rejectPendingUpload(pending.id, 'admin-1', 'Grund');
```

### Top Tags
```typescript
// Top Tags abrufen
const topTags = DatabaseServiceV2.getTopTags();
console.log('Top Tags:', topTags);

// Top Tags neu berechnen
const newTopTags = DatabaseServiceV2.recomputeTopTags(20);
```

### Comment Likes
```typescript
// Comment liken
DatabaseServiceV2.toggleCommentLike('comment-1', 'user-1');

// Like-Status prüfen
const isLiked = DatabaseServiceV2.isCommentLikedByUser('comment-1', 'user-1');

// Like-Count abrufen
const likeCount = DatabaseServiceV2.getCommentLikeCount('comment-1');
```

### Play Tracking
```typescript
// Play-Count erhöhen
DatabaseServiceV2.incrementPlay('track-1');

// Play-Count abrufen
const playCount = DatabaseServiceV2.getPlayCount('track-1');
```

## Validierungen

### Track-Validierung
```typescript
const validation = DatabaseServiceV2.validateTrack({
  title: 'Mein Track',
  url: 'data:audio/wav;base64,test',
  duration: 120,
  tags: ['Test', 'Valid']
});

if (!validation.isValid) {
  console.log('Fehler:', validation.errors);
}
```

### Follow-Validierung
```typescript
const validation = DatabaseServiceV2.validateFollow('user-1', 'user-2');
if (!validation.isValid) {
  console.log('Fehler:', validation.errors);
}
```

## Performance-Optimierungen

### Indexing
- **Maps für Relations**: O(1) Lookup für Likes, Bookmarks, etc.
- **Caching**: Top Tags werden gecacht und nur bei Änderungen neu berechnet
- **Batch-Operations**: Mehrere Operationen in einem Vorgang

### Speicher-Optimierung
- **Redundante IDs**: `userId` in Tracks für bessere Performance
- **Lazy Loading**: Daten werden nur bei Bedarf geladen
- **Compression**: JSON-Daten werden komprimiert gespeichert

## Beispiele

Siehe `src/examples/databaseV2Example.ts` für vollständige Beispiele aller neuen Features.

```typescript
import DatabaseV2Example from './src/examples/databaseV2Example';

// Alle Beispiele ausführen
await DatabaseV2Example.runAllExamples();

// Einzelne Beispiele
DatabaseV2Example.demonstrateFollowSystem();
DatabaseV2Example.demonstrateNotifications();
DatabaseV2Example.demonstrateTopTags();
```

## Rückwärtskompatibilität

- **V1-Daten**: Werden automatisch migriert
- **V1-API**: Bleibt funktional
- **Backup**: Automatisches Backup vor Migration
- **Rollback**: Möglichkeit zur Wiederherstellung

## Troubleshooting

### Migration fehlgeschlagen
1. Prüfe Browser-Konsole auf Fehler
2. Prüfe localStorage-Speicherplatz
3. Verwende `DatabaseMigration.validateMigration()` für Details

### Performance-Probleme
1. Prüfe Anzahl der Tracks (empfohlen: < 10.000)
2. Verwende `DatabaseServiceV2.debug()` für Statistiken
3. Bereinige alte Daten mit `deleteAllUserContent()`

### Daten-Inkonsistenzen
1. Führe `recomputeTopTags()` aus
2. Prüfe Validierungen mit `validateTrack()`, `validateFollow()`
3. Verwende `reset()` für kompletten Neustart

## Changelog

### V2.0.0
- ✅ Follow-System implementiert
- ✅ Notification-System implementiert
- ✅ Pending Upload Queue implementiert
- ✅ Top Tags System implementiert
- ✅ Comment Likes implementiert
- ✅ Play Tracking implementiert
- ✅ Erweiterte Validierungen implementiert
- ✅ Performance-Optimierungen implementiert
- ✅ Automatische Migration implementiert
- ✅ Rückwärtskompatibilität gewährleistet
