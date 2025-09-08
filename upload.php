<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Erlaube alle Origins für Server-URL
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

// Erfolgreiche Antwort
$response = [
    'success' => true,
    'message' => 'Audio erfolgreich hochgeladen',
    'data' => [
        'filename' => $uniqueName,
        'originalName' => $originalName,
        'size' => $file['size'],
        'mimeType' => $mimeType,
        'url' => '/aural/' . $targetPath,
        'title' => $title,
        'description' => $description,
        'gender' => $gender,
        'tags' => $tags,
        'uploadedAt' => date('c') // ISO 8601 format
    ]
];

echo json_encode($response);
?>
