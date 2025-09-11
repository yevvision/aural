<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: https://yev.vision'); // Erlaube yev.vision und www.yev.vision
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle OPTIONS request for CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit();
}

// Cap (Proof-of-Work) Validierung
function validateCapToken($token, $fileSize) {
    // Einfache Validierung - in Produktion sollte echte Cap-Validierung implementiert werden
    if (empty($token)) {
        return false;
    }
    
    // Token sollte mindestens 32 Zeichen haben
    if (strlen($token) < 32) {
        return false;
    }
    
    // Zusätzliche Validierung basierend auf Dateigröße
    $expectedMinLength = 32 + (int)($fileSize / (1024 * 1024)); // 1 Zeichen pro MB
    if (strlen($token) < $expectedMinLength) {
        return false;
    }
    
    return true;
}

// Rate-Limit und Duplikat-Check (Server-seitig)
function checkServerSideSecurity($file) {
    $deviceId = $_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR'];
    $deviceId = hash('sha256', $deviceId);
    
    // Einfache Datei-Hash-Berechnung
    $fileHash = hash_file('sha256', $file['tmp_name']);
    
    // Rate-Limit-Check (vereinfacht)
    $rateLimitFile = 'uploads/rate_limits.json';
    $rateLimits = [];
    
    if (file_exists($rateLimitFile)) {
        $rateLimits = json_decode(file_get_contents($rateLimitFile), true) ?: [];
    }
    
    $now = time();
    $deviceData = $rateLimits[$deviceId] ?? [
        'uploads_30min' => 0,
        'uploads_today' => 0,
        'last_upload_30min' => 0,
        'last_upload_today' => 0,
        'file_hashes' => []
    ];
    
    // 30-Minuten-Check
    if ($now - $deviceData['last_upload_30min'] < 1800) { // 30 Minuten
        if ($deviceData['uploads_30min'] >= 3) {
            return ['allowed' => false, 'reason' => 'Rate limit exceeded: 3 uploads per 30 minutes', 'requiresReview' => true];
        }
    } else {
        $deviceData['uploads_30min'] = 0;
    }
    
    // Tages-Check
    if ($now - $deviceData['last_upload_today'] < 86400) { // 24 Stunden
        if ($deviceData['uploads_today'] >= 5) {
            return ['allowed' => false, 'reason' => 'Daily limit exceeded: 5 uploads per day', 'requiresReview' => true];
        }
    } else {
        $deviceData['uploads_today'] = 0;
    }
    
    // Duplikat-Check
    $duplicateCount = $deviceData['file_hashes'][$fileHash] ?? 0;
    if ($duplicateCount >= 5) {
        return ['allowed' => false, 'reason' => 'Suspicious duplicate uploads detected', 'requiresReview' => true];
    }
    
    // Stats aktualisieren
    $deviceData['uploads_30min']++;
    $deviceData['uploads_today']++;
    $deviceData['last_upload_30min'] = $now;
    $deviceData['last_upload_today'] = $now;
    $deviceData['file_hashes'][$fileHash] = $duplicateCount + 1;
    
    $rateLimits[$deviceId] = $deviceData;
    file_put_contents($rateLimitFile, json_encode($rateLimits));
    
    return [
        'allowed' => true, 
        'requiresReview' => $duplicateCount >= 3, // Ab 3 Duplikaten Review
        'duplicateCount' => $duplicateCount
    ];
}

// Konfiguration
$uploadDir = 'uploads/';
$maxFileSize = 50 * 1024 * 1024; // 50MB
$allowedMimeTypes = [
    'audio/mpeg',     // MP3
    'audio/wav',      // WAV
    'audio/webm',     // WebM
    'audio/ogg',      // OGG
    'audio/mp4',      // M4A
    'audio/x-wav',    // WAV (alternative)
    'audio/vnd.wav'   // WAV (vendor)
];

// Erstelle Upload-Ordner falls nicht vorhanden
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Upload-Verzeichnis konnte nicht erstellt werden']);
        exit();
    }
}

