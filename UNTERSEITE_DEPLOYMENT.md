# 🚀 AURAL UNTERSEITE DEPLOYMENT für yev.vision/aural/

## 📋 Übersicht
Die Aural-App wird als **Unterseite** unter `https://yev.vision/aural/` deployed.
Die Hauptdomain `yev.vision` und `www.yev.vision` bleiben unverändert.

## 🏗️ Verzeichnisstruktur auf Server

```
yev.vision/
├── (deine bestehenden Webflow-Dateien)
└── aural/                    ← NEU: Aural-App Unterseite
    ├── index.html
    ├── assets/
    ├── .htaccess
    ├── upload.php
    ├── setup.php
    ├── robots.txt
    ├── sitemap.xml
    └── uploads/
        ├── index.php
        ├── audio/
        └── temp/
```

## 🚀 Deine nächsten Schritte:

### 1. **Ordner erstellen** (auf deinem Server)
```
Erstelle einen neuen Ordner: /aural/
```

### 2. **Dateien hochladen** (FileZilla)
```
Hochzuladen in: /aural/
├── dist/ (kompletter Ordner → wird zu /aural/)
├── upload.php
├── setup.php
├── .htaccess
├── robots.txt
├── sitemap.xml
└── uploads/ (mit index.php)
```

### 3. **Server-Setup ausführen**
```
URL: https://yev.vision/aural/setup.php
```

### 4. **App testen**
```
URL: https://yev.vision/aural/
```

## 🎯 URLs der Aural-App:

- **Hauptseite**: `https://yev.vision/aural/`
- **Feed**: `https://yev.vision/aural/feed`
- **Upload**: `https://yev.vision/aural/upload`
- **Record**: `https://yev.vision/aural/record`
- **Admin**: `https://yev.vision/aural/admin`
- **Setup**: `https://yev.vision/aural/setup.php`

## 🔧 .htaccess Anpassung für Unterseite

Die .htaccess ist bereits für Unterseiten konfiguriert:
- **SPA-Routing** funktioniert unter `/aural/`
- **PHP-Backend** läuft unter `/aural/api/`
- **Uploads** werden in `/aural/uploads/` gespeichert

## 🎵 Audio-Upload URLs:

Audio-Dateien werden gespeichert als:
```
https://yev.vision/aural/uploads/audio/filename.mp3
```

## 🔒 CORS-Konfiguration:

- **Erlaubte Origins**: `https://yev.vision` und `https://www.yev.vision`
- **API-Endpunkte**: `/aural/api/upload`, `/aural/api/setup`

## 📱 Mobile-Zugriff:

Die App funktioniert auf allen Geräten:
- **Desktop**: `https://yev.vision/aural/`
- **Mobile**: `https://yev.vision/aural/`
- **Tablet**: `https://yev.vision/aural/`

## 🧪 Test-Checkliste:

- [ ] **Ordner `/aural/`** erstellt
- [ ] **Alle Dateien** hochgeladen
- [ ] **setup.php** erfolgreich ausgeführt
- [ ] **App lädt** unter `https://yev.vision/aural/`
- [ ] **Audio-Upload** funktioniert
- [ ] **Mobile-Version** getestet

## 🎉 Vorteile der Unterseiten-Lösung:

✅ **Hauptdomain bleibt unverändert**
✅ **Webflow-Integration möglich**
✅ **Einfache Verwaltung**
✅ **Separate SSL-Zertifikate**
✅ **Unabhängige Updates**

---

## 🚀 **BEREIT FÜR DEPLOYMENT!**

**Nächster Schritt**: Erstelle den `/aural/` Ordner und lade die Dateien hoch!
