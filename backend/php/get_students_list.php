<?php
require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

try {
    $pdo = get_pdo();
    $stmt = $pdo->query('SELECT id, student_id, name, email, department, division, semester, created_at, updated_at FROM students');
    $students = $stmt->fetchAll();
    respond_json(200, [
        'success' => true,
        'students' => $students
    ]);
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to fetch students: ' . $e->getMessage()]);
}
