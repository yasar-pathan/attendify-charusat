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

$email = trim((string)($payload['email'] ?? ''));
$password = (string)($payload['password'] ?? '');

if ($email === '' || $password === '') {
    respond_json(400, ['success' => false, 'error' => 'Missing email or password']);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond_json(400, ['success' => false, 'error' => 'Invalid email format']);
}

try {
    $pdo = get_pdo();

    // Check if teacher exists and verify password
    $sql = 'SELECT id, Full_Name, Email FROM Teachers WHERE Email = :email LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);
    $teacher = $stmt->fetch();

    if (!$teacher) {
        respond_json(401, ['success' => false, 'error' => 'Invalid email or password']);
    }

    // Get the stored password hash
    $sql = 'SELECT Password FROM Teachers WHERE Email = :email LIMIT 1';
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':email' => $email]);
    $passwordData = $stmt->fetch();

    if (!$passwordData || !password_verify($password, $passwordData['Password'])) {
        respond_json(401, ['success' => false, 'error' => 'Invalid email or password']);
    }

    // Login successful
    respond_json(200, [
        'success' => true, 
        'message' => 'Login successful',
        'teacher' => [
            'id' => $teacher['id'],
            'name' => $teacher['Full_Name'],
            'email' => $teacher['Email']
        ]
    ]);

} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Login failed. Please try again.']);
}
?>