// Überprüfe ob Datei hochgeladen wurde
if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
    $error = $_FILES['audio']['error'] ?? 'Keine Datei empfangen';
    
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE => 'Datei zu groß (php.ini)',
        UPLOAD_ERR_FORM_SIZE => 'Datei zu groß (Form)',
        UPLOAD_ERR_PARTIAL => 'Upload unvollständig',
        UPLOAD_ERR_NO_FILE => 'Keine Datei ausgewählt',
        UPLOAD_ERR_NO_TMP_DIR => 'Kein temporäres Verzeichnis',
        UPLOAD_ERR_CANT_WRITE => 'Schreibfehler',
        UPLOAD_ERR_EXTENSION => 'Upload durch Erweiterung gestoppt'
    ];
    
    $message = $errorMessages[$error] ?? "Upload-Fehler: $error";
    
    http_response_code(400);
    echo json_encode(['error' => $message]);
    exit();
}

$file = $_FILES['audio'];

// Cap-Token validieren
$capToken = $_POST['capToken'] ?? '';
if (!validateCapToken($capToken, $file['size'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid or missing proof-of-work token']);
    exit();
}

// Server-seitige Sicherheitsprüfung
$securityCheck = checkServerSideSecurity($file);
if (!$securityCheck['allowed']) {
    http_response_code(429);
    echo json_encode([
        'error' => $securityCheck['reason'],
        'requiresReview' => true
    ]);
    exit();
}

// Datei-Validierung
if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['error' => 'Datei zu groß. Maximum: 50MB']);
    exit();
}

// MIME-Type prüfen
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
finfo_close($finfo);

if (!in_array($mimeType, $allowedMimeTypes)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültiger Dateityp. Erlaubt: MP3, WAV, WebM, OGG, M4A']);
    exit();
}

// Sichere Dateinamen generieren
$originalName = basename($file['name']);
$extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
$safeName = preg_replace('/[^a-zA-Z0-9_-]/', '_', pathinfo($originalName, PATHINFO_FILENAME));
$uniqueName = $safeName . '_' . time() . '_' . uniqid() . '.' . $extension;
$targetPath = $uploadDir . $uniqueName;

// Datei verschieben
if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Datei konnte nicht gespeichert werden']);
    exit();
}

// Metadaten aus POST extrahieren
$title = $_POST['title'] ?? '';
$description = $_POST['description'] ?? '';
$gender = $_POST['gender'] ?? null;
$tags = isset($_POST['tags']) ? json_decode($_POST['tags'], true) : [];
$requiresReview = $_POST['requiresReview'] === 'true' || $securityCheck['requiresReview'];

// Upload-ID generieren
$uploadId = uniqid('upload_', true);

// Wenn Review erforderlich ist, in Pending-Queue speichern
if ($requiresReview) {
    $pendingFile = 'uploads/pending_uploads.json';
    $pendingUploads = [];
    
    if (file_exists($pendingFile)) {
        $pendingUploads = json_decode(file_get_contents($pendingFile), true) ?: [];
    }
    
    $pendingUploads[$uploadId] = [
        'uploadId' => $uploadId,
        'filename' => $uniqueName,
        'originalName' => $originalName,
        'size' => $file['size'],
        'mimeType' => $mimeType,
        'url' => 'https://yev.vision/aural/' . $targetPath,
        'title' => $title,
        'description' => $description,
        'gender' => $gender,
        'tags' => $tags,
        'uploadedAt' => date('c'),
        'status' => 'pending_review',
        'reason' => $securityCheck['duplicateCount'] >= 3 ? 'Duplicate file detected' : 'Rate limit or security check',
        'duplicateCount' => $securityCheck['duplicateCount'],
        'deviceId' => hash('sha256', $_SERVER['HTTP_USER_AGENT'] . $_SERVER['REMOTE_ADDR'])
    ];
    
    file_put_contents($pendingFile, json_encode($pendingUploads));
}

// Erfolgreiche Antwort
$response = [
    'success' => true,
    'message' => $requiresReview ? 'Upload erfolgreich, wartet auf Freigabe' : 'Audio erfolgreich hochgeladen',
    'requiresReview' => $requiresReview,
    'uploadId' => $uploadId,
    'data' => [
        'filename' => $uniqueName,
        'originalName' => $originalName,
        'size' => $file['size'],
        'mimeType' => $mimeType,
        'url' => 'https://yev.vision/aural/' . $targetPath,
        'title' => $title,
        'description' => $description,
        'gender' => $gender,
        'tags' => $tags,
        'uploadedAt' => date('c'), // ISO 8601 format
        'status' => $requiresReview ? 'pending_review' : 'approved'
    ]
];

echo json_encode($response);
?>
