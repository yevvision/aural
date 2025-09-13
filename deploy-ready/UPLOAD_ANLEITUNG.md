# 🚀 AURAL APP - DEPLOYMENT ANLEITUNG

## 📁 Dateien bereit für Upload

Alle Dateien sind im Ordner `deploy-ready/` vorbereitet.

## 🔑 FTP-Zugangsdaten:
- **Server:** wp13874980.server-he.de
- **Benutzername:** ftp13874980-aural
- **Passwort:** aural33!
- **Zielordner:** /www/aural

## 📋 Upload-Reihenfolge:

### 1. Hauptdateien hochladen:
- `index.html`
- `vite.svg`
- `upload.php`
- `setup.php`
- `.htaccess`
- `robots.txt`
- `sitemap.xml`

### 2. Assets-Ordner hochladen:
- `assets/index-Cg5zhJfg.css`
- `assets/index-BY7-5q0t.js`
- `assets/worker-BAOIWoxA.js`
- `assets/ffmpegWorker-G7I8upzo.js`

### 3. Uploads-Ordner hochladen:
- `uploads/index.php`

### 4. Verifikationsdatei hochladen:
- `deployed-2025-09-13T02-07-11-609Z.txt`

## ✅ Nach dem Upload:

### Teste die App:
- **Hauptseite:** https://yev.vision/aural/
- **Setup:** https://yev.vision/aural/setup.php
- **Verifikation:** https://yev.vision/aural/deployed-2025-09-13T02-07-11-609Z.txt

### Prüfe Assets:
- **CSS:** https://yev.vision/aural/assets/index-Cg5zhJfg.css
- **JS:** https://yev.vision/aural/assets/index-BY7-5q0t.js

## 🔧 Falls Probleme:

### Assets laden nicht (404):
1. Prüfe ob `assets/` Ordner existiert
2. Prüfe Berechtigungen (755)
3. Prüfe Dateinamen (Groß-/Kleinschreibung)

### App lädt nicht:
1. Prüfe `index.html` ist hochgeladen
2. Prüfe `.htaccess` ist hochgeladen
3. Prüfe Browser-Console auf Fehler

## 🎉 Erfolg!

Wenn alles funktioniert, ist deine Aural-App live unter:
**https://yev.vision/aural/**

---
*Erstellt am: 2025-09-13T02:07:11.613Z*
