# Aural - Voice Social Network
## Ausführlicher Bericht über die Applikation

### 🎯 Überblick

**Aural** ist eine mobile-first Web-Applikation, die als "Instagram für Stimmen" konzipiert ist - eine soziale Plattform, die sich ausschließlich auf Audio-Inhalte konzentriert. Die App ermöglicht es Benutzern, Audio-Aufnahmen zu erstellen, zu teilen, zu entdecken und zu interagieren, wobei der Fokus auf intimen und erotischen Audio-Inhalten liegt.

### 🏗️ Technische Architektur

#### Frontend-Stack
- **React 19.1.1** mit TypeScript 5.8.3
- **Vite 7.1.2** als Build-Tool und Entwicklungsserver
- **React Router DOM 7.8.2** für Client-Side Routing
- **Tailwind CSS 4.1.12** für Styling mit benutzerdefiniertem Design-System
- **Framer Motion 12.23.12** für Animationen und Übergänge
- **Zustand 5.0.8** für State Management mit localStorage-Persistierung

#### Audio-Engine
- **Web Audio API** für erweiterte Audio-Manipulation und Visualisierung
- **MediaRecorder API** für Browser-basierte Audio-Aufnahme
- **Wavesurfer.js 7.10.1** für Wellenform-Visualisierung
- **FFmpeg.wasm** für Client-Side Audio-Konvertierung und -Komprimierung

#### Datenmanagement
- **Zentrale Datenbank** (`centralDatabase.ts`) als einzige Quelle der Wahrheit
- **localStorage** für Datenpersistierung (Milestone 1)
- **Simulierte Backend-Integration** mit PHP-Upload-Endpoint

### 🎨 Design-System

