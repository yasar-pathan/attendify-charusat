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

$email = trim((string)($payload['Email'] ?? $payload['email'] ?? ''));
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond_json(400, ['success' => false, 'error' => 'Valid email required']);
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->prepare('DELETE FROM `Teachers` WHERE `Email` = :email');
    $stmt->execute([':email' => $email]);
    $deleted = $stmt->rowCount();
    if ($deleted > 0) {
        respond_json(200, ['success' => true, 'message' => 'Teacher removed']);
    }
    respond_json(404, ['success' => false, 'error' => 'Teacher not found']);
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to remove teacher']);
}


