<?php
/**
 * Aural App - Automatischer Upload
 * Dieses Script lädt alle Dateien automatisch hoch
 */

echo "🚀 Aural App - Automatischer Upload\n";
echo "===================================\n\n";

// Erstelle den aural-Ordner falls nicht vorhanden
$targetDir = '/www/aural/';
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0755, true);
    echo "✅ Ordner erstellt: $targetDir\n";
}

// Erstelle assets-Ordner
$assetsDir = $targetDir . 'assets/';
if (!is_dir($assetsDir)) {
    mkdir($assetsDir, 0755, true);
    echo "✅ Assets-Ordner erstellt: $assetsDir\n";
}

// Erstelle uploads-Ordner
$uploadsDir = $targetDir . 'uploads/';
if (!is_dir($uploadsDir)) {
    mkdir($uploadsDir, 0755, true);
    echo "✅ Uploads-Ordner erstellt: $uploadsDir\n";
}

// Dateien die hochgeladen werden sollen
$files = [
    'dist/index.html' => $targetDir . 'index.html',
    'dist/assets/index-Cg5zhJfg.css' => $assetsDir . 'index-Cg5zhJfg.css',
    'dist/assets/index-BY7-5q0t.js' => $assetsDir . 'index-BY7-5q0t.js',
    'dist/assets/worker-BAOIWoxA.js' => $assetsDir . 'worker-BAOIWoxA.js',
    'dist/assets/ffmpegWorker-G7I8upzo.js' => $assetsDir . 'ffmpegWorker-G7I8upzo.js',
    'upload.php' => $targetDir . 'upload.php',
    'setup.php' => $targetDir . 'setup.php',
    '.htaccess' => $targetDir . '.htaccess',
    'robots.txt' => $targetDir . 'robots.txt',
    'sitemap.xml' => $targetDir . 'sitemap.xml',
    'uploads/index.php' => $uploadsDir . 'index.php'
];

echo "\n📁 Lade Dateien hoch:\n";

foreach ($files as $source => $target) {
    if (file_exists($source)) {
        if (copy($source, $target)) {
            echo "✅ $source → $target\n";
        } else {
            echo "❌ Fehler beim Kopieren: $source\n";
        }
    } else {
        echo "⚠️  Datei nicht gefunden: $source\n";
    }
}

echo "\n🎉 Upload abgeschlossen!\n";
echo "\n🔧 Nächste Schritte:\n";
echo "1. Besuche: https://yev.vision/aural/setup.php\n";
echo "2. Teste: https://yev.vision/aural/\n";
echo "3. Admin: https://yev.vision/aural/admin\n";

echo "\n📋 Verzeichnisstruktur:\n";
echo "$targetDir\n";
echo "├── index.html\n";
echo "├── assets/\n";
echo "│   ├── index-Cg5zhJfg.css\n";
echo "│   ├── index-BY7-5q0t.js\n";
echo "│   ├── worker-BAOIWoxA.js\n";
echo "│   └── ffmpegWorker-G7I8upzo.js\n";
echo "├── upload.php\n";
echo "├── setup.php\n";
echo "├── .htaccess\n";
echo "├── robots.txt\n";
echo "├── sitemap.xml\n";
echo "└── uploads/\n";
echo "    └── index.php\n";
?>
