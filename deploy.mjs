#!/usr/bin/env node

import sftp from 'ssh2-sftp-client';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguration
const CONFIG = {
  host: 'wp13874980.server-he.de',
  username: 'ftp13874980-aural',
  password: 'aural33!',
  remoteDir: '/www/aural',
  localDir: path.join(__dirname, 'dist'),
  port: 22
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

// Datei rekursiv hochladen
async function uploadDirectory(client, localPath, remotePath) {
  try {
    // Erstelle Remote-Verzeichnis falls nicht vorhanden
    await client.mkdir(remotePath, true);
    
    const items = await fs.readdir(localPath, { withFileTypes: true });
    
    for (const item of items) {
      const localItemPath = path.join(localPath, item.name);
      const remoteItemPath = path.join(remotePath, item.name);
      
      if (item.isDirectory()) {
        log.info(`📁 Erstelle Ordner: ${remoteItemPath}`);
        await uploadDirectory(client, localItemPath, remoteItemPath);
      } else {
        log.info(`📄 Lade hoch: ${item.name}`);
        await client.put(localItemPath, remoteItemPath, { overwrite: true });
      }
    }
  } catch (error) {
    log.error(`Fehler beim Hochladen von ${localPath}: ${error.message}`);
    throw error;
  }
}

// Index.html Pfade korrigieren
async function fixIndexHtmlPaths() {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  
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

// Probe-Datei erstellen und hochladen
async function createVerificationFile(client) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const markerFile = `deployed-${timestamp}.txt`;
  const markerContent = `Aural App deployed at: ${new Date().toISOString()}\nBuild: ${process.env.npm_package_version || '1.0.0'}\n`;
  
  try {
    // Lokale Marker-Datei erstellen
    const localMarkerPath = path.join(__dirname, markerFile);
    await fs.writeFile(localMarkerPath, markerContent);
    
    // Marker-Datei hochladen
    const remoteMarkerPath = path.join(CONFIG.remoteDir, markerFile);
    await client.put(localMarkerPath, remoteMarkerPath, { overwrite: true });
    
    // Lokale Marker-Datei löschen
    await fs.unlink(localMarkerPath);
    
    log.success(`Verifikationsdatei erstellt: ${markerFile}`);
    log.info(`🔍 Prüfe: https://yev.vision/aural/${markerFile}`);
    
    return markerFile;
  } catch (error) {
    log.warning(`Konnte Verifikationsdatei nicht erstellen: ${error.message}`);
    return null;
  }
}

// Server-Verbindung testen
async function testConnection(client) {
  try {
    const testFile = 'connection-test.txt';
    const testContent = `Test at ${new Date().toISOString()}`;
    
    // Test-Datei hochladen
    await client.put(Buffer.from(testContent), path.join(CONFIG.remoteDir, testFile), { overwrite: true });
    
    // Test-Datei wieder löschen
    await client.delete(path.join(CONFIG.remoteDir, testFile));
    
    log.success('Server-Verbindung erfolgreich');
    return true;
  } catch (error) {
    log.error(`Server-Verbindung fehlgeschlagen: ${error.message}`);
    return false;
  }
}

// Hauptfunktion
async function deploy() {
  const client = new sftp();
  
  try {
    log.deploy('Aural App Deployment gestartet...');
    
    // 1. Index.html Pfade korrigieren
    log.info('Korrigiere Asset-Pfade in index.html...');
    await fixIndexHtmlPaths();
    
    // 2. Verbindung herstellen
    log.info(`Verbinde mit Server: ${CONFIG.host}`);
    await client.connect({
      host: CONFIG.host,
      username: CONFIG.username,
      password: CONFIG.password,
      port: CONFIG.port
    });
    
    // 3. Verbindung testen
    log.info('Teste Server-Verbindung...');
    const connectionOk = await testConnection(client);
    if (!connectionOk) {
      throw new Error('Server-Verbindung fehlgeschlagen');
    }
    
    // 4. Lokales Verzeichnis prüfen
    log.info(`Prüfe lokales Verzeichnis: ${CONFIG.localDir}`);
    try {
      await fs.access(CONFIG.localDir);
    } catch (error) {
      throw new Error(`Lokales Verzeichnis nicht gefunden: ${CONFIG.localDir}`);
    }
    
    // 5. Kompletten dist-Ordner hochladen
    log.info(`Lade kompletten dist-Ordner hoch nach: ${CONFIG.remoteDir}`);
    await uploadDirectory(client, CONFIG.localDir, CONFIG.remoteDir);
    
    // 6. Zusätzliche Dateien hochladen
    const additionalFiles = [
      'upload.php',
      'setup.php', 
      '.htaccess',
      'robots.txt',
      'sitemap.xml'
    ];
    
    for (const file of additionalFiles) {
      const localPath = path.join(__dirname, file);
      const remotePath = path.join(CONFIG.remoteDir, file);
      
      try {
        await fs.access(localPath);
        log.info(`📄 Lade hoch: ${file}`);
        await client.put(localPath, remotePath, { overwrite: true });
      } catch (error) {
        log.warning(`Datei nicht gefunden: ${file}`);
      }
    }
    
    // 7. Uploads-Ordner erstellen
    const uploadsDir = path.join(CONFIG.remoteDir, 'uploads');
    try {
      await client.mkdir(uploadsDir, true);
      log.success('Uploads-Ordner erstellt/überprüft');
      
      // uploads/index.php hochladen
      const uploadsIndexPath = path.join(__dirname, 'uploads', 'index.php');
      try {
        await fs.access(uploadsIndexPath);
        await client.put(uploadsIndexPath, path.join(uploadsDir, 'index.php'), { overwrite: true });
        log.success('uploads/index.php hochgeladen');
      } catch (error) {
        log.warning('uploads/index.php nicht gefunden');
      }
    } catch (error) {
      log.warning(`Uploads-Ordner Fehler: ${error.message}`);
    }
    
    // 8. Verifikationsdatei erstellen
    log.info('Erstelle Verifikationsdatei...');
    const markerFile = await createVerificationFile(client);
    
    // 9. Erfolg
    log.success('🎉 Deployment erfolgreich abgeschlossen!');
    log.info('📱 App-URL: https://yev.vision/aural/');
    log.info('⚙️  Setup-URL: https://yev.vision/aural/setup.php');
    if (markerFile) {
      log.info(`🔍 Verifikation: https://yev.vision/aural/${markerFile}`);
    }
    
  } catch (error) {
    log.error(`Deployment fehlgeschlagen: ${error.message}`);
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

// Script ausführen
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch(console.error);
}

export { deploy };
