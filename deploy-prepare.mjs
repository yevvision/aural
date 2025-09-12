#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguration
const CONFIG = {
  localDir: path.join(__dirname, 'dist'),
  outputDir: path.join(__dirname, 'deploy-ready'),
  remoteDir: '/www/aural'
};

// Farbige Console-Ausgabe
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  deploy: (msg) => console.log(`${colors.bold}🚀 ${msg}${colors.reset}`)
};

// Index.html Pfade korrigieren
async function fixIndexHtmlPaths() {
  const indexPath = path.join(CONFIG.localDir, 'index.html');
  
  try {
    let content = await fs.readFile(indexPath, 'utf8');
    
    // Korrigiere Asset-Pfade
    content = content.replace(/\/assets\//g, './assets/');
    content = content.replace(/\/vite\.svg/g, './vite.svg');
    
    await fs.writeFile(indexPath, content, 'utf8');
    log.success('Index.html Pfade korrigiert');
  } catch (error) {
    log.warning(`Konnte Index.html nicht korrigieren: ${error.message}`);
  }
}

// Verzeichnis rekursiv kopieren
async function copyDirectory(src, dest) {
  try {
    await fs.mkdir(dest, { recursive: true });
    
    const items = await fs.readdir(src, { withFileTypes: true });
    
    for (const item of items) {
      const srcPath = path.join(src, item.name);
      const destPath = path.join(dest, item.name);
      
      if (item.isDirectory()) {
        await copyDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
  } catch (error) {
    log.error(`Fehler beim Kopieren von ${src}: ${error.message}`);
    throw error;
  }
}

// Verifikationsdatei erstellen
async function createVerificationFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const markerFile = `deployed-${timestamp}.txt`;
  const markerContent = `Aural App deployed at: ${new Date().toISOString()}\nBuild: ${process.env.npm_package_version || '1.0.0'}\nDeploy-Prepare: ${new Date().toISOString()}\n`;
  
  try {
    const markerPath = path.join(CONFIG.outputDir, markerFile);
    await fs.writeFile(markerPath, markerContent);
    log.success(`Verifikationsdatei erstellt: ${markerFile}`);
    return markerFile;
  } catch (error) {
    log.warning(`Konnte Verifikationsdatei nicht erstellen: ${error.message}`);
    return null;
  }
}

// Upload-Anleitung erstellen
async function createUploadInstructions(markerFile) {
  const instructions = `# 🚀 AURAL APP - DEPLOYMENT ANLEITUNG

## 📁 Dateien bereit für Upload

Alle Dateien sind im Ordner \`deploy-ready/\` vorbereitet.

## 🔑 FTP-Zugangsdaten:
- **Server:** wp13874980.server-he.de
- **Benutzername:** ftp13874980-aural
- **Passwort:** aural33!
- **Zielordner:** /www/aural

## 📋 Upload-Reihenfolge:

### 1. Hauptdateien hochladen:
- \`index.html\`
- \`vite.svg\`
- \`upload.php\`
- \`setup.php\`
- \`.htaccess\`
- \`robots.txt\`
- \`sitemap.xml\`

### 2. Assets-Ordner hochladen:
- \`assets/index-Cg5zhJfg.css\`
- \`assets/index-BY7-5q0t.js\`
- \`assets/worker-BAOIWoxA.js\`
- \`assets/ffmpegWorker-G7I8upzo.js\`

### 3. Uploads-Ordner hochladen:
- \`uploads/index.php\`

### 4. Verifikationsdatei hochladen:
- \`${markerFile}\`

## ✅ Nach dem Upload:

### Teste die App:
- **Hauptseite:** https://yev.vision/aural/
- **Setup:** https://yev.vision/aural/setup.php
- **Verifikation:** https://yev.vision/aural/${markerFile}

### Prüfe Assets:
- **CSS:** https://yev.vision/aural/assets/index-Cg5zhJfg.css
- **JS:** https://yev.vision/aural/assets/index-BY7-5q0t.js

## 🔧 Falls Probleme:

### Assets laden nicht (404):
1. Prüfe ob \`assets/\` Ordner existiert
2. Prüfe Berechtigungen (755)
3. Prüfe Dateinamen (Groß-/Kleinschreibung)

### App lädt nicht:
1. Prüfe \`index.html\` ist hochgeladen
2. Prüfe \`.htaccess\` ist hochgeladen
3. Prüfe Browser-Console auf Fehler

## 🎉 Erfolg!

Wenn alles funktioniert, ist deine Aural-App live unter:
**https://yev.vision/aural/**

---
*Erstellt am: ${new Date().toISOString()}*
`;

  const instructionsPath = path.join(CONFIG.outputDir, 'UPLOAD_ANLEITUNG.md');
  await fs.writeFile(instructionsPath, instructions);
  log.success('Upload-Anleitung erstellt');
}

// Hauptfunktion
async function prepareDeploy() {
  try {
    log.deploy('Aural App - Deployment-Vorbereitung gestartet...');
    
    // 1. Index.html Pfade korrigieren
    log.info('Korrigiere Asset-Pfade in index.html...');
    await fixIndexHtmlPaths();
    
    // 2. Output-Verzeichnis erstellen
    log.info(`Erstelle Output-Verzeichnis: ${CONFIG.outputDir}`);
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    // 3. Dist-Ordner kopieren
    log.info('Kopiere dist-Ordner...');
    await copyDirectory(CONFIG.localDir, CONFIG.outputDir);
    
    // 4. Zusätzliche Dateien kopieren
    const additionalFiles = [
      'upload.php',
      'setup.php', 
      '.htaccess',
      'robots.txt',
      'sitemap.xml'
    ];
    
    for (const file of additionalFiles) {
      const srcPath = path.join(__dirname, file);
      const destPath = path.join(CONFIG.outputDir, file);
      
      try {
        await fs.access(srcPath);
        await fs.copyFile(srcPath, destPath);
        log.info(`📄 Kopiert: ${file}`);
      } catch (error) {
        log.warning(`Datei nicht gefunden: ${file}`);
      }
    }
    
    // 5. Uploads-Ordner erstellen
    const uploadsDir = path.join(CONFIG.outputDir, 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    
    const uploadsIndexPath = path.join(__dirname, 'uploads', 'index.php');
    try {
      await fs.access(uploadsIndexPath);
      await fs.copyFile(uploadsIndexPath, path.join(uploadsDir, 'index.php'));
      log.success('uploads/index.php kopiert');
    } catch (error) {
      log.warning('uploads/index.php nicht gefunden');
    }
    
    // 6. Verifikationsdatei erstellen
    log.info('Erstelle Verifikationsdatei...');
    const markerFile = await createVerificationFile();
    
    // 7. Upload-Anleitung erstellen
    log.info('Erstelle Upload-Anleitung...');
    await createUploadInstructions(markerFile);
    
    // 8. Erfolg
    log.success('🎉 Deployment-Vorbereitung abgeschlossen!');
    log.info(`📁 Dateien bereit in: ${CONFIG.outputDir}`);
    log.info('📋 Upload-Anleitung: deploy-ready/UPLOAD_ANLEITUNG.md');
    log.info('📱 Nach Upload: https://yev.vision/aural/');
    if (markerFile) {
      log.info(`🔍 Verifikation: https://yev.vision/aural/${markerFile}`);
    }
    
  } catch (error) {
    log.error(`Deployment-Vorbereitung fehlgeschlagen: ${error.message}`);
    process.exit(1);
  }
}

// Script ausführen
if (import.meta.url === `file://${process.argv[1]}`) {
  prepareDeploy().catch(console.error);
}

export { prepareDeploy };

