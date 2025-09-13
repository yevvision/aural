<?php
// Diagnose-Skript für aural.yev.vision
// Dieses Skript hilft bei der Fehlerdiagnose

echo "<!DOCTYPE html>\n";
echo "<html lang='de'>\n";
echo "<head>\n";
echo "<meta charset='UTF-8'>\n";
echo "<title>Aural Diagnose</title>\n";
echo "<style>\n";
echo "body { font-family: Arial, sans-serif; background: #000; color: #fff; margin: 0; padding: 20px; }\n";
echo ".container { max-width: 800px; margin: 0 auto; }\n";
echo ".status { background: #10b981; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo ".error { background: #dc2626; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo ".warning { background: #f59e0b; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo ".info { background: #1f2937; padding: 15px; border-radius: 8px; margin: 10px 0; }\n";
echo "pre { background: #111; padding: 10px; border-radius: 4px; overflow-x: auto; }\n";
echo "</style>\n";
echo "</head>\n";
echo "<body>\n";
echo "<div class='container'>\n";
echo "<h1>🔧 Aural Diagnose</h1>\n";

// 1. Grundlegende Server-Informationen
echo "<div class='info'>\n";
echo "<h2>📊 Server-Informationen</h2>\n";
echo "<p><strong>PHP Version:</strong> " . phpversion() . "</p>\n";
echo "<p><strong>Server Software:</strong> " . $_SERVER['SERVER_SOFTWARE'] . "</p>\n";
echo "<p><strong>Document Root:</strong> " . $_SERVER['DOCUMENT_ROOT'] . "</p>\n";
echo "<p><strong>Script Name:</strong> " . $_SERVER['SCRIPT_NAME'] . "</p>\n";
echo "<p><strong>Request URI:</strong> " . $_SERVER['REQUEST_URI'] . "</p>\n";
echo "</div>\n";

// 2. Verzeichnis-Listing
echo "<div class='info'>\n";
echo "<h2>📁 Verzeichnis-Inhalt</h2>\n";
$files = scandir('.');
echo "<pre>\n";
foreach ($files as $file) {
    if ($file != '.' && $file != '..') {
        $perms = fileperms($file);
        $size = is_file($file) ? filesize($file) : 'DIR';
        echo sprintf("%-20s %s %s\n", $file, substr(sprintf('%o', $perms), -4), $size);
    }
}
echo "</pre>\n";
echo "</div>\n";

// 3. Prüfe wichtige Dateien
echo "<div class='info'>\n";
echo "<h2>📋 Datei-Prüfung</h2>\n";

$importantFiles = ['index.html', '.htaccess', 'assets'];
foreach ($importantFiles as $file) {
    if (file_exists($file)) {
        $perms = fileperms($file);
        $readable = is_readable($file) ? '✅ Lesbar' : '❌ Nicht lesbar';
        echo "<p><strong>$file:</strong> ✅ Existiert | Berechtigung: " . substr(sprintf('%o', $perms), -4) . " | $readable</p>\n";
    } else {
        echo "<p><strong>$file:</strong> ❌ Nicht gefunden</p>\n";
    }
}
echo "</div>\n";

// 4. .htaccess Inhalt anzeigen
if (file_exists('.htaccess')) {
    echo "<div class='info'>\n";
    echo "<h2>📄 .htaccess Inhalt</h2>\n";
    echo "<pre>\n";
    echo htmlspecialchars(file_get_contents('.htaccess'));
    echo "</pre>\n";
    echo "</div>\n";
} else {
    echo "<div class='warning'>\n";
    echo "<h2>⚠️ .htaccess nicht gefunden</h2>\n";
    echo "<p>Die .htaccess Datei fehlt. Das könnte der Grund für den 500-Fehler sein.</p>\n";
    echo "</div>\n";
}

// 5. PHP Fehler anzeigen
echo "<div class='info'>\n";
echo "<h2>🐛 PHP Fehler</h2>\n";
echo "<p><strong>Error Reporting:</strong> " . (error_reporting() ? 'Aktiviert' : 'Deaktiviert') . "</p>\n";
echo "<p><strong>Display Errors:</strong> " . (ini_get('display_errors') ? 'Aktiviert' : 'Deaktiviert') . "</p>\n";
echo "</div>\n";

// 6. Apache Module
if (function_exists('apache_get_modules')) {
    echo "<div class='info'>\n";
    echo "<h2>🔧 Apache Module</h2>\n";
    $modules = apache_get_modules();
    $importantModules = ['mod_rewrite', 'mod_headers', 'mod_expires'];
    foreach ($importantModules as $module) {
        $status = in_array($module, $modules) ? '✅ Aktiv' : '❌ Nicht aktiv';
        echo "<p><strong>$module:</strong> $status</p>\n";
    }
    echo "</div>\n";
}

echo "<div class='status'>\n";
echo "<h2>✅ Diagnose abgeschlossen</h2>\n";
echo "<p>Speichere diese Ausgabe und sende sie an den Support.</p>\n";
echo "</div>\n";

echo "</div>\n";
echo "</body>\n";
echo "</html>\n";
?>
