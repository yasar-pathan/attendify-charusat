<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();
    
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'attendance_records'");
    $tableExists = $stmt->rowCount() > 0;
    
    if (!$tableExists) {
        echo json_encode([
            'success' => false,
            'error' => 'Table attendance_records does not exist',
            'message' => 'Please create the table first'
        ]);
        exit;
    }
    
    // Get table structure
    $stmt = $pdo->query("DESCRIBE attendance_records");
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get sample data
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM attendance_records");
    $count = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'table_exists' => true,
        'columns' => $columns,
        'record_count' => $count['count'],
        'message' => 'Database and table are ready'
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
