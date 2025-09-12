# 500-Fehler Fix - Schritt-für-Schritt Anleitung

## ✅ Automatisch erledigt:
- [x] Ultra-minimale .htaccess erstellt
- [x] Clean-Deploy aktiviert (dangerous-clean-slate: true)
- [x] Testdatei probe.txt erstellt
- [x] GitHub Actions Deploy gestartet

## 🔧 Manuelle Schritte (per FTP):

### 1. Platzhalter/Problem-Dateien entfernen
**Per FTP in `/www/aural/`:**
- [ ] `index.php` löschen/umbenennen (falls vorhanden)
- [ ] `default.html` löschen/umbenennen (falls vorhanden)  
- [ ] `maintenance.html` löschen/umbenennen (falls vorhanden)

### 2. Subdomain-Ziel prüfen
**Im HostEurope KIS → Domainservices → Subdomains:**
- [ ] Bei `aural.yev.vision` muss `/www/aural` stehen (nicht nur `/aural`)
- [ ] Speichern

### 3. Dateirechte prüfen
**Per FTP:**
- [ ] Ordner: `755`
- [ ] Dateien: `644`

### 4. Schnelltests

#### Test 1: Webserver & Pfad
```
http://aural.yev.vision/probe.txt
```
**Erwartung:** 200 OK mit Inhalt "ok"

#### Test 2: App-Datei
```
http://aural.yev.vision/index.html?v=12345
```
**Erwartung:** Deine React-App wird angezeigt

#### Test 3: SPA-Routing
```
http://aural.yev.vision/search
```
**Erwartung:** App lädt und zeigt Search-Seite

#### Test 4: HTTPS (wenn SSL aktiv)
```
https://aural.yev.vision/
```
**Erwartung:** Keine SSL-Warnung, App lädt

## 🚨 Was war das Problem?

### Alte .htaccess-Probleme:
1. **Doppelte Rewrite-Regeln** - zwei Regeln, die alles auf index.html schicken
2. **Modul-Blöcke** - mod_headers, mod_expires, mod_deflate sind bei manchen HostEurope-Tarifen nicht erlaubt
3. **ErrorDocument 404** - kann zusammen mit Rewrite-Regeln eine Schleife erzeugen

### Neue .htaccess (ultra-minimal):
```apache
# keine Verzeichnisliste
Options -Indexes

# Standard-Datei
DirectoryIndex index.html

# Vite/React SPA-Fallback
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  # Wenn echte Datei oder Ordner existiert -> direkt ausliefern
  RewriteCond %{REQUEST_FILENAME} -f [OR]
  RewriteCond %{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  # alles andere auf index.html
  RewriteRule . /index.html [L]
</IfModule>
```

## 📋 Nach dem Fix:

### Clean-Deploy rückgängig machen:
Nach erfolgreichem Test in `.github/workflows/ftps-deploy.yml`:
```yaml
dangerous-clean-slate: false  # Zurück auf false setzen
```

### Performance-Optimierungen (optional):
Wenn alles läuft, können schrittweise hinzugefügt werden:
- Caching-Header
- Gzip-Kompression
- Security-Headers

## 🎯 Erwartetes Ergebnis:
- ✅ `http://aural.yev.vision/` lädt ohne 500-Fehler
- ✅ SPA-Routing funktioniert (`/search`, `/profile`, etc.)
- ✅ Assets werden korrekt geladen
- ✅ Keine HostEurope-Platzhalter mehr sichtbar
