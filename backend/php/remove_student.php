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

$studentId = trim((string)($payload['student_id'] ?? ''));
if ($studentId === '') {
    respond_json(400, ['success' => false, 'error' => 'Student ID is required']);
}

try {
    $pdo = get_pdo();
    
    // First check if student exists
    $stmt = $pdo->prepare('SELECT id, name, email FROM students WHERE student_id = :student_id');
    $stmt->execute([':student_id' => $studentId]);
    $student = $stmt->fetch();
    
    if (!$student) {
        respond_json(404, ['success' => false, 'error' => 'Student not found']);
    }
    
    // Hard delete - remove student from table
    $stmt = $pdo->prepare('DELETE FROM students WHERE student_id = :student_id');
    $stmt->execute([':student_id' => $studentId]);
    
    if ($stmt->rowCount() > 0) {
        respond_json(200, [
            'success' => true, 
            'message' => 'Student removed successfully',
            'student_name' => $student['name'],
            'student_email' => $student['email']
        ]);
    } else {
        respond_json(500, ['success' => false, 'error' => 'Failed to remove student']);
    }
    
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to remove student: ' . $e->getMessage()]);
}
