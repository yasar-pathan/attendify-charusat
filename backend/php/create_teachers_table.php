<?php
require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();
    
    // Create Teachers table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS `Teachers` (
        `id` int(11) NOT NULL AUTO_INCREMENT,
        `Full_Name` varchar(100) NOT NULL,
        `Email` varchar(100) NOT NULL UNIQUE,
        `Password` varchar(255) NOT NULL,
        `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
        `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `unique_email` (`Email`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";
    
    $pdo->exec($sql);
    
    echo json_encode([
        'success' => true,
        'message' => 'Teachers table created successfully',
        'sql' => $sql
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
?>
