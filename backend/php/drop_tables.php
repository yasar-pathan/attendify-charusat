<?php
require_once 'config.php';
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    $pdo = get_pdo();
    $pdo->exec("DROP TABLE IF EXISTS `attendance_records`");
    
    echo json_encode([
        'success' => true,
        'message' => 'Table attendance_records dropped successfully'
    ]);
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>
