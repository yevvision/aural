#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Konfiguration
const CONFIG = {
  host: 'wp13874980.server-he.de',
  username: 'ftp13874980-aural',
  password: 'aural33!',
  remoteDir: '/www/aural',
  localDir: path.join(__dirname, 'dist'),
  port: 21
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

// FTP-Script erstellen
async function createFtpScript() {
  const ftpCommands = [
    `open ${CONFIG.host}`,
    `user ${CONFIG.username} ${CONFIG.password}`,
    'binary',
    `cd ${CONFIG.remoteDir}`,
    'mkdir assets',
    'mkdir uploads',
    'lcd dist',
    'put index.html',
    'put vite.svg',
    'lcd assets',
    'cd assets',
    'put index-Cg5zhJfg.css',
    'put index-BY7-5q0t.js',
    'put worker-BAOIWoxA.js',
    'put ffmpegWorker-G7I8upzo.js',
    'cd ..',
    'lcd ..',
    'put upload.php',
    'put setup.php',
    'put .htaccess',
    'put robots.txt',
    'put sitemap.xml',
    'lcd uploads',
    'cd uploads',
    'put index.php',
    'cd ..',
    'lcd ..',
    'quit'
  ].join('\n');
  
  await fs.writeFile('ftp_commands.txt', ftpCommands);
  return 'ftp_commands.txt';
}

// Verifikationsdatei erstellen
async function createVerificationFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const markerFile = `deployed-${timestamp}.txt`;
  const markerContent = `Aural App deployed at: ${new Date().toISOString()}\nBuild: ${process.env.npm_package_version || '1.0.0'}\n`;
  
  try {
    await fs.writeFile(markerFile, markerContent);
    log.success(`Verifikationsdatei erstellt: ${markerFile}`);
    return markerFile;
  } catch (error) {
    log.warning(`Konnte Verifikationsdatei nicht erstellen: ${error.message}`);
    return null;
  }
}

// Hauptfunktion
async function deploy() {
  try {
    log.deploy('Aural App Deployment gestartet...');
    
    // 1. Index.html Pfade korrigieren
    log.info('Korrigiere Asset-Pfade in index.html...');
    await fixIndexHtmlPaths();
    
    // 2. Lokales Verzeichnis prüfen
    log.info(`Prüfe lokales Verzeichnis: ${CONFIG.localDir}`);
    try {
      await fs.access(CONFIG.localDir);
    } catch (error) {
      throw new Error(`Lokales Verzeichnis nicht gefunden: ${CONFIG.localDir}`);
    }
    
    // 3. FTP-Script erstellen
    log.info('Erstelle FTP-Script...');
    const ftpScript = await createFtpScript();
    
    // 4. FTP-Upload ausführen
    log.info('Führe FTP-Upload aus...');
    try {
      const { stdout, stderr } = await execAsync(`ftp -n < ${ftpScript}`);
      if (stderr) {
        log.warning(`FTP-Warnung: ${stderr}`);
      }
      log.success('FTP-Upload abgeschlossen');
    } catch (error) {
      log.error(`FTP-Upload fehlgeschlagen: ${error.message}`);
      throw error;
    }
    
    // 5. Verifikationsdatei erstellen
    log.info('Erstelle Verifikationsdatei...');
    const markerFile = await createVerificationFile();
    
    // 6. Verifikationsdatei hochladen
    if (markerFile) {
      try {
        const { stdout, stderr } = await execAsync(`echo "put ${markerFile}" | ftp -n ${CONFIG.host}`);
        log.success(`Verifikationsdatei hochgeladen: ${markerFile}`);
        log.info(`🔍 Prüfe: https://yev.vision/aural/${markerFile}`);
      } catch (error) {
        log.warning(`Konnte Verifikationsdatei nicht hochladen: ${error.message}`);
      }
    }
    
    // 7. Aufräumen
    try {
      await fs.unlink(ftpScript);
      if (markerFile) {
        await fs.unlink(markerFile);
      }
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // 8. Erfolg
    log.success('🎉 Deployment erfolgreich abgeschlossen!');
    log.info('📱 App-URL: https://yev.vision/aural/');
    log.info('⚙️  Setup-URL: https://yev.vision/aural/setup.php');
    if (markerFile) {
      log.info(`🔍 Verifikation: https://yev.vision/aural/${markerFile}`);
    }
    
  } catch (error) {
    log.error(`Deployment fehlgeschlagen: ${error.message}`);
    process.exit(1);
  }
}

// Script ausführen
if (import.meta.url === `file://${process.argv[1]}`) {
  deploy().catch(console.error);
}

export { deploy };

