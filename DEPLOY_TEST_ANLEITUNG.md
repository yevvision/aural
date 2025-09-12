# Deploy-Test Anleitung für aural.yev.vision

## Nach dem Deploy testen

### 1. Grundlegende Funktionalität testen

**URL:** https://aural.yev.vision

#### Hard-Reload durchführen
1. **Chrome/Edge:** `Ctrl+Shift+R` (Windows) oder `Cmd+Shift+R` (Mac)
2. **Firefox:** `Ctrl+F5` (Windows) oder `Cmd+Shift+R` (Mac)
3. **Safari:** `Cmd+Option+R` (Mac)

#### Was zu testen ist:
- [ ] Seite lädt ohne Fehler
- [ ] Keine 404-Fehler in der Konsole
- [ ] Alle Assets (CSS, JS, Bilder) laden korrekt
- [ ] React Router funktioniert (Navigation zwischen Seiten)

### 2. Asset-Check durchführen

#### Browser-Entwicklertools öffnen
1. `F12` drücken oder Rechtsklick → "Element untersuchen"
2. **Network-Tab** öffnen
3. **Hard-Reload** durchführen (`Ctrl+Shift+R`)

#### Was zu prüfen ist:
- [ ] **Status 200** für alle Assets (keine 404-Fehler)
- [ ] **index.html** lädt erfolgreich
- [ ] **CSS-Dateien** (index-*.css) laden
- [ ] **JavaScript-Dateien** (index-*.js) laden
- [ ] **Assets-Ordner** wird korrekt referenziert

#### Erwartete Assets:
```
https://aural.yev.vision/
├── index.html (Status: 200)
├── assets/
│   ├── index-*.css (Status: 200)
│   ├── index-*.js (Status: 200)
│   ├── ffmpegWorker-*.js (Status: 200)
│   └── worker-*.js (Status: 200)
└── vite.svg (Status: 200)
```

### 3. React Router testen

#### Direkte URL-Zugriffe testen:
- [ ] https://aural.yev.vision/ (Startseite)
- [ ] https://aural.yev.vision/search (Suchseite)
- [ ] https://aural.yev.vision/profile (Profilseite)
- [ ] https://aural.yev.vision/upload (Upload-Seite)

#### Erwartetes Verhalten:
- Alle URLs zeigen die React-App (nicht 404-Fehler)
- Navigation funktioniert zwischen den Seiten
- Browser-Zurück-Button funktioniert

### 4. Funktionalitätstests

#### Audio-Features:
- [ ] Audio-Cards werden angezeigt
- [ ] Play/Pause funktioniert
- [ ] Mini-Player erscheint beim Abspielen
- [ ] Gender-Filter funktionieren (All, Couples, Females, Males, Diverse)

#### Upload-Features:
- [ ] Upload-Seite lädt
- [ ] Gender-Auswahl ist Pflichtfeld
- [ ] Upload-Validierung funktioniert

### 5. Fehlerbehebung

#### Falls 500-Fehler auftreten:
1. **Server-Logs prüfen** (falls verfügbar)
2. **.htaccess-Syntax prüfen** - keine verbotenen Direktiven
3. **PHP-Version prüfen** - sollte 7.4+ sein

#### Falls 404-Fehler bei Assets:
1. **Base-URL prüfen** - sollte `./` sein
2. **Build-Ordner-Struktur prüfen**
3. **Rewrite-Regeln prüfen**

#### Falls React Router nicht funktioniert:
1. **.htaccess Rewrite-Regeln prüfen**
2. **ErrorDocument 404** sollte auf index.html zeigen
3. **RewriteCond** sollte Assets ausschließen

### 6. Performance-Check

#### Lighthouse-Audit durchführen:
1. **Chrome DevTools** → **Lighthouse-Tab**
2. **Generate report** klicken
3. **Performance, Accessibility, Best Practices** prüfen

#### Erwartete Werte:
- **Performance:** > 80
- **Accessibility:** > 90
- **Best Practices:** > 90
- **SEO:** > 80

### 7. Mobile-Test

#### Responsive Design prüfen:
1. **Chrome DevTools** → **Device Toolbar** (`Ctrl+Shift+M`)
2. Verschiedene Geräte testen:
   - iPhone SE (375x667)
   - iPhone 12 Pro (390x844)
   - iPad (768x1024)

### 8. Clean-Deploy rückgängig machen

**Nach erfolgreichem Test:**
1. `.github/workflows/ftps-deploy.yml` öffnen
2. `dangerous-clean-slate: true` → `dangerous-clean-slate: false`
3. Änderung committen und pushen

### 9. Monitoring einrichten

#### Empfohlene Tools:
- **Uptime Robot** für Verfügbarkeits-Monitoring
- **Google Analytics** für Nutzungsstatistiken
- **Google Search Console** für SEO-Monitoring

## Troubleshooting

### Häufige Probleme:

#### 1. "This site can't be reached"
- DNS-Propagation prüfen (kann 24h dauern)
- Server-Status prüfen

#### 2. "404 Not Found" bei direkten URLs
- .htaccess Rewrite-Regeln prüfen
- ErrorDocument 404 prüfen

#### 3. Assets laden nicht
- Base-URL in vite.config.ts prüfen
- .htaccess RewriteCond für Assets prüfen

#### 4. 500 Internal Server Error
- .htaccess-Syntax prüfen
- Server-Logs prüfen
- PHP-Version prüfen

## Kontakt

Bei Problemen:
1. GitHub Issues erstellen
2. Server-Logs prüfen
3. Browser-Konsole prüfen
