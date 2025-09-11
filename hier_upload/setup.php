<?php
// Setup-Datei für Aural - erstellt notwendige Ordner und setzt Permissions
header('Content-Type: application/json');

$response = [
    'success' => false,
    'message' => '',
    'details' => []
];

try {
    // Notwendige Ordner
    $directories = [
        'uploads/',
        'uploads/audio/',
        'uploads/temp/'
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            if (mkdir($dir, 0755, true)) {
                $response['details'][] = "✓ Ordner erstellt: $dir";
            } else {
                throw new Exception("Fehler beim Erstellen von: $dir");
            }
        } else {
            $response['details'][] = "✓ Ordner existiert bereits: $dir";
        }
        
        // Prüfe Schreibberechtigung
        if (!is_writable($dir)) {
            // Versuche Permissions zu setzen
            if (chmod($dir, 0755)) {
                $response['details'][] = "✓ Permissions gesetzt für: $dir";
            } else {
                $response['details'][] = "⚠ Warnung: $dir ist nicht beschreibbar";
            }
        } else {
            $response['details'][] = "✓ Ordner ist beschreibbar: $dir";
        }
    }
    
    // Erstelle Index-Dateien für Sicherheit
    $indexFiles = [
        'uploads/index.php',
        'uploads/audio/index.php',
        'uploads/temp/index.php'
    ];
    
    foreach ($indexFiles as $indexFile) {
        if (!file_exists($indexFile)) {
            file_put_contents($indexFile, '<?php http_response_code(403); exit("Forbidden"); ?>');
            $response['details'][] = "✓ Sicherheitsdatei erstellt: $indexFile";
        }
    }
    
    // Prüfe PHP-Konfiguration
    $maxFileSize = ini_get('upload_max_filesize');
    $maxPostSize = ini_get('post_max_size');
    $maxExecutionTime = ini_get('max_execution_time');
    
    $response['details'][] = "📋 PHP-Konfiguration:";
    $response['details'][] = "   - upload_max_filesize: $maxFileSize";
    $response['details'][] = "   - post_max_size: $maxPostSize";
    $response['details'][] = "   - max_execution_time: $maxExecutionTime";
    
    // Warnungen für zu kleine Limits
    $uploadLimit = (int)$maxFileSize;
    if ($uploadLimit < 50) {
        $response['details'][] = "⚠ Warnung: upload_max_filesize ist kleiner als 50MB";
    }
    
    $response['success'] = true;
    $response['message'] = 'Setup erfolgreich abgeschlossen!';
    
} catch (Exception $e) {
    $response['success'] = false;
    $response['message'] = 'Setup-Fehler: ' . $e->getMessage();
}

echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>


