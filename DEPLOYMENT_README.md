# 🎵 Aural - Deployment-Anleitung

## ✅ Status: Bereit für www.yev.vision/aural

Die Aural-Web-App ist vollständig vorbereitet und wird über SFTP hochgeladen.

## 📁 Struktur auf dem Server

```
/www/aural/
├── index.html          # React SPA Hauptdatei
├── assets/             # CSS, JS, Assets
├── upload.php          # Backend für Audio-Upload
├── setup.php           # Setup-Script (einmalig ausführen)
├── uploads/            # Audio-Dateien (automatisch erstellt)
├── .htaccess           # Apache-Konfiguration
└── dummy-audio/        # Demo-Dateien
```

## 🚀 Nach dem Upload

### 1. Setup ausführen (WICHTIG!)

Rufe einmalig auf: **https://www.yev.vision/aural/setup.php**

Das Setup-Script:
- ✅ Erstellt automatisch alle notwendigen Ordner
- ✅ Setzt die korrekten Permissions (755)
- ✅ Erstellt Sicherheitsdateien
- ✅ Prüft PHP-Konfiguration

### 2. App testen

- **Frontend:** https://www.yev.vision/aural
- **Audio-Upload:** In der App auf "Upload" gehen und Audio-Datei hochladen

## 🔧 Features

- ✅ **Vollständige React SPA** mit Router
- ✅ **Echte Audio-Uploads** (bis 50MB)
- ✅ **Unterstützte Formate:** MP3, WAV, WebM, OGG, M4A
- ✅ **Sichere File-Uploads** mit Validierung
- ✅ **CORS-Konfiguration** für www.yev.vision
- ✅ **Apache .htaccess** für SPA-Routing

## 🛠️ Technische Details

- **Frontend:** React 19 + TypeScript + Tailwind CSS
- **Backend:** PHP Upload-Script
- **Audio:** WaveSurfer.js für Visualisierung
- **Routing:** React Router mit Fallback
- **Build:** Vite mit `/aural/` Base-Path

## 📞 Support

Bei Problemen:
1. Prüfe `setup.php` Output
2. Prüfe Browser-Konsole für Fehler
3. Prüfe Server-Logs für PHP-Fehler

**Viel Erfolg! 🎉**


