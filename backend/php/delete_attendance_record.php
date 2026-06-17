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

$recordId = (int)($payload['recordId'] ?? 0);

if ($recordId <= 0) {
    respond_json(400, ['success' => false, 'error' => 'Valid record ID is required']);
}

try {
    $pdo = get_pdo();
    
    // First, get the record details for confirmation
    $selectSql = 'SELECT student_id, subject, date FROM attendance_records WHERE ID = :id LIMIT 1';
    $selectStmt = $pdo->prepare($selectSql);
    $selectStmt->execute([':id' => $recordId]);
    $record = $selectStmt->fetch();
    
    if (!$record) {
        respond_json(404, ['success' => false, 'error' => 'Attendance record not found']);
    }
    
    // Delete the record
    $deleteSql = 'DELETE FROM attendance_records WHERE ID = :id';
    $deleteStmt = $pdo->prepare($deleteSql);
    $deleteStmt->execute([':id' => $recordId]);
    
    $deletedRows = $deleteStmt->rowCount();
    
    if ($deletedRows > 0) {
        respond_json(200, [
            'success' => true, 
            'message' => 'Attendance record deleted successfully',
            'deleted_record' => [
                'id' => $recordId,
                'student_id' => $record['student_id'],
                'subject' => $record['subject'],
                'date' => $record['date']
            ]
        ]);
    } else {
        respond_json(500, ['success' => false, 'error' => 'Failed to delete record']);
    }
    
} catch (Throwable $e) {
    respond_json(500, ['success' => false, 'error' => 'Failed to delete attendance record: ' . $e->getMessage()]);
}
?>


