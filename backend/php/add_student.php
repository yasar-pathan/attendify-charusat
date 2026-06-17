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

// Extract student data
$studentId = trim((string)($payload['student_id'] ?? ''));
$name = trim((string)($payload['name'] ?? ''));
$email = trim((string)($payload['email'] ?? ''));
$department = trim((string)($payload['department'] ?? ''));
$division = trim((string)($payload['division'] ?? ''));
$semester = (int)($payload['semester'] ?? 0);

// Validate required fields
if ($studentId === '' || $name === '' || $email === '' || $department === '' || $division === '' || $semester === 0) {
    respond_json(400, ['success' => false, 'error' => 'All fields are required']);
}

// Validate department
if (!in_array($department, ['IT', 'CSE', 'CE'])) {
    respond_json(400, ['success' => false, 'error' => 'Invalid department']);
}

// Validate semester
if ($semester < 1 || $semester > 8) {
    respond_json(400, ['success' => false, 'error' => 'Invalid semester (1-8)']);
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond_json(400, ['success' => false, 'error' => 'Invalid email format']);
}

// Validate student ID format (e.g., d24it176 or 24it176)
if (!preg_match('/^(d)?\d{2}[a-z]{2,3}\d{3}$/i', $studentId)) {
    respond_json(400, ['success' => false, 'error' => 'Invalid student ID format. Use format: d24it176 or 24it176']);
}

// Check if student is diploma student (starts with 'd')
$isDiplomaStudent = strtolower(substr($studentId, 0, 1)) === 'd';

// Validate semester for diploma students (should not be 1 or 2)
if ($isDiplomaStudent && ($semester == 1 || $semester == 2)) {
    respond_json(400, ['success' => false, 'error' => 'Diploma students cannot be in semester 1 or 2']);
}

try {
    $pdo = get_pdo();
    
    // Check if student already exists
    $stmt = $pdo->prepare('SELECT id FROM students WHERE student_id = :student_id OR email = :email');
    $stmt->execute([':student_id' => $studentId, ':email' => $email]);
    
    if ($stmt->rowCount() > 0) {
        respond_json(409, ['success' => false, 'error' => 'Student ID or email already exists']);
    }
    
    // Insert new student
    $sql = 'INSERT INTO students (student_id, name, email, department, division, semester) VALUES (:student_id, :name, :email, :department, :division, :semester)';
    
    $stmt = $pdo->prepare($sql);
    $result = $stmt->execute([
        ':student_id' => $studentId,
        ':name' => $name,
        ':email' => $email,
        ':department' => $department,
        ':division' => $division,
        ':semester' => $semester
    ]);
    
    if ($result) {
        $student_id = $pdo->lastInsertId();
        respond_json(201, [
            'success' => true, 
            'message' => 'Student added successfully',
            'student_id' => $student_id
        ]);
    } else {
        respond_json(500, ['success' => false, 'error' => 'Failed to add student']);
    }
    
} catch (PDOException $e) {
    if ($e->getCode() == 23000) { // Duplicate entry
        respond_json(409, ['success' => false, 'error' => 'Student ID or email already exists']);
    }
    respond_json(500, ['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    respond_json(500, ['success' => false, 'error' => 'Server error: ' . $e->getMessage()]);
}
