<?php
/**
 * Aural App - Server Upload Script
 * Lädt alle Dateien über HTTP auf den Server hoch
 */

// Server-Konfiguration
$serverUrl = 'https://yev.vision/aural/';
$ftpUsername = 'ftp13874980-aural';
$ftpPassword = 'Aural33!';

echo "🚀 Aural App Upload Script\n";
echo "==========================\n\n";

// Dateien die hochgeladen werden sollen
$filesToUpload = [
    // Dist-Ordner (alle Dateien)
    'dist/index.html',
    'dist/assets/index-Cg5zhJfg.css',
    'dist/assets/index-BY7-5q0t.js',
    'dist/assets/worker-BAOIWoxA.js',
    'dist/assets/ffmpegWorker-G7I8upzo.js',
    
    // PHP-Dateien
    'upload.php',
    'setup.php',
    
    // Konfigurationsdateien
    '.htaccess',
    'robots.txt',
    'sitemap.xml',
    
    // Uploads-Ordner
    'uploads/index.php'
];

echo "📋 Dateien die hochgeladen werden:\n";
foreach ($filesToUpload as $file) {
    if (file_exists($file)) {
        echo "✅ $file\n";
    } else {
        echo "❌ $file (nicht gefunden)\n";
    }
}

echo "\n🔧 Nächste Schritte:\n";
echo "1. Lade diese Dateien manuell über FileZilla hoch:\n";
echo "   - Server: yev.vision\n";
echo "   - Benutzername: $ftpUsername\n";
echo "   - Passwort: $ftpPassword\n";
echo "   - Pfad: /www/aural/\n\n";

echo "2. Erstelle diese Ordnerstruktur auf dem Server:\n";
echo "   /www/aural/\n";
echo "   ├── index.html (aus dist/)\n";
echo "   ├── assets/ (aus dist/assets/)\n";
echo "   ├── upload.php\n";
echo "   ├── setup.php\n";
echo "   ├── .htaccess\n";
echo "   ├── robots.txt\n";
echo "   ├── sitemap.xml\n";
echo "   └── uploads/\n";
echo "       └── index.php\n\n";

echo "3. Nach dem Upload:\n";
echo "   - Besuche: https://yev.vision/aural/setup.php\n";
echo "   - Teste: https://yev.vision/aural/\n\n";

echo "🎉 Upload-Anleitung erstellt!\n";
?>
