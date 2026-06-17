<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];
} else {
    $payload = $_POST;
}

$id = (int)($payload['id'] ?? 0);
if ($id <= 0) {
    respond_json(400, ['success' => false, 'error' => 'Valid attendance ID required']);
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('DELETE FROM `attendance_records` WHERE `id` = :id');
    $stmt->execute([':id' => $id]);
    $deleted = $stmt->rowCount();
    
    if ($deleted > 0) {
        respond_json(200, ['success' => true, 'message' => 'Attendance record removed successfully']);
    }
    respond_json(404, ['success' => false, 'error' => 'Attendance record not found']);
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to remove attendance record: ' . $e->getMessage()]);
}
