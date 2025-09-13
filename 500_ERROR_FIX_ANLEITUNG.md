# 500-Fehler Fix für aural.yev.vision

## 🚨 Problem
Die Website `aural.yev.vision` zeigt einen 500-Fehler: "Das Skript konnte nicht fehlerfrei ausgeführt werden."

## 🔍 Diagnose-Schritte

### 1. Sofort-Test (5 Minuten)
```bash
# Teste, ob der Server grundsätzlich funktioniert
curl -I http://aural.yev.vision/probe.txt
curl -I http://aural.yev.vision/index.test.html
```

### 2. .htaccess temporär deaktivieren
```bash
# Benenne .htaccess um, um sie auszuschließen
mv .htaccess _htaccess.off
```

**Test:** `http://aural.yev.vision/` - Wenn es jetzt funktioniert, war .htaccess das Problem.

### 3. Minimale .htaccess testen
```bash
# Verwende die minimale Version
cp .htaccess.minimal .htaccess
```

**Test:** `http://aural.yev.vision/` - Sollte jetzt funktionieren.

### 4. Diagnose-Skript ausführen
```bash
# Lade diagnose.php auf den Server und rufe es auf
http://aural.yev.vision/diagnose.php
```

## 📋 Checkliste für HostEurope Support

### A. Subdomain-Konfiguration prüfen
- [ ] Subdomain `aural.yev.vision` zeigt auf `/www/aural`
- [ ] Nicht auf `/aural` oder anderen Pfad

### B. vHost-Einstellungen
- [ ] `AllowOverride All` für `/www/aural` aktiviert
- [ ] Oder mindestens `AllowOverride FileInfo` für Rewrite-Regeln

### C. Dateiberechtigungen
```bash
# Ordner
chmod 755 /www/aural

# Dateien
find /www/aural -type f -exec chmod 644 {} \;

# Owner (falls nötig)
chown -R www-data:www-data /www/aural
```

### D. Alte Dateien entfernen
- [ ] `index.php` (HostEurope-Platzhalter) entfernen
- [ ] Keine doppelten `index.html` Dateien

## 🔧 .htaccess Versionen

### Minimal (empfohlen für HostEurope)
```apache
DirectoryIndex index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule . /index.html [L]
</IfModule>
```

### Mit Headers (nur wenn erlaubt)
```apache
DirectoryIndex index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule . /index.html [L]
</IfModule>

<IfModule mod_headers.c>
  Header always set X-Content-Type-Options nosniff
  Header always set X-Frame-Options DENY
  Header always set X-XSS-Protection "1; mode=block"
</IfModule>
```

## 📞 Support-Nachricht (Copy-Paste)

```
Betreff: 500-Fehler aural.yev.vision - SPA Konfiguration

Hallo,

meine Subdomain aural.yev.vision liefert einen 500-Fehler. 
Es handelt sich um eine statische Single Page Application (React/Vite).

Bitte prüfen Sie:

1. Subdomain-Docroot: aural.yev.vision → /www/aural
2. AllowOverride All für /www/aural aktiviert
3. Keine index.php (HostEurope-Platzhalter) im Ordner
4. Dateiberechtigungen: Ordner 755, Dateien 644

Minimale .htaccess die funktionieren sollte:
DirectoryIndex index.html
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule . /index.html [L]
</IfModule>

Können Sie bitte die error.log Einträge für aural.yev.vision teilen?

Vielen Dank!
```

## 🎯 Wahrscheinlichste Ursachen (Top 3)

1. **AllowOverride None** - .htaccess wird nicht ausgewertet
2. **Falsches Docroot** - Subdomain zeigt nicht auf /www/aural
3. **Alte index.php** - HostEurope-Platzhalter verursacht Konflikt

## ✅ Erfolg-Test

Nach dem Fix sollte funktionieren:
- `http://aural.yev.vision/` → Lädt die App
- `http://aural.yev.vision/profile/test` → Lädt die App (SPA Routing)
- `http://aural.yev.vision/assets/...` → Lädt statische Dateien