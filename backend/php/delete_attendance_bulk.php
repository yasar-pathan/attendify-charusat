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

// Extract filter parameters
$department = trim((string)($payload['department'] ?? ''));
$division = trim((string)($payload['division'] ?? ''));
$timeSlot = trim((string)($payload['timeSlot'] ?? ''));
$semester = trim((string)($payload['semester'] ?? ''));
$date = trim((string)($payload['date'] ?? ''));

try {
    $pdo = get_pdo();
    
    // Build the DELETE query with filters
    $sql = 'DELETE FROM `attendance_records` WHERE 1=1';
    $params = [];
    
    if ($department !== '') {
        $sql .= ' AND dept = :dept';
        $params[':dept'] = $department;
    }
    
    if ($division !== '') {
        $sql .= ' AND division = :division';
        $params[':division'] = $division;
    }
    
    if ($timeSlot !== '') {
        $sql .= ' AND timeslot = :timeslot';
        $params[':timeslot'] = $timeSlot;
    }
    
    if ($semester !== '') {
        $sql .= ' AND sem = :sem';
        $params[':sem'] = (int)$semester;
    }
    
    if ($date !== '') {
        $sql .= ' AND date = :date';
        $params[':date'] = $date;
    }
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $deletedCount = $stmt->rowCount();
    
    respond_json(200, [
        'success' => true, 
        'message' => 'Attendance records deleted successfully',
        'deletedCount' => $deletedCount
    ]);
    
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to delete attendance records: ' . $e->getMessage()]);
}
