# 🚀 AURAL DEPLOYMENT ANLEITUNG für yev.vision

## 📋 Übersicht
Diese Anleitung führt dich durch das Deployment der Aural-App auf deiner Domain `yev.vision`.

## 🏗️ Was wurde vorbereitet

### ✅ Production Build
- **Vite Build** erfolgreich erstellt
- **TypeScript-Fehler** behoben
- **Bundle-Optimierung** für Production
- **Assets** in `/dist` Ordner

### ✅ PHP Backend
- **upload.php** - Audio-Upload-Endpoint
- **setup.php** - Server-Setup und Validierung
- **uploads/index.php** - Sicherheitsdatei
- **CORS** für yev.vision konfiguriert

### ✅ Server-Konfiguration
- **.htaccess** für SPA-Routing erstellt
- **Security Headers** konfiguriert
- **Audio-File-Handling** optimiert
- **Caching** für Performance

## 🚀 Deployment-Schritte

### 1. Dateien auf Server hochladen

```bash
# Alle Dateien aus dem Projekt-Ordner auf yev.vision hochladen:
- dist/ (kompletter Ordner)
- upload.php
- setup.php
- .htaccess
- uploads/ (Ordner mit index.php)
```

### 2. Server-Setup ausführen

Besuche: `https://yev.vision/setup.php`

Das Setup wird:
- ✅ Upload-Ordner erstellen
- ✅ Berechtigungen setzen
- ✅ PHP-Konfiguration prüfen
- ✅ Sicherheitsdateien erstellen

### 3. Verzeichnisstruktur auf Server

```
yev.vision/
├── index.html (aus dist/)
├── assets/ (aus dist/assets/)
├── .htaccess
├── upload.php
├── setup.php
└── uploads/
    ├── index.php
    ├── audio/ (wird erstellt)
    └── temp/ (wird erstellt)
```

## 🔧 Domain-Konfiguration

### DNS-Einstellungen (bereits konfiguriert)
```
Type: A
Name: @
Value: 75.2.70.75

Type: A  
Name: @
Value: 99.83.190.102
```

### SSL-Zertifikat
- **Webflow** sollte automatisch SSL bereitstellen
- **HTTPS** wird in .htaccess erzwungen
- **CORS** ist für https://yev.vision konfiguriert

## 🎵 Audio-Features

### Unterstützte Formate
- **MP3** (.mp3)
- **WAV** (.wav) 
- **WebM** (.webm)
- **OGG** (.ogg)
- **M4A** (.m4a)

### Upload-Limits
- **Maximale Dateigröße**: 50MB
- **Rate-Limiting**: 3 Uploads/30min, 5 Uploads/Tag
- **Duplikat-Schutz**: Automatische Erkennung
- **Sicherheitsprüfung**: Cap-Token Validierung

## 🔒 Sicherheit

### Implementierte Maßnahmen
- **CORS** nur für yev.vision
- **Rate-Limiting** gegen Spam
- **File-Validation** für Audio-Formate
- **Upload-Directory-Protection**
- **XSS-Protection** Headers
- **Content-Security-Policy**

### Upload-Sicherheit
- **MIME-Type-Validierung**
- **Dateigröße-Limits**
- **Sichere Dateinamen**
- **Duplikat-Erkennung**
- **Device-Fingerprinting**

## 📱 Mobile-Optimierung

### Responsive Design
- **Mobile-First** Ansatz
- **Touch-optimierte** Interfaces
- **Progressive Web App** Features
- **Haptic Feedback** für mobile Geräte

### Performance
- **Lazy Loading** für Komponenten
- **Code Splitting** für kleinere Bundles
- **Asset-Caching** für schnelle Ladezeiten
- **Gzip-Kompression** aktiviert

## 🧪 Testing

### 1. Setup testen
```
https://yev.vision/setup.php
```

### 2. App-Funktionalität testen
```
https://yev.vision/
```

### 3. Audio-Upload testen
- Gehe zu `/upload`
- Lade eine Audio-Datei hoch
- Prüfe Upload-Status

### 4. Admin-Funktionen testen
```
https://yev.vision/admin
```

## 🔧 Troubleshooting

### Häufige Probleme

#### 1. 404-Fehler bei Navigation
- **Ursache**: .htaccess nicht korrekt
- **Lösung**: .htaccess-Datei prüfen und neu hochladen

#### 2. Upload-Fehler
- **Ursache**: PHP-Limits zu niedrig
- **Lösung**: setup.php ausführen und PHP-Konfiguration prüfen

#### 3. CORS-Fehler
- **Ursache**: Falsche Domain-Konfiguration
- **Lösung**: upload.php CORS-Header prüfen

#### 4. Audio spielt nicht ab
- **Ursache**: Falsche MIME-Types
- **Lösung**: .htaccess Audio-Headers prüfen

### Debug-Modus aktivieren
```javascript
// In Browser-Konsole:
localStorage.setItem('aural-debug', 'true');
```

## 📊 Monitoring

### Logs prüfen
- **Upload-Logs**: `uploads/rate_limits.json`
- **Pending-Uploads**: `uploads/pending_uploads.json`
- **Browser-Console**: Für Frontend-Fehler

### Performance-Monitoring
- **Lighthouse-Score** prüfen
- **Bundle-Größe** überwachen
- **Upload-Zeiten** messen

## 🚀 Go-Live Checkliste

- [ ] Alle Dateien hochgeladen
- [ ] setup.php erfolgreich ausgeführt
- [ ] App lädt unter https://yev.vision
- [ ] Audio-Upload funktioniert
- [ ] Admin-Bereich erreichbar
- [ ] Mobile-Version getestet
- [ ] SSL-Zertifikat aktiv
- [ ] DNS-Propagation abgeschlossen

## 📞 Support

Bei Problemen:
1. **Browser-Console** prüfen
2. **setup.php** erneut ausführen
3. **.htaccess** Syntax prüfen
4. **PHP-Error-Logs** checken

---

**Viel Erfolg mit deiner Aural-App! 🎵✨**
