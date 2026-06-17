<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();
    
    // Create table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS `attendance_records` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `MOT` varchar(20) NOT NULL,
        `timeslot` varchar(50) NOT NULL,
        `dept` varchar(10) NOT NULL,
        `division` varchar(20) NOT NULL,
        `subject` varchar(100) NOT NULL,
        `faculty_name` varchar(100) NOT NULL,
        `sem` int(2) NOT NULL,
        `date` date NOT NULL,
        `student_id` varchar(20) NOT NULL,
        `selfie` longtext NOT NULL,
        `gmail` varchar(100) NOT NULL,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        KEY `idx_student_date` (`student_id`, `date`),
        KEY `idx_dept_sem` (`dept`, `sem`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Table attendance_records created successfully',
        'sql' => $sql
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
