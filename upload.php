<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$dbFile = 'aural_database.json';

// Initialize database if it doesn't exist
function initializeDatabase() {
    global $dbFile;
    if (!file_exists($dbFile)) {
        $initialData = [
            'users' => [],
            'tracks' => [],
            'comments' => [],
            'reports' => [],
            'notifications' => [],
            'pendingUploads' => [],
            'follows' => [],
            'commentLikes' => [],
            'plays' => [],
            'timestamp' => date('c')
        ];
        file_put_contents($dbFile, json_encode($initialData, JSON_PRETTY_PRINT));
    }
}

// Load database
function loadDatabase() {
    global $dbFile;
    initializeDatabase();
    $content = file_get_contents($dbFile);
    return json_decode($content, true);
}

// Save database
function saveDatabase($data) {
    global $dbFile;
    $data['timestamp'] = date('c');
    file_put_contents($dbFile, json_encode($data, JSON_PRETTY_PRINT));
}

// Generate unique ID
function generateId() {
    return uniqid() . '_' . substr(md5(microtime()), 0, 8);
}

// Handle different request types
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'upload';

try {
    switch ($action) {
        case 'upload':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for uploads');
            }
            
            // Handle file upload
            if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception('No audio file uploaded');
            }
            
            $file = $_FILES['audio'];
            $title = $_POST['title'] ?? 'Untitled';
            $description = $_POST['description'] ?? '';
            $capToken = $_POST['capToken'] ?? '';
            $requiresReview = ($_POST['requiresReview'] ?? 'false') === 'true';
            $gender = $_POST['gender'] ?? '';
            $tags = json_decode($_POST['tags'] ?? '[]', true);
            $userId = $_POST['userId'] ?? 'temp_user';
            $username = $_POST['username'] ?? 'temp_user';
            
            // Validate file
            $allowedTypes = ['audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'audio/m4a'];
            if (!in_array($file['type'], $allowedTypes)) {
                throw new Exception('Invalid audio file type');
            }
            
            // Generate unique filename
            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = generateId() . '.' . $extension;
            $uploadPath = 'uploads/' . $filename;
            
            // Create uploads directory if it doesn't exist
            if (!is_dir('uploads')) {
                mkdir('uploads', 0755, true);
            }
            
            // Move uploaded file
            if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
                throw new Exception('Failed to save audio file');
            }
            
            // Create track data
            $trackId = generateId();
            $track = [
                'id' => $trackId,
                'title' => $title,
                'description' => $description,
                'filename' => $filename,
                'url' => 'https://goaural.com/' . $uploadPath,
                'duration' => 0, // Will be calculated by client
                'user' => [
                    'id' => $userId,
                    'username' => $username
                ],
                'userId' => $userId,
                'likes' => 0,
                'isLiked' => false,
                'isBookmarked' => false,
                'createdAt' => date('c'),
                'tags' => $tags,
                'gender' => $gender,
                'fileSize' => $file['size'],
                'format' => $file['type'],
                'status' => $requiresReview ? 'pending_review' : 'active'
            ];
            
            // Load database and add track
            $db = loadDatabase();
            
            // Check auto-approve status
            $autoApproveActive = $db['autoApproveStatus'] ?? false;
            
            if ($requiresReview && !$autoApproveActive) {
                // Manual approval required - add to pending uploads
                $pendingUpload = [
                    'uploadId' => $trackId,
                    'title' => $title,
                    'status' => 'pending_review',
                    'reason' => 'Security check triggered - manual approval required',
                    'userId' => $userId,
                    'username' => $username,
                    'duration' => 0,
                    'filename' => $filename,
                    'url' => 'https://goaural.com/' . $uploadPath,
                    'createdAt' => date('c')
                ];
                $db['pendingUploads'][] = $pendingUpload;
            } else {
                // Auto-approve active OR no review required - add directly to tracks
                if ($requiresReview && $autoApproveActive) {
                    // Log auto-approval
                    error_log("Auto-approved upload: $trackId (title: $title) - would normally require review");
                }
                $db['tracks'][] = $track;
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'id' => $trackId,
                    'filename' => $filename,
                    'originalName' => $file['name'],
                    'size' => $file['size'],
                    'mimeType' => $file['type'],
                    'uploadedAt' => date('c'),
                    'requiresReview' => $requiresReview,
                    'autoApproved' => $requiresReview && $autoApproveActive,
                    'autoApproveActive' => $autoApproveActive
                ]
            ]);
            break;
            
        case 'getPendingUploads':
            $db = loadDatabase();
            echo json_encode([
                'success' => true,
                'data' => $db['pendingUploads'] ?? []
            ]);
            break;
            
        case 'approveUpload':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for approval');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $uploadId = $input['uploadId'] ?? '';
            
            if (!$uploadId) {
                throw new Exception('Upload ID required');
            }
            
            $db = loadDatabase();
            $pendingIndex = -1;
            $pendingUpload = null;
            
            // Find pending upload
            foreach ($db['pendingUploads'] as $index => $upload) {
                if ($upload['uploadId'] === $uploadId) {
                    $pendingIndex = $index;
                    $pendingUpload = $upload;
                    break;
                }
            }
            
            if ($pendingIndex === -1) {
                throw new Exception('Pending upload not found');
            }
            
            // Create track from pending upload
            $track = [
                'id' => $pendingUpload['uploadId'],
                'title' => $pendingUpload['title'],
                'description' => '',
                'filename' => $pendingUpload['filename'],
                'url' => $pendingUpload['url'],
                'duration' => $pendingUpload['duration'],
                'user' => [
                    'id' => $pendingUpload['userId'],
                    'username' => $pendingUpload['username']
                ],
                'userId' => $pendingUpload['userId'],
                'likes' => 0,
                'isLiked' => false,
                'isBookmarked' => false,
                'createdAt' => $pendingUpload['createdAt'],
                'tags' => [],
                'gender' => '',
                'fileSize' => 0,
                'format' => 'audio/wav',
                'status' => 'active'
            ];
            
            // Add to tracks and remove from pending
            $db['tracks'][] = $track;
            array_splice($db['pendingUploads'], $pendingIndex, 1);
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $track
            ]);
            break;
            
        case 'getTracks':
            $db = loadDatabase();
            echo json_encode([
                'success' => true,
                'data' => $db['tracks'] ?? []
            ]);
            break;
            
        case 'getDatabase':
            $db = loadDatabase();
            echo json_encode([
                'success' => true,
                'data' => $db
            ]);
            break;
            
        case 'addTrack':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding tracks');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $track = $input['track'] ?? null;
            
            if (!$track) {
                throw new Exception('Track data required');
            }
            
            $db = loadDatabase();
            $db['tracks'][] = $track;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $track
            ]);
            break;
            
        case 'deleteTrack':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for deleting tracks');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $trackId = $input['trackId'] ?? '';
            
            if (!$trackId) {
                throw new Exception('Track ID required');
            }
            
            $db = loadDatabase();
            $found = false;
            
            // Remove from tracks
            foreach ($db['tracks'] as $index => $track) {
                if ($track['id'] === $trackId) {
                    unset($db['tracks'][$index]);
                    $db['tracks'] = array_values($db['tracks']); // Re-index array
                    $found = true;
                    break;
                }
            }
            
            if (!$found) {
                throw new Exception('Track not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'message' => 'Track deleted successfully'
            ]);
            break;
            
        case 'getUser':
            if ($method !== 'GET') {
                throw new Exception('Only GET method allowed for getting users');
            }
            
            $userId = $_GET['userId'] ?? '';
            if (!$userId) {
                throw new Exception('User ID required');
            }
            
            $db = loadDatabase();
            $user = null;
            
            foreach ($db['users'] as $u) {
                if ($u['id'] === $userId) {
                    $user = $u;
                    break;
                }
            }
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            echo json_encode([
                'success' => true,
                'data' => $user
            ]);
            break;
            
        case 'addUser':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding users');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $user = $input['user'] ?? null;
            
            if (!$user) {
                throw new Exception('User data required');
            }
            
            $db = loadDatabase();
            $db['users'][] = $user;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $user
            ]);
            break;
            
        case 'updateUser':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for updating users');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['userId'] ?? '';
            $updates = $input['updates'] ?? [];
            
            if (!$userId) {
                throw new Exception('User ID required');
            }
            
            $db = loadDatabase();
            $userFound = false;
            
            foreach ($db['users'] as $index => $user) {
                if ($user['id'] === $userId) {
                    $db['users'][$index] = array_merge($user, $updates);
                    $userFound = true;
                    break;
                }
            }
            
            if (!$userFound) {
                throw new Exception('User not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $db['users'][$index]
            ]);
            break;
            
        case 'updateTrack':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for updating tracks');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $trackId = $input['trackId'] ?? '';
            $updates = $input['updates'] ?? [];
            
            if (!$trackId) {
                throw new Exception('Track ID required');
            }
            
            $db = loadDatabase();
            $trackFound = false;
            
            foreach ($db['tracks'] as $index => $track) {
                if ($track['id'] === $trackId) {
                    $db['tracks'][$index] = array_merge($track, $updates);
                    $trackFound = true;
                    break;
                }
            }
            
            if (!$trackFound) {
                throw new Exception('Track not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $db['tracks'][$index]
            ]);
            break;
            
        case 'addComment':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding comments');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $comment = $input;
            
            if (!$comment) {
                throw new Exception('Comment data required');
            }
            
            $db = loadDatabase();
            $db['comments'][] = $comment;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $comment
            ]);
            break;
            
        case 'deleteComment':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for deleting comments');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $commentId = $input['commentId'] ?? '';
            
            if (!$commentId) {
                throw new Exception('Comment ID required');
            }
            
            $db = loadDatabase();
            $commentFound = false;
            
            foreach ($db['comments'] as $index => $comment) {
                if ($comment['id'] === $commentId) {
                    array_splice($db['comments'], $index, 1);
                    $commentFound = true;
                    break;
                }
            }
            
            if (!$commentFound) {
                throw new Exception('Comment not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'addLike':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding likes');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $like = $input;
            
            if (!$like) {
                throw new Exception('Like data required');
            }
            
            $db = loadDatabase();
            if (!isset($db['likes'])) {
                $db['likes'] = [];
            }
            $db['likes'][] = $like;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $like
            ]);
            break;
            
        case 'removeLike':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for removing likes');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $likeId = $input['likeId'] ?? '';
            
            if (!$likeId) {
                throw new Exception('Like ID required');
            }
            
            $db = loadDatabase();
            $likeFound = false;
            
            if (isset($db['likes'])) {
                foreach ($db['likes'] as $index => $like) {
                    if ($like['id'] === $likeId) {
                        array_splice($db['likes'], $index, 1);
                        $likeFound = true;
                        break;
                    }
                }
            }
            
            if (!$likeFound) {
                throw new Exception('Like not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'addBookmark':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding bookmarks');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $bookmark = $input;
            
            if (!$bookmark) {
                throw new Exception('Bookmark data required');
            }
            
            $db = loadDatabase();
            if (!isset($db['bookmarks'])) {
                $db['bookmarks'] = [];
            }
            $db['bookmarks'][] = $bookmark;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $bookmark
            ]);
            break;
            
        case 'removeBookmark':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for removing bookmarks');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $bookmarkId = $input['bookmarkId'] ?? '';
            
            if (!$bookmarkId) {
                throw new Exception('Bookmark ID required');
            }
            
            $db = loadDatabase();
            $bookmarkFound = false;
            
            if (isset($db['bookmarks'])) {
                foreach ($db['bookmarks'] as $index => $bookmark) {
                    if ($bookmark['id'] === $bookmarkId) {
                        array_splice($db['bookmarks'], $index, 1);
                        $bookmarkFound = true;
                        break;
                    }
                }
            }
            
            if (!$bookmarkFound) {
                throw new Exception('Bookmark not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'incrementPlay':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for incrementing plays');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $trackId = $input['trackId'] ?? '';
            
            if (!$trackId) {
                throw new Exception('Track ID required');
            }
            
            $db = loadDatabase();
            if (!isset($db['plays'])) {
                $db['plays'] = [];
            }
            
            $playFound = false;
            foreach ($db['plays'] as $index => $play) {
                if ($play['trackId'] === $trackId) {
                    $db['plays'][$index]['count'] = ($db['plays'][$index]['count'] ?? 0) + 1;
                    $playFound = true;
                    break;
                }
            }
            
            if (!$playFound) {
                $db['plays'][] = [
                    'trackId' => $trackId,
                    'count' => 1,
                    'lastPlayed' => date('c')
                ];
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'addUserActivity':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding user activities');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $activity = $input;
            
            if (!$activity) {
                throw new Exception('Activity data required');
            }
            
            $db = loadDatabase();
            if (!isset($db['userActivities'])) {
                $db['userActivities'] = [];
            }
            $db['userActivities'][] = $activity;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $activity
            ]);
            break;
            
        case 'addNotification':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding notifications');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $notification = $input;
            
            if (!$notification) {
                throw new Exception('Notification data required');
            }
            
            $db = loadDatabase();
            $db['notifications'][] = $notification;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $notification
            ]);
            break;
            
        case 'markActivityAsRead':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for marking activities as read');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $activityId = $input['activityId'] ?? '';
            
            if (!$activityId) {
                throw new Exception('Activity ID required');
            }
            
            $db = loadDatabase();
            $activityFound = false;
            
            if (isset($db['userActivities'])) {
                foreach ($db['userActivities'] as $index => $activity) {
                    if ($activity['id'] === $activityId) {
                        $db['userActivities'][$index]['isRead'] = true;
                        $activityFound = true;
                        break;
                    }
                }
            }
            
            if (!$activityFound) {
                throw new Exception('Activity not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'markNotificationAsRead':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for marking notifications as read');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $notificationId = $input['notificationId'] ?? '';
            
            if (!$notificationId) {
                throw new Exception('Notification ID required');
            }
            
            $db = loadDatabase();
            $notificationFound = false;
            
            foreach ($db['notifications'] as $index => $notification) {
                if ($notification['id'] === $notificationId) {
                    $db['notifications'][$index]['isRead'] = true;
                    $notificationFound = true;
                    break;
                }
            }
            
            if (!$notificationFound) {
                throw new Exception('Notification not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'addReport':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding reports');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $report = $input;
            
            if (!$report) {
                throw new Exception('Report data required');
            }
            
            $db = loadDatabase();
            $db['reports'][] = $report;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $report
            ]);
            break;
            
        case 'updateReportStatus':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for updating report status');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $reportId = $input['reportId'] ?? '';
            $status = $input['status'] ?? '';
            $reviewedBy = $input['reviewedBy'] ?? '';
            
            if (!$reportId || !$status) {
                throw new Exception('Report ID and status required');
            }
            
            $db = loadDatabase();
            $reportFound = false;
            
            foreach ($db['reports'] as $index => $report) {
                if ($report['id'] === $reportId) {
                    $db['reports'][$index]['status'] = $status;
                    if ($reviewedBy) {
                        $db['reports'][$index]['reviewedBy'] = $reviewedBy;
                    }
                    $db['reports'][$index]['reviewedAt'] = date('c');
                    $reportFound = true;
                    break;
                }
            }
            
            if (!$reportFound) {
                throw new Exception('Report not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $db['reports'][$index]
            ]);
            break;
            
        case 'deleteReport':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for deleting reports');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $reportId = $input['reportId'] ?? '';
            
            if (!$reportId) {
                throw new Exception('Report ID required');
            }
            
            $db = loadDatabase();
            $reportFound = false;
            
            foreach ($db['reports'] as $index => $report) {
                if ($report['id'] === $reportId) {
                    array_splice($db['reports'], $index, 1);
                    $reportFound = true;
                    break;
                }
            }
            
            if (!$reportFound) {
                throw new Exception('Report not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'deleteAllUserContent':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for deleting user content');
            }
            
            $db = loadDatabase();
            
            // Delete all user-generated content
            $db['tracks'] = [];
            $db['comments'] = [];
            $db['reports'] = [];
            $db['pendingUploads'] = [];
            $db['likes'] = [];
            $db['bookmarks'] = [];
            $db['plays'] = [];
            $db['userActivities'] = [];
            $db['notifications'] = [];
            $db['follows'] = [];
            $db['commentLikes'] = [];
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'forceDeleteTrack':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for force deleting tracks');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $trackTitle = $input['trackTitle'] ?? '';
            $username = $input['username'] ?? '';
            
            if (!$trackTitle || !$username) {
                throw new Exception('Track title and username required');
            }
            
            $db = loadDatabase();
            $tracksDeleted = 0;
            
            // Delete tracks matching title and username
            foreach ($db['tracks'] as $index => $track) {
                if ($track['title'] === $trackTitle && $track['user']['username'] === $username) {
                    array_splice($db['tracks'], $index, 1);
                    $tracksDeleted++;
                }
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'deletedCount' => $tracksDeleted
            ]);
            break;
            
        case 'resetDatabase':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for resetting database');
            }
            
            $initialData = [
                'users' => [],
                'tracks' => [],
                'comments' => [],
                'reports' => [],
                'notifications' => [],
                'pendingUploads' => [],
                'follows' => [],
                'commentLikes' => [],
                'plays' => [],
                'likes' => [],
                'bookmarks' => [],
                'userActivities' => [],
                'timestamp' => date('c')
            ];
            
            saveDatabase($initialData);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'forceCreateDemoData':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for creating demo data');
            }
            
            $db = loadDatabase();
            
            // Add demo user if not exists
            $demoUserExists = false;
            foreach ($db['users'] as $user) {
                if ($user['username'] === 'demo_user') {
                    $demoUserExists = true;
                    break;
                }
            }
            
            if (!$demoUserExists) {
                $db['users'][] = [
                    'id' => 'demo_user_1',
                    'username' => 'demo_user',
                    'email' => 'demo@example.com',
                    'avatar' => '',
                    'totalLikes' => 0,
                    'totalUploads' => 0,
                    'createdAt' => date('c'),
                    'isAdmin' => false
                ];
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'forceAddHollaTracks':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding Holla tracks');
            }
            
            $db = loadDatabase();
            
            // Add demo Holla tracks
            $hollaTracks = [
                [
                    'id' => 'holla_track_1',
                    'title' => 'Holla Demo Track 1',
                    'description' => 'Demo track for testing',
                    'filename' => 'demo1.wav',
                    'url' => 'https://goaural.com/uploads/demo1.wav',
                    'duration' => 30,
                    'user' => [
                        'id' => 'demo_user_1',
                        'username' => 'demo_user'
                    ],
                    'userId' => 'demo_user_1',
                    'likes' => 5,
                    'isLiked' => false,
                    'isBookmarked' => false,
                    'createdAt' => date('c'),
                    'tags' => ['demo', 'holla'],
                    'gender' => 'mixed',
                    'fileSize' => 1024000,
                    'format' => 'audio/wav',
                    'status' => 'active'
                ]
            ];
            
            foreach ($hollaTracks as $track) {
                $db['tracks'][] = $track;
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'addedCount' => count($hollaTracks)
            ]);
            break;
            
        case 'addDemoActivitiesAndNotifications':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding demo activities');
            }
            
            $db = loadDatabase();
            
            // Add demo activities
            $demoActivities = [
                [
                    'id' => 'demo_activity_1',
                    'userId' => 'demo_user_1',
                    'type' => 'track_uploaded',
                    'message' => 'You uploaded a new track',
                    'createdAt' => date('c'),
                    'isRead' => false
                ]
            ];
            
            if (!isset($db['userActivities'])) {
                $db['userActivities'] = [];
            }
            
            foreach ($demoActivities as $activity) {
                $db['userActivities'][] = $activity;
            }
            
            // Add demo notifications
            $demoNotifications = [
                [
                    'id' => 'demo_notification_1',
                    'userId' => 'demo_user_1',
                    'type' => 'like_received',
                    'message' => 'Someone liked your track',
                    'createdAt' => date('c'),
                    'isRead' => false
                ]
            ];
            
            foreach ($demoNotifications as $notification) {
                $db['notifications'][] = $notification;
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'activitiesAdded' => count($demoActivities),
                'notificationsAdded' => count($demoNotifications)
            ]);
            break;
            
        case 'rejectUpload':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for rejecting uploads');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $uploadId = $input['uploadId'] ?? '';
            $reason = $input['reason'] ?? 'No reason provided';
            
            if (!$uploadId) {
                throw new Exception('Upload ID required');
            }
            
            $db = loadDatabase();
            $uploadFound = false;
            
            foreach ($db['pendingUploads'] as $index => $upload) {
                if ($upload['uploadId'] === $uploadId) {
                    // Remove from pending uploads
                    array_splice($db['pendingUploads'], $index, 1);
                    $uploadFound = true;
                    break;
                }
            }
            
            if (!$uploadFound) {
                throw new Exception('Pending upload not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'reason' => $reason
            ]);
            break;
            
        case 'getAutoApproveStatus':
            $db = loadDatabase();
            $autoApproveStatus = $db['autoApproveStatus'] ?? false;
            
            echo json_encode([
                'success' => true,
                'data' => $autoApproveStatus
            ]);
            break;
            
        case 'setAutoApproveStatus':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for setting auto approve status');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $status = $input['status'] ?? false;
            
            $db = loadDatabase();
            $db['autoApproveStatus'] = $status;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $status
            ]);
            break;
            
        case 'getUserData':
            if ($method !== 'GET') {
                throw new Exception('Only GET method allowed for getting user data');
            }
            
            $userId = $_GET['userId'] ?? '';
            if (!$userId) {
                throw new Exception('User ID required');
            }
            
            $db = loadDatabase();
            $user = null;
            
            foreach ($db['users'] as $u) {
                if ($u['id'] === $userId) {
                    $user = $u;
                    break;
                }
            }
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            // Get user's tracks
            $userTracks = [];
            foreach ($db['tracks'] as $track) {
                if ($track['userId'] === $userId) {
                    $userTracks[] = $track;
                }
            }
            
            // Get user's followed users
            $followedUsers = [];
            if (isset($db['follows'])) {
                foreach ($db['follows'] as $follow) {
                    if ($follow['followerId'] === $userId) {
                        // Find the followed user
                        foreach ($db['users'] as $followedUser) {
                            if ($followedUser['id'] === $follow['followingId']) {
                                $followedUsers[] = $followedUser;
                                break;
                            }
                        }
                    }
                }
            }
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'user' => $user,
                    'myTracks' => $userTracks,
                    'followedUsers' => $followedUsers
                ]
            ]);
            break;
            
        case 'updateUserData':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for updating user data');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $userId = $input['userId'] ?? '';
            $userData = $input['userData'] ?? [];
            $myTracks = $input['myTracks'] ?? [];
            $followedUsers = $input['followedUsers'] ?? [];
            
            if (!$userId) {
                throw new Exception('User ID required');
            }
            
            $db = loadDatabase();
            
            // Update user data
            $userFound = false;
            foreach ($db['users'] as $index => $user) {
                if ($user['id'] === $userId) {
                    $db['users'][$index] = array_merge($user, $userData);
                    $userFound = true;
                    break;
                }
            }
            
            if (!$userFound) {
                throw new Exception('User not found');
            }
            
            // Update user's tracks (remove old ones and add new ones)
            $db['tracks'] = array_filter($db['tracks'], function($track) use ($userId) {
                return $track['userId'] !== $userId;
            });
            $db['tracks'] = array_merge($db['tracks'], $myTracks);
            
            // Update followed users
            if (isset($db['follows'])) {
                $db['follows'] = array_filter($db['follows'], function($follow) use ($userId) {
                    return $follow['followerId'] !== $userId;
                });
            } else {
                $db['follows'] = [];
            }
            
            foreach ($followedUsers as $followedUser) {
                $db['follows'][] = [
                    'id' => uniqid() . '_' . substr(md5(microtime()), 0, 8),
                    'followerId' => $userId,
                    'followingId' => $followedUser['id'],
                    'createdAt' => date('c')
                ];
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => [
                    'user' => $db['users'][$index],
                    'myTracks' => $myTracks,
                    'followedUsers' => $followedUsers
                ]
            ]);
            break;
            
        case 'addCommentLike':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding comment likes');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $commentLike = $input;
            
            if (!$commentLike) {
                throw new Exception('Comment like data required');
            }
            
            $db = loadDatabase();
            if (!isset($db['commentLikes'])) {
                $db['commentLikes'] = [];
            }
            $db['commentLikes'][] = $commentLike;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $commentLike
            ]);
            break;
            
        case 'removeCommentLike':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for removing comment likes');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $likeId = $input['likeId'] ?? '';
            
            if (!$likeId) {
                throw new Exception('Comment like ID required');
            }
            
            $db = loadDatabase();
            $likeFound = false;
            
            if (isset($db['commentLikes'])) {
                foreach ($db['commentLikes'] as $index => $like) {
                    if ($like['id'] === $likeId) {
                        array_splice($db['commentLikes'], $index, 1);
                        $likeFound = true;
                        break;
                    }
                }
            }
            
            if (!$likeFound) {
                throw new Exception('Comment like not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
        case 'addFollow':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for adding follows');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $follow = $input;
            
            if (!$follow) {
                throw new Exception('Follow data required');
            }
            
            $db = loadDatabase();
            if (!isset($db['follows'])) {
                $db['follows'] = [];
            }
            $db['follows'][] = $follow;
            saveDatabase($db);
            
            echo json_encode([
                'success' => true,
                'data' => $follow
            ]);
            break;
            
        case 'removeFollow':
            if ($method !== 'POST') {
                throw new Exception('Only POST method allowed for removing follows');
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            $followId = $input['followId'] ?? '';
            
            if (!$followId) {
                throw new Exception('Follow ID required');
            }
            
            $db = loadDatabase();
            $followFound = false;
            
            if (isset($db['follows'])) {
                foreach ($db['follows'] as $index => $follow) {
                    if ($follow['id'] === $followId) {
                        array_splice($db['follows'], $index, 1);
                        $followFound = true;
                        break;
                    }
                }
            }
            
            if (!$followFound) {
                throw new Exception('Follow not found');
            }
            
            saveDatabase($db);
            
            echo json_encode([
                'success' => true
            ]);
            break;
            
            
        default:
            throw new Exception('Unknown action: ' . $action);
    }
    
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
