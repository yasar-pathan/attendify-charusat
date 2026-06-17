<?php
declare(strict_types=1);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond_json(405, ['success' => false, 'error' => 'Method not allowed']);
}

try {
    $pdo = get_pdo();
    
    // Get total count of all students
    $stmt = $pdo->prepare('SELECT COUNT(*) as count FROM students');
    $stmt->execute();
    $result = $stmt->fetch();
    
    // Get department-wise counts
    $stmt = $pdo->prepare('SELECT department, COUNT(*) as count FROM students GROUP BY department');
    $stmt->execute();
    $deptCounts = $stmt->fetchAll();
    
    respond_json(200, [
        'success' => true,
        'total_count' => (int)$result['count'],
        'department_counts' => $deptCounts
    ]);
    
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to fetch student count: ' . $e->getMessage()]);
}
