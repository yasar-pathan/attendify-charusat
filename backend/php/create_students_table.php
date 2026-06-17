<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();
    
    // Create students table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS `students` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `student_id` varchar(20) NOT NULL UNIQUE,
        `name` varchar(100) NOT NULL,
        `email` varchar(100) NOT NULL UNIQUE,
        `department` enum('IT', 'CSE', 'CE') NOT NULL,
        `division` varchar(10) NOT NULL,
        `semester` int(2) NOT NULL,
        `is_active` boolean DEFAULT TRUE,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `unique_student_id` (`student_id`),
        UNIQUE KEY `unique_email` (`email`),
        KEY `idx_department` (`department`),
        KEY `idx_semester` (`semester`),
        KEY `idx_active` (`is_active`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Students table created successfully',
        'note' => 'Student ID format: [d]YYdept### (d = diploma student, YY = admission year, dept = IT/CSE/CE, ### = roll number)',
        'sql' => $sql
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