#### Farbpalette
- **Hintergrund**: Tiefes Schwarz (#0A0A0B)
- **Primärtext**: Weiß (#FFFFFF)
- **Sekundärtext**: Grau (#A3A3A3)
- **Neon-Akzente**: Pink (#FF006E), Violett (#8338EC), Türkis (#06FFA5), Rot (#FF1744)

#### Typografie
- **Primärschrift**: Inter (moderne, humanistische Sans-Serif)
- **Hierarchie**: Große, fette Gewichtungen für Überschriften, reguläre Gewichtungen für Fließtext

#### UI-Prinzipien
- **Mobile-First**: Optimiert für Touch-Interfaces und kleine Bildschirme
- **Dark Mode Only**: Konsistente dunkle Benutzeroberfläche
- **Minimalistisch**: Fokus auf Audio-Inhalte ohne visuelle Ablenkungen
- **Accessibility**: Mindestens 44x44px Touch-Targets, klare Kontraste

### 📱 Hauptfunktionen

#### 1. Feed-System (`/`)
- **Kategorisierte Ansichten**: New, Bookmarked, Following, Top Rated, Most Commented
- **Gender-Filter**: Couples, Females, Males, Diverse
- **Audio-Karten**: Titel, Dauer, Benutzername, Likes, Tags
- **Echtzeit-Updates**: Automatische Synchronisation zwischen Komponenten
- **Infinite Scroll**: Nahtloses Laden von Inhalten

#### 2. Audio-Player-System

##### Mini-Player (Persistent)
- **Bottom-fixed**: Bleibt während der Navigation sichtbar
- **Play/Pause-Kontrolle**: Einfache Wiedergabe-Steuerung
- **Fortschrittsbalken**: Mit Seek-Funktionalität
- **Track-Informationen**: Titel und Benutzername
- **Expand-Button**: Öffnet Vollbild-Player

##### Vollbild-Player (`/player/:id`)
- **Große Play/Pause-Schaltfläche**: Zentriert mit Audio-Visualizer
- **Animierte Wellenform**: Echtzeit-Visualisierung der Audio-Daten
- **Erweiterte Steuerung**: Zeit-Anzeige, Lautstärke, Wiedergabeliste
- **Soziale Interaktionen**: Like, Bookmark, Kommentar, Teilen
- **Kommentar-System**: Echtzeit-Kommentare mit Like-Funktionalität

#### 3. Audio-Erstellung

##### Aufnahme-Seite (`/record`)
- **Browser-Mikrofon-Aufnahme**: MediaRecorder API mit WebM/Opus
- **Echtzeit-Visualisierung**: Frequenz- und Volumen-Analyse
- **Aufnahme-Kontrollen**: Start, Pause, Resume, Stop, Cancel
- **Dauer-Tracking**: Präzise Zeitmessung mit Pause-Unterstützung
- **Qualitätseinstellungen**: 44.1kHz Sample Rate, 128 kbps Bitrate

##### Upload-Seite (`/upload`)
- **Drag & Drop**: Intuitive Datei-Auswahl
- **Datei-Validierung**: MP3, WAV, WebM, OGG, M4A (max 50MB)
- **Metadaten-Editor**: Titel, Beschreibung, Gender, Tags
- **Vorschau-Funktion**: Audio-Wiedergabe vor Upload
- **Tag-System**: Vordefinierte und benutzerdefinierte Tags

#### 4. Audio-Editor (`/audio-editor`)
- **Wellenform-Editor**: Interaktive Darstellung für präzise Bearbeitung
- **Schneiden/Trimmen**: Präzise Auswahl von Start- und Endpunkten
- **Lautstärke-Regelung**: Globale Anpassung und Fade-Effekte
- **Export-Funktionen**: Verschiedene Qualitätsstufen und Formate
- **Echtzeit-Vorschau**: Sofortige Wiedergabe der Änderungen

#### 5. Profil-System (`/profile/:id`)
- **Benutzer-Statistiken**: Total Likes, Uploads, Join-Datum
- **Track-Übersicht**: Alle Uploads des Benutzers
- **Profil-Bearbeitung**: Username, Bio, Avatar
- **Follow-System**: Anderen Benutzern folgen
- **Unterscheidung**: Eigene vs. fremde Profile

#### 6. Such- und Entdeckungsfunktionen

##### Suchseite (`/search`)
- **Erweiterte Filter**: Gender, Tags, Dauer, Datum
- **Sortierung**: Recent, Popular, Trending
- **Echtzeit-Suche**: Sofortige Ergebnisse während der Eingabe
- **Suchverlauf**: Persistente Speicherung der letzten Suchen

##### Kategorie-Seiten (`/category/:categoryId`)
- **Spezialisierte Ansichten**: Fokussierte Inhalte pro Kategorie
- **Filterung**: Nach verschiedenen Kriterien
- **Pagination**: Effiziente Inhaltsladung

#### 7. Kommentar-System (`/comments`)
- **Aktivitäts-Feed**: Likes, Kommentare, Follows, Uploads
- **Echtzeit-Updates**: Sofortige Benachrichtigungen
- **Interaktionen**: Like, Antworten, Melden
- **Benachrichtigungen**: Ungelesene Aktivitäten

#### 8. Admin-Funktionen (`/admin`)
- **Benutzer-Verwaltung**: Übersicht aller Benutzer
- **Content-Moderation**: Melde-System und Content-Review
- **Statistiken**: Upload-Zahlen, Aktivitäten, Performance
- **Datenbank-Verwaltung**: Cleanup und Wartung

### 🔧 Erweiterte Features

#### Audio-Verarbeitung
- **Client-Side Processing**: FFmpeg.wasm für Format-Konvertierung
- **Wellenform-Generierung**: Automatische Analyse der Audio-Daten
- **Komprimierung**: Optimierung für Web-Distribution
- **Qualitätskontrolle**: Automatische Validierung der Uploads

#### State Management
- **Zentrale Datenbank**: Einheitliche Datenquelle für alle Komponenten
- **Optimistic Updates**: Sofortige UI-Updates mit Rollback-Funktionalität
- **Persistierung**: Automatische Speicherung in localStorage
- **Synchronisation**: Echtzeit-Updates zwischen verschiedenen Stores

#### Performance-Optimierungen
- **Lazy Loading**: Komponenten werden bei Bedarf geladen
- **Memoization**: React.memo und useMemo für optimale Rendering-Performance
- **Code Splitting**: Automatische Aufteilung des Bundles
- **Caching**: Intelligente Zwischenspeicherung von Audio-Daten

### 🎵 Audio-Features

#### Unterstützte Formate
- **Upload**: MP3, WAV, WebM, OGG, M4A
- **Aufnahme**: WebM/Opus (Browser-native)
- **Export**: MP3, WAV, AAC (über FFmpeg)

#### Qualitätseinstellungen
- **Aufnahme**: 44.1kHz, 128 kbps, Mono
- **Upload**: Bis zu 50MB Dateigröße
- **Export**: Verschiedene Qualitätsstufen (hoch/mittel/niedrig)

#### Visualisierung
- **Echtzeit-Analyse**: Frequenz- und Volumen-Darstellung
- **Wellenform-Editor**: Interaktive Bearbeitung
- **Animierte Effekte**: Glow-Effekte und Partikel-Systeme

### 🔐 Sicherheit und Datenschutz

#### Content-Moderation
- **Melde-System**: Benutzer können unangemessene Inhalte melden
- **Automatische Filter**: Grundlegende Content-Validierung
- **Admin-Review**: Manuelle Überprüfung gemeldeter Inhalte

#### Datenschutz
- **Anonyme Nutzung**: Keine E-Mail-Verifizierung erforderlich
- **Lokale Speicherung**: Daten werden im Browser gespeichert
- **Opt-in Tracking**: Benutzer können Tracking deaktivieren

### 📊 Datenstrukturen

#### AudioTrack Interface
```typescript
interface AudioTrack {
  id: string;
  title: string;
  description?: string;
  duration: number;
  url: string;
  user: User;
  likes: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  comments?: Comment[];
  commentsCount?: number;
  createdAt: Date;
  waveformData?: number[];
  tags?: string[];
  gender?: 'Female' | 'Male' | 'Mixed' | 'Couple' | 'Diverse';
  filename?: string;
  fileSize?: number;
  format?: string;
  isPublic?: boolean;
}
```

#### User Interface
```typescript
interface User {
  id: string;
  username: string;
  email?: string;
  avatar?: string;
  totalLikes: number;
  totalUploads: number;
  bio?: string;
  createdAt: Date;
  isVerified?: boolean;
  followersCount?: number;
  followingCount?: number;
}
```

### 🚀 Deployment und Hosting

#### Entwicklung
- **Vite Dev Server**: Hot Module Replacement für schnelle Entwicklung
- **TypeScript**: Strikte Typisierung für bessere Code-Qualität
- **ESLint**: Code-Qualitätskontrolle
- **Vitest**: Unit-Testing-Framework

#### Produktion
- **Static Hosting**: Optimiert für CDN-Verteilung
- **PHP Backend**: Upload-Endpoint für Datei-Verarbeitung
- **Progressive Web App**: Offline-Funktionalität und App-Installation

### 📈 Zukünftige Erweiterungen

#### Geplante Features
- **Echtzeit-Chat**: Voice-Messaging zwischen Benutzern
- **Live-Streaming**: Echtzeit-Audio-Übertragung
- **AI-Integration**: Automatische Tag-Generierung und Content-Empfehlungen
- **Mobile App**: Native iOS/Android-Anwendungen
- **Monetarisierung**: Premium-Features und Creator-Funds

#### Technische Verbesserungen
- **Backend-Integration**: Vollständige Server-Architektur
- **Real-time Sync**: WebSocket-basierte Echtzeit-Updates
- **CDN-Integration**: Globale Audio-Distribution
- **Analytics**: Detaillierte Nutzungsstatistiken

### 🎯 Zielgruppe

#### Primäre Zielgruppe
- **Content Creator**: Podcaster, Voice Artists, Musiker, Storyteller
- **Audio-Enthusiasten**: Benutzer, die Voice-basierte soziale Interaktionen suchen
- **Mobile-First Users**: Smartphone-primäre Benutzer
- **Community Builder**: Gruppen, die sich um geteilte Audio-Interessen organisieren

#### Anwendungsfälle
- **Intime Audio-Sharing**: Persönliche Gedanken und Erfahrungen
- **Erotische Inhalte**: Erwachsene Audio-Inhalte in sicherer Umgebung
- **Kreative Projekte**: Voice-Art, Storytelling, Musik
- **Community Building**: Audio-basierte soziale Netzwerke

### 📱 Browser-Kompatibilität

#### Unterstützte Browser
- **Chrome 47+**: Vollständige Funktionalität
- **Firefox 29+**: Vollständige Funktionalität
- **Safari 14.1+**: Vollständige Funktionalität
- **Edge 79+**: Vollständige Funktionalität

#### Mobile Browser
- **iOS Safari**: Optimiert für Touch-Interfaces
- **Chrome Mobile**: Vollständige Audio-Features
- **Samsung Internet**: Kompatibel mit allen Features

### 🔧 Wartung und Support

#### Code-Qualität
- **TypeScript**: Strikte Typisierung verhindert Runtime-Fehler
- **ESLint**: Automatische Code-Qualitätskontrolle
- **Modulare Architektur**: Einfache Wartung und Erweiterung
- **Dokumentation**: Umfassende Code-Dokumentation

#### Performance-Monitoring
- **Bundle-Analyse**: Automatische Größen-Optimierung
- **Lighthouse-Scores**: Regelmäßige Performance-Bewertungen
- **Error-Tracking**: Automatische Fehler-Erkennung und -Meldung

---

**Aural** stellt eine innovative und technisch ausgereifte Lösung für Audio-basierte soziale Interaktionen dar. Die App kombiniert moderne Web-Technologien mit einem durchdachten Design-System, um eine nahtlose und immersive Erfahrung für Benutzer zu schaffen, die sich auf Audio-Inhalte konzentrieren möchten.
