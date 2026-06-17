<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

// Accept JSON or form-encoded
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') !== false) {
    $raw = file_get_contents('php://input');
    $payload = json_decode($raw, true) ?? [];
} else {
    $payload = $_POST;
}

$name = trim((string)($payload['Full_Name'] ?? $payload['name'] ?? ''));
$email = trim((string)($payload['Email'] ?? $payload['email'] ?? ''));
$password = (string)($payload['Password'] ?? $payload['password'] ?? '');

if ($name === '' || $email === '' || $password === '') {
    respond_json(400, ['success' => false, 'error' => 'Missing required fields']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond_json(400, ['success' => false, 'error' => 'Invalid email']);
}

// Hash password with PASSWORD_DEFAULT (bcrypt/argon depending on PHP)
$hashed = password_hash($password, PASSWORD_DEFAULT);

try {
    $pdo = get_pdo();

    // Ensure table/columns match exactly: Teachers(Full_Name, Email, Password)
    $sql = 'INSERT INTO `Teachers` (`Full_Name`, `Email`, `Password`) VALUES (:name, :email, :pass)';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':name'  => $name,
        ':email' => $email,
        ':pass'  => $hashed,
    ]);

    respond_json(201, ['success' => true, 'message' => 'Teacher added successfully']);
} catch (Throwable $e) {
    // Duplicate email or other DB error
    respond_json(500, ['success' => false, 'error' => 'Failed to add teacher']);
}


