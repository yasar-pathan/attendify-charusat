<?php
/**
 * Debug endpoint to check where attendance records are actually stored
 */
require_once 'config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

try {
    $pdo = get_pdo();
    
    // Check all tables in the database
    $sql = "SHOW TABLES IN " . DB_NAME;
    $stmt = $pdo->query($sql);
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $debug = [
        'database' => DB_NAME,
        'tables_found' => $tables,
        'attendance_records_count' => 0,
        'attendance_records_sample' => [],
    ];
    
    // Count and fetch from attendance_records if it exists
    if (in_array('attendance_records', $tables)) {
        $countStmt = $pdo->query("SELECT COUNT(*) as cnt FROM attendance_records");
        $countRow = $countStmt->fetch();
        $debug['attendance_records_count'] = $countRow['cnt'] ?? 0;
        
        // Fetch last 5 records
        $sampleStmt = $pdo->query("SELECT id, student_id, date, dept, division, attendance_time FROM attendance_records ORDER BY attendance_time DESC LIMIT 5");
        $debug['attendance_records_sample'] = $sampleStmt->fetchAll();
    }
    
    // Check if there are other attendance-related tables
    $attendanceRelated = array_filter($tables, function($t) {
        return stripos($t, 'attend') !== false;
    });
    $debug['attendance_related_tables'] = array_values($attendanceRelated);
    
    respond_json(200, [
        'success' => true,
        'debug_info' => $debug
    ]);
    
} catch (Exception $e) {
    respond_json(500, [
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
